import React, { useState } from 'react';
import { Classroom, Student } from '../../types';
import { Users, Gamepad2, Trophy, Eye, EyeOff, Send, Sparkles, X, Star } from 'lucide-react';
import { updateClassroomSettings, sendAnnouncement } from '../../firebase/db';
import { sounds } from '../../utils/audio';

interface Props {
  classroom: Classroom;
  students: Student[];
  onClose: () => void;
}

export const ClassroomLiveMonitor: React.FC<Props> = ({
  classroom,
  students,
  onClose
}) => {
  const [privacyMode, setPrivacyMode] = useState<boolean>(
    classroom.settings?.privacyMode || false
  );
  const [announcementMsg, setAnnouncementMsg] = useState('');
  const [announcementSent, setAnnouncementSent] = useState(false);

  const total = students.length;
  const playing = students.filter(s => s.status === 'playing' || s.status === 'idle').length;
  const completed = students.filter(s => s.completedLevelsCount >= 12 || s.status === 'completed').length;
  const workingWs = students.filter(s => s.status === 'working_worksheet').length;

  const togglePrivacy = async () => {
    sounds.playClick();
    const nextVal = !privacyMode;
    setPrivacyMode(nextVal);
    await updateClassroomSettings(classroom.id, { privacyMode: nextVal });
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementMsg.trim()) return;
    sounds.playSuccess();
    await sendAnnouncement(classroom.id, 'ประกาศจากหน้าจอชั้นเรียน', announcementMsg.trim());
    setAnnouncementMsg('');
    setAnnouncementSent(true);
    setTimeout(() => setAnnouncementSent(false), 2500);
  };

  return (
    <div className="fixed inset-0 bg-sky-50/98 z-50 overflow-y-auto p-6 text-slate-800 animate-fade-in flex flex-col justify-between">
      {/* Header Bar for Projector */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border-b-4 border-indigo-100 p-6 rounded-3xl shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 font-black text-xs border border-indigo-200">
              CLASSROOM LIVE MONITOR
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-indigo-900">
            Algorithm Adventure — {classroom.name}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={togglePrivacy}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs transition flex items-center gap-2 border-2 ${
              privacyMode
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
            }`}
          >
            {privacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {privacyMode ? 'Privacy Mode (ซ่อนชื่อ)' : 'Normal Mode (แสดงชื่อเต็ม)'}
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl font-black text-xs transition shadow-md flex items-center gap-1.5"
          >
            <X className="w-4 h-4" /> ปิดหน้าจอฉาย
          </button>
        </div>
      </div>

      {/* Real-time Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
        <div className="bg-white border-b-4 border-slate-200 p-5 rounded-3xl flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-2xl border-2 border-indigo-200">
            👥
          </div>
          <div>
            <div className="text-xs text-slate-400 font-extrabold uppercase">นักเรียนในห้อง</div>
            <div className="text-2xl font-black text-indigo-900">{total} คน</div>
          </div>
        </div>

        <div className="bg-white border-b-4 border-slate-200 p-5 rounded-3xl flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-cyan-100 text-cyan-700 flex items-center justify-center text-2xl border-2 border-cyan-200">
            🎮
          </div>
          <div>
            <div className="text-xs text-slate-400 font-extrabold uppercase">กำลังเล่น</div>
            <div className="text-2xl font-black text-cyan-600">{playing} คน</div>
          </div>
        </div>

        <div className="bg-white border-b-4 border-slate-200 p-5 rounded-3xl flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl border-2 border-emerald-200">
            🏆
          </div>
          <div>
            <div className="text-xs text-slate-400 font-extrabold uppercase">ผ่านครบแล้ว</div>
            <div className="text-2xl font-black text-emerald-600">{completed} คน</div>
          </div>
        </div>

        <div className="bg-white border-b-4 border-slate-200 p-5 rounded-3xl flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-2xl border-2 border-amber-200">
            📚
          </div>
          <div>
            <div className="text-xs text-slate-400 font-extrabold uppercase">ทำใบงาน</div>
            <div className="text-2xl font-black text-amber-600">{workingWs} คน</div>
          </div>
        </div>
      </div>

      {/* Live Student Cards Grid */}
      <div className="flex-1 bg-white border-b-4 border-slate-200 rounded-3xl p-6 overflow-y-auto max-h-[50vh] shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {students.map((std, idx) => {
            const displayName = privacyMode
              ? `นักเรียน ${String(idx + 1).padStart(2, '0')}`
              : std.name;

            let totalStars = 0;
            for (const lid in std.levels) {
              if (std.levels[lid].completed) totalStars += std.levels[lid].stars || 0;
            }

            return (
              <div
                key={std.id}
                className={`p-4 rounded-3xl border-b-4 flex flex-col justify-between transition shadow-sm ${
                  std.completedLevelsCount >= 12
                    ? 'bg-emerald-50 border-emerald-300'
                    : 'bg-white border-slate-200 hover:border-indigo-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase">
                      World {std.currentWorld || 1}
                    </span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <h4 className="text-sm font-black text-slate-800 truncate">{displayName}</h4>
                  <p className="text-[11px] text-indigo-600 font-bold mt-1">
                    ด่านผ่าน: {std.completedLevelsCount}/12
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t-2 border-slate-100 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-amber-600 font-black">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {totalStars}
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold">
                    {std.totalScore} คะแนน
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Broadcast Announcement */}
      <form onSubmit={handleSendBroadcast} className="mt-6 flex gap-3">
        <input
          type="text"
          value={announcementMsg}
          onChange={(e) => setAnnouncementMsg(e.target.value)}
          placeholder="พิมพ์ประกาศด่วนส่งขึ้นหน้าจอนักเรียน Real-time..."
          className="flex-1 px-5 py-3.5 bg-white border-2 border-slate-200 focus:border-indigo-600 rounded-2xl text-xs text-slate-800 font-bold placeholder-slate-400 outline-none transition shadow-sm"
        />
        <button
          type="submit"
          className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl text-xs transition flex items-center gap-2 shadow-md shrink-0"
        >
          <Send className="w-4 h-4" /> ส่งประกาศด่วน
        </button>
      </form>
    </div>
  );
};
