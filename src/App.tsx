import React, { useState, useEffect } from 'react';
import { Classroom, Student, TeacherUser } from './types';
import { isFirebaseInitialized, testFirebaseConnection, FirebaseConnectionStatus } from './firebase/config';
import { StudentJoin } from './components/student/StudentJoin';
import { StudentDashboard } from './components/student/StudentDashboard';
import { TeacherLogin } from './components/teacher/TeacherLogin';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { FirebaseGuideModal } from './components/FirebaseGuideModal';
import { Volume2, VolumeX, ShieldCheck, Database, Award, Sparkles, RefreshCw, AlertTriangle } from 'lucide-react';
import { sounds } from './utils/audio';

export function App() {

  const [viewMode, setViewMode] = useState<
    'student_join' | 'student_dashboard' | 'teacher_login' | 'teacher_dashboard' | 'verify_cert'
  >('student_join');

  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [teacher, setTeacher] = useState<TeacherUser | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showFirebaseModal, setShowFirebaseModal] = useState(false);
  const [verifyCertId, setVerifyCertId] = useState<string | null>(null);
  const [firebaseStatus, setFirebaseStatus] = useState<FirebaseConnectionStatus>({
    status: isFirebaseInitialized() ? 'live' : 'demo',
    message: isFirebaseInitialized() ? 'กำลังตรวจสอบการเชื่อมต่อ...' : 'โหมดตัวอย่าง (Demo Mode)'
  });

  useEffect(() => {
    testFirebaseConnection().then(status => {
      setFirebaseStatus(status);
    });
  }, []);

  // Check URL parameters for certificate verification or auto-room join
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const verifyParam = params.get('verify');
      if (verifyParam) {
        setVerifyCertId(verifyParam);
        setViewMode('verify_cert');
      }
    }
  }, []);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sounds.setMuted(!next);
    if (next) sounds.playClick();
  };

  const handleStudentJoined = (c: Classroom, s: Student) => {
    setClassroom(c);
    setStudent(s);
    setViewMode('student_dashboard');
  };

  const handleTeacherLoggedIn = (t: TeacherUser) => {
    setTeacher(t);
    setViewMode('teacher_dashboard');
  };

  return (
    <div className="min-h-screen bg-sky-50 text-slate-800 font-sans selection:bg-indigo-500 selection:text-white flex flex-col justify-between">
      {/* Global Navigation Header */}
      <header className="bg-white border-b-4 border-indigo-100 px-6 py-4 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 text-2xl font-black text-white">
              🤖
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-indigo-900 tracking-tight flex items-center gap-2">
                ภารกิจพิชิตอาณาจักรอัลกอริทึม
                <span className="hidden sm:inline-block text-xs bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full font-extrabold border border-indigo-200">
                  Grade 4
                </span>
              </h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Algorithm Adventure | กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี (ป.4)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Firebase Live or Demo Mode Indicator Pill */}
            <button
              onClick={() => setShowFirebaseModal(true)}
              title={firebaseStatus.message}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 font-black text-xs shadow-sm transition ${
                firebaseStatus.status === 'live'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                  : firebaseStatus.status === 'error'
                  ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100 animate-pulse'
                  : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
              }`}
            >
              {firebaseStatus.status === 'live' ? (
                <>
                  <Database className="w-4 h-4 text-emerald-600" />
                  <span>🟢 Firebase Live (ออนไลน์)</span>
                </>
              ) : firebaseStatus.status === 'error' ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>⚠️ Firebase Rules Error (คลิกแก้)</span>
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 text-amber-600" />
                  <span>🟡 Demo Mode (เฉพาะเครื่องนี้)</span>
                </>
              )}
            </button>

            {/* Sound Mute Toggle */}
            <button
              onClick={toggleSound}
              className="p-2.5 rounded-2xl bg-white border-2 border-indigo-100 text-indigo-600 hover:bg-indigo-50 transition shadow-sm"
              title={soundEnabled ? 'ปิดเสียง' : 'เปิดเสียง'}
            >
              {soundEnabled ? <Volume2 className="w-5 h-5 text-indigo-600" /> : <VolumeX className="w-5 h-5 text-rose-500" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full">
        {viewMode === 'verify_cert' && verifyCertId ? (
          /* Certificate Verification Screen */
          <div className="max-w-md mx-auto my-12 p-8 bg-white border-b-4 border-emerald-200 rounded-3xl text-center space-y-4 shadow-lg">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto text-3xl border-2 border-emerald-200">
              <ShieldCheck className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-black text-indigo-900">ผลการตรวจสอบวุฒิบัตร (Certificate Verified)</h2>
            <p className="text-xs text-slate-600">
              วุฒิบัตรหมายเลข <strong className="text-indigo-600 font-mono">{verifyCertId}</strong> มีผลบังคับใช้และออกโดยระบบภารกิจพิชิตอาณาจักรอัลกอริทึมอย่างถูกต้อง
            </p>
            <button
              onClick={() => { setViewMode('student_join'); }}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs shadow-md transition"
            >
              กลับสู่หน้าแรก
            </button>
          </div>
        ) : viewMode === 'student_join' ? (
          <StudentJoin
            onStudentJoined={handleStudentJoined}
            onSwitchToTeacher={() => setViewMode('teacher_login')}
          />
        ) : viewMode === 'student_dashboard' && classroom && student ? (
          <StudentDashboard
            initialClassroom={classroom}
            initialStudent={student}
            onLeaveClassroom={() => {
              setClassroom(null);
              setStudent(null);
              setViewMode('student_join');
            }}
          />
        ) : viewMode === 'teacher_login' ? (
          <TeacherLogin
            onTeacherLoggedIn={handleTeacherLoggedIn}
            onSwitchToStudent={() => setViewMode('student_join')}
          />
        ) : viewMode === 'teacher_dashboard' && teacher ? (
          <TeacherDashboard
            teacher={teacher}
            onLogout={() => {
              setTeacher(null);
              setViewMode('teacher_login');
            }}
          />
        ) : null}
      </main>

      {/* Global Footer */}
      <footer className="bg-slate-800 px-6 py-3 text-white text-xs font-bold border-t-4 border-slate-700 shadow-inner">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-4 items-center">
            <span className="text-emerald-400 uppercase tracking-wide">● System Online</span>
            <span className="text-slate-400 uppercase tracking-wide">Algorithm Adventure Grade 4</span>
          </div>
          <div className="text-slate-400 text-[11px]">
            © 2024 กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี (วิทยาการคำนวณ ป.4)
          </div>
        </div>
      </footer>

      {/* Firebase Setup Modal */}
      {showFirebaseModal && (
        <FirebaseGuideModal
          onClose={() => setShowFirebaseModal(false)}
          onConfigSaved={() => window.location.reload()}
        />
      )}
    </div>
  );
}

export default App;

