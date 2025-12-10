// import React, { useEffect, useRef, useState } from "react";
// import { useSelector } from "react-redux";
// import { useSearchParams } from "react-router-dom";

// export default function StudentLive({fps=24 }) {
//   const videoRef = useRef(null);
//   const canvasRef = useRef(null);
//   const wsRef = useRef(null);
//   const [connected, setConnected] = useState(false);
//   const [behavior, setBehavior] = useState(null);

//   const [params] = useSearchParams();
//   const examId = params.get("exam");

//   const { userInfo, isAuthenticated } = useSelector((state) => state.user);

//   useEffect(() => {
//     async function startCamera() {
//       try {
//         const stream = await navigator.mediaDevices.getUserMedia({ video:{ width:640, height:480 }, audio:false });
//         videoRef.current.srcObject = stream;
//         await videoRef.current.play();
//       } catch (e) {
//         console.error("camera error", e);
//       }
//     }
//     startCamera();

//     // connect ws
//     wsRef.current = new WebSocket(`ws://localhost:8000/ws/student?exam=${examId}&student=${userInfo.student_id}`);
//     wsRef.current.onopen = () => setConnected(true);
//     wsRef.current.onmessage = (ev) => {
//       try {
//         const data = JSON.parse(ev.data);
//         if (data.type === "self_assessment") {
//           setBehavior(data.behavior);
//         }
//       } catch (e) {}
//     };
//     wsRef.current.onclose = () => setConnected(false);

//     const interval = setInterval(() => {
//       if (!videoRef.current || !(wsRef.current && wsRef.current.readyState === WebSocket.OPEN)) return;
//       const v = videoRef.current;
//       const canvas = canvasRef.current || document.createElement("canvas");
//       canvas.width = 640;
//       canvas.height = 480;
//       const ctx = canvas.getContext("2d");
//       ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
//       // compress jpeg quality 0.6
//       const b64 = canvas.toDataURL("image/jpeg", 0.6);
//       const payload = { type: "frame", ts: Date.now(), b64 };
//       wsRef.current.send(JSON.stringify(payload));
//     }, 1000 / Math.max(1,fps));

//     return () => {
//       clearInterval(interval);
//       try { wsRef.current.close(); } catch {}
//       if (videoRef.current?.srcObject) videoRef.current.srcObject.getTracks().forEach(t=>t.stop());
//     };
//   }, [examId, userInfo.ID, fps]);

//   return (
//     <div>
//       <div>
//         <video ref={videoRef} autoPlay muted playsInline style={{width:320,height:240,objectFit:"cover",borderRadius:8}} />
//         <canvas ref={canvasRef} style={{display:"none"}}/>
//       </div>
//       <div>
//         <p>WS: {connected ? "connected":"disconnected"}</p>
//         <p>Behavior: {behavior ? `${behavior.class} (${(behavior.score*100).toFixed(1)}%)` : "chưa có"}</p>
//       </div>
//     </div>
//   );
// }

// import React, { useEffect, useRef, useState } from "react";
// import { useSelector } from "react-redux";
// import { useSearchParams } from "react-router-dom";

// export default function StudentLive({ fps = 24 }) {
//   const videoRef = useRef(null);
//   const canvasRef = useRef(null);
//   const wsRef = useRef(null);
//   const [connected, setConnected] = useState(false);
//   const [detections, setDetections] = useState([]);
//   const [violationRate, setViolationRate] = useState(0);

//   const [params] = useSearchParams();
//   const examId = params.get("exam");
//   const { userInfo } = useSelector((state) => state.user);

//   useEffect(() => {
//     async function startCamera() {
//       try {
//         const stream = await navigator.mediaDevices.getUserMedia({
//           video: { width: 640, height: 480 },
//           audio: false,
//         });
//         videoRef.current.srcObject = stream;
//         await videoRef.current.play();
//       } catch (e) {
//         console.error("camera error", e);
//       }
//     }
//     startCamera();

//     // 🔹 Kết nối WebSocket
//     wsRef.current = new WebSocket(
//       `ws://localhost:8000/ws/student?exam=${examId}&student=${userInfo.student_id}`
//     );
//     wsRef.current.onopen = () => setConnected(true);
//     wsRef.current.onmessage = (ev) => {
//       try {
//         const data = JSON.parse(ev.data);
//         if (data.type === "self_assessment") {
//           setDetections(data.detections || []);
//           setViolationRate(data.violation_rate || 0);
//         }
//       } catch (e) {
//         console.error("WS parse error", e);
//       }
//     };
//     wsRef.current.onclose = () => setConnected(false);

//     // 🔹 Gửi frame định kỳ
//     const interval = setInterval(() => {
//       if (!videoRef.current || !(wsRef.current && wsRef.current.readyState === WebSocket.OPEN))
//         return;
//       const v = videoRef.current;
//       const canvas = canvasRef.current || document.createElement("canvas");
//       canvas.width = 640;
//       canvas.height = 480;
//       const ctx = canvas.getContext("2d");
//       ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
//       const b64 = canvas.toDataURL("image/jpeg", 0.6);
//       const payload = { type: "frame", ts: Date.now(), b64 };
//       wsRef.current.send(JSON.stringify(payload));
//     }, 1000 / Math.max(1, fps));

//     return () => {
//       clearInterval(interval);
//       try {
//         wsRef.current.close();
//       } catch {}
//       if (videoRef.current?.srcObject)
//         videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
//     };
//   }, [examId, userInfo.student_id, fps]);

//   return (
//     <div className="p-4 bg-gray-100 min-h-screen flex flex-col items-center">
//       {/* Camera */}
//       <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden shadow-md">
//         <video
//           ref={videoRef}
//           autoPlay
//           muted
//           playsInline
//           style={{ width: 640, height: 480, objectFit: "cover" }}
//         />
//         <canvas ref={canvasRef} style={{ display: "none" }} />
//       </div>

//       {/* Status */}
//       <div className="mt-4 text-center">
//         <p className="font-semibold">
//           WS Status:{" "}
//           <span className={connected ? "text-green-600" : "text-red-600"}>
//             {connected ? "Connected" : "Disconnected"}
//           </span>
//         </p>
//         <p>
//           Violation Rate:{" "}
//           <strong className={violationRate > 0 ? "text-red-600" : "text-green-600"}>
//             {(violationRate * 100).toFixed(1)}%
//           </strong>
//         </p>
//       </div>

//       {/* Detection list */}
//       <div className="mt-6 w-full max-w-md bg-white rounded-xl shadow-md p-4">
//         <h3 className="text-lg font-bold mb-2">🎯 Behavior Detections</h3>
//         {detections.length > 0 ? (
//           <table className="w-full text-sm text-left border-collapse">
//             <thead>
//               <tr className="border-b bg-gray-50">
//                 <th className="py-1 px-2">#</th>
//                 <th className="py-1 px-2">Label</th>
//                 <th className="py-1 px-2">Score</th>
//               </tr>
//             </thead>
//             <tbody>
//               {detections.map((d, i) => (
//                 <tr key={i} className="border-b hover:bg-gray-100">
//                   <td className="py-1 px-2">{i + 1}</td>
//                   <td
//                     className={`py-1 px-2 font-medium ${
//                       d.label !== "normal" ? "text-red-600" : "text-green-600"
//                     }`}
//                   >
//                     {d.label}
//                   </td>
//                   <td className="py-1 px-2">{(d.score * 100).toFixed(1)}%</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         ) : (
//           <p className="text-gray-500 text-sm italic">Chưa có dữ liệu nhận diện...</p>
//         )}
//       </div>
//     </div>
//   );
// }

// Final

// import React, { useEffect, useRef, useState } from "react";
// import { useSelector } from "react-redux";
// import { useSearchParams } from "react-router-dom";

// export default function StudentLive({ fps = 4 }) {
//   const videoRef = useRef(null);
//   const canvasRef = useRef(null);
//   const wsRef = useRef(null);
//   const sendCooldown = useRef(0);
//   const lastAnnotatedUpdate = useRef(0);

