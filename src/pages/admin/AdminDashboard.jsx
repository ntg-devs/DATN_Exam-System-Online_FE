import React, { useState, useEffect } from "react";
import {
  FiUsers,
  FiBook,
  FiBarChart2,
  FiFileText,
  FiX,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiDownload,
} from "react-icons/fi";
import {
  MdSchool,
  MdPerson,
  MdClose,
  MdGroups,
  MdAssignment,
} from "react-icons/md";
import {
  FaPlus,
  FaUser,
  FaEye,
  FaUserPlus,
  FaRegCalendarAlt,
  FaPlay,
  FaClock,
  FaCheckCircle,
  FaGraduationCap,
} from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  createAccount,
  getAllUsers,
  updateUser,
  deleteUser,
  adminGetAllClasses,
  adminCreateSubject,
  adminGetAllTeachers,
  getStudentsNotInClass,
  addStudentsToClass,
  getStudentsInClass,
  getExamsByClass,
  createExam,
  getExamSessions,
  createExamSession,
  addStudentsToExamSession,
  getStudentsNotInSession,
  getStudentsInSession,
  getExams,
  generateReport,
  toggleAccountStatus,
} from "../../services/services.js";

const menuItems = [
  { key: "accounts", label: "Quản lý tài khoản", icon: <FiUsers /> },
  { key: "subjects", label: "Quản lý môn học", icon: <FiBook /> },
  { key: "stats", label: "Thống kê", icon: <FiBarChart2 /> },
  { key: "reports", label: "Báo cáo", icon: <FiFileText /> },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("accounts");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [role, setRole] = useState("teacher");
  const [accounts, setAccounts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [statusTarget, setStatusTarget] = useState(null);

  // Sửa tài khoản
  const [showEditModal, setShowEditModal] = useState(false);
  const [editRole, setEditRole] = useState("teacher");
  const [editForm, setEditForm] = useState({
    id: "",
    name: "",
    email: "",
    student_id: "",
  });

  // Xóa tài khoản
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    student_id: "",
  });

  // Mật khẩu mặc định
  const DEFAULT_PASSWORD = "123456";

  // ================================
  // 🎓 QUẢN LÝ MÔN HỌC (SUBJECTS)
  // ================================
  const [subjects, setSubjects] = useState([]);
  const [subjectSearchTerm, setSubjectSearchTerm] = useState("");
  const [showCreateSubjectModal, setShowCreateSubjectModal] = useState(false);
  const [subjectForm, setSubjectForm] = useState({
    name: "",
    code: "",
    teacher_id: "",
    description: "",
  });
  const [teachers, setTeachers] = useState([]);
  const [currentSubject, setCurrentSubject] = useState(null);
  const [subjectPanelMode, setSubjectPanelMode] = useState("students"); // "students" | "exams"

  // Thêm sinh viên vào môn học
  const [showAddStudentsModal, setShowAddStudentsModal] = useState(false);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [selectedStudentsForSubject, setSelectedStudentsForSubject] = useState(
    []
  );

  // Tạo bài thi
  const [showCreateExamModal, setShowCreateExamModal] = useState(false);
  const [examForm, setExamForm] = useState({
    name: "",
    code: "",
    start_time: "",
    duration: "",
  });
  const [examSessions, setExamSessions] = useState([
    { start_time: "", duration: "" },
  ]);

  // Chi tiết bài thi
  const [showExamDetailModal, setShowExamDetailModal] = useState(false);
  const [currentExam, setCurrentExam] = useState(null);
  const [examSessionsList, setExamSessionsList] = useState([]);

  // Thêm ca thi
  const [showAddSessionModal, setShowAddSessionModal] = useState(false);
  const [newSessionForm, setNewSessionForm] = useState({
    start_time: "",
    duration: "",
  });

  // Thêm sinh viên vào ca thi
  const [showAddStudentsToSessionModal, setShowAddStudentsToSessionModal] =
    useState(false);
  const [targetSession, setTargetSession] = useState(null);
  const [studentsNotInSession, setStudentsNotInSession] = useState([]);
  const [selectedStudentsForSession, setSelectedStudentsForSession] = useState(
    []
  );

  // Xem sinh viên trong ca thi
  const [showStudentsInSessionModal, setShowStudentsInSessionModal] =
    useState(false);
  const [studentsInSession, setStudentsInSession] = useState([]);

  // Danh sách sinh viên trong môn học
  const [studentsInSubject, setStudentsInSubject] = useState([]);
  const [examsInSubject, setExamsInSubject] = useState([]);

  // Dữ liệu cho thống kê
  const [allExams, setAllExams] = useState([]);
  const [allSessions, setAllSessions] = useState([]);

  // Dữ liệu cho báo cáo
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportFilters, setReportFilters] = useState({
    start_date: "",
    end_date: "",
    class_id: "",
  });

  // Fetch danh sách users khi component mount hoặc sau khi tạo tài khoản
  useEffect(() => {
    fetchAccounts();
  }, []);

  // Fetch danh sách môn học và giảng viên khi vào tab subjects
  useEffect(() => {
    if (activeTab === "subjects") {
      fetchSubjects();
      fetchTeachers();
    }
  }, [activeTab]);

  // Fetch dữ liệu cho thống kê khi vào tab stats
  useEffect(() => {
    if (activeTab === "stats") {
      fetchSubjects();
      fetchAllExams();
    }
  }, [activeTab]);

  // Load dữ liệu khi chọn môn học
  useEffect(() => {
    if (currentSubject) {
      loadSubjectData();
    }
  }, [currentSubject]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await getAllUsers(); // Lấy tất cả users (không filter)
      if (res.success) {
        // setAccounts(res.users || []);
        const filteredUsers = (res.users || []).filter(
          (user) => user.email !== "admin@gmail.com"
        );
        setAccounts(filteredUsers);
      } else {
        toast.error("Không thể tải danh sách tài khoản!");
      }
    } catch (error) {
      console.error("Lỗi khi fetch accounts:", error);
      toast.error("Lỗi khi tải danh sách tài khoản!");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();

    // Validate chung
    if (!form.name || !form.email) {
      toast.error("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    // Validate riêng cho sinh viên
    if (role === "student" && !form.student_id) {
      toast.error("Vui lòng nhập mã sinh viên!");
      return;
    }

    setLoading(true);

    const payload = {
      name: form.name,
      email: form.email,
      password: DEFAULT_PASSWORD, // Mật khẩu mặc định
      role,
      student_id: role === "student" ? form.student_id : null,
    };

    try {
      const res = await createAccount(payload);

      if (res.success) {
        toast.success(
          `🎉 Tạo tài khoản ${
            role === "teacher" ? "giảng viên" : "sinh viên"
          } thành công!`
        );
        setShowCreateModal(false);
        setForm({
          name: "",
          email: "",
          student_id: "",
        });
        // Refresh danh sách tài khoản sau khi tạo thành công
        await fetchAccounts();
      } else {
        toast.error("❌ " + (res.detail || "Tạo tài khoản thất bại!"));
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Lỗi khi tạo tài khoản!");
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (acc) => {
    setEditForm({
      id: acc._id,
      name: acc.name || "",
      email: acc.email || "",
      student_id: acc.student_id || "",
    });
    setEditRole(acc.role || "teacher");
    setShowEditModal(true);
  };

  const handleUpdateAccount = async (e) => {
    e.preventDefault();

    if (!editForm.name || !editForm.email) {
      toast.error("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    if (editRole === "student" && !editForm.student_id) {
      toast.error("Vui lòng nhập mã sinh viên!");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        id: editForm.id,
        name: editForm.name,
        email: editForm.email,
        student_id: editRole === "student" ? editForm.student_id : null,
        role: editRole,
      };

      const res = await updateUser(payload);

      if (res.success) {
        toast.success("Cập nhật tài khoản thành công!");
        setShowEditModal(false);
        await fetchAccounts();
      } else {
        toast.error(res.detail || "Cập nhật tài khoản thất bại!");
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Lỗi khi cập nhật tài khoản!");
    } finally {
      setLoading(false);
    }
  };

  const openStatusConfirm = (acc) => {
    setStatusTarget(acc);
    setShowStatusConfirm(true);
  };

  const handleToggleStatus = async () => {
    if (!statusTarget?._id) return;

    setLoading(true);
    try {
      // res ở đây thực chất là data từ backend, không phải Response
      const result = await toggleAccountStatus(statusTarget._id);

      // Không cần res.json() nữa vì result đã là object
      if (result.success) {
        toast.success(
          result.new_status
            ? "Kích hoạt tài khoản thành công!"
            : "Vô hiệu hóa tài khoản thành công!"
        );
        setShowStatusConfirm(false);
        setStatusTarget(null);
        await fetchAccounts(); // Refresh danh sách
      } else {
        toast.error(result.detail || "Thao tác thất bại!");
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi thay đổi trạng thái!");
    } finally {
      setLoading(false);
    }
  };

  const openDeleteConfirm = (acc) => {
    setDeleteTarget(acc);
    setShowDeleteConfirm(true);
  };

  const handleDeleteAccount = async () => {
    if (!deleteTarget?._id) return;

    setLoading(true);
    try {
      const res = await deleteUser(deleteTarget._id);
      if (res.success) {
        toast.success("Xóa tài khoản thành công!");
        setShowDeleteConfirm(false);
        setDeleteTarget(null);
        await fetchAccounts();
      } else {
        toast.error(res.detail || "Xóa tài khoản thất bại!");
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Lỗi khi xóa tài khoản!");
    } finally {
      setLoading(false);
    }
  };

  // ================================
  // 🎓 QUẢN LÝ MÔN HỌC - Functions
  // ================================

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const res = await adminGetAllClasses();
      if (res.success) {
        setSubjects(res.classes || []);
      } else {
        toast.error("Không thể tải danh sách môn học!");
      }
    } catch (error) {
      console.error("Lỗi khi fetch subjects:", error);
      toast.error("Lỗi khi tải danh sách môn học!");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await adminGetAllTeachers();
      if (res.success) {
        setTeachers(res.teachers || []);
      }
    } catch (error) {
      console.error("Lỗi khi fetch teachers:", error);
    }
  };

  // Fetch tất cả exams và sessions cho thống kê
  const fetchAllExams = async () => {
    try {
      const examsData = await getExams();
      const examsList = examsData?.exams || examsData || [];
      setAllExams(examsList);

      // Fetch tất cả sessions cho mỗi exam
      const allSessionsData = [];
      for (const exam of examsList) {
        try {
          const sessionsRes = await getExamSessions({ exam_id: exam._id });
          if (sessionsRes?.success && sessionsRes.sessions) {
            allSessionsData.push(...sessionsRes.sessions);
          }
        } catch (err) {
          console.error(`Lỗi khi fetch sessions cho exam ${exam._id}:`, err);
        }
      }
      setAllSessions(allSessionsData);
    } catch (error) {
      console.error("Lỗi khi fetch all exams:", error);
    }
  };

  const loadSubjectData = async () => {
    if (!currentSubject) return;
    try {
      // Load sinh viên trong môn học
      const studentsRes = await getStudentsInClass({
        class_id: currentSubject._id,
      });
      setStudentsInSubject(studentsRes?.students || []);

      // Load bài thi của môn học
      const examsRes = await getExamsByClass({ class_id: currentSubject._id });
      setExamsInSubject(examsRes?.exams || []);
    } catch (error) {
      console.error("Lỗi khi load dữ liệu môn học:", error);
      toast.error("Không thể tải dữ liệu môn học!");
    }
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    if (!subjectForm.name || !subjectForm.code || !subjectForm.teacher_id) {
      toast.error("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    setLoading(true);
    try {
      const res = await adminCreateSubject(subjectForm);
      if (res.success) {
        toast.success("Tạo môn học thành công!");
        setShowCreateSubjectModal(false);
        setSubjectForm({ name: "", code: "", teacher_id: "", description: "" });
        await fetchSubjects();
      } else {
        toast.error(res.detail || "Tạo môn học thất bại!");
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Lỗi khi tạo môn học!");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddStudentsModal = async (subject) => {
    setCurrentSubject(subject);
    try {
      const res = await getStudentsNotInClass({ class_id: subject._id });
      setAvailableStudents(res?.students || []);
      setSelectedStudentsForSubject([]);
      setShowAddStudentsModal(true);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải danh sách sinh viên!");
    }
  };

  const toggleStudentSelectionForSubject = (stu) => {
    setSelectedStudentsForSubject((prev) =>
      prev.includes(stu._id)
        ? prev.filter((id) => id !== stu._id)
        : [...prev, stu._id]
    );
  };

  const handleAddStudentsToSubject = async () => {
    if (!selectedStudentsForSubject.length) {
      toast.error("Vui lòng chọn sinh viên!");
      return;
    }
    try {
      const res = await addStudentsToClass({
        class_id: currentSubject._id,
        student_ids: selectedStudentsForSubject,
      });
      if (res.success) {
        toast.success("Thêm sinh viên vào môn học thành công!");
        setShowAddStudentsModal(false);
        await loadSubjectData();
        await fetchSubjects();
      } else {
        toast.error(res.detail || "Thêm sinh viên thất bại!");
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi thêm sinh viên!");
    }
  };

  const handleOpenSubjectDetail = (subject) => {
    setCurrentSubject(subject);
    setSubjectPanelMode("students");
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    if (!examForm.name || !examForm.code) {
      toast.error("Vui lòng nhập tên và mã bài thi!");
      return;
    }

    const validSessions = examSessions.filter(
      (s) => s.start_time && s.duration
    );
    if (!validSessions.length) {
      toast.error("Vui lòng thêm ít nhất 1 ca thi!");
      return;
    }

    setLoading(true);
    try {
      // Tạo bài thi
      const examRes = await createExam({
        class_id: currentSubject._id,
        name: examForm.name,
        code: examForm.code,
        start_time: examForm.start_time || validSessions[0].start_time,
        duration:
          Number(examForm.duration) || Number(validSessions[0].duration),
        created_by: currentSubject.teacher_id, // Admin tạo nhưng gán cho giảng viên
      });

      if (!examRes.success) {
        toast.error("Không tạo được bài thi!");
        return;
      }

      const examId = examRes?.exam._id;

      // Tạo các ca thi
      for (const s of validSessions) {
        try {
          await createExamSession({
            exam_id: examId,
            name: `Ca thi ${examSessions.indexOf(s) + 1}`,
            start_time: s.start_time,
            duration: Number(s.duration),
          });
        } catch (err) {
          console.error("Lỗi tạo ca thi:", err);
        }
      }

      toast.success("Tạo bài thi và ca thi thành công!");
      setShowCreateExamModal(false);
      setExamForm({ name: "", code: "", start_time: "", duration: "" });
      setExamSessions([{ start_time: "", duration: "" }]);
      await loadSubjectData();
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi tạo bài thi!");
    } finally {
      setLoading(false);
    }
  };

  const updateSessionField = (index, field, value) => {
    const copy = [...examSessions];
    copy[index] = { ...copy[index], [field]: value };
    setExamSessions(copy);
  };

  const addSessionRow = () => {
    setExamSessions([...examSessions, { start_time: "", duration: "" }]);
  };

  const removeSessionRow = (index) => {
    const copy = [...examSessions];
    copy.splice(index, 1);
    setExamSessions(copy.length ? copy : [{ start_time: "", duration: "" }]);
  };

  const openExamDetail = async (exam) => {
    setCurrentExam(exam);
    try {
      const res = await getExamSessions({ exam_id: exam._id });
      setExamSessionsList(res?.sessions || []);
      setShowExamDetailModal(true);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải ca thi!");
    }
  };

  const handleAddSessionToExam = async () => {
    if (!newSessionForm.start_time || !newSessionForm.duration) {
      toast.error("Vui lòng nhập đầy đủ thông tin ca thi!");
      return;
    }
    try {
      const res = await createExamSession({
        exam_id: currentExam._id,
        name: `Ca thi ${examSessionsList.length + 1}`,
        start_time: newSessionForm.start_time,
        duration: Number(newSessionForm.duration),
      });
      if (res.success) {
        toast.success("Thêm ca thi thành công!");
        setShowAddSessionModal(false);
        setNewSessionForm({ start_time: "", duration: "" });
        const data = await getExamSessions({ exam_id: currentExam._id });
        setExamSessionsList(data?.sessions || []);
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi thêm ca thi!");
    }
  };

  const openAddStudentsToSession = async ({ session, exam }) => {
    setTargetSession(session);
    try {
      const res = await getStudentsNotInSession({
        session_id: session._id,
        class_id: exam.class_id || currentSubject._id,
      });
      setStudentsNotInSession(res?.students || []);
      setSelectedStudentsForSession([]);
      setShowAddStudentsToSessionModal(true);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải danh sách sinh viên!");
    }
  };

  const toggleStudentSelectionForSession = (stu) => {
    setSelectedStudentsForSession((prev) =>
      prev.includes(stu._id)
        ? prev.filter((id) => id !== stu._id)
        : [...prev, stu._id]
    );
  };

  const handleAddStudentsToSession = async () => {
    if (!selectedStudentsForSession.length) {
      toast.error("Vui lòng chọn sinh viên!");
      return;
    }
    try {
      const res = await addStudentsToExamSession({
        session_id: targetSession._id,
        student_ids: selectedStudentsForSession,
      });
      if (res.success) {
        toast.success("Thêm sinh viên vào ca thi thành công!");
        setShowAddStudentsToSessionModal(false);
        const data = await getExamSessions({ exam_id: currentExam._id });
        setExamSessionsList(data?.sessions || []);
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi thêm sinh viên!");
    }
  };

  const handleViewStudentsInSession = async (session) => {
    try {
      const res = await getStudentsInSession(session._id);
      setStudentsInSession(res?.students || []);
      setShowStudentsInSessionModal(true);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải danh sách sinh viên!");
    }
  };

  const getSessionStatus = (session) => {
    const OFFSET = 7 * 60 * 60 * 1000;

    const now = Date.now();

    const start = new Date(session.start_time).getTime() + OFFSET;

    const end = start + session.duration * 60 * 1000;

    if (now >= start && now <= end) return "active"; // đang diễn ra
    if (now < start) return "soon"; // chưa đến giờ
    if (now > end) return "done"; // đã kết thúc
    return "";
  };

  // Filter subjects
  const filteredSubjects = subjects.filter((subj) => {
    const keyword = subjectSearchTerm.toLowerCase().trim();
    if (!keyword) return true;
    return (
      subj.name?.toLowerCase().includes(keyword) ||
      subj.code?.toLowerCase().includes(keyword) ||
      subj.teacher_name?.toLowerCase().includes(keyword)
    );
  });

  // Thống kê nhanh
  const totalAccounts = accounts.length;
  const totalTeachers = accounts.filter((acc) => acc.role === "teacher").length;
  const totalStudents = accounts.filter((acc) => acc.role === "student").length;

  // Mapping tên hành vi vi phạm
  const getBehaviorName = (behavior, type) => {
    if (!behavior) return "N/A";

    const behaviorStr = behavior.toString().toLowerCase();

    // Vi phạm về nhận diện (face)
    if (type === "face") {
      switch (behaviorStr) {
        case "multi_face":
          return "Phát hiện nhiều người trong khung hình";
        case "mismatch_face":
        case "unknown_face":
          return "Khuôn mặt không khớp/nghi vấn thi hộ";
        case "no_face":
          return "Không phát hiện khuôn mặt";
        case "look_away":
          return "Đảo mắt bất thường/nhìn ra ngoài màn hình";
        default:
          return behavior;
      }
    }

    // Vi phạm về hành vi (behavior)
    switch (behaviorStr) {
      case "mobile_use":
        return "Sử dụng điện thoại trong khi thi";
      case "eye_movement":
      case "look_away":
        return "Đảo mắt bất thường/nhìn ra ngoài màn hình";
      case "side_watching":
        return "Nghiêng mặt / xoay mặt sang hướng khác";
      case "hand_move":
        return "Cử động tay bất thường";
      case "mouth_open":
        return "Mở miệng bất thường/ Có dấu hiệu trao đổi";
      case "multi_face":
        return "Phát hiện nhiều người trong khung hình";
      case "mismatch_face":
      case "unknown_face":
        return "Khuôn mặt không khớp/nghi vấn thi hộ";
      default:
        return behavior;
    }
  };

  // Tính toán dữ liệu cho biểu đồ
  const getAccountDistributionData = () => {
    return [
      { name: "Giảng viên", value: totalTeachers, color: "#10b981" },
      { name: "Sinh viên", value: totalStudents, color: "#3b82f6" },
    ];
  };

  const getTopSubjectsByStudentsData = () => {
    const subjectsWithCount = subjects.map((subject) => ({
      name: subject.name || subject.code || "N/A",
      students: subject.students?.length || 0,
    }));
    return subjectsWithCount
      .sort((a, b) => b.students - a.students)
      .slice(0, 5);
  };

  const getSubjectsByTeacherData = () => {
    const teacherMap = {};
    subjects.forEach((subject) => {
      const teacherName = subject.teacher_name || "Chưa phân công";
      teacherMap[teacherName] = (teacherMap[teacherName] || 0) + 1;
    });
    return Object.entries(teacherMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const getSessionsByStatusData = () => {
    const now = Date.now();
    let active = 0;
    let soon = 0;
    let done = 0;

    allSessions.forEach((session) => {
      const start = new Date(session.start_time).getTime();
      const end = start + (session.duration || 0) * 60 * 1000;
      if (now >= start && now <= end) active++;
      else if (now < start) soon++;
      else if (now > end) done++;
    });

    return [
      { name: "Đang diễn ra", value: active, color: "#10b981" },
      { name: "Sắp diễn ra", value: soon, color: "#f59e0b" },
      { name: "Đã kết thúc", value: done, color: "#6b7280" },
    ];
  };

  const getExamsOverTimeData = () => {
    const last7Days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
      });
      last7Days.push({ date: dateStr, exams: 0 });
    }

    allExams.forEach((exam) => {
      if (exam.created_at) {
        const examDate = new Date(exam.created_at);
        const daysDiff = Math.floor((today - examDate) / (1000 * 60 * 60 * 24));
        if (daysDiff >= 0 && daysDiff <= 6) {
          const dateStr = examDate.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
          });
          const dayData = last7Days.find((d) => d.date === dateStr);
          if (dayData) dayData.exams++;
        }
      }
    });

    return last7Days;
  };

  // Hàm tạo báo cáo
  const handleGenerateReport = async () => {
    if (!reportFilters.start_date || !reportFilters.end_date) {
      toast.error("Vui lòng chọn khoảng thời gian!");
      return;
    }

    setReportLoading(true);
    try {
      const res = await generateReport(reportFilters);
      if (res.success) {
        setReportData(res.report);
        console.log(res.report);
        toast.success("Tạo báo cáo thành công!");
      } else {
        toast.error(res.detail || "Không thể tạo báo cáo!");
      }
    } catch (error) {
      console.error("Lỗi khi tạo báo cáo:", error);
      toast.error("Lỗi khi tạo báo cáo!");
    } finally {
      setReportLoading(false);
    }
  };

  // Hàm export Excel
  const handleExportExcel = () => {
    if (!reportData) {
      toast.error("Vui lòng tạo báo cáo trước!");
      return;
    }

    try {
      // Tạo workbook
      const wb = XLSX.utils.book_new();

      // Sheet 1: Tổng quan
      const summaryData = [
        ["BÁO CÁO TỔNG HỢP"],
        ["Từ ngày:", reportData.filter.start_date || "N/A"],
        ["Đến ngày:", reportData.filter.end_date || "N/A"],
        [""],
        ["THỐNG KÊ"],
        ["Tổng số vi phạm:", reportData.statistics.total_violations],
        ["Vi phạm hành vi:", reportData.statistics.behavior_violations],
        ["Vi phạm nhận diện:", reportData.statistics.face_violations],
      ];
      const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, ws1, "Tổng quan");

      // Sheet 2: Chi tiết vi phạm
      const violationsData = [
        [
          "STT",
          "Thời gian",
          "Sinh viên",
          "Mã SV",
          "Môn học",
          "Mã môn học",
          "Kỳ thi",
          "Mã kỳ thi",
          "Loại vi phạm",
          "Hành vi",
          "Mô tả chi tiết",
          "Điểm số",
          "Thời lượng (ms)",
          "Lý do",
        ],
      ];
      reportData.violations.forEach((v, index) => {
        // Lấy behavior display name
        const behaviorName =
          v.behavior_display || getBehaviorName(v.behavior, v.type);

        // Lấy mô tả chi tiết
        let detailDescription = "";
        if (v.type === "behavior") {
          detailDescription = `Vi phạm hành vi: ${behaviorName}`;
          if (v.score) detailDescription += ` (Điểm: ${v.score})`;
          if (v.duration_ms)
            detailDescription += ` - Thời lượng: ${v.duration_ms}ms`;
        } else if (v.type === "face") {
          detailDescription = `Vi phạm nhận diện: ${behaviorName}`;
          if (v.reason) detailDescription += ` - ${v.reason}`;
        }

        violationsData.push([
          index + 1,
          v.timestamp ? new Date(v.timestamp).toLocaleString("vi-VN") : "N/A",
          v.student_name || "N/A",
          v.student_id || "N/A",
          v.class_name || "N/A",
          v.class_code || "N/A",
          v.exam_name || "N/A",
          v.exam_code || "N/A",
          v.type === "behavior"
            ? "Hành vi"
            : v.type === "face"
            ? "Nhận diện"
            : "N/A",
          behaviorName,
          detailDescription,
          v.score || "N/A",
          v.duration_ms || "N/A",
          v.reason || v.detail || "N/A",
        ]);
      });
      const ws2 = XLSX.utils.aoa_to_sheet(violationsData);

      // Tự động điều chỉnh độ rộng cột
      const colWidths = [
        { wch: 5 }, // STT
        { wch: 20 }, // Thời gian
        { wch: 25 }, // Sinh viên
        { wch: 12 }, // Mã SV
        { wch: 30 }, // Môn học
        { wch: 12 }, // Mã môn học
        { wch: 30 }, // Kỳ thi
        { wch: 12 }, // Mã kỳ thi
        { wch: 15 }, // Loại vi phạm
        { wch: 40 }, // Hành vi
        { wch: 60 }, // Mô tả chi tiết
        { wch: 10 }, // Điểm số
        { wch: 15 }, // Thời lượng
        { wch: 40 }, // Lý do
      ];
      ws2["!cols"] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws2, "Chi tiết vi phạm");

      // Sheet 3: Thống kê theo môn học
      const classStatsData = [
        ["Môn học", "Tổng vi phạm", "Vi phạm hành vi", "Vi phạm nhận diện"],
      ];
      Object.entries(reportData.class_statistics).forEach(
        ([className, stats]) => {
          classStatsData.push([
            className,
            stats.total,
            stats.behavior,
            stats.face,
          ]);
        }
      );
      const ws3 = XLSX.utils.aoa_to_sheet(classStatsData);
      XLSX.utils.book_append_sheet(wb, ws3, "Thống kê theo môn học");

      // Sheet 4: Thống kê theo sinh viên
      const studentStatsData = [
        ["Sinh viên", "Tổng vi phạm", "Vi phạm hành vi", "Vi phạm nhận diện"],
      ];
      Object.entries(reportData.student_statistics).forEach(
        ([studentName, stats]) => {
          studentStatsData.push([
            studentName,
            stats.total,
            stats.behavior,
            stats.face,
          ]);
        }
      );
      const ws4 = XLSX.utils.aoa_to_sheet(studentStatsData);
      XLSX.utils.book_append_sheet(wb, ws4, "Thống kê theo sinh viên");

      // Xuất file
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([wbout], { type: "application/octet-stream" });
      const fileName = `BaoCao_${reportData.filter.start_date}_${reportData.filter.end_date}.xlsx`;
      saveAs(blob, fileName);
      toast.success("Xuất file Excel thành công!");
    } catch (error) {
      console.error("Lỗi khi xuất Excel:", error);
      toast.error("Lỗi khi xuất file Excel!");
    }
  };

  // Filter accounts theo searchTerm
  const filteredAccounts = accounts.filter((acc) => {
    const keyword = searchTerm.toLowerCase().trim();
    if (!keyword) return true;
    return (
      acc.name?.toLowerCase().includes(keyword) ||
      acc.email?.toLowerCase().includes(keyword) ||
      acc.student_id?.toLowerCase().includes(keyword)
    );
  });

  const renderContent = () => {
    switch (activeTab) {
      case "accounts":
        return (
          <div className="space-y-5">
            <h2 className="text-xl font-semibold text-slate-800">
              Quản lý tài khoản
            </h2>

            {/* Thống kê nhanh */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Card Tổng tài khoản */}
              <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-20 h-20 bg-slate-100 rounded-full -mr-10 -mt-10 opacity-50 group-hover:opacity-70 transition-opacity"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-slate-100 rounded-xl group-hover:bg-slate-200 transition-colors">
                      <FiUsers className="text-slate-600" size={24} />
                    </div>
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Tổng tài khoản
                  </p>
                  <p className="text-4xl font-bold text-slate-900 mb-1">
                    {totalAccounts}
                  </p>
                  <p className="text-xs text-slate-500">Tất cả người dùng</p>
                </div>
              </div>

              {/* Card Giảng viên */}
              <div className="group relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-200 rounded-full -mr-10 -mt-10 opacity-50 group-hover:opacity-70 transition-opacity"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-emerald-100 rounded-xl group-hover:bg-emerald-200 transition-colors">
                      <MdPerson className="text-emerald-600" size={24} />
                    </div>
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-2">
                    Giảng viên
                  </p>
                  <p className="text-4xl font-bold text-emerald-900 mb-1">
                    {totalTeachers}
                  </p>
                  <p className="text-xs text-emerald-600">
                    Giáo viên trong hệ thống
                  </p>
                </div>
              </div>

              {/* Card Sinh viên */}
              <div className="group relative overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50 p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200 rounded-full -mr-10 -mt-10 opacity-50 group-hover:opacity-70 transition-opacity"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                      <FaGraduationCap className="text-blue-600" size={24} />
                    </div>
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-2">
                    Sinh viên
                  </p>
                  <p className="text-4xl font-bold text-blue-900 mb-1">
                    {totalStudents}
                  </p>
                  <p className="text-xs text-blue-600">
                    Học sinh trong hệ thống
                  </p>
                </div>
              </div>
            </div>

            {/* Thanh tìm kiếm + nút tạo */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-md">
                <FiSearch
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white shadow-sm outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-sm"
                  placeholder="Tìm theo tên, email hoặc MSSV..."
                />
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5"
              >
                <FaUserPlus size={16} /> Tạo tài khoản mới
              </button>
            </div>

            {/* Bảng tài khoản */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
              <div className="max-h-[600px] overflow-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-gradient-to-r from-indigo-50 to-purple-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-4 font-semibold text-slate-700 uppercase text-xs tracking-wider">
                        Họ tên
                      </th>
                      <th className="px-6 py-4 font-semibold text-slate-700 uppercase text-xs tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-4 font-semibold text-slate-700 uppercase text-xs tracking-wider">
                        Mã sinh viên
                      </th>
                      <th className="px-6 py-4 font-semibold text-slate-700 uppercase text-xs tracking-wider">
                        Vai trò
                      </th>
                      <th className="px-2 py-4 font-semibold text-slate-700 uppercase text-xs tracking-wider">
                        Ngày tạo
                      </th>
                      <th className="px-6 py-4 font-semibold text-slate-700 uppercase text-xs tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-2 py-4 font-semibold text-slate-700 uppercase text-xs tracking-wider text-center">
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {loading && accounts.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                            <p className="text-slate-500">Đang tải...</p>
                          </div>
                        </td>
                      </tr>
                    ) : filteredAccounts.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <FiUsers className="text-gray-300" size={48} />
                            <p className="text-slate-500 text-lg font-medium">
                              {searchTerm
                                ? "Không tìm thấy tài khoản nào"
                                : "Chưa có tài khoản nào"}
                            </p>
                            {!searchTerm && (
                              <button
                                onClick={() => setShowCreateModal(true)}
                                className="mt-2 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition"
                              >
                                <FaUserPlus size={14} /> Tạo tài khoản đầu tiên
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredAccounts.map((acc) => {
                        // Format ngày tạo
                        const formatDate = (dateStr) => {
                          if (!dateStr) return "-";
                          try {
                            const date = new Date(dateStr);
                            return date.toLocaleDateString("vi-VN", {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                            });
                          } catch {
                            return "-";
                          }
                        };

                        return (
                          <tr
                            key={acc._id || acc.email}
                            className="hover:bg-indigo-50/50 transition-colors group"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                                  {(acc.name || "U").charAt(0).toUpperCase()}
                                </div>
                                <span className="font-semibold text-xs text-slate-800">
                                  {acc.name || "-"}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-slate-700">
                                {acc.email || "-"}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-slate-700 font-mono text-xs">
                                {acc.student_id || "-"}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${
                                  acc.role === "teacher"
                                    ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                    : acc.role === "admin"
                                    ? "bg-purple-100 text-purple-700 border border-purple-200"
                                    : "bg-blue-100 text-blue-700 border border-blue-200"
                                }`}
                              >
                                {acc.role === "teacher"
                                  ? "Giảng viên"
                                  : acc.role === "admin"
                                  ? "Admin"
                                  : "Sinh viên"}
                              </span>
                            </td>
                            <td className="px-2 py-4">
                              <span className="text-xs text-slate-600">
                                {formatDate(acc.created_at)}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center px-1 py-1.5 rounded-full text-xs font-semibold w-[109px] ${
                                  acc.is_active === false ||
                                  acc.is_active == null
                                    ? "bg-red-100 text-red-700 border border-red-200"
                                    : "bg-green-100 text-green-700 border border-green-200"
                                }`}
                              >
                                {acc.is_active === false ||
                                acc.is_active == null
                                  ? "Không hoạt động"
                                  : "Hoạt động"}
                              </span>
                            </td>
                            <td className="px-2 py-4">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
                                  onClick={() => openEditModal(acc)}
                                >
                                  <FiEdit2 size={14} /> Sửa
                                </button>
                                {/* <button
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                                  onClick={() => openDeleteConfirm(acc)}
                                >
                                  <FiTrash2 size={14} /> Xóa
                                </button> */}
                                <button
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                    acc.is_active === false ||
                                    acc.is_active == null
                                      ? "text-green-600 hover:bg-green-50"
                                      : "text-red-600 hover:bg-red-50"
                                  }`}
                                  onClick={() => openStatusConfirm(acc)}
                                >
                                  {acc.is_active === false ||
                                  acc.is_active == null ? (
                                    <> Kích hoạt</>
                                  ) : (
                                    <> Vô hiệu hóa</>
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal tạo tài khoản */}
            {showCreateModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setForm({ name: "", email: "", student_id: "" });
                      setRole("teacher");
                    }}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                  >
                    <FiX size={24} />
                  </button>

                  <h2 className="text-xl font-semibold mb-4">
                    Tạo tài khoản mới
                  </h2>

                  {/* Chọn vai trò */}
                  <div className="flex justify-center mb-6 space-x-4">
                    <button
                      type="button"
                      onClick={() => setRole("teacher")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium ${
                        role === "teacher"
                          ? "bg-green-500 text-white shadow-md"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      <MdSchool size={20} />
                      Giảng viên
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole("student")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium ${
                        role === "student"
                          ? "bg-blue-500 text-white shadow-md"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      <MdPerson size={20} />
                      Sinh viên
                    </button>
                  </div>

                  <form onSubmit={handleCreateAccount} className="space-y-4">
                    {/* Họ tên */}
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">
                        Họ và tên <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Nguyễn Văn A"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                        required
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="email@domain.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                        required
                      />
                    </div>

                    {/* Mã sinh viên (chỉ hiện khi role = student) */}
                    {role === "student" && (
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">
                          Mã sinh viên <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="student_id"
                          value={form.student_id}
                          onChange={handleChange}
                          placeholder="VD: B12345"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                          required
                        />
                      </div>
                    )}

                    {/* Thông báo mật khẩu mặc định */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800">
                        <strong>Mật khẩu mặc định:</strong>{" "}
                        <code className="bg-blue-100 px-2 py-1 rounded">
                          123456
                        </code>
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Người dùng sẽ được yêu cầu đổi mật khẩu khi đăng nhập
                        lần đầu.
                      </p>
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCreateModal(false);
                          setForm({ name: "", email: "", student_id: "" });
                          setRole("teacher");
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className={`px-4 py-2 rounded-lg text-white font-medium ${
                          loading
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700"
                        }`}
                      >
                        {loading ? "Đang tạo..." : "Tạo tài khoản"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Xác nhận xóa tài khoản */}
            {/* {showDeleteConfirm && deleteTarget && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm relative">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteTarget(null);
                    }}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                  >
                    <FiX size={24} />
                  </button>

                  <h2 className="text-lg font-semibold mb-3 text-red-600">
                    Xác nhận xóa tài khoản
                  </h2>
                  <p className="text-sm text-gray-700 mb-4">
                    Bạn có chắc chắn muốn xóa tài khoản{" "}
                    <span className="font-semibold">{deleteTarget.name}</span> (
                    {deleteTarget.email}) không? Hành động này không thể hoàn
                    tác.
                  </p>

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteTarget(null);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      disabled={loading}
                      className={`px-4 py-2 rounded-lg text-white text-sm ${
                        loading
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-red-600 hover:bg-red-700"
                      }`}
                    >
                      {loading ? "Đang xóa..." : "Xóa"}
                    </button>
                  </div>
                </div>
              </div>
            )} */}

            {showStatusConfirm && statusTarget && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm relative">
                  <button
                    onClick={() => {
                      setShowStatusConfirm(false);
                      setStatusTarget(null);
                    }}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                  >
                    <FiX size={24} />
                  </button>
                  <h2
                    className={`text-lg font-semibold mb-3 ${
                      statusTarget.is_active ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {statusTarget.is_active
                      ? "Vô hiệu hóa tài khoản"
                      : "Kích hoạt tài khoản"}
                  </h2>
                  <p className="text-sm text-gray-700 mb-4">
                    Bạn có chắc chắn muốn{" "}
                    <span className="font-semibold">
                      {statusTarget.is_active ? "vô hiệu hóa" : "kích hoạt"}
                    </span>{" "}
                    tài khoản{" "}
                    <span className="font-semibold">{statusTarget.name}</span> (
                    {statusTarget.email}) không?
                  </p>
                  {statusTarget.is_active === false && (
                    <p className="text-xs text-gray-600 mb-4">
                      Khi kích hoạt lại, người dùng sẽ có thể đăng nhập bình
                      thường.
                    </p>
                  )}
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowStatusConfirm(false);
                        setStatusTarget(null);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={handleToggleStatus}
                      disabled={loading}
                      className={`px-4 py-2 rounded-lg text-white text-sm ${
                        loading
                          ? "bg-gray-400 cursor-not-allowed"
                          : statusTarget.is_active
                          ? "bg-red-600 hover:bg-red-700"
                          : "bg-green-600 hover:bg-green-700"
                      }`}
                    >
                      {loading
                        ? "Đang xử lý..."
                        : statusTarget.is_active
                        ? "Vô hiệu hóa"
                        : "Kích hoạt"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal sửa tài khoản */}
            {showEditModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                  >
                    <FiX size={24} />
                  </button>

                  <h2 className="text-xl font-semibold mb-4">
                    Sửa thông tin tài khoản
                  </h2>

                  {/* Chọn vai trò */}
                  <div className="flex justify-center mb-6 space-x-4">
                    <button
                      type="button"
                      onClick={() => setEditRole("teacher")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium ${
                        editRole === "teacher"
                          ? "bg-green-500 text-white shadow-md"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      <MdSchool size={20} />
                      Giảng viên
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditRole("student")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium ${
                        editRole === "student"
                          ? "bg-blue-500 text-white shadow-md"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      <MdPerson size={20} />
                      Sinh viên
                    </button>
                  </div>

                  <form onSubmit={handleUpdateAccount} className="space-y-4">
                    {/* Họ tên */}
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">
                        Họ và tên <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={editForm.name}
                        onChange={handleEditChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                        required
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={editForm.email}
                        onChange={handleEditChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                        required
                      />
                    </div>

                    {/* Mã sinh viên (chỉ hiện khi role = student) */}
                    {editRole === "student" && (
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">
                          Mã sinh viên <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="student_id"
                          value={editForm.student_id}
                          onChange={handleEditChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                          required
                        />
                      </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowEditModal(false)}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className={`px-4 py-2 rounded-lg text-white font-medium ${
                          loading
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700"
                        }`}
                      >
                        {loading ? "Đang lưu..." : "Lưu thay đổi"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        );

      case "subjects":
        // Thống kê nhanh
        const totalSubjects = subjects.length;
        const totalTeachersInSubjects = new Set(
          subjects.map((s) => s.teacher_id)
        ).size;
        const totalStudentsInSubjects = subjects.reduce(
          (sum, s) => sum + (s.students?.length || 0),
          0
        );

        return (
          <div className="space-y-6">
            {/* Header với thống kê */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Quản lý môn học
              </h2>
              <p className="text-sm text-slate-600">
                Phân công giảng viên, quản lý sinh viên và tạo lịch thi cho từng
                môn học
              </p>
            </div>

            {/* Thống kê nhanh */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-emerald-700 mb-1">
                      Tổng môn học
                    </p>
                    <p className="text-3xl font-bold text-emerald-900">
                      {totalSubjects}
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-200 rounded-lg">
                    <FiBook className="text-emerald-700" size={24} />
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-blue-700 mb-1">
                      Giảng viên
                    </p>
                    <p className="text-3xl font-bold text-blue-900">
                      {totalTeachersInSubjects}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-200 rounded-lg">
                    <MdSchool className="text-blue-700" size={24} />
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100/50 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-purple-700 mb-1">
                      Tổng sinh viên
                    </p>
                    <p className="text-3xl font-bold text-purple-900">
                      {totalStudentsInSubjects}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-200 rounded-lg">
                    <MdGroups className="text-purple-700" size={24} />
                  </div>
                </div>
              </div>
            </div>

            {/* Grid 2 cột: Danh sách môn học | Chi tiết môn học */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Cột 1 - Danh sách môn học */}
              <div className="space-y-4">
                {/* Thanh tìm kiếm và nút tạo */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative flex-1 sm:max-w-xs">
                    <FiSearch
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      size={18}
                    />
                    <input
                      type="text"
                      value={subjectSearchTerm}
                      onChange={(e) => setSubjectSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-200 bg-white shadow-sm outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-sm"
                      placeholder="Tìm kiếm môn học..."
                    />
                  </div>
                  <button
                    onClick={() => setShowCreateSubjectModal(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 px-5 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:from-emerald-700 hover:to-emerald-800 hover:shadow-lg active:scale-95"
                  >
                    <FaPlus size={16} /> Thêm môn học
                  </button>
                </div>

                {/* Danh sách môn học */}
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm max-h-[70vh]">
                  <div className="max-h-[70vh] overflow-y-auto">
                    {loading && subjects.length === 0 ? (
                      <div className="p-12 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-3"></div>
                        <p className="text-slate-500">
                          Đang tải danh sách môn học...
                        </p>
                      </div>
                    ) : filteredSubjects.length === 0 ? (
                      <div className="p-12 text-center">
                        <FiBook
                          className="mx-auto text-slate-300 mb-3"
                          size={48}
                        />
                        <p className="text-slate-500 font-medium">
                          {subjectSearchTerm
                            ? "Không tìm thấy môn học nào"
                            : "Chưa có môn học nào"}
                        </p>
                        {!subjectSearchTerm && (
                          <button
                            onClick={() => setShowCreateSubjectModal(true)}
                            className="mt-4 text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                          >
                            Tạo môn học đầu tiên →
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {filteredSubjects.map((subj) => (
                          <div
                            key={subj._id}
                            onClick={() => handleOpenSubjectDetail(subj)}
                            className={`group p-5 cursor-pointer transition-all ${
                              currentSubject?._id === subj._id
                                ? "bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-l-4 border-emerald-600 shadow-sm"
                                : "hover:bg-slate-50 hover:shadow-sm"
                            }`}
                          >
                            <div className="flex items-start gap-4">
                              {/* Icon môn học */}
                              <div
                                className={`flex-shrink-0 p-3 rounded-xl ${
                                  currentSubject?._id === subj._id
                                    ? "bg-emerald-200"
                                    : "bg-slate-100 group-hover:bg-slate-200"
                                } transition-colors`}
                              >
                                <FiBook
                                  className={
                                    currentSubject?._id === subj._id
                                      ? "text-emerald-700"
                                      : "text-slate-600"
                                  }
                                  size={24}
                                />
                              </div>

                              {/* Thông tin môn học */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <h3 className="font-bold text-slate-900 text-lg mb-1">
                                      {subj.name}
                                    </h3>
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                                        {subj.code}
                                      </span>
                                    </div>
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2 text-sm">
                                        <MdSchool
                                          className="text-slate-400"
                                          size={16}
                                        />
                                        <span className="text-slate-600">
                                          {subj.teacher_name || (
                                            <span className="text-slate-400 italic">
                                              Chưa phân công
                                            </span>
                                          )}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 text-sm">
                                        <MdGroups
                                          className="text-slate-400"
                                          size={16}
                                        />
                                        <span className="text-slate-600">
                                          {subj.students?.length || 0} sinh viên
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Nút thêm sinh viên */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenAddStudentsModal(subj);
                                    }}
                                    className="flex-shrink-0 flex items-center gap-1.5 bg-purple-500 hover:bg-purple-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm transition-all hover:shadow active:scale-95"
                                  >
                                    <FaUserPlus size={12} /> Thêm SV
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Cột 2 - Chi tiết môn học */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-[60vh] overflow-hidden flex flex-col">
                {!currentSubject ? (
                  <div className="flex-1 flex items-center justify-center p-12">
                    <div className="text-center">
                      <div className="inline-flex p-4 bg-slate-100 rounded-full mb-4">
                        <FiBook className="text-slate-400" size={48} />
                      </div>
                      <p className="text-slate-500 font-medium mb-1">
                        Chưa chọn môn học
                      </p>
                      <p className="text-sm text-slate-400">
                        Chọn một môn học từ danh sách bên trái để xem chi tiết
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Header chi tiết */}
                    <div className="bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-b border-slate-200 p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-emerald-200 rounded-lg">
                              <FiBook className="text-emerald-700" size={20} />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-slate-900">
                                {currentSubject.name}
                              </h3>
                              <p className="text-sm text-slate-600 font-mono">
                                {currentSubject.code}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mt-3">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <MdSchool
                                className="text-emerald-600"
                                size={18}
                              />
                              <span>
                                <span className="font-medium">Giảng viên:</span>{" "}
                                {currentSubject.teacher_name || (
                                  <span className="text-slate-400 italic">
                                    Chưa phân công
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 border-b border-slate-200 px-6 bg-slate-50/50">
                      <button
                        onClick={() => setSubjectPanelMode("students")}
                        className={`relative px-5 py-3 text-sm font-medium transition-all ${
                          subjectPanelMode === "students"
                            ? "text-emerald-700"
                            : "text-slate-600 hover:text-slate-800"
                        }`}
                      >
                        <FaUser className="inline mr-2" size={14} />
                        Sinh viên
                        {subjectPanelMode === "students" && (
                          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-t-full"></span>
                        )}
                      </button>
                      <button
                        onClick={() => setSubjectPanelMode("exams")}
                        className={`relative px-5 py-3 text-sm font-medium transition-all ${
                          subjectPanelMode === "exams"
                            ? "text-emerald-700"
                            : "text-slate-600 hover:text-slate-800"
                        }`}
                      >
                        <FaRegCalendarAlt className="inline mr-2" size={14} />
                        Bài thi
                        {subjectPanelMode === "exams" && (
                          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-t-full"></span>
                        )}
                      </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-6 overflow-y-auto">
                      {subjectPanelMode === "students" ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <MdGroups
                                className="text-emerald-600"
                                size={20}
                              />
                              <p className="text-sm font-semibold text-slate-700">
                                {studentsInSubject.length} sinh viên
                              </p>
                            </div>
                            <button
                              onClick={() =>
                                handleOpenAddStudentsModal(currentSubject)
                              }
                              className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm transition-all hover:shadow active:scale-95"
                            >
                              <FaUserPlus size={12} /> Thêm sinh viên
                            </button>
                          </div>
                          {studentsInSubject.length === 0 ? (
                            <div className="text-center py-12">
                              <div className="inline-flex p-4 bg-slate-100 rounded-full mb-4">
                                <FaUser className="text-slate-400" size={32} />
                              </div>
                              <p className="text-slate-500 font-medium mb-1">
                                Chưa có sinh viên nào
                              </p>
                              <p className="text-sm text-slate-400 mb-4">
                                Thêm sinh viên vào môn học này để bắt đầu
                              </p>
                              <button
                                onClick={() =>
                                  handleOpenAddStudentsModal(currentSubject)
                                }
                                className="inline-flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-all hover:shadow"
                              >
                                <FaUserPlus /> Thêm sinh viên
                              </button>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 gap-3">
                              {studentsInSubject.map((stu) => (
                                <div
                                  key={stu._id}
                                  className="flex items-center gap-4 p-4 border border-slate-200 rounded-xl bg-gradient-to-r from-white to-slate-50/50 hover:shadow-md transition-all group"
                                >
                                  <div className="relative">
                                    <img
                                      src={
                                        stu.face_image
                                          ? `data:image/jpeg;base64,${stu.face_image}`
                                          : "https://ui-avatars.com/api/?name=" +
                                            encodeURIComponent(stu.name)
                                      }
                                      className="w-14 h-14 rounded-full object-cover border-2 border-slate-200 group-hover:border-emerald-300 transition-colors"
                                      alt={stu.name}
                                    />
                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                                      <FaUser
                                        className="text-white"
                                        size={10}
                                      />
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold text-slate-900 mb-1 truncate">
                                      {stu.name}
                                    </p>
                                    <div className="flex items-center gap-3 text-xs text-slate-600">
                                      <span className="flex items-center gap-1">
                                        <span className="font-medium">
                                          MSSV:
                                        </span>{" "}
                                        {stu.student_id}
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-500 truncate mt-1">
                                      {stu.email}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <MdAssignment
                                className="text-blue-600"
                                size={20}
                              />
                              <p className="text-sm font-semibold text-slate-700">
                                {examsInSubject.length} bài thi
                              </p>
                            </div>
                            <button
                              onClick={() => setShowCreateExamModal(true)}
                              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md transition-all hover:shadow-lg active:scale-95"
                            >
                              <FaPlus size={14} /> Tạo bài thi
                            </button>
                          </div>
                          {examsInSubject.length === 0 ? (
                            <div className="text-center py-12">
                              <div className="inline-flex p-4 bg-slate-100 rounded-full mb-4">
                                <FaRegCalendarAlt
                                  className="text-slate-400"
                                  size={32}
                                />
                              </div>
                              <p className="text-slate-500 font-medium mb-1">
                                Chưa có bài thi nào
                              </p>
                              <p className="text-sm text-slate-400 mb-4">
                                Tạo bài thi đầu tiên cho môn học này
                              </p>
                              <button
                                onClick={() => setShowCreateExamModal(true)}
                                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-all hover:shadow"
                              >
                                <FaPlus /> Tạo bài thi
                              </button>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 gap-3">
                              {examsInSubject.map((exam) => (
                                <div
                                  key={exam._id}
                                  className="group p-4 border border-slate-200 rounded-xl bg-gradient-to-r from-white to-blue-50/30 hover:shadow-lg transition-all cursor-pointer"
                                  onClick={() => openExamDetail(exam)}
                                >
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3 flex-1">
                                      <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                                        <FaRegCalendarAlt
                                          className="text-blue-600"
                                          size={20}
                                        />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-slate-900 mb-1">
                                          {exam.name}
                                        </h4>
                                        <div className="flex items-center gap-2 mb-2">
                                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-mono">
                                            {exam.code}
                                          </span>
                                        </div>
                                        {exam.start_time && (
                                          <p className="text-xs text-slate-500 flex items-center gap-1">
                                            <FaClock size={12} />
                                            {new Date(
                                              exam.start_time
                                            ).toLocaleString("vi-VN")}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openExamDetail(exam);
                                      }}
                                      className="flex-shrink-0 text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                                    >
                                      Chi tiết <span>→</span>
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Modal tạo môn học */}
            {showCreateSubjectModal && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg relative animate-scale-in">
                  <button
                    onClick={() => {
                      setShowCreateSubjectModal(false);
                      setSubjectForm({
                        name: "",
                        code: "",
                        teacher_id: "",
                        description: "",
                      });
                    }}
                    className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-100 rounded-lg"
                  >
                    <MdClose size={24} />
                  </button>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-emerald-100 rounded-xl">
                      <FiBook className="text-emerald-600" size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">
                        Tạo môn học mới
                      </h2>
                      <p className="text-sm text-slate-500">
                        Phân công giảng viên và thiết lập môn học
                      </p>
                    </div>
                  </div>
                  <form onSubmit={handleCreateSubject} className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-slate-700">
                        Tên môn học <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={subjectForm.name}
                        onChange={(e) =>
                          setSubjectForm({
                            ...subjectForm,
                            name: e.target.value,
                          })
                        }
                        placeholder="VD: Cấu trúc dữ liệu"
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-slate-700">
                        Mã môn học <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={subjectForm.code}
                        onChange={(e) =>
                          setSubjectForm({
                            ...subjectForm,
                            code: e.target.value,
                          })
                        }
                        placeholder="VD: CT101"
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-slate-700">
                        Phân công giảng viên{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={subjectForm.teacher_id}
                        onChange={(e) =>
                          setSubjectForm({
                            ...subjectForm,
                            teacher_id: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm"
                        required
                      >
                        <option value="">Chọn giảng viên...</option>
                        {teachers.map((t) => (
                          <option key={t._id} value={t._id}>
                            {t.name} ({t.email})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-slate-700">
                        Mô tả (tùy chọn)
                      </label>
                      <textarea
                        value={subjectForm.description}
                        onChange={(e) =>
                          setSubjectForm({
                            ...subjectForm,
                            description: e.target.value,
                          })
                        }
                        placeholder="Mô tả về môn học..."
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm resize-none"
                        rows="3"
                      />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCreateSubjectModal(false);
                          setSubjectForm({
                            name: "",
                            code: "",
                            teacher_id: "",
                            description: "",
                          });
                        }}
                        className="px-5 py-2.5 border border-slate-300 rounded-xl hover:bg-slate-50 font-medium text-slate-700 transition-all"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className={`px-5 py-2.5 rounded-xl text-white font-semibold shadow-md transition-all ${
                          loading
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 hover:shadow-lg active:scale-95"
                        }`}
                      >
                        {loading ? "Đang tạo..." : "Tạo môn học"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal thêm sinh viên vào môn học */}
            {showAddStudentsModal && currentSubject && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 overflow-auto p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-3xl relative max-h-[90vh] overflow-y-auto">
                  <button
                    onClick={() => setShowAddStudentsModal(false)}
                    className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-100 rounded-lg"
                  >
                    <MdClose size={24} />
                  </button>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-purple-100 rounded-xl">
                      <FaUserPlus className="text-purple-600" size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">
                        Thêm sinh viên
                      </h2>
                      <p className="text-sm text-slate-500">
                        Môn học: {currentSubject.name}
                      </p>
                    </div>
                  </div>
                  <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-xl">
                    <p className="text-sm text-purple-800">
                      <span className="font-semibold">Đã chọn:</span>{" "}
                      {selectedStudentsForSubject.length} sinh viên
                    </p>
                  </div>
                  <div className="max-h-96 overflow-y-auto space-y-2 mb-6">
                    {availableStudents.length === 0 ? (
                      <div className="text-center py-12">
                        <MdGroups
                          className="mx-auto text-slate-300 mb-3"
                          size={48}
                        />
                        <p className="text-slate-500 font-medium">
                          Tất cả sinh viên đã được thêm vào môn học này
                        </p>
                      </div>
                    ) : (
                      availableStudents.map((stu) => (
                        <label
                          key={stu._id}
                          className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                            selectedStudentsForSubject.includes(stu._id)
                              ? "border-purple-500 bg-purple-50"
                              : "border-slate-200 hover:border-purple-300 hover:bg-purple-50/30"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedStudentsForSubject.includes(
                              stu._id
                            )}
                            onChange={() =>
                              toggleStudentSelectionForSubject(stu)
                            }
                            className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                          />
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold">
                              {stu.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-slate-900">
                                {stu.name}
                              </p>
                              <p className="text-sm text-slate-600">
                                {stu.student_id} • {stu.email}
                              </p>
                            </div>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                    <button
                      onClick={() => setShowAddStudentsModal(false)}
                      className="px-5 py-2.5 border border-slate-300 rounded-xl hover:bg-slate-50 font-medium text-slate-700 transition-all"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleAddStudentsToSubject}
                      disabled={selectedStudentsForSubject.length === 0}
                      className={`px-5 py-2.5 rounded-xl text-white font-semibold shadow-md transition-all ${
                        selectedStudentsForSubject.length === 0
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 hover:shadow-lg active:scale-95"
                      }`}
                    >
                      Thêm{" "}
                      {selectedStudentsForSubject.length > 0 &&
                        `(${selectedStudentsForSubject.length})`}{" "}
                      sinh viên
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal tạo bài thi */}
            {showCreateExamModal && currentSubject && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 overflow-auto p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-3xl relative max-h-[90vh] overflow-y-auto">
                  <button
                    onClick={() => {
                      setShowCreateExamModal(false);
                      setExamForm({
                        name: "",
                        code: "",
                        start_time: "",
                        duration: "",
                      });
                      setExamSessions([{ start_time: "", duration: "" }]);
                    }}
                    className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-100 rounded-lg"
                  >
                    <MdClose size={24} />
                  </button>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <FaRegCalendarAlt className="text-blue-600" size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">
                        Tạo bài thi mới
                      </h2>
                      <p className="text-sm text-slate-500">
                        Môn học: {currentSubject.name}
                      </p>
                    </div>
                  </div>
                  <form onSubmit={handleCreateExam} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-slate-700">
                          Tên bài thi <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={examForm.name}
                          onChange={(e) =>
                            setExamForm({ ...examForm, name: e.target.value })
                          }
                          placeholder="VD: Kiểm tra giữa kỳ"
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-slate-700">
                          Mã bài thi <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={examForm.code}
                          onChange={(e) =>
                            setExamForm({ ...examForm, code: e.target.value })
                          }
                          placeholder="VD: KT001"
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm font-mono"
                          required
                        />
                      </div>
                    </div>

                    <div className="border-t border-slate-200 pt-6">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900 mb-1">
                            Ca thi
                          </h3>
                          <p className="text-sm text-slate-500">
                            Thêm các ca thi cho bài thi này
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={addSessionRow}
                          className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-medium shadow-sm transition-all hover:shadow active:scale-95"
                        >
                          <FaPlus size={14} /> Thêm ca thi
                        </button>
                      </div>
                      <div className="space-y-4">
                        {examSessions.map((ses, idx) => (
                          <div
                            key={idx}
                            className="border-2 border-slate-200 p-5 rounded-xl bg-gradient-to-r from-slate-50 to-white hover:border-blue-300 transition-all"
                          >
                            <div className="flex justify-between items-center mb-4">
                              <div className="flex items-center gap-2">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                  <FaClock
                                    className="text-blue-600"
                                    size={16}
                                  />
                                </div>
                                <h4 className="font-bold text-slate-900">
                                  Ca {idx + 1}
                                </h4>
                              </div>
                              {examSessions.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeSessionRow(idx)}
                                  className="text-red-600 hover:text-red-700 text-sm font-medium px-3 py-1 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <FiTrash2 className="inline mr-1" size={14} />{" "}
                                  Xóa
                                </button>
                              )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-medium mb-1.5 text-slate-600">
                                  Thời gian bắt đầu
                                </label>
                                <input
                                  type="datetime-local"
                                  min={new Date().toISOString().slice(0, 16)}
                                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                                  value={ses.start_time}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    // Lấy thời gian hiện tại (định dạng giống datetime-local)
                                    // Tạo thời gian hiện tại +7 giờ (bù lại UTC)
                                    const now = new Date();
                                    now.setHours(now.getHours() + 7);

                                    // Chuẩn ISO rồi cắt giống datetime-local
                                    const nowValue = now
                                      .toISOString()
                                      .slice(0, 16);

                                    if (value < nowValue) {
                                      toast.error(
                                        "Không được chọn thời gian ở quá khứ"
                                      );
                                      return;
                                    }
                                    updateSessionField(
                                      idx,
                                      "start_time",
                                      e.target.value
                                    );
                                  }}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium mb-1.5 text-slate-600">
                                  Thời lượng (phút)
                                </label>
                                <input
                                  type="number"
                                  min={15}
                                  placeholder="Tối thiểu 15 phút"
                                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                                  value={ses.duration}
                                  onChange={(e) => {
                                    updateSessionField(
                                      idx,
                                      "duration",
                                      e.target.value
                                    );
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCreateExamModal(false);
                          setExamForm({
                            name: "",
                            code: "",
                            start_time: "",
                            duration: "",
                          });
                          setExamSessions([{ start_time: "", duration: "" }]);
                        }}
                        className="px-5 py-2.5 border border-slate-300 rounded-xl hover:bg-slate-50 font-medium text-slate-700 transition-all"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className={`px-5 py-2.5 rounded-xl text-white font-semibold shadow-md transition-all ${
                          loading
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover:shadow-lg active:scale-95"
                        }`}
                      >
                        {loading ? "Đang tạo..." : "Tạo bài thi"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal chi tiết bài thi */}
            {showExamDetailModal && currentExam && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-auto">
                <div className="bg-white rounded-xl p-6 w-full max-w-3xl relative max-h-[90vh] overflow-y-auto">
                  <button
                    onClick={() => setShowExamDetailModal(false)}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                  >
                    <MdClose size={24} />
                  </button>
                  <h2 className="text-xl font-semibold mb-4">
                    Chi tiết bài thi: {currentExam.name}
                  </h2>

                  <div className="mb-4">
                    <h3 className="font-medium mb-2">Danh sách ca thi</h3>
                    {examSessionsList.length === 0 ? (
                      <p className="text-slate-500">Chưa có ca thi nào.</p>
                    ) : (
                      <div className="space-y-3">
                        {examSessionsList.map((s) => {
                          const status = getSessionStatus(s);
                          return (
                            <div key={s._id} className="border p-3 rounded-lg">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-semibold">Ca: {s.name}</p>
                                  <p className="text-sm text-slate-600">
                                    Bắt đầu:{" "}
                                    {new Date(
                                      new Date(s.start_time).getTime() +
                                        7 * 60 * 60 * 1000
                                    ).toLocaleString("vi-VN")}
                                  </p>
                                  <p className="text-sm text-slate-500">
                                    Thời lượng: {s.duration} phút
                                  </p>
                                  {status === "active" && (
                                    <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                                      Đang diễn ra
                                    </span>
                                  )}
                                  {status === "soon" && (
                                    <span className="inline-block mt-2 px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">
                                      Chưa đến giờ
                                    </span>
                                  )}
                                  {status === "done" && (
                                    <span className="inline-block mt-2 px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                                      Đã kết thúc
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-col gap-2">
                                  <button
                                    onClick={() =>
                                      openAddStudentsToSession({
                                        session: s,
                                        exam: currentExam,
                                      })
                                    }
                                    className="flex  items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm"
                                  >
                                    <FaUserPlus /> Thêm SV
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleViewStudentsInSession(s)
                                    }
                                    className="flex  items-center gap-2 bg-emerald-500 text-white px-3 py-1 rounded text-sm"
                                  >
                                    <FaEye /> Xem SV
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowAddSessionModal(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                      <FaPlus /> Thêm ca thi
                    </button>
                    <button
                      onClick={() => setShowExamDetailModal(false)}
                      className="px-4 py-2 border rounded-lg"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal thêm ca thi */}
            {showAddSessionModal && currentExam && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 w-96 relative">
                  <button
                    onClick={() => {
                      setShowAddSessionModal(false);
                      setNewSessionForm({ start_time: "", duration: "" });
                    }}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                  >
                    <MdClose size={24} />
                  </button>
                  <h2 className="text-xl font-semibold mb-4">Thêm ca thi</h2>
                  <div className="space-y-3">
                    <input
                      type="datetime-local"
                      min={new Date().toISOString().slice(0, 16)}
                      value={newSessionForm.start_time}
                      onChange={(e) => {
                        setNewSessionForm({
                          ...newSessionForm,
                          start_time: e.target.value,
                        });
                        const value = e.target.value;
                        // Lấy thời gian hiện tại (định dạng giống datetime-local)
                        // Tạo thời gian hiện tại +7 giờ (bù lại UTC)
                        const now = new Date();
                        now.setHours(now.getHours() + 7);

                        // Chuẩn ISO rồi cắt giống datetime-local
                        const nowValue = now.toISOString().slice(0, 16);

                        if (value < nowValue) {
                          toast.error("Không được chọn thời gian ở quá khứ");
                          return;
                        }
                      }}
                      className="border px-3 py-2 rounded-lg w-full"
                    />
                    <input
                      type="number"
                      min={15}
                      placeholder="Thời lượng (phút)"
                      value={newSessionForm.duration}
                      onChange={(e) =>
                        setNewSessionForm({
                          ...newSessionForm,
                          duration: e.target.value,
                        })
                      }
                      className="border px-3 py-2 rounded-lg w-full"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setShowAddSessionModal(false);
                          setNewSessionForm({ start_time: "", duration: "" });
                        }}
                        className="px-4 py-2 border rounded"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={handleAddSessionToExam}
                        className="px-4 py-2 bg-blue-600 text-white rounded"
                      >
                        Thêm ca thi
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal thêm sinh viên vào ca thi */}
            {showAddStudentsToSessionModal && targetSession && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-auto">
                <div className="bg-white rounded-xl p-6 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
                  <button
                    onClick={() => setShowAddStudentsToSessionModal(false)}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                  >
                    <MdClose size={24} />
                  </button>
                  <h2 className="text-xl font-semibold mb-4">
                    Thêm sinh viên vào ca thi
                  </h2>
                  <p className="text-sm text-slate-600 mb-3">
                    Ca:{" "}
                    {new Date(targetSession.start_time).toLocaleString("vi-VN")}
                  </p>
                  <div className="max-h-96 overflow-y-auto space-y-2 mb-4">
                    {studentsNotInSession.length === 0 ? (
                      <p className="text-slate-500 text-center py-8">
                        Tất cả sinh viên đã được thêm vào ca thi này.
                      </p>
                    ) : (
                      studentsNotInSession.map((stu) => (
                        <label
                          key={stu._id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 cursor-pointer"
                        >
                          <span className="text-sm">
                            {stu.name} - {stu.student_id}
                          </span>
                          <input
                            type="checkbox"
                            checked={selectedStudentsForSession.includes(
                              stu._id
                            )}
                            onChange={() =>
                              toggleStudentSelectionForSession(stu)
                            }
                          />
                        </label>
                      ))
                    )}
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowAddStudentsToSessionModal(false)}
                      className="px-4 py-2 border rounded-lg"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleAddStudentsToSession}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg"
                    >
                      Thêm sinh viên
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal xem sinh viên trong ca thi */}
            {showStudentsInSessionModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-auto">
                <div className="bg-white rounded-xl p-6 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
                  <button
                    onClick={() => setShowStudentsInSessionModal(false)}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                  >
                    <MdClose size={24} />
                  </button>
                  <h2 className="text-xl font-semibold mb-4">
                    Danh sách sinh viên trong ca thi
                  </h2>
                  {studentsInSession.length === 0 ? (
                    <p className="text-slate-500 text-center py-8">
                      Chưa có sinh viên nào.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {studentsInSession.map((stu) => (
                        <div
                          key={stu._id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <span className="text-sm">
                            {stu.name} - {stu.student_id}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-end mt-4">
                    <button
                      onClick={() => setShowStudentsInSessionModal(false)}
                      className="px-4 py-2 border rounded-lg"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case "stats": {
        const accountDistributionData = getAccountDistributionData();
        const topSubjectsData = getTopSubjectsByStudentsData();
        const subjectsByTeacherData = getSubjectsByTeacherData();
        const sessionsByStatusData = getSessionsByStatusData();
        const examsOverTimeData = getExamsOverTimeData();
        const totalSubjectsStats = subjects.length;
        const totalExams = allExams.length;
        const totalSessions = allSessions.length;

        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">
              Thống kê tổng quan
            </h2>

            {/* Thống kê nhanh */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-blue-50 to-blue-100 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-blue-600">
                      Tổng tài khoản
                    </p>
                    <p className="mt-2 text-3xl font-bold text-blue-900">
                      {totalAccounts}
                    </p>
                    <p className="mt-1 text-xs text-blue-700">
                      Giảng viên & Sinh viên
                    </p>
                  </div>
                  <FiUsers className="text-blue-500" size={32} />
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-emerald-50 to-emerald-100 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">
                      Tổng môn học
                    </p>
                    <p className="mt-2 text-3xl font-bold text-emerald-900">
                      {totalSubjectsStats}
                    </p>
                    <p className="mt-1 text-xs text-emerald-700">
                      Môn học đang quản lý
                    </p>
                  </div>
                  <FiBook className="text-emerald-500" size={32} />
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-purple-50 to-purple-100 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-purple-600">
                      Tổng kỳ thi
                    </p>
                    <p className="mt-2 text-3xl font-bold text-purple-900">
                      {totalExams}
                    </p>
                    <p className="mt-1 text-xs text-purple-700">
                      Kỳ thi đã tạo
                    </p>
                  </div>
                  <MdAssignment className="text-purple-500" size={32} />
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-amber-50 to-amber-100 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-amber-600">
                      Tổng ca thi
                    </p>
                    <p className="mt-2 text-3xl font-bold text-amber-900">
                      {totalSessions}
                    </p>
                    <p className="mt-1 text-xs text-amber-700">Ca thi đã tạo</p>
                  </div>
                  <FaRegCalendarAlt className="text-amber-500" size={32} />
                </div>
              </div>
            </div>

            {/* Biểu đồ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Biểu đồ tròn: Phân bổ tài khoản */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">
                  Phân bổ tài khoản
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={accountDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {accountDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Biểu đồ tròn: Trạng thái ca thi */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">
                  Trạng thái ca thi
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={sessionsByStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {sessionsByStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Biểu đồ cột: Top 5 môn học có nhiều sinh viên nhất */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">
                  Top 5 môn học có nhiều sinh viên nhất
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topSubjectsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar
                      dataKey="students"
                      fill="#3b82f6"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Biểu đồ cột: Số lượng môn học theo giảng viên */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">
                  Số lượng môn học theo giảng viên
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={subjectsByTeacherData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#10b981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Biểu đồ đường: Số lượng kỳ thi theo thời gian (7 ngày gần nhất) */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">
                  Số lượng kỳ thi được tạo (7 ngày gần nhất)
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={examsOverTimeData}>
                    <defs>
                      <linearGradient
                        id="colorExams"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#8b5cf6"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="#8b5cf6"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="exams"
                      stroke="#8b5cf6"
                      fillOpacity={1}
                      fill="url(#colorExams)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );
      }

      case "reports": {
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">
              Báo cáo tổng hợp
            </h2>

            {/* Form filter */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                Bộ lọc
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Từ ngày <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={reportFilters.start_date}
                    onChange={(e) =>
                      setReportFilters({
                        ...reportFilters,
                        start_date: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Đến ngày <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={reportFilters.end_date}
                    onChange={(e) =>
                      setReportFilters({
                        ...reportFilters,
                        end_date: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Môn học
                  </label>
                  <select
                    value={reportFilters.class_id}
                    onChange={(e) =>
                      setReportFilters({
                        ...reportFilters,
                        class_id: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="">Tất cả môn học</option>
                    {subjects.map((subject) => (
                      <option key={subject._id} value={subject._id}>
                        {subject.code} - {subject.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end gap-2">
                  <button
                    onClick={handleGenerateReport}
                    disabled={reportLoading}
                    className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition ${
                      reportLoading
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-indigo-600 hover:bg-indigo-700 hover:shadow"
                    }`}
                  >
                    {reportLoading ? "Đang tạo..." : "Tạo báo cáo"}
                  </button>
                  {reportData && (
                    <button
                      onClick={handleExportExcel}
                      className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 hover:shadow"
                    >
                      <FiDownload size={16} />
                      Excel
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Kết quả báo cáo */}
            {reportData && (
              <div className="space-y-6">
                {/* Thống kê tổng quan */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-red-50 to-red-100 p-5 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-red-600">
                      Tổng số vi phạm
                    </p>
                    <p className="mt-2 text-3xl font-bold text-red-900">
                      {reportData.statistics.total_violations}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-orange-50 to-orange-100 p-5 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-orange-600">
                      Vi phạm hành vi
                    </p>
                    <p className="mt-2 text-3xl font-bold text-orange-900">
                      {reportData.statistics.behavior_violations}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-purple-50 to-purple-100 p-5 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-purple-600">
                      Vi phạm nhận diện
                    </p>
                    <p className="mt-2 text-3xl font-bold text-purple-900">
                      {reportData.statistics.face_violations}
                    </p>
                  </div>
                </div>

                {/* Biểu đồ thống kê */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Biểu đồ tròn: Phân bổ vi phạm theo loại */}
                  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">
                      Phân bổ vi phạm theo loại
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={[
                            {
                              name: "Hành vi",
                              value: reportData.statistics.behavior_violations,
                              color: "#f59e0b",
                            },
                            {
                              name: "Nhận diện",
                              value: reportData.statistics.face_violations,
                              color: "#8b5cf6",
                            },
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {[{ color: "#f59e0b" }, { color: "#8b5cf6" }].map(
                            (entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            )
                          )}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Biểu đồ cột: Thống kê theo môn học */}
                  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">
                      Thống kê vi phạm theo môn học
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={Object.entries(reportData.class_statistics).map(
                          ([name, stats]) => ({
                            name:
                              name.length > 15
                                ? name.substring(0, 15) + "..."
                                : name,
                            "Tổng vi phạm": stats.total,
                            "Vi phạm hành vi": stats.behavior,
                            "Vi phạm nhận diện": stats.face,
                          })
                        )}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="name"
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="Tổng vi phạm"
                          fill="#ef4444"
                          radius={[8, 8, 0, 0]}
                        />
                        <Bar
                          dataKey="Vi phạm hành vi"
                          fill="#f59e0b"
                          radius={[8, 8, 0, 0]}
                        />
                        <Bar
                          dataKey="Vi phạm nhận diện"
                          fill="#8b5cf6"
                          radius={[8, 8, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Bảng chi tiết vi phạm */}
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-800">
                      Chi tiết vi phạm ({reportData.violations.length} bản ghi)
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 font-semibold text-slate-700">
                            STT
                          </th>
                          <th className="px-4 py-3 font-semibold text-slate-700">
                            Thời gian
                          </th>
                          {/* <th className="px-4 py-3 font-semibold text-slate-700">
                            Sinh viên
                          </th> */}
                          <th className="px-4 py-3 font-semibold text-slate-700">
                            Mã SV
                          </th>
                          <th className="px-4 py-3 font-semibold text-slate-700">
                            Môn học
                          </th>
                          <th className="px-4 py-3 font-semibold text-slate-700">
                            Kỳ thi
                          </th>
                          <th className="px-4 py-3 font-semibold text-slate-700">
                            Loại
                          </th>
                          <th className="px-4 py-3 font-semibold text-slate-700">
                            Hành vi
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {reportData.violations.length === 0 ? (
                          <tr>
                            <td
                              colSpan="8"
                              className="px-4 py-8 text-center text-slate-500"
                            >
                              Không có dữ liệu vi phạm
                            </td>
                          </tr>
                        ) : (
                          reportData.violations.map((v, index) => (
                            <tr key={index} className="hover:bg-slate-50">
                              <td className="px-4 py-3 text-slate-600">
                                {index + 1}
                              </td>
                              <td className="px-4 py-3 text-slate-600">
                                {v.timestamp
                                  ? new Date(v.timestamp).toLocaleString(
                                      "vi-VN"
                                    )
                                  : "N/A"}
                              </td>
                              {/* <td className="px-4 py-3 text-slate-600">
                                {v.student_name || "N/A"}
                              </td> */}
                              <td className="px-4 py-3 text-slate-600">
                                {v.student || "N/A"}
                              </td>
                              <td className="px-4 py-3 text-slate-600">
                                {v.class_name || "N/A"}
                              </td>
                              <td className="px-4 py-3 text-slate-600">
                                {v.exam_name || "N/A"}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                    v.type === "behavior"
                                      ? "bg-orange-100 text-orange-800"
                                      : v.type === "face"
                                      ? "bg-purple-100 text-purple-800"
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {v.type === "behavior"
                                    ? "Hành vi"
                                    : v.type === "face"
                                    ? "Nhận diện"
                                    : "N/A"}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-600">
                                {v.behavior_display ||
                                  getBehaviorName(v.behavior, v.type)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {!reportData && (
              <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm text-center">
                <FiFileText className="mx-auto text-slate-400" size={48} />
                <p className="mt-4 text-sm text-slate-600">
                  Chọn khoảng thời gian và nhấn "Tạo báo cáo" để xem kết quả
                </p>
              </div>
            )}
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-slate-100 to-slate-200 text-slate-900">
      <div className="flex min-h-screen w-full">
        {/* Sidebar - Fixed và cải thiện */}
        <aside className="hidden w-72 flex-col border-r border-slate-200 bg-white shadow-lg sm:flex sticky top-0 h-screen">
          {/* Logo/Brand Section */}
          <div className="bg-linear-to-br from-indigo-600 to-purple-600 px-6 py-5 text-white shadow-md flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                <MdSchool className="text-xl" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-wide">Online Exam</h1>
                <p className="text-xs text-indigo-100">Bảng điều khiển Admin</p>
              </div>
            </div>
          </div>

          {/* Navigation Menu - Cải thiện */}
          <nav className="flex-1 space-y-2 overflow-y-auto p-4">
            {menuItems.map((item) => {
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  className={`group relative flex w-full items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-linear-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30"
                      : "text-slate-700 hover:bg-slate-100 hover:text-indigo-600"
                  }`}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-white"></div>
                  )}
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg transition-all ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600"
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="flex-1 text-left">{item.label}</span>
                  {isActive && (
                    <div className="h-2 w-2 shrink-0 rounded-full bg-white"></div>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-slate-200 bg-slate-50 px-4 py-4 flex-shrink-0">
            <div className="flex items-center gap-3 rounded-lg bg-white px-3 py-2.5 shadow-sm">
              <img
                src="https://ui-avatars.com/api/?name=Admin&background=6366f1&color=fff"
                alt="Admin"
                className="h-10 w-10 rounded-full ring-2 ring-indigo-200"
              />
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">
                  Quản trị viên
                </p>
                <p className="text-xs text-slate-500">Administrator</p>
              </div>
            </div>
            <div className="mt-3 text-center text-[10px] text-slate-400">
              © {new Date().getFullYear()} Online Exam System
            </div>
          </div>
        </aside>

        {/* Main Content Area - Full Width */}
        <div className="flex flex-1 flex-col">
          {/* Sticky Header */}
          <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm shadow-sm">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex-1"></div>
              <div className="flex items-center gap-4">
                <div className="hidden items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm sm:flex">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium text-slate-700">
                    Trực tuyến
                  </span>
                </div>
                <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm">
                  <img
                    src="https://ui-avatars.com/api/?name=Admin&background=6366f1&color=fff"
                    alt="Admin"
                    className="h-9 w-9 rounded-full ring-2 ring-indigo-200"
                  />
                  <span className="hidden text-sm font-semibold text-slate-700 sm:inline">
                    Admin
                  </span>
                </div>
              </div>
            </div>
          </header>

          {/* Scrollable Content */}
          <main className="flex-1 overflow-y-auto p-6">
            <div className="mx-auto w-full max-w-[1600px]">
              <div className="space-y-6">{renderContent()}</div>
            </div>
          </main>
        </div>

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              fontSize: "14px",
              borderRadius: "8px",
              padding: "12px 16px",
            },
          }}
        />
      </div>
    </div>
  );
}
