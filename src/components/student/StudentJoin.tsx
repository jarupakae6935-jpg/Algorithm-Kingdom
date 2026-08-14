import React, { useState, useEffect } from 'react';
import { findClassroomByCode, joinClassroom } from '../../firebase/db';
import { Classroom, Student } from '../../types';
import { UserCheck, QrCode, Sparkles, Loader2 } from 'lucide-react';
import { sounds } from '../../utils/audio';

interface Props {
  onStudentJoined: (classroom: Classroom, student: Student) => void;
  onSwitchToTeacher: () => void;
}

export const StudentJoin: React.FC<Props> = ({
  onStudentJoined,
  onSwitchToTeacher
}) => {
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [studentNameInput, setStudentNameInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto detect room code from URL ?room=ALG4-XXXX
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room');
      if (roomParam) {
        setRoomCodeInput(roomParam.trim().toUpperCase());
      }
    }
  }, []);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const code = roomCodeInput.trim().toUpperCase();
    const name = studentNameInput.trim();

    if (!code) {
      setErrorMsg('กรุณากรอกรหัสห้องเรียน');
      return;
    }
    if (!name) {
      setErrorMsg('กรุณากรอกชื่อนักเรียน');
      return;
    }

    setLoading(true);
    sounds.playClick();

    try {
      const classroom = await findClassroomByCode(code);
      if (!classroom) {
        setErrorMsg('ไม่พบห้องเรียนรหัสนี้! กรุณาตรวจสอบรหัสห้องเรียนกับคุณครูอีกครั้ง');
        setLoading(false);
        return;
      }

      if (classroom.settings?.isOpen === false) {
        setErrorMsg('ขณะนี้ห้องเรียนนี้ถูกปิดการลงทะเบียนเข้าใหม่โดยคุณครู');
        setLoading(false);
        return;
      }

      const newStudent = await joinClassroom(classroom.id, name);
      sounds.playSuccess();
      onStudentJoined(classroom, newStudent);
    } catch (err: any) {
      console.error('Error joining room', err);
      setErrorMsg('เกิดข้อผิดพลาดในการเข้าร่วมห้องเรียน กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="bg-white border-b-4 border-indigo-100 p-8 rounded-3xl max-w-md w-full shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg text-3xl transform rotate-3">
            🤖
          </div>
          <h1 className="text-2xl font-black text-indigo-900">เข้าร่วมภารกิจอัลกอริทึม</h1>
          <p className="text-xs font-bold text-slate-400">ป้อนรหัสห้องเรียนจากคุณครูและพิมพ์ชื่อของคุณเพื่อเข้าเล่น</p>
        </div>

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-600 mb-1">
              รหัสห้องเรียน (Classroom Code)
            </label>
            <input
              type="text"
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
              placeholder="เช่น ALG4-K8P2"
              maxLength={10}
              className="w-full px-4 py-3 bg-indigo-50/60 border-2 border-indigo-100 focus:border-indigo-600 rounded-2xl text-center text-lg font-black tracking-widest uppercase text-indigo-900 placeholder-slate-400 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-600 mb-1">
              ชื่อของฉัน (Student Name)
            </label>
            <input
              type="text"
              value={studentNameInput}
              onChange={(e) => setStudentNameInput(e.target.value)}
              placeholder="เช่น น้องเอ (ป.4/1)"
              maxLength={30}
              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-indigo-600 rounded-2xl text-slate-800 font-bold placeholder-slate-400 outline-none transition text-sm"
            />
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-xs font-bold text-center">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-black rounded-2xl shadow-md transition flex items-center justify-center gap-2 text-base"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                กำลังเชื่อมต่อห้องเรียน...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-yellow-300" />
                เข้าร่วมเกมตะลุยด่าน
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t-2 border-slate-100 text-center">
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