//   const [connected, setConnected] = useState(false);
//   const [detections, setDetections] = useState([]);
//   const [violationRate, setViolationRate] = useState(0);
//   const [annotatedFrame, setAnnotatedFrame] = useState(null);

//   const [params] = useSearchParams();
//   const examId = params.get("exam");
//   const { userInfo } = useSelector((state) => state.user);

//   const verifyInfo = useSelector((state) => state.verify.verifyInfo);

//   useEffect(() => {
//     let animationId = null;
//     const targetInterval = 1000 / fps;

//     async function startCamera() {
//       const stream = await navigator.mediaDevices.getUserMedia({
//         video: { width: 640, height: 480 },
//         audio: false,
//       });
//       videoRef.current.srcObject = stream;
//       await videoRef.current.play();
//     }
//     startCamera();

//     wsRef.current = new WebSocket(
//       `ws://localhost:8000/ws/student?exam=${examId}&student=${userInfo.student_id}&class_id=${verifyInfo.classId}`
//     );

//     wsRef.current.onopen = () => setConnected(true);

//     wsRef.current.onmessage = (ev) => {
//       const data = JSON.parse(ev.data);
//       if (data.type !== "self_assessment") return;

//       setDetections(data.detections || []);
//       setViolationRate(data.violation_rate || 0);

//       // throttle annotated frame update (300 ms)
//       if (Date.now() - lastAnnotatedUpdate.current > 300) {
//         setAnnotatedFrame(data.frame_b64);
//         lastAnnotatedUpdate.current = Date.now();
//       }
//     };

//     wsRef.current.onclose = () => setConnected(false);

//     function loop() {
//       animationId = requestAnimationFrame(loop);

//       const now = performance.now();
//       if (now - sendCooldown.current < targetInterval) return;
//       sendCooldown.current = now;

//       const video = videoRef.current;
//       const canvas = canvasRef.current;
//       if (!video || !canvas) return;

//       const ctx = canvas.getContext("2d");
//       canvas.width = 640;
//       canvas.height = 480;
//       ctx.drawImage(video, 0, 0, 640, 480);

//       // toBlob nhanh hơn rất nhiều
//       canvas.toBlob(
//         (blob) => {
//           if (!blob) return;
//           const reader = new FileReader();
//           reader.onloadend = () => {
//             if (wsRef.current?.readyState === WebSocket.OPEN) {
//               wsRef.current.send(
//                 JSON.stringify({
//                   type: "frame",
//                   b64: reader.result,
//                   ts: Date.now(),
//                 })
//               );
//             }
//           };
//           reader.readAsDataURL(blob);
//         },
//         "image/jpeg",
//         0.6
//       );
//     }

//     animationId = requestAnimationFrame(loop);

//     return () => {
//       cancelAnimationFrame(animationId);
//       wsRef.current?.close();
//       videoRef.current?.srcObject?.getTracks().forEach((t) => t.stop());
//     };
//   }, []);

//   return (
//     <div className="p-4">
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {/* VIDEO + OVERLAY */}
//         <div className="flex justify-center">
//           <div className="relative w-[640px] h-[480px] rounded-xl overflow-hidden shadow-lg border border-gray-300 bg-black">
//             <video
//               ref={videoRef}
//               autoPlay
//               muted
//               playsInline
//               className="w-full h-full object-cover"
//             />

//             {annotatedFrame && (
//               <img
//                 src={annotatedFrame}
//                 className="absolute top-0 left-0 w-full h-full object-cover"
//               />
//             )}

//             <canvas ref={canvasRef} className="hidden" />
//           </div>
//         </div>

//         {/* STATUS + DETECTION */}
//         <div className="space-y-6">
//           {/* WS + STATUS */}
//           <div className="bg-white rounded-xl shadow-md p-5 border border-gray-200">
//             <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
//               📡 Trạng thái hệ thống
//             </h3>

//             <div className="flex justify-between items-center mb-3">
//               <span className="font-medium">WebSocket:</span>
//               <span
//                 className={`px-3 py-1 rounded-full text-sm font-semibold ${
//                   connected
//                     ? "bg-green-100 text-green-700"
//                     : "bg-red-100 text-red-700"
//                 }`}
//               >
//                 {connected ? "Connected" : "Disconnected"}
//               </span>
//             </div>

//             {/* VIOLATION RATE */}
//             <p className="font-medium mb-1">Violation Rate:</p>
//             <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
//               <div
//                 className={`h-3 ${
//                   violationRate > 0.3
//                     ? "bg-red-500"
//                     : violationRate > 0.1
//                     ? "bg-yellow-500"
//                     : "bg-green-500"
//                 }`}
//                 style={{ width: `${violationRate * 100}%` }}
//               ></div>
//             </div>

//             <p
//               className={`mt-2 text-sm font-semibold ${
//                 violationRate > 0 ? "text-red-600" : "text-green-600"
//               }`}
//             >
//               {(violationRate * 100).toFixed(1)}%
//             </p>
//           </div>

//           {/* DETECTION TABLE */}
//           <div className="bg-white rounded-xl shadow-md p-5 border border-gray-200">
//             <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
//               🎯 Kết quả nhận diện
//             </h3>

//             {detections.length > 0 ? (
//               <table className="w-full text-sm text-left border-collapse">
//                 <thead>
//                   <tr className="border-b bg-gray-50 text-gray-700">
//                     <th className="py-2 px-2 w-10">#</th>
//                     <th className="py-2 px-2">Label</th>
//                     <th className="py-2 px-2">Score</th>
//                   </tr>
//                 </thead>

//                 <tbody>
//                   {detections.map((d, i) => (
//                     <tr key={i} className="border-b hover:bg-gray-100">
//                       <td className="py-2 px-2">{i + 1}</td>

//                       <td className="py-2 px-2">
//                         <span
//                           className={`px-2 py-1 rounded-md text-xs font-semibold ${
//                             d.label !== "normal"
//                               ? "bg-red-100 text-red-700"
//                               : "bg-green-100 text-green-700"
//                           }`}
//                         >
//                           {d.label}
//                         </span>
//                       </td>

