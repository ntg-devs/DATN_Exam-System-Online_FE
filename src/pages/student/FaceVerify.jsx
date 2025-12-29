import { useRef, useState, useEffect } from "react";
import { MdCheckCircle, MdLock } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { login, logout } from "../../redux/slices/userSlice.js";
import {
  setVerifyInfo,
  verifySuccess,
  verifyFailed,
} from "../../redux/slices/verifySlice.js";
import { useNavigate, Link } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { 
  createAccount, 
  getAccountByFace,
  reportFaceVerificationFailure,
  checkFaceVerificationApproval
} from "../../services/services.js";
import { LogOut, GraduationCap, AlertTriangle, Home } from "lucide-react";
import { URL_API } from "../../utils/path.js";

const MAX_FAILED_ATTEMPTS = 3;

export default function FaceVerify() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [status, setStatus] = useState("");
  const [student, setStudent] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isApproved, setIsApproved] = useState(false); // Track xem đã được approve chưa

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const verifyInfo = useSelector((state) => state.verify.verifyInfo);
  const userInfo = useSelector((state) => state.user.userInfo);

  // Khôi phục số lần thất bại từ localStorage (theo sessionId) và kiểm tra approval
  useEffect(() => {
    const checkApprovalAndAttempts = async () => {
      if (!verifyInfo?.sessionId || !verifyInfo?.examId || !userInfo?.student_id) {
        return;
      }

      const storageKey = `face_verify_attempts_${verifyInfo.sessionId}`;
      const savedAttempts = parseInt(localStorage.getItem(storageKey) || "0", 10);
      setFailedAttempts(savedAttempts);
      
      // Nếu đã có 3 lần thất bại, kiểm tra xem đã được approve chưa
      if (savedAttempts >= MAX_FAILED_ATTEMPTS) {
        setIsBlocked(true);
        
        // Kiểm tra approval
        try {
          const approvalCheck = await checkFaceVerificationApproval({
            student_id: userInfo.student_id,
            session_id: verifyInfo.sessionId,
            exam_id: verifyInfo.examId,
          });
          
          if (approvalCheck.success && approvalCheck.approved) {
            // Đã được approve, cho phép thử xác thực lại (không tự động vào thi)
            setIsApproved(true);
            setIsBlocked(false); // Bỏ block để cho phép thử lại
            toast.success("Giáo viên đã cho phép bạn vào thi. Bạn có thể thử xác thực lại hoặc vào thi trực tiếp.", {
              duration: 5000,
            });
          }
        } catch (err) {
          console.error("Lỗi kiểm tra approval:", err);
        }
      }
    };
    
    checkApprovalAndAttempts();
  }, [verifyInfo?.sessionId, verifyInfo?.examId, userInfo?.student_id]);

  // Kiểm tra approval định kỳ khi bị block (mỗi 5 giây)
  useEffect(() => {
    if (!isBlocked || !verifyInfo?.sessionId || !verifyInfo?.examId || !userInfo?.student_id) {
      return;
    }

    const checkApproval = async () => {
      try {
        const approvalCheck = await checkFaceVerificationApproval({
          student_id: userInfo.student_id,
          session_id: verifyInfo.sessionId,
          exam_id: verifyInfo.examId,
        });
        
        if (approvalCheck.success && approvalCheck.approved) {
          // Đã được approve, cho phép thử xác thực lại
          setIsApproved(true);
          setIsBlocked(false);
          toast.success("Giáo viên đã cho phép bạn vào thi. Bạn có thể thử xác thực lại hoặc vào thi trực tiếp.", {
            duration: 5000,
          });
        }
      } catch (err) {
        console.error("Lỗi kiểm tra approval:", err);
      }
    };

    // Kiểm tra ngay lập tức
    checkApproval();
    
    // Sau đó kiểm tra định kỳ mỗi 5 giây
    const interval = setInterval(checkApproval, 5000);
    
    return () => clearInterval(interval);
  }, [isBlocked, verifyInfo?.sessionId, verifyInfo?.examId, userInfo?.student_id]);

  /* ======================================
          BẬT CAMERA
  ====================================== */
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 640, facingMode: "user" },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStatus("Camera đã bật");
      }

      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = 640;
        canvas.height = 640;
      }
    } catch (err) {
      setStatus("Không thể mở camera. Vui lòng cấp quyền truy cập.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setStatus("Camera đã tắt");
    }
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  /* ======================================
          CHỤP FRAME
  ====================================== */
  const captureFrame = async () => {
    if (!videoRef.current) return null;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");

    // Lật ngang video
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);

    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    // Khôi phục transform (nếu vẽ bounding box sau này trên cùng canvas)
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg")
    );
    return blob;
  };

  /* ======================================
          VẼ BOUNDING BOXES
  ====================================== */
  const drawBoxes = (faces) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scaleX = canvas.width / video.videoWidth;
    const scaleY = canvas.height / video.videoHeight;

    faces.forEach((face) => {
      let [x1, y1, x2, y2] = face.box;

      // Scale theo canvas
      x1 *= scaleX;
      x2 *= scaleX;
      y1 *= scaleY;
      y2 *= scaleY;

      // Mirror: chỉ flip nếu video mirror (giống captureFrame)
      // const mirror = true;
      // if (mirror) {
      //   const tempX1 = x1;
      //   x1 = canvas.width - x2;
      //   x2 = canvas.width - tempX1;
      // }

      const label = face.label === "unknown" ? "Người lạ" : face.label;

      ctx.lineWidth = 3;
      ctx.strokeStyle = face.label === "unknown" ? "red" : "green";
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

      ctx.font = "18px Arial";
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fillText(label, x1, y1 - 10);
    });
  };

  /* ======================================
            GỬI FRAME ĐỂ NHẬN DIỆN
  ====================================== */
  const handleLogin = async () => {
    // Kiểm tra nếu đã bị chặn và chưa được approve
    if (isBlocked && !isApproved) {
      toast.error("Bạn đã vượt quá số lần thử cho phép. Vui lòng đợi giáo viên cho phép.");
      return;
    }

    setCapturing(true);
    setStatus("Đang nhận diện khuôn mặt...");

    const blob = await captureFrame();
    if (!blob) {
      toast.error("Không thể chụp ảnh từ webcam.");
      setCapturing(false);
      return;
    }

    const formData = new FormData();
    formData.append("image", blob, "frame.jpg");

    const toastId = toast.loading("Đang xác thực...");

    try {
      const res = await fetch(`${URL_API}/verify-face`, {
        method: "POST",
        body: formData,
      });

      console.log(res)
      // const res = await fetch("http://https://unworkable-bernie-merely.ngrok-free.dev/api/verify-face", {
      //   method: "POST",
      //   body: formData,
      // });
      // const res = await fetch("https://103.142.24.110:8000/api/verify-face", {
      //   method: "POST",
      //   body: formData,
      // });

      const data = await res.json();
      console.log("Kết quả backend:", data);

      if (data.faces) drawBoxes(data.faces);

      if (res.ok && data.verified) {
        const detected = data.faces.find((f) => f.label !== "unknown");

        if (detected) {
          const studentId = detected.label;

          if (userInfo.student_id == studentId) {
            setStudent({ student_id: studentId });

            // Reset số lần thất bại khi xác thực thành công
            if (verifyInfo?.sessionId) {
              const storageKey = `face_verify_attempts_${verifyInfo.sessionId}`;
              localStorage.removeItem(storageKey);
              setFailedAttempts(0);
              setIsBlocked(false);
            }

            // Lấy thông tin tài khoản
            const acc = await getAccountByFace({ student_id: studentId });
            dispatch(setVerifyInfo(acc.user));

            toast.success("Xác thực thành công!", { id: toastId });

            // ⏳ Giữ lại 2 giây cho bạn nhìn bounding box
            await new Promise((resolve) => setTimeout(resolve, 3000));

            stopCamera();

            return navigate(
              `/student_live?exam=${verifyInfo?.examId}&session=${verifyInfo.sessionId}`
            );
          }
          
          // Thất bại: khuôn mặt không khớp
          handleVerificationFailure(toastId);
          return;
        }

        // có mặt nhưng không trùng
        handleVerificationFailure(toastId);
        return;
      }

      // Thất bại: không nhận diện được khuôn mặt
      handleVerificationFailure(toastId);
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối server!", { id: toastId });
      setCapturing(false);
    }
  };

  /* ======================================
        XỬ LÝ KHI XÁC THỰC THẤT BẠI
  ====================================== */
  const handleVerificationFailure = async (toastId) => {
    // Kiểm tra xem đã được approve chưa
    let approved = isApproved;
    if (!approved && verifyInfo?.sessionId && verifyInfo?.examId && userInfo?.student_id) {
      try {
        const approvalCheck = await checkFaceVerificationApproval({
          student_id: userInfo.student_id,
          session_id: verifyInfo.sessionId,
          exam_id: verifyInfo.examId,
        });
        approved = approvalCheck.success && approvalCheck.approved;
        if (approved) {
          setIsApproved(true);
        }
      } catch (err) {
        console.error("Lỗi kiểm tra approval:", err);
      }
    }

    // Nếu đã được approve, cho vào thi luôn dù xác thực thất bại
    if (approved) {
      toast.success("Bạn đã được giáo viên cho phép. Đang vào phòng thi...", { id: toastId });
      
      try {
        const acc = await getAccountByFace({ student_id: userInfo.student_id });
        if (acc && acc.user) {
          dispatch(setVerifyInfo(acc.user));
          
          stopCamera();
          
          setTimeout(() => {
            navigate(
              `/student_live?exam=${verifyInfo.examId}&session=${verifyInfo.sessionId}`
            );
          }, 1000);
        }
      } catch (err) {
        console.error("Lỗi khi lấy thông tin tài khoản:", err);
        toast.error("Có lỗi xảy ra. Vui lòng thử lại.", { id: toastId });
      }
      
      setCapturing(false);
      return;
    }

    // Nếu chưa được approve, xử lý như bình thường
    const newAttempts = failedAttempts + 1;
    setFailedAttempts(newAttempts);

    // Lưu vào localStorage theo sessionId
    if (verifyInfo?.sessionId) {
      const storageKey = `face_verify_attempts_${verifyInfo.sessionId}`;
      localStorage.setItem(storageKey, newAttempts.toString());
    }

    const remainingAttempts = MAX_FAILED_ATTEMPTS - newAttempts;

    if (newAttempts >= MAX_FAILED_ATTEMPTS) {
      setIsBlocked(true);
      
      // Gửi thông tin lên backend
      if (verifyInfo?.sessionId && verifyInfo?.examId && userInfo?.student_id) {
        try {
          await reportFaceVerificationFailure({
            student_id: userInfo.student_id,
            session_id: verifyInfo.sessionId,
            exam_id: verifyInfo.examId,
          });
          console.log("[INFO] Đã báo cáo xác thực thất bại 3 lần lên server");
        } catch (err) {
          console.error("[ERROR] Lỗi báo cáo thất bại:", err);
        }
      }
      
      toast.error(
        `Xác thực thất bại! Bạn đã sử dụng hết ${MAX_FAILED_ATTEMPTS} lần thử. Giáo viên sẽ được thông báo và có thể cho phép bạn vào thi.`,
        { id: toastId, duration: 8000 }
      );
      
      // Log sự kiện này
      console.warn(`[SECURITY] Student ${userInfo?.student_id} failed face verification ${MAX_FAILED_ATTEMPTS} times for session ${verifyInfo?.sessionId}`);
    } else {
      toast.error(
        `Xác thực thất bại! Còn ${remainingAttempts} lần thử.`,
        { id: toastId }
      );
    }

    setCapturing(false);
  };

  const handleLogout = () => {
    // Dừng camera
    stopCamera();
    // Xóa Redux state
    dispatch(logout());
    // Xóa localStorage
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    // Chuyển đến trang đăng nhập
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      <nav className="backdrop-blur-xl bg-white/60 border-b border-indigo-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link
            to="/student_dashboard"
            className="font-bold text-2xl text-indigo-600 flex items-center gap-2"
          >
            <GraduationCap size={28} />
            Smart Exam
          </Link>

          <button
            onClick={handleLogout}
            className="px-3 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 shadow"
          >
            <LogOut size={18} /> Đăng xuất
          </button>
        </div>
      </nav>

      <div className="flex items-center justify-center p-6">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
            Xác thực danh tính
          </h1>

          <div className="relative mx-auto w-80 h-80 rounded-full overflow-hidden border-8 border-gray-200 shadow-inner mb-4">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              muted
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full"
            />
          </div>

          {/* Hiển thị cảnh báo khi bị chặn */}
          {isBlocked && !isApproved && (
            <div className="mb-4 bg-red-50 border-2 border-red-300 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <MdLock className="text-red-500 mt-1 flex-shrink-0" size={24} />
                <div className="flex-1">
                  <h3 className="font-bold text-red-700 mb-2">
                    Xác thực bị khóa
                  </h3>
                  <p className="text-sm text-red-600 mb-3">
                    Bạn đã sử dụng hết {MAX_FAILED_ATTEMPTS} lần thử xác thực khuôn mặt. 
                    Giáo viên đã được thông báo và có thể cho phép bạn vào thi. 
                    Vui lòng đợi giáo viên xử lý hoặc liên hệ trực tiếp.
                  </p>
                  <div className="flex flex-col gap-2 mt-3">
                    <button
                      onClick={() => navigate("/student_dashboard")}
                      className="w-full bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition flex items-center justify-center gap-2"
                    >
                      <Home size={18} />
                      Về trang chủ
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Hiển thị thông báo khi đã được approve */}
          {isApproved && (
            <div className="mb-4 bg-green-50 border-2 border-green-300 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <MdCheckCircle className="text-green-500 mt-1 flex-shrink-0" size={24} />
                <div className="flex-1">
                  <h3 className="font-bold text-green-700 mb-2">
                    Đã được giáo viên cho phép
                  </h3>
                  <p className="text-sm text-green-600 mb-3">
                    Giáo viên đã cho phép bạn vào thi. Bạn có thể thử xác thực lại hoặc vào thi trực tiếp.
                  </p>
                  <div className="flex flex-col gap-2 mt-3">
                    <button
                      onClick={async () => {
                        try {
                          const acc = await getAccountByFace({ student_id: userInfo.student_id });
                          if (acc && acc.user) {
                            dispatch(setVerifyInfo(acc.user));
                            stopCamera();
                            navigate(
                              `/student_live?exam=${verifyInfo.examId}&session=${verifyInfo.sessionId}`
                            );
                          }
                        } catch (err) {
                          console.error("Lỗi:", err);
                          toast.error("Có lỗi xảy ra. Vui lòng thử lại.");
                        }
                      }}
                      className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition flex items-center justify-center gap-2"
                    >
                      <MdCheckCircle size={18} />
                      Vào thi trực tiếp
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Hiển thị số lần thử còn lại */}
          {!isBlocked && failedAttempts > 0 && (
            <div className="mb-4 bg-yellow-50 border border-yellow-300 rounded-xl p-3">
              <div className="flex items-center gap-2 text-yellow-700">
                <AlertTriangle size={20} />
                <span className="text-sm font-medium">
                  Còn {MAX_FAILED_ATTEMPTS - failedAttempts} lần thử
                </span>
              </div>
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={capturing || (isBlocked && !isApproved)}
            className={`w-full py-3 rounded-xl transition font-medium ${
              isBlocked && !isApproved
                ? "bg-gray-400 text-white cursor-not-allowed"
                : capturing
                ? "bg-indigo-400 text-white cursor-not-allowed opacity-60"
                : "bg-indigo-500 text-white hover:bg-indigo-600"
            }`}
          >
            {isBlocked && !isApproved
              ? "Đã khóa - Đợi giáo viên cho phép"
              : capturing
              ? "Đang nhận diện..."
              : isApproved
              ? "Thử xác thực lại"
              : "Xác thực danh tính"}
          </button>

          <p className="text-center mt-4 text-sm text-gray-600">{status}</p>

          {student && (
            <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <MdCheckCircle
                className="text-green-500 mx-auto mb-2"
                size={48}
              />
              <h2 className="font-bold text-lg text-green-700">
                Xin chào, {student.student_id}
              </h2>
            </div>
          )}
        </div>
      </div>

      <Toaster position="top-center" />
    </div>
  );
}
