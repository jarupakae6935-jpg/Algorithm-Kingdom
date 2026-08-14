import React, { useState } from 'react';
import { teacherLogin, teacherRegister } from '../../firebase/db';
import { TeacherUser } from '../../types';
import { Mail, Lock, User, LogIn, UserPlus, Sparkles, Loader2 } from 'lucide-react';
import { sounds } from '../../utils/audio';

interface Props {
  onTeacherLoggedIn: (user: TeacherUser) => void;
  onSwitchToStudent: () => void;
}

export const TeacherLogin: React.FC<Props> = ({
  onTeacherLoggedIn,
  onSwitchToStudent
}) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !password) {
      setErrorMsg('กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }

    setLoading(true);
    sounds.playClick();

    try {
      let res;
      if (isRegister) {
        res = await teacherRegister(email, password, name || 'ครูผู้สอน ป.4');
      } else {
        res = await teacherLogin(email, password);
      }
      sounds.playSuccess();
      onTeacherLoggedIn({
        uid: res.uid,
        name: res.name,
        email: res.email,
        role: 'teacher'
      });
    } catch (err: any) {
      console.error('Login error', err);
      setErrorMsg('การเข้าสู่ระบบขัดข้อง กรุณาตรวจสอบอีเมลและรหัสผ่าน');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    sounds.playSuccess();
    onTeacherLoggedIn({
      uid: 'teacher-demo-01',
      name: 'ครูสายชล สมาร์ท',
      email: 'teacher@school.ac.th',
      role: 'teacher'
    });
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="bg-white border-b-4 border-indigo-100 p-8 rounded-3xl max-w-md w-full shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-md text-3xl transform rotate-3 text-white">
            👩‍🏫
          </div>
          <h1 className="text-2xl font-black text-indigo-900">
            {isRegister ? 'สร้างบัญชีครูผู้สอน' : 'เข้าสู่ระบบครูผู้สอน'}
          </h1>
          <p className="text-xs font-bold text-slate-400">ระบบจัดการห้องเรียนและติดตามคะแนน Real-time</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-black text-slate-600 mb-1">
                ชื่อ-นามสกุลครูผู้สอน
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น ครูสายชล สมาร์ท"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-2 border-slate-200 focus:border-indigo-600 rounded-2xl text-slate-800 font-bold placeholder-slate-400 outline-none text-xs transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-black text-slate-600 mb-1">
              อีเมล (Email)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teacher@school.ac.th"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-2 border-slate-200 focus:border-indigo-600 rounded-2xl text-slate-800 font-bold placeholder-slate-400 outline-none text-xs transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-600 mb-1">
              รหัสผ่าน (Password)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-2 border-slate-200 focus:border-indigo-600 rounded-2xl text-slate-800 font-bold placeholder-slate-400 outline-none text-xs transition"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-xs font-bold text-center">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-md transition flex items-center justify-center gap-2 text-sm"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isRegister ? (
              <>
                <UserPlus className="w-4 h-4" /> สมัครบัญชีครู
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" /> เข้าสู่ระบบ
              </>
            )}
          </button>
        </form>

        <div className="space-y-3 pt-2 text-center">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-extrabold"
          >
            {isRegister ? 'มีบัญชีแล้ว? เข้าสู่ระบบ' : 'ยังไม่มีบัญชีครู? สร้างบัญชีครู'}
          </button>

          <div className="relative border-t-2 border-slate-100 pt-3">
            <button
              type="button"
              onClick={handleDemoLogin}
              className="w-full py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-black rounded-2xl border-2 border-amber-200 transition flex items-center justify-center gap-2 shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              ทดลองใช้งานใน DEMO MODE (ไม่ต้องใช้อีเมล)
            </button>
          </div>

          <div className="pt-2">
            <button
              onClick={onSwitchToStudent}
              className="text-xs text-slate-500 hover:text-slate-700 font-bold underline"
            >
              👨‍🎓 เข้าสู่ระบบนักเรียน
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