//                       <td className="py-2 px-2">
//                         {(d.score * 100).toFixed(1)}%
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             ) : (
//               <p className="text-gray-500 text-sm italic text-center py-2">
//                 Chưa có dữ liệu nhận diện...
//               </p>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// Final (2)

// import React, { useEffect, useRef, useState } from "react";
// import { useSelector } from "react-redux";
// import { useSearchParams, Link, useNavigate } from "react-router-dom";
// import { LogOut, GraduationCap } from "lucide-react";

// export default function StudentLive({ fps = 4 }) {
//   const videoRef = useRef(null);
//   const canvasRef = useRef(null);
//   const wsRef = useRef(null);
//   const sendCooldown = useRef(0);
//   const lastAnnotatedUpdate = useRef(0);

//   const [connected, setConnected] = useState(false);
//   const [detections, setDetections] = useState([]);
//   const [violationRate, setViolationRate] = useState(0);
//   const [annotatedFrame, setAnnotatedFrame] = useState(null);

//   const [params] = useSearchParams();
//   const examId = params.get("exam");
//   const { userInfo } = useSelector((state) => state.user);
//   const verifyInfo = useSelector((state) => state.verify.verifyInfo);

//   const navigate = useNavigate();

//   // -----------------------------------------------------
//   // CAMERA + WEBSOCKET (GIỮ NGUYÊN LOGIC)
//   // -----------------------------------------------------
//   useEffect(() => {
//     let animationId = null;
//     const targetInterval = 1000 / fps;

//     async function startCamera() {
//       const stream = await navigator.mediaDevices.getUserMedia({
//         video: { width: 640, height: 480 },
//         audio: false,
//       });
//       videoRef.current.srcObject = stream;
//       await videoRef.current.play();
//     }
//     startCamera();

//     wsRef.current = new WebSocket(
//       `ws://localhost:8000/ws/student?exam=${examId}&student=${userInfo.student_id}&class_id=${verifyInfo.classId}`
//     );

//     wsRef.current.onopen = () => setConnected(true);

//     wsRef.current.onmessage = (ev) => {
//       const data = JSON.parse(ev.data);
//       if (data.type !== "self_assessment") return;

//       setDetections(data.detections || []);
//       setViolationRate(data.violation_rate || 0);

//       if (Date.now() - lastAnnotatedUpdate.current > 300) {
//         setAnnotatedFrame(data.frame_b64);
//         lastAnnotatedUpdate.current = Date.now();
//       }
//     };

//     wsRef.current.onclose = () => setConnected(false);

//     function loop() {
//       animationId = requestAnimationFrame(loop);
//       const now = performance.now();
//       if (now - sendCooldown.current < targetInterval) return;
//       sendCooldown.current = now;

//       const video = videoRef.current;
//       const canvas = canvasRef.current;
//       if (!video || !canvas) return;

//       const ctx = canvas.getContext("2d");
//       canvas.width = 640;
//       canvas.height = 480;
//       ctx.drawImage(video, 0, 0, 640, 480);

//       canvas.toBlob(
//         (blob) => {
//           if (!blob) return;
//           const reader = new FileReader();
//           reader.onloadend = () => {
//             if (wsRef.current?.readyState === WebSocket.OPEN) {
//               wsRef.current.send(
//                 JSON.stringify({
//                   type: "frame",
//                   b64: reader.result,
//                   ts: Date.now(),
//                 })
//               );
//             }
//           };
//           reader.readAsDataURL(blob);
//         },
//         "image/jpeg",
//         0.6
//       );
//     }

//     animationId = requestAnimationFrame(loop);

//     return () => {
//       cancelAnimationFrame(animationId);
//       wsRef.current?.close();
//       videoRef.current?.srcObject?.getTracks().forEach((t) => t.stop());
//     };
//   }, []);

//   // -----------------------------------------------------
//   // FUNCTION: Đăng xuất
//   // -----------------------------------------------------
//   const handleLogout = () => {
//     navigate("/login");
//   };

//   // -----------------------------------------------------
//   // UI
//   // -----------------------------------------------------
//   return (
//     <div className="min-h-screen bg-gray-100">
//       {/* NAVBAR */}
//       <nav className="backdrop-blur-xl bg-white/60 border-b border-indigo-200 shadow-sm sticky top-0 z-50">
//         <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
//           <Link
//             to="/student_dashboard"
//             className="font-bold text-2xl text-indigo-600 flex items-center gap-2"
//           >
//             <GraduationCap size={28} /> Smart Exam
//           </Link>
//           <div className="flex items-center gap-6 text-gray-700 font-medium">
//             <Link
//               to="/student_dashboard"
//               className="hover:text-indigo-600 transition"
//             >
//               Trang chủ
//             </Link>
//             <Link
//               to="/student_violation_history"
//               className="hover:text-indigo-600 transition"
//             >
//               Lịch sử vi phạm
//             </Link>
//             <button className="px-3 py-2 bg-red-500 text-white rounded-xl flex items-center gap-2 hover:bg-red-600 shadow">
//               <LogOut size={18} /> Đăng xuất
//             </button>
//           </div>
//         </div>
//       </nav>

//       {/* ---------------- PAGE CONTENT ---------------- */}
//       <div className="p-6">
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//           {/* CAMERA PREVIEW */}
//           <div className="flex justify-center">
//             <div className="relative w-[640px] h-[480px] rounded-xl overflow-hidden shadow-lg border border-gray-300 bg-black">
//               <video
//                 ref={videoRef}
//                 autoPlay
//                 muted
//                 playsInline
//                 className="w-full h-full object-cover"
//               />

//               {annotatedFrame && (
//                 <img
//                   src={annotatedFrame}
//                   className="absolute top-0 left-0 w-full h-full object-cover"
//                 />
//               )}

//               <canvas ref={canvasRef} className="hidden" />
//             </div>
//           </div>

//           {/* STATUS & DETECTIONS */}
//           <div className="space-y-6">
//             {/* STATUS */}
//             <div className="bg-white rounded-xl shadow-md p-5 border border-gray-200">
//               <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
//                 📡 Trạng thái hệ thống
//               </h3>

//               <div className="flex justify-between mb-3">
//                 <span className="font-medium">WebSocket:</span>
//                 <span
//                   className={`px-3 py-1 rounded-full text-sm font-semibold ${
//                     connected
//                       ? "bg-green-100 text-green-700"
//                       : "bg-red-100 text-red-700"
//                   }`}
//                 >
//                   {connected ? "Đã kêt nối" : "Chưa kết nối"}
//                 </span>
//               </div>

//               <p className="font-medium">Tỉ lệ vi phạm:</p>
//               <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
//                 <div
//                   className={`h-3 ${
//                     violationRate > 0.3
//                       ? "bg-red-500"
//                       : violationRate > 0.1
//                       ? "bg-yellow-500"
//                       : "bg-green-500"
//                   }`}
//                   style={{ width: `${violationRate * 100}%` }}
//                 ></div>
//               </div>

//               <p
//                 className={`mt-2 text-sm font-semibold ${
//                   violationRate > 0 ? "text-red-600" : "text-green-600"
//                 }`}
//               >
//                 {(violationRate * 100).toFixed(1)}%
//               </p>
//             </div>

//             {/* DETECTION TABLE */}
//             <div className="bg-white rounded-xl shadow-md p-5 border border-gray-200">
//               <h3 className="text-lg font-bold mb-4">🎯 Kết quả nhận diện</h3>

//               {detections.length > 0 ? (
//                 <table className="w-full text-sm text-left border-collapse">
//                   <thead>
//                     <tr className="border-b bg-gray-50 text-gray-700">
//                       <th className="py-2 px-2 w-10">#</th>
//                       <th className="py-2 px-2">Label</th>
//                       <th className="py-2 px-2">Score</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {detections.map((d, i) => (
//                       <tr key={i} className="border-b hover:bg-gray-100">
//                         <td className="py-2 px-2">{i + 1}</td>
//                         <td className="py-2 px-2">
//                           <span
//                             className={`px-2 py-1 rounded-md text-xs font-semibold ${
//                               d.label !== "normal"
//                                 ? "bg-red-100 text-red-700"
//                                 : "bg-green-100 text-green-700"
//                             }`}
//                           >
//                             {d.label}
//                           </span>
//                         </td>
//                         <td className="py-2 px-2">
//                           {(d.score * 100).toFixed(1)}%
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               ) : (
//                 <p className="text-gray-500 text-sm italic text-center py-2">
//                   Chưa có dữ liệu nhận diện...
//                 </p>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// Final optimized

// import React, { useEffect, useRef, useState } from "react";
// import { useSelector } from "react-redux";
// import { useSearchParams, Link, useNavigate } from "react-router-dom";
// import { LogOut, GraduationCap } from "lucide-react";
// import { FaCamera } from "react-icons/fa";

// export default function StudentLive({ fps = 4 }) {
//   const videoRef = useRef(null);
//   const canvasRef = useRef(null);
//   const wsRef = useRef(null);
//   const sendCooldown = useRef(0);
//   const lastAnnotatedUpdate = useRef(0);

//   const [connected, setConnected] = useState(false);
//   const [detections, setDetections] = useState([]);
//   const [violationRate, setViolationRate] = useState(0);
//   const [annotatedFrame, setAnnotatedFrame] = useState(null);

//   const [params] = useSearchParams();
//   const examId = params.get("exam");

//   const { userInfo } = useSelector((state) => state.user);
//   const verifyInfo = useSelector((state) => state.verify.verifyInfo);

//   const navigate = useNavigate();

//   // -----------------------------------------------------
//   // CAMERA + WEBSOCKET
//   // -----------------------------------------------------
//   useEffect(() => {
//     let animationId = null;
//     const targetInterval = 1000 / fps;

//     async function startCamera() {
//       const stream = await navigator.mediaDevices.getUserMedia({
//         video: { width: 640, height: 480 },
//         audio: false,
//       });

//       videoRef.current.srcObject = stream;
//       await videoRef.current.play();
//     }

//     startCamera();

//     // WebSocket
//     wsRef.current = new WebSocket(
//       `ws://localhost:8000/ws/student?exam=${examId}&student=${userInfo.student_id}&class_id=${verifyInfo.classId}`
//     );

//     wsRef.current.onopen = () => setConnected(true);

//     wsRef.current.onmessage = (ev) => {
//       const data = JSON.parse(ev.data);
//       if (data.type !== "self_assessment") return;

//       setDetections(data.detections || []);
//       setViolationRate(data.violation_rate || 0);

//       // update annotated frame
//       if (Date.now() - lastAnnotatedUpdate.current > 200) {
//         setAnnotatedFrame(data.frame_b64);
//         lastAnnotatedUpdate.current = Date.now();
//       }
//     };

//     wsRef.current.onclose = () => setConnected(false);

//     // CAMERA LOOP
//     function loop() {
//       animationId = requestAnimationFrame(loop);

//       const now = performance.now();
//       if (now - sendCooldown.current < targetInterval) return;
//       sendCooldown.current = now;

//       const video = videoRef.current;
//       const canvas = canvasRef.current;
//       if (!video || !canvas) return;

//       const ctx = canvas.getContext("2d");
//       canvas.width = 640;
//       canvas.height = 480;

//       // 👉 MUST DRAW EXACTLY AS ORIGINAL (NO FLIP)
//       ctx.drawImage(video, 0, 0, 640, 480);

//       canvas.toBlob(
//         (blob) => {
//           if (!blob) return;

//           const reader = new FileReader();
//           reader.onloadend = () => {
//             if (wsRef.current?.readyState === WebSocket.OPEN) {
//               wsRef.current.send(
//                 JSON.stringify({
//                   type: "frame",
//                   b64: reader.result,
//                   ts: Date.now(),
//                 })
//               );
//             }
//           };
//           reader.readAsDataURL(blob);
//         },
//         "image/jpeg",
//         0.6
//       );
//     }

//     animationId = requestAnimationFrame(loop);

//     return () => {
//       cancelAnimationFrame(animationId);
//       wsRef.current?.close();
//       videoRef.current?.srcObject?.getTracks().forEach((t) => t.stop());
//     };
//   }, []);

//   // Logout
//   const handleLogout = () => {
//     navigate("/login");
//   };

//   return (
//     <div className="min-h-screen bg-gray-100">
//       {/* NAVBAR */}
//       <nav className="backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg sticky top-0 z-40">
//           <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
//             <Link to="/student_dashboard" className="flex items-center gap-3">
//               <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
//                 <GraduationCap className="w-7 h-7 text-white" />
//               </div>
//               <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
//                 Smart Exam
//               </span>
//             </Link>

//             <div className="flex items-center gap-8">
//               <div className="hidden md:flex items-center gap-6 text-gray-700 font-medium">
//                 <Link
//                   to="/student_dashboard"
//                   className="hover:text-indigo-600 transition"
//                 >
//                   Trang chủ
//                 </Link>
//                 <Link
//                   to="/violation_history"
//                   className="hover:text-indigo-600 transition"
//                 >
//                   Lịch sử vi phạm
//                 </Link>
//               </div>

//               <div className="flex items-center gap-4">
//                 <div className="flex items-center gap-3 px-4 py-2 bg-gray-100/80 rounded-full">
//                   <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
//                     S
//                   </div>
//                   <span className="font-medium text-gray-800">Sinh viên</span>
//                 </div>
//                 <button className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow transition">
//                   <LogOut size={18} />
//                   Đăng xuất
//                 </button>
//               </div>
//             </div>
//           </div>
//         </nav>

//       {/* HEADER + TRẠNG THÁI */}
//       <div className="mb-8 px-8 flex flex-wrap items-center justify-between gap-6">
//         <div className="flex-1 justify-between bg-white/20 backdrop-blur-md rounded-2xl px-2 py-2 border border-white/50 flex items-center gap-6">
//           <div className="flex justify-center items-center">
//             <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg mr-4">
//               <FaCamera className="w-4 h-4 text-white" />
//             </div>
//             <div>
//               <h1 className=" font-bold text-gray-800">
//                 {verifyInfo?.examName} — {verifyInfo?.sessionName}
//               </h1>
//               <p className="text-gray-600 mt-1 font-mono">
//                 Lớp:{" "}
//                 <span className="font-semibold">{verifyInfo?.className}</span> |
//                 Mã bài thi:{" "}
//                 <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg font-mono">
//                   {examId}
//                 </span>
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* PAGE CONTENT */}
//       <div className="p-6">
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//           {/* CAMERA & OVERLAY */}
//           <div className="flex justify-center">
//             <div className="relative w-[640px] h-[480px] rounded-xl overflow-hidden shadow-lg border border-gray-300 bg-black">
//               {/* VIDEO (UNMIRRORED) */}
//               <video
//                 ref={videoRef}
//                 autoPlay
//                 muted
//                 playsInline
//                 className="w-full h-full object-cover"
//                 style={{ transform: "scaleX(1)" }} // FIX flip
//               />

