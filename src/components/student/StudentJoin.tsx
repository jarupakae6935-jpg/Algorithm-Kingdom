import React, { useState, useEffect } from 'react';
import { findClassroomByCode, joinClassroom, fetchStudentsInClassroom } from '../../firebase/db';
import { isFirebaseInitialized } from '../../firebase/config';
import { Classroom, Student } from '../../types';
import { UserCheck, QrCode, Sparkles, Loader2, CheckCircle2, History, Users, AlertCircle } from 'lucide-react';
import { sounds } from '../../utils/audio';

interface Props {
  onStudentJoined: (classroom: Classroom, student: Student) => void;
  onSwitchToTeacher: () => void;
}

const LAST_SESSION_KEY = 'algo_last_student_session';

interface SavedSession {
  roomCode: string;
  classroomId: string;
  classroomName: string;
  studentName: string;
  studentId?: string;
}

export const StudentJoin: React.FC<Props> = ({
  onStudentJoined,
  onSwitchToTeacher
}) => {
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [studentNameInput, setStudentNameInput] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Live verified classroom info while typing
  const [verifiedClassroom, setVerifiedClassroom] = useState<Classroom | null>(null);
  const [checkingCode, setCheckingCode] = useState(false);
  const [rosterStudents, setRosterStudents] = useState<Student[]>([]);
  const [savedSession, setSavedSession] = useState<SavedSession | null>(null);

  // Load saved session if exists
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LAST_SESSION_KEY);
      if (raw) {
        setSavedSession(JSON.parse(raw));
      }
    } catch (e) {
      console.warn('Error loading saved session', e);
    }
  }, []);

  // Auto detect room code from URL ?room=ALG4-XXXX or ?room=XXXX
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room');
      if (roomParam) {
        const cleanParam = roomParam.trim().toUpperCase();
        setRoomCodeInput(cleanParam);
        checkRoomCode(cleanParam);
      }
    }
  }, []);

  // Debounced check room code when typing
  useEffect(() => {
    const trimmed = roomCodeInput.trim().toUpperCase();
    if (trimmed.length >= 3) {
      const timer = setTimeout(() => {
        checkRoomCode(trimmed);
      }, 400);
      return () => clearTimeout(timer);
    } else {
      setVerifiedClassroom(null);
      setRosterStudents([]);
    }
  }, [roomCodeInput]);

  const checkRoomCode = async (code: string) => {
    if (!code) return;
    setCheckingCode(true);
    try {
      const found = await findClassroomByCode(code);
      if (found) {
        setVerifiedClassroom(found);
        setErrorMsg(null);
        // Fetch roster students for convenient 1-click select
        const roster = await fetchStudentsInClassroom(found.id);
        setRosterStudents(roster);
      } else {
        setVerifiedClassroom(null);
        setRosterStudents([]);
      }
    } catch (e) {
      console.warn('checkRoomCode error', e);
    } finally {
      setCheckingCode(false);
    }
  };

  const handleJoin = async (e?: React.FormEvent, customName?: string, customCode?: string, customStudentId?: string) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    const code = (customCode || roomCodeInput).trim().toUpperCase();
    const name = (customName || studentNameInput).trim();
    const targetStudentId = customStudentId || selectedStudentId;

    if (!code) {
      setErrorMsg('กรุณากรอกรหัสห้องเรียน');
      return;
    }
    if (!name) {
      setErrorMsg('กรุณากรอกหรือเลือกชื่อนักเรียน');
      return;
    }

    setLoading(true);
    sounds.playClick();

    try {
      const classroom = verifiedClassroom && (
        verifiedClassroom.roomCode.toUpperCase() === code ||
        verifiedClassroom.roomCode.toUpperCase().replace(/[^A-Z0-9]/g, '') === code.replace(/[^A-Z0-9]/g, '') ||
        verifiedClassroom.roomCode.toUpperCase().endsWith(code.replace(/[^A-Z0-9]/g, ''))
      ) ? verifiedClassroom : await findClassroomByCode(code);

      if (!classroom) {
        setErrorMsg(`ไม่พบห้องเรียนสำหรับรหัส "${code}" กรุณาตรวจสอบรหัสห้องเรียน 4 ตัวท้ายกับคุณครูผู้สอน`);
        setLoading(false);
        return;
      }

      if (classroom.settings?.isOpen === false) {
        setErrorMsg('ขณะนี้ห้องเรียนนี้ถูกปิดการลงทะเบียนเข้าใหม่โดยคุณครู');
        setLoading(false);
        return;
      }

      const joinedStudent = await joinClassroom(classroom.id, name, targetStudentId);

      // Save session with verified studentId for exact re-linking
      try {
        localStorage.setItem(LAST_SESSION_KEY, JSON.stringify({
          roomCode: classroom.roomCode,
          classroomId: classroom.id,
          classroomName: classroom.name,
          studentName: joinedStudent.name,
          studentId: joinedStudent.id
        }));
      } catch (err) {
        console.warn('Failed to save session', err);
      }

      sounds.playSuccess();
      onStudentJoined(classroom, joinedStudent);
    } catch (err: any) {
      console.error('Error joining room', err);
      setErrorMsg('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  const handleResumeSavedSession = async () => {
    if (!savedSession) return;
    setRoomCodeInput(savedSession.roomCode);
    setStudentNameInput(savedSession.studentName);
    setSelectedStudentId(savedSession.studentId);
    await handleJoin(undefined, savedSession.studentName, savedSession.roomCode, savedSession.studentId);
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="bg-white border-b-4 border-indigo-100 p-6 sm:p-8 rounded-3xl max-w-md w-full shadow-xl space-y-5">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg text-3xl transform rotate-3 text-white">
            🤖
          </div>
          <h1 className="text-2xl font-black text-indigo-900">เข้าร่วมภารกิจอัลกอริทึม</h1>
          <p className="text-xs font-bold text-slate-400">
            ป้อนรหัสห้องเรียนจากคุณครูและพิมพ์ชื่อของคุณเพื่อเข้าเล่น
          </p>
        </div>

        {/* Quick Resume Previous Session Banner */}
        {savedSession && (
          <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-indigo-800 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-indigo-600" /> เข้าสู่ระบบครั้งล่าสุด
              </span>
              <span className="text-[10px] bg-indigo-200/70 text-indigo-900 font-extrabold px-2 py-0.5 rounded-md">
                {savedSession.roomCode}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-bold text-slate-700 truncate">
                {savedSession.studentName} ({savedSession.classroomName})
              </div>
              <button
                type="button"
                onClick={handleResumeSavedSession}
                disabled={loading}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition shrink-0 shadow-sm"
              >
                เข้าเล่นต่อ ➔
              </button>
            </div>
          </div>
        )}

        <form onSubmit={(e) => handleJoin(e)} className="space-y-4">
          {/* Room Code Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-black text-slate-600">
                รหัสห้องเรียน (Classroom Code)
              </label>
              {checkingCode && (
                <span className="text-[10px] text-indigo-600 font-bold flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> กำลังค้นหา...
                </span>
              )}
            </div>
            <input
              type="text"
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
              placeholder="เช่น K8P2 หรือ ALG4-K8P2"
              maxLength={12}
              className="w-full px-4 py-3 bg-indigo-50/60 border-2 border-indigo-100 focus:border-indigo-600 rounded-2xl text-center text-lg font-black tracking-widest uppercase text-indigo-900 placeholder-slate-400 outline-none transition"
            />
            <p className="text-[10px] text-slate-400 mt-1 text-center">
              * พิมพ์รหัส 4 ตัวท้าย (เช่น <strong className="text-indigo-600 font-black">8821</strong> หรือ <strong className="text-indigo-600 font-black">K8P2</strong>) หรือรหัสเต็ม
            </p>
          </div>

          {/* Verified Classroom Found Banner */}
          {verifiedClassroom && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 font-bold flex items-center gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-black text-emerald-950 truncate">
                  {verifiedClassroom.name}
                </div>
                <div className="text-[11px] text-emerald-700 truncate">
                  ครูผู้สอน: {verifiedClassroom.teacherName} (รหัส: {verifiedClassroom.roomCode})
                </div>
              </div>
            </div>
          )}

          {/* Student Name Input / Selection */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-black text-slate-600">
                ชื่อนักเรียน (Student Name)
              </label>
              {rosterStudents.length > 0 && (
                <span className="text-[10px] text-indigo-600 font-extrabold flex items-center gap-1">
                  <Users className="w-3 h-3" /> มีรายชื่อในห้อง {rosterStudents.length} คน
                </span>
              )}
            </div>

            {/* Quick Roster Select if available */}
            {rosterStudents.length > 0 && (
              <div className="mb-2">
                <select
                  value={selectedStudentId || ''}
                  onChange={(e) => {
                    const selId = e.target.value;
                    if (selId) {
                      const found = rosterStudents.find(s => s.id === selId);
                      if (found) {
                        setSelectedStudentId(found.id);
                        setStudentNameInput(found.name);
                      }
                    } else {
                      setSelectedStudentId(undefined);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-indigo-50/70 border-2 border-indigo-200 focus:border-indigo-600 rounded-2xl text-xs font-black text-indigo-950 outline-none transition"
                >
                  <option value="">-- หรือเลือกชื่อของคุณจากรายชื่อห้อง --</option>
                  {rosterStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.totalScore > 0 ? `(มี ${s.totalScore} คะแนน)` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <input
              type="text"
              value={studentNameInput}
              onChange={(e) => {
                setStudentNameInput(e.target.value);
                setSelectedStudentId(undefined);
              }}
              placeholder="พิมพ์ชื่อ เช่น ด.ช. ก้องภพ หรือ น้องเอ"
              maxLength={40}
              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-indigo-600 rounded-2xl text-slate-800 font-bold placeholder-slate-400 outline-none transition text-sm"
            />
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-bold space-y-1">
              <div className="flex items-center gap-1.5 text-rose-800 font-black">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>เข้าสู่ห้องเรียนไม่สำเร็จ</span>
              </div>
              <p className="text-[11px] leading-relaxed">{errorMsg}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-black rounded-2xl shadow-md transition flex items-center justify-center gap-2 text-base disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                กำลังเชื่อมต่อห้องเรียน...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-yellow-300" />
                เข้าสู่บทเรียนและเริ่มเล่น
              </>
            )}
          </button>
        </form>

        {/* Demo Mode Quick Access */}
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={() => {
              setRoomCodeInput('ALG4-8821');
              setStudentNameInput('น้องเอ (ป.4/1)');
            }}
            className="text-[11px] text-slate-400 hover:text-indigo-600 font-bold underline transition"
          >
            💡 ทดลองด้วยห้องตัวอย่าง (รหัส: ALG4-8821)
          </button>
        </div>

        <div className="pt-3 border-t-2 border-slate-100 text-center">
          <button
            onClick={onSwitchToTeacher}
            className="text-xs text-indigo-600 hover:text-indigo-800 underline font-extrabold transition"
          >
            👩‍🏫 คุณครูผู้สอน? คลิกเข้าสู่ระบบครู
          </button>
        </div>
      </div>
    </div>
  );
};

