import React, { useState, useEffect } from 'react';
import { TeacherUser, Classroom, Student } from '../../types';
import { createClassroom, subscribeToStudents, sendAnnouncement } from '../../firebase/db';
import { calculateClassAnalytics } from '../../utils/analytics';
import { exportClassroomToCSV, exportClassroomToJSON } from '../../utils/export';
import { ClassroomLiveMonitor } from './ClassroomLiveMonitor';
import { QrDisplayModal } from './QrDisplayModal';
import { StudentAnalyticsModal } from './StudentAnalyticsModal';
import { WorksheetReviewModal } from './WorksheetReviewModal';
import { ObservationModal } from './ObservationModal';
import { ClassSettingsModal } from './ClassSettingsModal';
import { FirebaseGuideModal } from '../FirebaseGuideModal';
import { Plus, QrCode, Monitor, Settings, Download, FileText, Send, Eye, ShieldAlert, Sparkles, BarChart3, AlertCircle } from 'lucide-react';
import { sounds } from '../../utils/audio';

interface Props {
  teacher: TeacherUser;
  onLogout: () => void;
}

export const TeacherDashboard: React.FC<Props> = ({ teacher, onLogout }) => {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const [students, setStudents] = useState<Student[]>([]);

  // Modals state
  const [showCreateClassModal, setShowCreateClassModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showLiveMonitor, setShowLiveMonitor] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showFirebaseModal, setShowFirebaseModal] = useState(false);
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<Student | null>(null);
  const [selectedStudentForWs, setSelectedStudentForWs] = useState<Student | null>(null);
  const [selectedStudentForObs, setSelectedStudentForObs] = useState<Student | null>(null);

  // New classroom form state
  const [newClassName, setNewClassName] = useState('');
  const [newAcademicYear, setNewAcademicYear] = useState('2569');

  // Broadcast announcement
  const [announcementMsg, setAnnouncementMsg] = useState('');

  // Default initial demo classroom setup if none
  useEffect(() => {
    const demoClass: Classroom = {
      id: 'demo-class-01',
      name: 'วิทยาการคำนวณ ป.4/1',
      teacherId: teacher.uid,
      teacherName: teacher.name,
      academicYear: '2569',
      roomCode: 'ALG4-K8P2',
      status: 'active',
      createdAt: new Date().toISOString(),
      settings: {
        maxTimePerLevel: 300,
        maxHearts: 3,
        enableHints: true,
        enableTimer: true,
        enableSound: true,
        enableWorksheets: true,
        allowedWorld: 3,
        privacyMode: false,
        isPaused: false,
        isOpen: true
      }
    };
    setClassrooms([demoClass]);
    setSelectedClassroom(demoClass);
  }, [teacher]);

  // Subscribe to real-time student updates
  useEffect(() => {
    if (!selectedClassroom) return;
    const unsub = subscribeToStudents(selectedClassroom.id, (list) => {
      setStudents(list);
    });
    return () => unsub();
  }, [selectedClassroom]);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    sounds.playSuccess();
    const created = await createClassroom(teacher.uid, teacher.name, newClassName, newAcademicYear);
    setClassrooms(prev => [created, ...prev]);
    setSelectedClassroom(created);
    setNewClassName('');
    setShowCreateClassModal(false);
  };

  const analytics = calculateClassAnalytics(students);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header Bar */}
      <div className="bg-white border-b-4 border-indigo-100 p-6 rounded-3xl shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-indigo-100 text-indigo-700 font-extrabold px-3 py-1 rounded-full border border-indigo-200">
              TEACHER DASHBOARD
            </span>
            <span className="text-xs font-bold text-slate-500">ยินดีต้อนรับคุณครู {teacher.name}</span>
          </div>
          <h1 className="text-2xl font-black text-indigo-900 mt-1">
            ภารกิจพิชิตอาณาจักรอัลกอริทึม ป.4
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFirebaseModal(true)}
            className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-black rounded-2xl text-xs transition flex items-center gap-1.5"
          >
            🔥 Firebase Setup
          </button>

          <button
            onClick={() => setShowCreateClassModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl text-xs transition flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" /> สร้างห้องเรียน
          </button>

          <button
            onClick={onLogout}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-2xl transition border border-slate-200"
          >
            ออกจากระบบ
          </button>
        </div>
      </div>

      {/* Classroom Selection & Quick Toolbar */}
      {selectedClassroom && (
        <div className="bg-white border-b-4 border-slate-200 p-6 rounded-3xl space-y-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <select
                value={selectedClassroom.id}
                onChange={(e) => {
                  const target = classrooms.find(c => c.id === e.target.value);
                  if (target) setSelectedClassroom(target);
                }}
                className="px-4 py-2.5 bg-slate-50 border-2 border-slate-200 text-indigo-900 font-black text-sm rounded-2xl outline-none"
              >
                {classrooms.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} (รหัส: {c.roomCode})
                  </option>
                ))}
              </select>

              <div className="text-xs text-slate-500 font-bold">
                รหัสเข้าร่วม: <strong className="text-indigo-600 text-base font-black ml-1">{selectedClassroom.roomCode}</strong>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowQrModal(true)}
                className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-black rounded-2xl text-xs transition flex items-center gap-1.5"
              >
                <QrCode className="w-4 h-4" /> แสดง QR Code
              </button>

              <button
                onClick={() => setShowLiveMonitor(true)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-xs transition flex items-center gap-1.5 shadow-sm"
              >
                <Monitor className="w-4 h-4" /> ฉายจอ Real-time
              </button>

              <button
                onClick={() => setShowSettingsModal(true)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-black rounded-2xl text-xs transition flex items-center gap-1.5"
              >
                <Settings className="w-4 h-4" /> ตั้งค่าห้อง
              </button>

              <button
                onClick={() => exportClassroomToCSV(selectedClassroom, students)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-black rounded-2xl text-xs transition flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>
          </div>

          {/* Quick Broadcast Announcement Input */}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!announcementMsg.trim()) return;
              sounds.playSuccess();
              await sendAnnouncement(selectedClassroom.id, 'ประกาศจากคุณครู', announcementMsg.trim());
              setAnnouncementMsg('');
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={announcementMsg}
              onChange={(e) => setAnnouncementMsg(e.target.value)}
              placeholder="ส่งประกาศบทเรียนหรือข้อความถึงนักเรียนทุกคนในห้อง Real-time..."
              className="flex-1 px-4 py-2.5 bg-slate-50 border-2 border-slate-200 focus:border-indigo-600 rounded-2xl text-xs text-slate-800 placeholder-slate-400 font-bold outline-none transition"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl text-xs transition flex items-center gap-1.5 shrink-0"
            >
              <Send className="w-3.5 h-3.5" /> ส่งประกาศ
            </button>
          </form>
        </div>
      )}

      {/* Real-time Analytics Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border-b-4 border-slate-200 p-5 rounded-3xl space-y-1 shadow-sm">
          <div className="text-xs text-slate-400 font-black uppercase">👥 นักเรียนทั้งหมด</div>
          <div className="text-3xl font-black text-indigo-900">{analytics.totalStudents} คน</div>
        </div>

        <div className="bg-white border-b-4 border-slate-200 p-5 rounded-3xl space-y-1 shadow-sm">
          <div className="text-xs text-slate-400 font-black uppercase">🎮 คะแนนเกมเฉลี่ย</div>
          <div className="text-3xl font-black text-amber-600">{analytics.avgGameScore} / 360</div>
        </div>

        <div className="bg-white border-b-4 border-slate-200 p-5 rounded-3xl space-y-1 shadow-sm">
          <div className="text-xs text-slate-400 font-black uppercase">📈 Learning Gain เฉลี่ย</div>
          <div className="text-3xl font-black text-emerald-600">
            {analytics.avgLearningGain >= 0 ? `+${analytics.avgLearningGain}` : analytics.avgLearningGain}
          </div>
          <p className="text-[10px] text-slate-400 font-bold">Pre: {analytics.avgPreTest} → Post: {analytics.avgPostTest}</p>
        </div>

        <div className="bg-white border-b-4 border-slate-200 p-5 rounded-3xl space-y-1 shadow-sm">
          <div className="text-xs text-slate-400 font-black uppercase">🏆 ผ่านครบ 12 ด่าน</div>
          <div className="text-3xl font-black text-indigo-600">{analytics.completionRate}%</div>
        </div>
      </div>

      {/* Competency Skill Breakdown & Early Warning */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Competency Skills Bars */}
        <div className="md:col-span-7 bg-white border-b-4 border-slate-200 p-6 rounded-3xl space-y-4 shadow-sm">
          <h3 className="text-base font-black text-indigo-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            วิเคราะห์ระดับทักษะเชิงคำนวณของห้องเรียน (Competency Dashboard)
          </h3>

          <div className="space-y-3">
            {[
              { label: '1. การเรียงลำดับขั้นตอน (Sequencing)', score: analytics.competencyScores.sequencing },
              { label: '2. การออกแบบอัลกอริทึม (Algorithm Design)', score: analytics.competencyScores.algorithmDesign },
              { label: '3. การแก้ปัญหาเฉพาะหน้า (Problem Solving)', score: analytics.competencyScores.problemSolving },
              { label: '4. การตรวจแก้จุดผิดพลาด (Debugging)', score: analytics.competencyScores.debugging },
              { label: '5. การปรับแต่งอัลกอริทึม (Optimization)', score: analytics.competencyScores.optimization }
            ].map((sk) => (
              <div key={sk.label} className="space-y-1">
                <div className="flex justify-between text-xs font-black text-slate-700">
                  <span>{sk.label}</span>
                  <span className="text-indigo-600">{sk.score}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${sk.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Narrative & Early Warnings */}
        <div className="md:col-span-5 bg-white border-b-4 border-slate-200 p-6 rounded-3xl space-y-4 flex flex-col justify-between shadow-sm">
          <div className="space-y-3">
            <h3 className="text-base font-black text-indigo-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              การตีความผลและข้อเสนอแนะอัตโนมัติ
            </h3>

            <div className="space-y-2">
              {analytics.interpretationNarratives.map((nar, idx) => (
                <div key={idx} className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-2xl text-xs text-slate-700 font-bold leading-relaxed">
                  • {nar}
                </div>
              ))}
            </div>
          </div>

          {/* Early Warning Students List */}
          {analytics.earlyWarningStudents.length > 0 && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl space-y-1 text-xs text-amber-900">
              <span className="font-black text-amber-900 flex items-center gap-1">
                🟡 นักเรียนที่ควรติดตามใกล้ชิด ({analytics.earlyWarningStudents.length} คน)
              </span>
              <p className="font-bold">{analytics.earlyWarningStudents[0].student.name}: {analytics.earlyWarningStudents[0].reason}</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Student Data Table */}
      <div className="bg-white border-b-4 border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
          <h3 className="text-lg font-black text-indigo-900">ตารางแสดงพัฒนาการและคะแนน Real-time</h3>
          <span className="text-xs font-bold text-slate-400">{students.length} รายชื่อ</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-400 border-b-2 border-slate-100 font-black uppercase tracking-wider">
              <tr>
                <th className="p-3">ลำดับ</th>
                <th className="p-3">ชื่อ-นามสกุล</th>
                <th className="p-3">Pre-test</th>
                <th className="p-3">คะแนนเกม (360)</th>
                <th className="p-3">Post-test</th>
                <th className="p-3">Gain</th>
                <th className="p-3">Progress</th>
                <th className="p-3">การกระทำ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 font-bold">
                    ยังไม่มีนักเรียนเข้าร่วมห้องเรียน กรุณาแชร์ QR Code เพื่อให้นักเรียนเข้าร่วม
                  </td>
                </tr>
              ) : (
                students.map((std, idx) => {
                  const gain = std.learningGain;
                  return (
                    <tr key={std.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 text-slate-400 font-bold">{idx + 1}</td>
                      <td className="p-3 font-black text-indigo-900">{std.name}</td>
                      <td className="p-3 font-bold text-slate-600">{std.preTestScore ?? '-'}</td>
                      <td className="p-3 font-black text-amber-600">{std.totalScore}</td>
                      <td className="p-3 font-black text-indigo-600">{std.postTestScore ?? '-'}</td>
                      <td className="p-3 font-black text-emerald-600">
                        {gain !== undefined ? (gain >= 0 ? `+${gain}` : `${gain}`) : '-'}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-indigo-600 h-full" style={{ width: `${std.progressPercentage}%` }} />
                          </div>
                          <span className="text-[10px] text-slate-500 font-bold">{std.completedLevelsCount}/12</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setSelectedStudentForReport(std)}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-black rounded-lg transition border border-indigo-200"
                          >
                            รายงาน
                          </button>
                          <button
                            onClick={() => setSelectedStudentForWs(std)}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-black rounded-lg transition border border-amber-200"
                          >
                            ใบงาน
                          </button>
                          <button
                            onClick={() => setSelectedStudentForObs(std)}
                            className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 text-[11px] font-black rounded-lg transition border border-teal-200"
                          >
                            สังเกต
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

      {/* Create Classroom Modal */}
      {showCreateClassModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border-b-4 border-indigo-100 p-6 rounded-3xl max-w-md w-full shadow-2xl text-slate-800 space-y-4">
            <h3 className="text-lg font-black text-indigo-900">สร้างห้องเรียนใหม่</h3>
            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-600 mb-1">ชื่อห้องเรียน</label>
                <input
                  type="text"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="เช่น วิทยาการคำนวณ ป.4/2"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 focus:border-indigo-600 rounded-2xl text-xs text-slate-800 font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-600 mb-1">ปีการศึกษา</label>
                <input
                  type="text"
                  value={newAcademicYear}
                  onChange={(e) => setNewAcademicYear(e.target.value)}
                  placeholder="2569"
                  className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 focus:border-indigo-600 rounded-2xl text-xs text-slate-800 font-bold outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl text-xs transition"
                >
                  สร้างห้องเรียน
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateClassModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl text-xs font-black transition"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQrModal && selectedClassroom && (
        <QrDisplayModal
          classroom={selectedClassroom}
          onClose={() => setShowQrModal(false)}
        />
      )}

      {/* Classroom Live Monitor Screen */}
      {showLiveMonitor && selectedClassroom && (
        <ClassroomLiveMonitor
          classroom={selectedClassroom}
          students={students}
          onClose={() => setShowLiveMonitor(false)}
        />
      )}

      {/* Class Settings Modal */}
      {showSettingsModal && selectedClassroom && (
        <ClassSettingsModal
          classroom={selectedClassroom}
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      {/* Individual Student Report Modal */}
      {selectedStudentForReport && selectedClassroom && (
        <StudentAnalyticsModal
          student={selectedStudentForReport}
          classroom={selectedClassroom}
          onClose={() => setSelectedStudentForReport(null)}
        />
      )}

      {/* Worksheet Review Modal */}
      {selectedStudentForWs && selectedClassroom && (
        <WorksheetReviewModal
          student={selectedStudentForWs}
          classroom={selectedClassroom}
          onClose={() => setSelectedStudentForWs(null)}
        />
      )}

      {/* Observation Checklist Modal */}
      {selectedStudentForObs && selectedClassroom && (
        <ObservationModal
          student={selectedStudentForObs}
          classroom={selectedClassroom}
          onClose={() => setSelectedStudentForObs(null)}
        />
      )}

      {/* Firebase Config Guide Modal */}
      {showFirebaseModal && (
        <FirebaseGuideModal
          onClose={() => setShowFirebaseModal(false)}
          onConfigSaved={() => window.location.reload()}
        />
      )}
    </div>
  );
};