//               {/* ANNOTATED FRAME (OVERLAY) */}
//               {annotatedFrame && (
//                 <img
//                   src={annotatedFrame}
//                   className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none"
//                   style={{ transform: "scaleX(1)" }} // ensure correct orientation
//                 />
//               )}

//               <canvas ref={canvasRef} className="hidden" />
//             </div>
//           </div>

//           {/* STATUS + DETECTIONS */}
//           <div className="space-y-6">
//             {/* STATUS */}
//             <div className="bg-white rounded-xl shadow-md p-5 border border-gray-200">
//               <h3 className="text-lg font-bold mb-4">📡 Trạng thái hệ thống</h3>

//               <div className="flex justify-between">
//                 <span className="font-medium">WebSocket:</span>
//                 <span
//                   className={`px-3 py-1 rounded-full ${
//                     connected
//                       ? "bg-green-100 text-green-700"
//                       : "bg-red-100 text-red-700"
//                   }`}
//                 >
//                   {connected ? "Đã kết nối" : "Chưa kết nối"}
//                 </span>
//               </div>

//               <p className="font-medium mt-3">Tỉ lệ vi phạm:</p>
//               <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
//                 <div
//                   className={`h-3 ${
//                     violationRate > 0.3
//                       ? "bg-red-500"
//                       : violationRate > 0.1
//                       ? "bg-yellow-500"
//                       : "bg-green-500"
//                   }`}
//                   style={{ width: `${violationRate * 100}%` }}
//                 ></div>
//               </div>
//             </div>

//             {/* DETECTIONS */}
//             <div className="bg-white rounded-xl shadow-md p-5 border border-gray-200">
//               <h3 className="text-lg font-bold mb-4">🎯 Kết quả nhận diện</h3>

//               {detections.length > 0 ? (
//                 <table className="w-full text-sm text-left border-collapse">
//                   <thead>
//                     <tr className=" bg-gray-50 text-gray-700 mb-2">
//                       <th>#</th>
//                       <th>Hành vi</th>
//                       <th>Độ tin cậy</th>
//                     </tr>
//                   </thead>
//                   <tbody className="mt-4">
//                     {detections.map((d, i) => (
//                       <tr key={i} className="">
//                         <td>{i + 1}</td>
//                         <td className="mt-2">
//                           <span
//                             className={`px-2 py-1 rounded-md text-xs ${
//                               d.label !== "normal"
//                                 ? "bg-red-100 text-red-700"
//                                 : "bg-green-100 text-green-700"
//                             }`}
//                           >
//                             {d.label}
//                           </span>
//                         </td>
//                         <td>{(d.score * 100).toFixed(1)}%</td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               ) : (
//                 <p className="text-gray-500 italic">Chưa có dữ liệu...</p>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// import React, { useEffect, useRef, useState } from "react";
// import { useSelector } from "react-redux";
// import { useSearchParams, Link, useNavigate } from "react-router-dom";
// import { LogOut, GraduationCap } from "lucide-react";
// import { FaCamera } from "react-icons/fa";

