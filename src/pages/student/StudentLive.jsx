import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { LogOut, GraduationCap } from "lucide-react";
import NotificationBell from "../../components/NotificationBell";
import toast, { Toaster } from "react-hot-toast";
import { changePassword } from "../../services/services.js";

import { SOCKET_URL } from "../../utils/path";

export default function StudentLive({ fps = 4 }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  const lastSendRef = useRef(0);

  const annotatedTimeout = useRef(null);
  const [annotatedFrame, setAnnotatedFrame] = useState(null);

  const [detections, setDetections] = useState([]);
  const [violationRate, setViolationRate] = useState(0);
  const [connected, setConnected] = useState(false);

  const [showGuide, setShowGuide] = useState(true);

  const [params] = useSearchParams();
  const examId = params.get("exam");
  const sessionId = params.get("session");
  const [showTeacherInfo, setShowTeacherInfo] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const { userInfo } = useSelector((state) => state.user);
  const verifyInfo = useSelector((state) => state.verify.verifyInfo);
  const navigate = useNavigate();

  const handleChangePassword = async () => {
    if (!passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password) {
      toast.error("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    if (passwordForm.new_password.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự!");
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error("Mật khẩu mới và xác nhận mật khẩu không khớp!");
      return;
    }

    setChangingPassword(true);
    try {
      const res = await changePassword({
        user_id: userInfo._id,
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });

      if (res.success) {
        toast.success("Đổi mật khẩu thành công!");
        setShowChangePassword(false);
        setPasswordForm({
          current_password: "",
          new_password: "",
          confirm_password: "",
        });
      } else {
        toast.error(res.detail || "Đổi mật khẩu thất bại!");
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi đổi mật khẩu!");
    } finally {
      setChangingPassword(false);
    }
  };

  const behaviorMap = {
    hand_move: "Di chuyển tay bất thường",
    mobile_use: "Sử dụng điện thoại",
    side_watching: "Nghiêng mặt sang hướng khác",
    mouth_open: "Mở miệng trao đổi",
    eye_movement: "Liếc mắt nhiều hướng",
  };
  const faceLabelMap = {
    unknown: "Người lạ",
    other_student: "Thi hộ – Phát hiện người khác",
    multiple_faces: "Nhiều hơn 1 khuôn mặt",
    no_face: "Không thấy khuôn mặt",
    looking_away: "Nhìn ra chỗ khác quá lâu",
    phone_detected: "Phát hiện điện thoại trong khung hình",
  };
  const reasonMap = {
    multi_face: "Phát hiện nhiều khuôn mặt",
    no_face: "Không phát hiện khuôn mặt",
    mismatch: "Khuôn mặt không khớp",
    unknown: "Lý do không xác định",
  };

  const getBehaviorText = (label) => {
    return (
      behaviorMap[label] || faceLabelMap[label] || reasonMap[label] || label
    );
  };

  /** ==========================
   *  1️⃣ KHỞI TẠO CAMERA + WS
   * ========================== */
  useEffect(() => {
    let animId;

    async function initCamera() {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      });
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    }

    initCamera();

    // === WS ===
    const ws = new WebSocket(
      `${SOCKET_URL}/ws/student?exam=${examId}&student=${userInfo.student_id}&class_id=${verifyInfo.classId}&session=${sessionId}`
    );
    // const ws = new WebSocket(
    //   `wss://https://unworkable-bernie-merely.ngrok-free.dev/ws/student?exam=${examId}&student=${userInfo.student_id}&class_id=${verifyInfo.classId}&session=${sessionId}`
    // );
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);

    ws.onclose = () => setConnected(false);

    ws.onmessage = (ev) => {
      const data = JSON.parse(ev.data);

      if (data.type !== "self_assessment") return;

      // Nhận diện hành vi (Liên tục, realtime)
      setDetections(data.detections || []);
      setViolationRate(data.violation_rate || 0);

      // Ảnh annotated (làm mịn — không bị chớp)
      if (data.frame_b64) {
        setAnnotatedFrame(data.frame_b64);

        // Reset nếu đang chạy timeout
        if (annotatedTimeout.current) clearTimeout(annotatedTimeout.current);

        // Ẩn sau 3 giây nếu không có frame mới
        annotatedTimeout.current = setTimeout(() => {
          setAnnotatedFrame(null);
        }, 3000);
      }
    };

    /** ==========================
     * 2️⃣ Vòng lặp gửi frame → WS
     * ========================== */
    const interval = 1000 / fps;

    function loop() {
      animId = requestAnimationFrame(loop);

      const now = performance.now();
      if (now - lastSendRef.current < interval) return;

      lastSendRef.current = now;

      const v = videoRef.current;
      const c = canvasRef.current;
      if (!v || !c) return;

      const ctx = c.getContext("2d");
      c.width = 640;
      c.height = 480;
      ctx.drawImage(v, 0, 0, 640, 480);

      c.toBlob(
        (blob) => {
          if (!blob) return;
          const reader = new FileReader();

          reader.onloadend = () => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(
                JSON.stringify({
                  type: "frame",
                  b64: reader.result,
                  ts: Date.now(),
                })
              );
            }
          };

          reader.readAsDataURL(blob);
        },
        "image/jpeg",
        0.6
      );
    }

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      wsRef.current?.close();
      if (annotatedTimeout.current) clearTimeout(annotatedTimeout.current);

      videoRef.current?.srcObject?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  /** ==========================
   * Đăng xuất
   * ========================== */
  const handleLogout = () => {
    navigate("/login");
  };

  /** ==========================
   * UI HIỂN THỊ
   * ========================== */
  return (
    <div className="min-h-screen bg-gray-100">
      {/* === POPUP HƯỚNG DẪN === */}
      {showGuide && (
        <div className="fixed inset-0 bg-white/70 backdrop-blur-md flex items-center justify-center z-[999] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6">
            <h2 className="text-2xl font-bold text-indigo-600 text-center mb-4">
              Hướng dẫn đặt camera & Quy chế thi
            </h2>

            <div className="space-y-4 text-gray-700">
              <div>
                <h3 className="font-semibold mb-1">📷 Cách đặt camera</h3>
                <ul className="list-disc pl-6">
                  <li>Camera ngang tầm mắt</li>
                  <li>Khoảng cách 50–80 cm</li>
                  <li>Ánh sáng rõ, không ngược sáng</li>
                  <li>Luôn giữ mặt trong khung hình</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-1">⚠ Quy chế</h3>
                <ul className="list-disc pl-6">
                  <li>Không liếc trái/phải nhiều</li>
                  <li>Không quay mặt khỏi camera</li>
                  <li>Không dùng điện thoại</li>
                  <li>Không nói chuyện/mấp máy môi</li>
                  <li>Không đưa tay bất thường vào khung</li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => setShowGuide(false)}
              className="mt-6 w-full bg-indigo-600 text-white py-2 rounded-xl"
            >
              Tôi đã hiểu
            </button>
          </div>
        </div>
      )}

      {/* NAVBAR */}
      <nav className="backdrop-blur-xl bg-white/60 border-b border-indigo-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link
            to="/student_dashboard"
            className="font-bold text-2xl text-indigo-600 flex items-center gap-2"
          >
            <GraduationCap size={28} /> Smart Exam
          </Link>

          <div className="flex items-center gap-6 text-gray-700 font-medium">
            <Link
              to="/student_dashboard"
              className="hover:text-indigo-600 transition"
            >
              Trang chủ
            </Link>
            <Link
              to="/student_violation_history"
              className="hover:text-indigo-600 transition"
            >
              Lịch sử vi phạm
            </Link>
            <div className="relative">
                  <div
                    className="flex items-center gap-3 px-4 py-2 bg-gray-100/80 rounded-full cursor-pointer hover:bg-gray-200 transition"
                    onClick={() => setShowTeacherInfo(!showTeacherInfo)}
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                      S
                    </div>
                  </div>

                  {/* Overlay để click ra ngoài đóng popup */}
                  {showTeacherInfo && (
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowTeacherInfo(false)}
                    />
                  )}

                  {/* 3. POP-UP HIỂN THỊ THÔNG TIN TÀI KHOẢN */}
                  {showTeacherInfo && (
                    <div className="absolute right-0 mt-2 p-4 w-80 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 animate-fade-in">
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-bold text-gray-800">Thông tin tài khoản</h3>
                          <button
                            onClick={() => setShowTeacherInfo(false)}
                            className="text-gray-400 hover:text-gray-600 transition text-xl leading-none"
                            title="Đóng"
                          >
                            ×
                          </button>
                        </div>
                        <div className="space-y-2 mb-4">
                          <div className="flex gap-2 items-center">
                            <div className="text-sm font-semibold text-gray-700 w-24">
                              Tên:
                            </div>
                            <div className="text-sm text-indigo-600 font-medium">
                              {userInfo.name}
                            </div>
                          </div>
                          <div className="flex gap-2 items-center">
                            <div className="text-sm font-semibold text-gray-700 w-24">
                              Email:
                            </div>
                            <div className="text-sm text-indigo-600 font-medium">
                              {userInfo.email}
                            </div>
                          </div>
                          {userInfo.student_id && (
                            <div className="flex gap-2 items-center">
                              <div className="text-sm font-semibold text-gray-700 w-24">
                                Mã SV:
                              </div>
                              <div className="text-sm text-indigo-600 font-medium">
                                {userInfo.student_id}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Form đổi mật khẩu */}
                      {!showChangePassword ? (
                        <button
                          onClick={() => setShowChangePassword(true)}
                          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium text-sm"
                        >
                          Đổi mật khẩu
                        </button>
                      ) : (
                        <div className="space-y-3 border-t pt-3">
                          <h4 className="text-sm font-semibold text-gray-700">Đổi mật khẩu</h4>
                          <input
                            type="password"
                            placeholder="Mật khẩu hiện tại"
                            value={passwordForm.current_password}
                            onChange={(e) =>
                              setPasswordForm({ ...passwordForm, current_password: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <input
                            type="password"
                            placeholder="Mật khẩu mới"
                            value={passwordForm.new_password}
                            onChange={(e) =>
                              setPasswordForm({ ...passwordForm, new_password: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <input
                            type="password"
                            placeholder="Xác nhận mật khẩu mới"
                            value={passwordForm.confirm_password}
                            onChange={(e) =>
                              setPasswordForm({ ...passwordForm, confirm_password: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleChangePassword}
                              disabled={changingPassword}
                              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium text-sm disabled:opacity-50"
                            >
                              {changingPassword ? "Đang xử lý..." : "Xác nhận"}
                            </button>
                            <button
                              onClick={() => {
                                setShowChangePassword(false);
                                setPasswordForm({
                                  current_password: "",
                                  new_password: "",
                                  confirm_password: "",
                                });
                              }}
                              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium text-sm"
                            >
                              Hủy
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
            <NotificationBell studentId={userInfo._id} toast={toast} />
            <button
              onClick={() => {
                navigate("/");
              }}
              className="px-3 py-2 bg-red-500 text-white rounded-xl flex items-center gap-2 hover:bg-red-600 shadow"
            >
              <LogOut size={18} /> Đăng xuất
            </button>
          </div>
        </div>
      </nav>

      {/* === MAIN === */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CAMERA */}
          <div className="flex justify-center">
            <div className="relative w-[640px] h-[480px] rounded-xl overflow-hidden shadow border bg-black">
              <video ref={videoRef} autoPlay muted className="w-full h-full" />

              {annotatedFrame && (
                <img
                  src={annotatedFrame}
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-200"
                />
              )}

              <canvas ref={canvasRef} className="hidden" />
            </div>
          </div>

          {/* Detections */}
          <div className="space-y-6">
            {/* Status */}
            <div className="bg-white shadow p-5 rounded-xl border">
              <h3 className="font-bold mb-3">📡 Trạng thái hệ thống</h3>

              <div className="flex justify-between mb-2">
                <span>WebSocket:</span>
                <span
                  className={`px-3 py-1 rounded-full ${
                    connected
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {connected ? "Đã kết nối" : "Mất kết nối"}
                </span>
              </div>

              <p className="font-medium">Tỉ lệ vi phạm:</p>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${
                    violationRate > 0.3
                      ? "bg-red-500"
                      : violationRate > 0.1
                      ? "bg-yellow-500"
                      : "bg-green-500"
                  }`}
                  style={{ width: `${violationRate * 100}%` }}
                />
              </div>
            </div>

            {/* Detections */}
            <div className="bg-white shadow p-5 rounded-xl border">
              <h3 className="font-bold mb-3">🎯 Kết quả nhận diện</h3>

              {detections.length === 0 ? (
                <p className="text-gray-500 italic">Chưa có dữ liệu...</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-left">
                      <th># Nhãn</th>
                      <th>Hành vi</th>
                      <th>Độ tin cậy</th>
                    </tr>
                  </thead>
                  {/* <tbody>
                    {detections.map((d, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td>
                          <span
                            className={`px-2 py-1 rounded-md ${
                              d.label === "normal"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {d.label}
                          </span>
                        </td>
                        <td></td>
                        <td>{(d.score * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody> */}

                  <tbody>
                    {detections.map((d, i) => {
                      const behaviorText = getBehaviorText(d.label);

                      return (
                        <tr key={i} className="border-b mb-12">
                          <td
                            className={`px-2 py-1 rounded-md text-xs font-medium ${
                              d.label === "normal"
                                ? " text-green-700"
                                : " text-red-700"
                            }`}
                          >
                            {i + 1}: {d.label}
                          </td>

                          {/* Hành vi (đã Việt hóa) */}
                          <td>
                            <span
                              className={`px-2 py-1 rounded-md text-xs font-medium ${
                                d.label === "normal"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {behaviorText}
                            </span>
                          </td>

                          {/* Độ tin cậy */}
                          <td>{(d.score * 100).toFixed(1)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
