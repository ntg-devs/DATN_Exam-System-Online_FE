import { useState, useEffect, useRef } from "react";
import { createExam, getExams, getExamsByTeacher } from "../services/services";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { useSelector } from "react-redux";
import { SOCKET_URL, URL_API } from "../utils/path";

export default function Dashboard() {
  const [examCode, setExamCode] = useState("");
  const [examName, setExamName] = useState("");
  const [search, setSearch] = useState("");
  const [exams, setExams] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [duration, setDuration] = useState("");
  const navigate = useNavigate();

  const { userInfo } = useSelector((state) => state.user);
  const wsRef = useRef(null); // ✅ lưu socket để không tạo lại

  // ====== Thông báo ======
  const notifySuccess = () => toast.success("Tạo phòng thi thành công!");
  const notifyExists = () =>
    toast.error("Tạo phòng thi thất bại do đã tồn tại!");
  const notifyIncomplete = () => toast.error("Vui lòng nhập đầy đủ thông tin!");

  // ====== Lấy danh sách phòng thi lần đầu ======
  useEffect(() => {
    wsRef.current = null;
    fetchExams();
    connectSocketRealtime(); // ✅ mở socket realtime
  }, []);

  // ====== Lấy dữ liệu từ API ======
  const fetchExams = async () => {
    let data;
    if (userInfo.role === "teacher") {
      data = await getExamsByTeacher({ created_by: userInfo._id });
    } else {
      data = await getExams();
    }
    setExams(data?.exams || []);
  };

  // ======================================================
  // ✅ KẾT NỐI WEBSOCKET REALTIME
  // ======================================================
  const connectSocketRealtime = () => {
    if (wsRef.current) return;

    wsRef.current = new WebSocket(`${SOCKET_URL}/ws/exams`);
    // wsRef.current = new WebSocket("wss://https://unworkable-bernie-merely.ngrok-free.dev/ws/exams");
    // wsRef.current = new WebSocket("wss://103.142.24.110:8000/ws/exams");

    wsRef.current.onopen = () => {
      console.log("✅ WS connected exam realtime");
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("WS message:", data);

      // ✅ Chỉ nhận sự kiện khi phòng thi mới tạo trên server
      if (data.type === "exam_created") {
        const exam = data.exam;

        // Nếu giáo viên → chỉ nhận phòng do họ tạo
        // if (userInfo.role === "teacher") {
        //   if (exam.created_by !== userInfo._id) return;
        // }

        if (userInfo.role === "teacher" && userInfo._id != exam.created_by) {
          console.log("Bỏ qua vì created_by không trùng");
          return;
        }

        // ✅ Cập nhật danh sách realtime (không trùng lặp)
        setExams((prev) => {
          if (prev.some((e) => e._id === exam._id)) return prev;
          return [...prev, exam];
        });
      }
    };

    wsRef.current.onclose = () => {
      console.log("❌ WS closed - reconnecting...");
      setTimeout(connectSocketRealtime, 1500);
    };

    wsRef.current.onerror = (err) => {
      console.error("❌ WS ERROR:", err);
    };
  };

  // ======================================================
  // ✅ Tạo phòng thi
  // ======================================================
  const handleCreateExam = async (e) => {
    e.preventDefault();

    if (!examCode.trim() || !examName.trim() || !duration.trim()) {
      notifyIncomplete();
      return;
    }

    const success = await createExam({
      code: examCode.trim(),
      name: examName.trim(),
      created_by: userInfo._id,
      created_by_name: userInfo.name,
      start_time: startTime,
      duration: Number(duration),
    });

    if (success) {
      notifySuccess();
      setShowModal(false);
      setExamCode("");
      setExamName("");
      setStartTime("");
      setDuration("");
    } else {
      notifyExists();
    }
  };

  const filteredExams = exams.filter(
    (exam) =>
      exam.name.toLowerCase().includes(search.toLowerCase()) ||
      exam.code.toLowerCase().includes(search.toLowerCase())
  );

  // ======================================================
  // ✅ GIAO DIỆN
  // ======================================================
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-2xl font-bold mb-6 text-center">
        🎓 Quản lý phòng thi
      </h1>

      {/* Thanh tìm kiếm */}
      <div className="flex justify-center mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Tìm kiếm..."
          className="border border-gray-300 rounded-lg p-2 w-1/2 shadow-sm"
        />
      </div>

      {/* Chỉ giáo viên mới tạo được phòng */}
      {userInfo.role === "teacher" && (
        <div className="flex justify-center mb-6">
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2"
          >
            ➕ Tạo phòng thi
          </button>
        </div>
      )}

      {/* Danh sách phòng thi */}
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md p-4">
        <h2 className="text-lg font-semibold mb-4">Danh sách phòng thi</h2>

        {filteredExams.length === 0 ? (
          <p className="text-gray-500 text-center">
            Không có phòng nào phù hợp.
          </p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredExams.map((exam) => (
              <li
                key={exam._id}
                className="flex items-center justify-between py-3 px-2 hover:bg-gray-50 transition"
              >
                <div>
                  <p className="font-medium">{exam.name}</p>
                  <p className="text-sm text-gray-500">Mã: {exam.code}</p>

                  {exam.start_time && (
                    <p className="text-sm text-gray-400">
                      🕒 Bắt đầu:{" "}
                      {new Date(exam.start_time).toLocaleString("vi-VN", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </p>
                  )}

                  {exam.duration && (
                    <p className="text-sm text-gray-400">
                      ⏳ Thời lượng: {exam.duration} phút
                    </p>
                  )}
                </div>

                {userInfo.role === "teacher" ? (
                  <button
                    onClick={() => navigate(`/teacher?exam=${exam.code}`)}
                    className="bg-green-500 hover:bg-green-600 text-white rounded-lg px-3 py-1"
                  >
                    🚀 Vào phòng (Giáo viên)
                  </button>
                ) : (
                  <button
                    onClick={() => navigate(`/student?exam=${exam.code}`)}
                    className="bg-green-500 hover:bg-green-600 text-white rounded-lg px-3 py-1"
                  >
                    🚀 Vào phòng (Sinh viên)
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Modal tạo phòng thi */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-[90%] max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-center">
              ➕ Tạo phòng thi mới
            </h2>

            <form onSubmit={handleCreateExam} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Mã phòng thi
                </label>
                <input
                  type="text"
                  value={examCode}
                  onChange={(e) => setExamCode(e.target.value)}
                  className="border rounded-lg p-2 w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Tên phòng thi
                </label>
                <input
                  type="text"
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  className="border rounded-lg p-2 w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Thời gian bắt đầu
                </label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="border rounded-lg p-2 w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Thời lượng (phút)
                </label>
                <input
                  type="number"
                  min="1"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="border rounded-lg p-2 w-full"
                />
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-gray-300 px-4 py-2 rounded-lg"
                >
                  ❌ Hủy
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg"
                >
                  ✅ Tạo phòng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Toaster position="top-right" />
    </div>
  );
}