// export default function StudentLive({ fps = 4 }) {
//   const videoRef = useRef(null);
//   const canvasRef = useRef(null);
//   const wsRef = useRef(null);
//   const sendCooldown = useRef(0);

//   const [connected, setConnected] = useState(false);
//   const [detections, setDetections] = useState([]);
//   const [violationRate, setViolationRate] = useState(0);
//   const [annotatedFrame, setAnnotatedFrame] = useState(null);
//   const [lastFrameTime, setLastFrameTime] = useState(0);

//   const [params] = useSearchParams();
//   const examId = params.get("exam");

//   const { userInfo } = useSelector((state) => state.user);
//   const verifyInfo = useSelector((state) => state.verify.verifyInfo);

//   const navigate = useNavigate();

//   useEffect(() => {
//     let animationId = null;
//     const targetInterval = 1000 / fps;

//     async function startCamera() {
//       const stream = await navigator.mediaDevices.getUserMedia({
//         video: { width: 640, height: 480 },
//         audio: false,
//       });
//       videoRef.current.srcObject = stream;
//       await videoRef.current.play();
//     }

//     startCamera();

//     wsRef.current = new WebSocket(
//       `ws://localhost:8000/ws/student?exam=${examId}&student=${userInfo.student_id}&class_id=${verifyInfo.classId}`
//     );
//     // wsRef.current = new WebSocket(
//     //   `wss://103.142.24.110:8000/ws/student?exam=${examId}&student=${userInfo.student_id}&class_id=${verifyInfo.classId}`
//     // );

//     wsRef.current.onopen = () => setConnected(true);

//     wsRef.current.onmessage = (ev) => {
//       const data = JSON.parse(ev.data);
//       if (data.type !== "self_assessment") return;

//       setDetections(data.detections || []);
//       setViolationRate(data.violation_rate || 0);

//       if (data.frame_b64) {
//         setAnnotatedFrame(data.frame_b64);
//         setLastFrameTime(Date.now());
//       }
//     };

//     wsRef.current.onclose = () => setConnected(false);

//     function loop() {
//       animationId = requestAnimationFrame(loop);

//       const now = performance.now();
//       if (now - sendCooldown.current < targetInterval) return;
//       sendCooldown.current = now;

//       const video = videoRef.current;
//       const canvas = canvasRef.current;
//       if (!video || !canvas) return;

//       const ctx = canvas.getContext("2d");
//       canvas.width = 640;
//       canvas.height = 480;
//       ctx.drawImage(video, 0, 0, 640, 480);

//       canvas.toBlob((blob) => {
//         if (!blob) return;
//         const reader = new FileReader();
//         reader.onloadend = () => {
//           if (wsRef.current?.readyState === WebSocket.OPEN) {
//             wsRef.current.send(
//               JSON.stringify({
//                 type: "frame",
//                 b64: reader.result,
//                 ts: Date.now(),
//               })
//             );
//           }
//         };
//         reader.readAsDataURL(blob);
//       }, "image/jpeg", 0.6);
//     }

//     animationId = requestAnimationFrame(loop);

//     // effect kiểm tra 3 giây
//     const interval = setInterval(() => {
//       if (annotatedFrame && Date.now() - lastFrameTime > 3000) {
//         setAnnotatedFrame(null);
//       }
//     }, 500);

//     return () => {
//       cancelAnimationFrame(animationId);
//       wsRef.current?.close();
//       videoRef.current?.srcObject?.getTracks().forEach((t) => t.stop());
//       clearInterval(interval);
//     };
//   }, []);

//   const handleLogout = () => {
//     navigate("/login");
//   };

//   return (
//     <div className="min-h-screen bg-gray-100">
//       {/* NAVBAR */}
//       <nav className="backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg sticky top-0 z-40">
//         <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
//           <Link to="/student_dashboard" className="flex items-center gap-3">
//             <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
//               <GraduationCap className="w-7 h-7 text-white" />
//             </div>
//             <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
//               Smart Exam
//             </span>
//           </Link>

//           <div className="flex items-center gap-8">
//             <div className="hidden md:flex items-center gap-6 text-gray-700 font-medium">
//               <Link
//                 to="/student_dashboard"
//                 className="hover:text-indigo-600 transition"
//               >
//                 Trang chủ
//               </Link>
//               <Link
//                 to="/violation_history"
//                 className="hover:text-indigo-600 transition"
//               >
//                 Lịch sử vi phạm
//               </Link>
//             </div>

//             <div className="flex items-center gap-4">
//               <div className="flex items-center gap-3 px-4 py-2 bg-gray-100/80 rounded-full">
//                 <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
//                   S
//                 </div>
//                 <span className="font-medium text-gray-800">Sinh viên</span>
//               </div>
//               <button
//                 onClick={handleLogout}
//                 className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow transition"
//               >
//                 <LogOut size={18} />
//                 Đăng xuất
//               </button>
//             </div>
//           </div>
//         </div>
//       </nav>

//       {/* HEADER */}
//       <div className="mb-8 px-8 flex flex-wrap items-center justify-between gap-6">
//         <div className="flex-1 justify-between bg-white/20 backdrop-blur-md rounded-2xl px-2 py-2 border border-white/50 flex items-center gap-6">
//           <div className="flex justify-center items-center">
//             <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg mr-4">
//               <FaCamera className="w-4 h-4 text-white" />
//             </div>
//             <div>
//               <h1 className=" font-bold text-gray-800">
//                 {verifyInfo?.examName} — {verifyInfo?.sessionName}
//               </h1>
//               <p className="text-gray-600 mt-1 font-mono">
//                 Lớp:{" "}
//                 <span className="font-semibold">{verifyInfo?.className}</span> |
//                 Mã bài thi:{" "}
//                 <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg font-mono">
//                   {examId}
//                 </span>
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* PAGE CONTENT */}
//       <div className="p-6">
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//           <div className="flex justify-center">
//             <div className="relative w-[640px] h-[480px] rounded-xl overflow-hidden shadow-lg border border-gray-300 bg-black">
//               <video
//                 ref={videoRef}
//                 autoPlay
//                 muted
//                 playsInline
//                 className="w-full h-full object-cover"
//                 style={{ transform: "scaleX(1)" }}
//               />
//               {annotatedFrame && (
//                 <img
//                   src={annotatedFrame}
//                   className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none transition-opacity duration-500"
//                   style={{ transform: "scaleX(1)" }}
//                 />
//               )}
//               <canvas ref={canvasRef} className="hidden" />
//             </div>
//           </div>

//           {/* STATUS + DETECTIONS */}
//           <div className="space-y-6">
//             <div className="bg-white rounded-xl shadow-md p-5 border border-gray-200">
//               <h3 className="text-lg font-bold mb-4">📡 Trạng thái hệ thống</h3>
//               <div className="flex justify-between">
//                 <span className="font-medium">WebSocket:</span>
//                 <span
//                   className={`px-3 py-1 rounded-full ${
//                     connected
//                       ? "bg-green-100 text-green-700"
//                       : "bg-red-100 text-red-700"
//                   }`}
//                 >
//                   {connected ? "Đã kết nối" : "Chưa kết nối"}
//                 </span>
//               </div>

//               <p className="font-medium mt-3">Tỉ lệ vi phạm:</p>
//               <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
//                 <div
//                   className={`h-3 ${
//                     violationRate > 0.3
//                       ? "bg-red-500"
//                       : violationRate > 0.1
//                       ? "bg-yellow-500"
//                       : "bg-green-500"
//                   }`}
//                   style={{ width: `${violationRate * 100}%` }}
//                 ></div>
//               </div>
//             </div>

//             <div className="bg-white rounded-xl shadow-md p-5 border border-gray-200">
//               <h3 className="text-lg font-bold mb-4">🎯 Kết quả nhận diện</h3>

//               {detections.length > 0 ? (
//                 <table className="w-full text-sm text-left border-collapse">
//                   <thead>
//                     <tr className=" bg-gray-50 text-gray-700 mb-2">
//                       <th>#</th>
//                       <th>Hành vi</th>
//                       <th>Độ tin cậy</th>
//                     </tr>
//                   </thead>
//                   <tbody className="mt-4">
//                     {detections.map((d, i) => (
//                       <tr key={i}>
//                         <td>{i + 1}</td>
//                         <td className="mt-2">
//                           <span
//                             className={`px-2 py-1 rounded-md text-xs ${
//                               d.label !== "normal"
//                                 ? "bg-red-100 text-red-700"
//                                 : "bg-green-100 text-green-700"
//                             }`}
//                           >
//                             {d.label}
//                           </span>
//                         </td>
//                         <td>{(d.score * 100).toFixed(1)}%</td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               ) : (
//                 <p className="text-gray-500 italic">Chưa có dữ liệu...</p>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// import React, { useEffect, useRef, useState } from "react";
// import { useSelector } from "react-redux";
// import { useSearchParams, Link, useNavigate } from "react-router-dom";
// import { LogOut, GraduationCap } from "lucide-react";
// import { FaCamera } from "react-icons/fa";

// export default function StudentLive({ fps = 4 }) {
//   const videoRef = useRef(null);
//   const canvasRef = useRef(null);
//   const wsRef = useRef(null);
//   const sendCooldown = useRef(0);

//   const [connected, setConnected] = useState(false);
//   const [detections, setDetections] = useState([]);
//   const [violationRate, setViolationRate] = useState(0);
//   const [annotatedFrame, setAnnotatedFrame] = useState(null);
//   const [lastFrameTime, setLastFrameTime] = useState(0);
//   const [showGuide, setShowGuide] = useState(true);

//   const [params] = useSearchParams();
//   const examId = params.get("exam");

//   const { userInfo } = useSelector((state) => state.user);
//   const verifyInfo = useSelector((state) => state.verify.verifyInfo);

//   const navigate = useNavigate();

//   useEffect(() => {
//     let animationId = null;
//     const targetInterval = 1000 / fps;

//     async function startCamera() {
//       const stream = await navigator.mediaDevices.getUserMedia({
//         video: { width: 640, height: 480 },
//         audio: false,
//       });
//       videoRef.current.srcObject = stream;
//       await videoRef.current.play();
//     }

//     startCamera();

//     wsRef.current = new WebSocket(
//       `ws://localhost:8000/ws/student?exam=${examId}&student=${userInfo.student_id}&class_id=${verifyInfo.classId}`
//     );
//     // wsRef.current = new WebSocket(
//     //   `wss://103.142.24.110:8000/ws/student?exam=${examId}&student=${userInfo.student_id}&class_id=${verifyInfo.classId}`
//     // );

//     wsRef.current.onopen = () => setConnected(true);

//     wsRef.current.onmessage = (ev) => {
//       const data = JSON.parse(ev.data);
//       console.log(data)
//       if (data.type !== "self_assessment") return;

//       setDetections(data.detections || []);
//       setViolationRate(data.violation_rate || 0);

//       if (data.frame_b64) {
//         setAnnotatedFrame(data.frame_b64);
//         setLastFrameTime(Date.now());
//       }
//     };

//     wsRef.current.onclose = () => setConnected(false);

//     function loop() {
//       animationId = requestAnimationFrame(loop);

//       const now = performance.now();
//       if (now - sendCooldown.current < targetInterval) return;
//       sendCooldown.current = now;

//       const video = videoRef.current;
//       const canvas = canvasRef.current;
//       if (!video || !canvas) return;

//       const ctx = canvas.getContext("2d");
//       canvas.width = 640;
//       canvas.height = 480;
//       ctx.drawImage(video, 0, 0, 640, 480);

//       canvas.toBlob(
//         (blob) => {
//           if (!blob) return;
//           const reader = new FileReader();
//           reader.onloadend = () => {
//             if (wsRef.current?.readyState === WebSocket.OPEN) {
//               wsRef.current.send(
//                 JSON.stringify({
//                   type: "frame",
//                   b64: reader.result,
//                   ts: Date.now(),
//                 })
//               );
//             }
//           };
//           reader.readAsDataURL(blob);
//         },
//         "image/jpeg",
//         0.6
//       );
//     }

//     animationId = requestAnimationFrame(loop);

//     // effect kiểm tra 3 giây
//     const interval = setInterval(() => {
//       if (annotatedFrame && Date.now() - lastFrameTime > 3000) {
//         setAnnotatedFrame(null);
//       }
//     }, 500);

//     return () => {
//       cancelAnimationFrame(animationId);
//       wsRef.current?.close();
//       videoRef.current?.srcObject?.getTracks().forEach((t) => t.stop());
//       clearInterval(interval);
//     };
//   }, []);

//   const handleLogout = () => {
//     navigate("/login");
//   };

//   return (
//     <div className="min-h-screen bg-gray-100">
//       {showGuide && (
//         <div className="fixed inset-0 bg-white/70 backdrop-blur-md flex items-center justify-center z-[999] p-4">
//           <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 animate-fadeIn">
//             <h2 className="text-2xl font-bold text-indigo-600 text-center mb-4">
//               Hướng dẫn đặt camera & Quy chế phòng chống gian lận
//             </h2>

//             <div className="space-y-4 text-gray-700 text-[15px] leading-relaxed">
//               <div>
//                 <h3 className="font-semibold text-lg mb-1">
//                   📷 Cách đặt camera đúng cách
//                 </h3>
//                 <ul className="list-disc pl-6 space-y-1">
//                   <li>Đặt camera ngang tầm mắt.</li>
//                   <li>Giữ khoảng cách 50–80 cm từ mặt đến camera.</li>
//                   <li>Đảm bảo ánh sáng rõ ràng, không bị ngược sáng.</li>
//                   <li>Giữ toàn bộ khuôn mặt luôn nằm trong khung hình.</li>
//                 </ul>
//               </div>

//               <div>
//                 <h3 className="font-semibold text-lg mb-1">
//                   ⚠ Quy chế chống gian lận
//                 </h3>
//                 <ul className="list-disc pl-6 space-y-1">
//                   <li>Không được liếc mắt nhiều lần sang trái hoặc phải.</li>
//                   <li>Không quay mặt khỏi camera.</li>
//                   <li>Không dùng điện thoại, tablet hoặc thiết bị ngoài.</li>
//                   <li>Không úp/mở miệng nói chuyện.</li>
//                   <li>Không di chuyển tay bất thường trong khung hình.</li>
//                   <li>Không để người khác xuất hiện trong camera.</li>
//                   <li>Ngồi đúng vị trí, không rời khỏi bàn thi.</li>
//                 </ul>
//               </div>

//               <p className="text-sm text-red-600 font-medium">
//                 Hệ thống sẽ tự động ghi nhận hành vi vi phạm qua camera AI. Vui
//                 lòng tuân thủ để tránh bị điểm trừ.
//               </p>
//             </div>

//             <button
//               onClick={() => setShowGuide(false)}
//               className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-xl shadow-md transition"
//             >
//               Tôi đã hiểu
//             </button>
//           </div>
//         </div>
//       )}

//       {/* NAVBAR */}
//       <nav className="backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg sticky top-0 z-40">
//         <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
//           <Link to="/student_dashboard" className="flex items-center gap-3">
//             <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
//               <GraduationCap className="w-7 h-7 text-white" />
//             </div>
//             <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
//               Smart Exam
//             </span>
//           </Link>

//           <div className="flex items-center gap-8">
//             <div className="hidden md:flex items-center gap-6 text-gray-700 font-medium">
//               <Link
//                 to="/student_dashboard"
//                 className="hover:text-indigo-600 transition"
//               >
//                 Trang chủ
//               </Link>
//               <Link
//                 to="/violation_history"
//                 className="hover:text-indigo-600 transition"
//               >
//                 Lịch sử vi phạm
//               </Link>
//             </div>

//             <div className="flex items-center gap-4">
//               <div className="flex items-center gap-3 px-4 py-2 bg-gray-100/80 rounded-full">
//                 <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
//                   S
//                 </div>
//                 <span className="font-medium text-gray-800">Sinh viên</span>
//               </div>
//               <button
//                 onClick={handleLogout}
//                 className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow transition"
//               >
//                 <LogOut size={18} />
//                 Đăng xuất
//               </button>
//             </div>
//           </div>
//         </div>
//       </nav>

//       {/* HEADER */}
//       <div className="mb-8 px-8 flex flex-wrap items-center justify-between gap-6">
//         <div className="flex-1 justify-between bg-white/20 backdrop-blur-md rounded-2xl px-2 py-2 border border-white/50 flex items-center gap-6">
//           <div className="flex justify-center items-center">
//             <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg mr-4">
//               <FaCamera className="w-4 h-4 text-white" />
//             </div>
//             <div>
//               <h1 className=" font-bold text-gray-800">
//                 {verifyInfo?.examName} — {verifyInfo?.sessionName}
//               </h1>
//               <p className="text-gray-600 mt-1 font-mono">
//                 Lớp:{" "}
//                 <span className="font-semibold">{verifyInfo?.className}</span> |
//                 Mã bài thi:{" "}
//                 <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg font-mono">
//                   {examId}
//                 </span>
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* PAGE CONTENT */}
//       <div className="p-6">
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//           <div className="flex justify-center">
//             <div className="relative w-[640px] h-[480px] rounded-xl overflow-hidden shadow-lg border border-gray-300 bg-black">
//               <video
//                 ref={videoRef}
//                 autoPlay
//                 muted
//                 playsInline
//                 className="w-full h-full object-cover"
//                 style={{ transform: "scaleX(1)" }}
//               />
//               {annotatedFrame && (
//                 <img
//                   src={annotatedFrame}
//                   className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none transition-opacity duration-500"
//                   style={{ transform: "scaleX(1)" }}
//                 />
//               )}
//               <canvas ref={canvasRef} className="hidden" />
//             </div>
//           </div>

//           {/* STATUS + DETECTIONS */}
//           <div className="space-y-6">
//             <div className="bg-white rounded-xl shadow-md p-5 border border-gray-200">
//               <h3 className="text-lg font-bold mb-4">📡 Trạng thái hệ thống</h3>
//               <div className="flex justify-between">
//                 <span className="font-medium">WebSocket:</span>
//                 <span
//                   className={`px-3 py-1 rounded-full ${
//                     connected
//                       ? "bg-green-100 text-green-700"
//                       : "bg-red-100 text-red-700"
//                   }`}
//                 >
//                   {connected ? "Đã kết nối" : "Chưa kết nối"}
//                 </span>
//               </div>

//               <p className="font-medium mt-3">Tỉ lệ vi phạm:</p>
//               <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
//                 <div
//                   className={`h-3 ${
//                     violationRate > 0.3
//                       ? "bg-red-500"
//                       : violationRate > 0.1
//                       ? "bg-yellow-500"
//                       : "bg-green-500"
//                   }`}
//                   style={{ width: `${violationRate * 100}%` }}
//                 ></div>
//               </div>
//             </div>

//             <div className="bg-white rounded-xl shadow-md p-5 border border-gray-200">
//               <h3 className="text-lg font-bold mb-4">🎯 Kết quả nhận diện</h3>

//               {detections.length > 0 ? (
//                 <table className="w-full text-sm text-left border-collapse">
//                   <thead>
//                     <tr className=" bg-gray-50 text-gray-700 mb-2">
//                       <th>#</th>
//                       <th>Hành vi</th>
//                       <th>Độ tin cậy</th>
//                     </tr>
//                   </thead>
//                   <tbody className="mt-4">
//                     {detections.map((d, i) => (
//                       <tr key={i}>
//                         <td>{i + 1}</td>
//                         <td className="mt-2">
//                           <span
//                             className={`px-2 py-1 rounded-md text-xs ${
//                               d.label !== "normal"
//                                 ? "bg-red-100 text-red-700"
//                                 : "bg-green-100 text-green-700"
//                             }`}
//                           >
//                             {d.label}
//                           </span>
//                         </td>
//                         <td>{(d.score * 100).toFixed(1)}%</td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               ) : (
//                 <p className="text-gray-500 italic">Chưa có dữ liệu...</p>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


// import React, { useEffect, useRef, useState } from "react";
// import { useSelector } from "react-redux";
// import { useSearchParams, Link, useNavigate } from "react-router-dom";
// import { LogOut, GraduationCap } from "lucide-react";
// import { FaCamera } from "react-icons/fa";

// export default function StudentLive({ fps = 4 }) {
//   const videoRef = useRef(null);
//   const canvasRef = useRef(null);
//   const wsRef = useRef(null);
//   const sendCooldown = useRef(0);
//   const hideFrameTimeout = useRef(null);  // ⬅️ Timeout để ẩn ảnh sau 3s

//   const [connected, setConnected] = useState(false);
//   const [detections, setDetections] = useState([]);
//   const [violationRate, setViolationRate] = useState(0);
//   const [annotatedFrame, setAnnotatedFrame] = useState(null);
//   const [lastFrameTime, setLastFrameTime] = useState(0);
//   const [showGuide, setShowGuide] = useState(true);

//   const [params] = useSearchParams();
//   const examId = params.get("exam");

//   const { userInfo } = useSelector((state) => state.user);
//   const verifyInfo = useSelector((state) => state.verify.verifyInfo);

//   const navigate = useNavigate();

//   useEffect(() => {
//     let animationId = null;
//     const targetInterval = 1000 / fps;

//     async function startCamera() {
//       const stream = await navigator.mediaDevices.getUserMedia({
//         video: { width: 640, height: 480 },
//         audio: false,
//       });
//       videoRef.current.srcObject = stream;
//       await videoRef.current.play();
//     }

//     startCamera();

//     wsRef.current = new WebSocket(
//       `ws://localhost:8000/ws/student?exam=${examId}&student=${userInfo.student_id}&class_id=${verifyInfo.classId}`
//     );

//     wsRef.current.onopen = () => setConnected(true);

//     wsRef.current.onmessage = (ev) => {
//       const data = JSON.parse(ev.data);
//       console.log(data)

//       if (data.type !== "self_assessment") return;

//       // 🟢 Dữ liệu hành vi — vẫn liên tục, KHÔNG bị ảnh hưởng
//       setDetections(data.detections || []);
//       setViolationRate(data.violation_rate || 0);

//       // 🟣 Ảnh annotatedFrame — chỉ hiện tối đa 3 giây
//       if (data.frame_b64) {
//         setAnnotatedFrame(data.frame_b64);
//         setLastFrameTime(Date.now());

//         // Reset timeout nếu backend gửi nhiều lần
//         if (hideFrameTimeout.current) {
//           clearTimeout(hideFrameTimeout.current);
//         }

//         // ⏳ Ẩn hình sau 3 giây
//         hideFrameTimeout.current = setTimeout(() => {
//           setAnnotatedFrame(null);
//         }, 3000);
//       }
//     };

//     wsRef.current.onclose = () => setConnected(false);

//     /** LOOP GỬI FRAME */
//     function loop() {
//       animationId = requestAnimationFrame(loop);

//       const now = performance.now();
//       if (now - sendCooldown.current < targetInterval) return;
//       sendCooldown.current = now;

//       const video = videoRef.current;
//       const canvas = canvasRef.current;
//       if (!video || !canvas) return;

//       const ctx = canvas.getContext("2d");
//       canvas.width = 640;
//       canvas.height = 480;

//       ctx.drawImage(video, 0, 0, 640, 480);

//       canvas.toBlob(
//         (blob) => {
//           if (!blob) return;
//           const reader = new FileReader();
//           reader.onloadend = () => {
//             if (wsRef.current?.readyState === WebSocket.OPEN) {
//               wsRef.current.send(
//                 JSON.stringify({
//                   type: "frame",
//                   b64: reader.result,
//                   ts: Date.now(),
//                 })
//               );
//             }
//           };
//           reader.readAsDataURL(blob);
//         },
//         "image/jpeg",
//         0.6
//       );
//     }

//     animationId = requestAnimationFrame(loop);

//     // CLEANUP
//     return () => {
//       if (hideFrameTimeout.current) clearTimeout(hideFrameTimeout.current);
//       cancelAnimationFrame(animationId);
//       wsRef.current?.close();
//       videoRef.current?.srcObject?.getTracks().forEach((t) => t.stop());
//     };
//   }, []);

//   const handleLogout = () => {
//     navigate("/login");
//   };

//   return (
//     <div className="min-h-screen bg-gray-100">
//       {/* === HƯỚNG DẪN === */}
//       {showGuide && (
//         <div className="fixed inset-0 bg-white/70 backdrop-blur-md flex items-center justify-center z-[999] p-4">
//           <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 animate-fadeIn">
//             <h2 className="text-2xl font-bold text-indigo-600 text-center mb-4">
//               Hướng dẫn đặt camera & Quy chế phòng chống gian lận
//             </h2>

//             <div className="space-y-4 text-gray-700 text-[15px] leading-relaxed">
//               <div>
//                 <h3 className="font-semibold text-lg mb-1">📷 Cách đặt camera</h3>
//                 <ul className="list-disc pl-6 space-y-1">
//                   <li>Đặt camera ngang tầm mắt.</li>
//                   <li>Khoảng cách 50–80 cm.</li>
//                   <li>Ánh sáng rõ, không ngược sáng.</li>
//                   <li>Khuôn mặt luôn trong khung hình.</li>
//                 </ul>
//               </div>

//               <div>
//                 <h3 className="font-semibold text-lg mb-1">⚠ Quy chế</h3>
//                 <ul className="list-disc pl-6 space-y-1">
//                   <li>Không liếc mắt sang trái/phải nhiều.</li>
//                   <li>Không quay mặt khỏi camera.</li>
//                   <li>Không dùng điện thoại.</li>
//                   <li>Không nói chuyện/mấp máy môi.</li>
//                   <li>Không đưa tay bất thường vào khung hình.</li>
//                 </ul>
//               </div>
//             </div>

//             <button
//               onClick={() => setShowGuide(false)}
//               className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-xl shadow-md transition"
//             >
//               Tôi đã hiểu
//             </button>
//           </div>
//         </div>
//       )}

//       {/* === NAVBAR === */}
//       <nav className="backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg sticky top-0 z-40">
//         <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
//           <Link to="/student_dashboard" className="flex items-center gap-3">
//             <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
//               <GraduationCap className="w-7 h-7 text-white" />
//             </div>
//             <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
//               Smart Exam
//             </span>
//           </Link>

//           <div className="flex items-center gap-8">
//             <div className="hidden md:flex items-center gap-6 text-gray-700 font-medium">
//               <Link to="/student_dashboard" className="hover:text-indigo-600">
//                 Trang chủ
//               </Link>
//               <Link to="/violation_history" className="hover:text-indigo-600">
//                 Lịch sử vi phạm
//               </Link>
//             </div>

//             <div className="flex items-center gap-4">
//               <div className="flex items-center gap-3 px-4 py-2 bg-gray-100/80 rounded-full">
//                 <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
//                   S
//                 </div>
//                 <span className="font-medium text-gray-800">Sinh viên</span>
//               </div>
//               <button
//                 onClick={handleLogout}
//                 className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow transition"
//               >
//                 <LogOut size={18} />
//                 Đăng xuất
//               </button>
//             </div>
//           </div>
//         </div>
//       </nav>

//       {/* === VIDEO === */}
//       <div className="p-6">
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//           <div className="flex justify-center">
//             <div className="relative w-[640px] h-[480px] rounded-xl overflow-hidden shadow-lg border border-gray-300 bg-black">
//               <video
//                 ref={videoRef}
//                 autoPlay
//                 muted
//                 playsInline
//                 className="w-full h-full object-cover"
//               />

//               {/* KHUNG NHẬN DIỆN (HIỆN TỐI ĐA 3 GIÂY) */}
//               {annotatedFrame && (
//                 <img
//                   src={annotatedFrame}
//                   className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none transition-opacity duration-300"
//                 />
//               )}

//               <canvas ref={canvasRef} className="hidden" />
//             </div>
//           </div>

//           {/* === Detections === */}
//           <div className="space-y-6">
//             <div className="bg-white rounded-xl shadow-md p-5 border border-gray-200">
//               <h3 className="text-lg font-bold mb-4">📡 Trạng thái hệ thống</h3>
//               <div className="flex justify-between">
//                 <span className="font-medium">WebSocket:</span>
//                 <span
//                   className={`px-3 py-1 rounded-full ${
//                     connected
//                       ? "bg-green-100 text-green-700"
//                       : "bg-red-100 text-red-700"
//                   }`}
//                 >
//                   {connected ? "Đã kết nối" : "Chưa kết nối"}
//                 </span>
//               </div>

//               <p className="font-medium mt-3">Tỉ lệ vi phạm:</p>
//               <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
//                 <div
//                   className={`h-3 ${
//                     violationRate > 0.3
//                       ? "bg-red-500"
//                       : violationRate > 0.1
//                       ? "bg-yellow-500"
//                       : "bg-green-500"
//                   }`}
//                   style={{ width: `${violationRate * 100}%` }}
//                 ></div>
//               </div>
//             </div>

//             <div className="bg-white rounded-xl shadow-md p-5 border border-gray-200">
//               <h3 className="text-lg font-bold mb-4">🎯 Kết quả nhận diện</h3>

//               {detections.length > 0 ? (
//                 <table className="w-full text-sm text-left border-collapse">
//                   <thead>
//                     <tr className=" bg-gray-50 text-gray-700 mb-2">
//                       <th>#</th>
//                       <th>Hành vi</th>
//                       <th>Độ tin cậy</th>
//                     </tr>
//                   </thead>
//                   <tbody className="mt-4">
//                     {detections.map((d, i) => (
//                       <tr key={i}>
//                         <td>{i + 1}</td>
//                         <td className="mt-2">
//                           <span
//                             className={`px-2 py-1 rounded-md text-xs ${
//                               d.label !== "normal"
//                                 ? "bg-red-100 text-red-700"
//                                 : "bg-green-100 text-green-700"
//                             }`}
//                           >
//                             {d.label}
//                           </span>
//                         </td>
//                         <td>{(d.score * 100).toFixed(1)}%</td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               ) : (
//                 <p className="text-gray-500 italic">Chưa có dữ liệu...</p>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { LogOut, GraduationCap } from "lucide-react";
import { SOCKET_URL } from "../utils/path";

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

  const { userInfo } = useSelector((state) => state.user);
  const verifyInfo = useSelector((state) => state.verify.verifyInfo);
  const navigate = useNavigate();

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

      {/* === NAV === */}
      <nav className="bg-white/80 backdrop-blur border-b shadow sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/student_dashboard" className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-indigo-600">
              Smart Exam
            </span>
          </Link>

          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full flex items-center gap-2"
          >
            <LogOut size={18} /> Đăng xuất
          </button>
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
                    <tr>
                      <th>#</th>
                      <th>Hành vi</th>
                      <th>Độ tin cậy</th>
                    </tr>
                  </thead>
                  <tbody>
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
                        <td>{(d.score * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
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
