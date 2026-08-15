import React, { useState } from 'react';
import { Classroom, ClassroomSettings } from '../../types';
import { updateClassroomSettings } from '../../firebase/db';
import { X, Lock, Play, Pause, Save, Eye, ShieldAlert, Trash2 } from 'lucide-react';
import { sounds } from '../../utils/audio';

interface Props {
  classroom: Classroom;
  onClose: () => void;
  onDeleteClassroom?: () => void;
}

export const ClassSettingsModal: React.FC<Props> = ({ classroom, onClose, onDeleteClassroom }) => {
  const current = classroom.settings || {
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
  };

  const [settings, setSettings] = useState<ClassroomSettings>(current);
  const [saved, setSaved] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playSuccess();
    await updateClassroomSettings(classroom.id, settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 p-6 sm:p-8 rounded-3xl max-w-lg w-full shadow-2xl text-white my-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <span className="text-xs font-bold text-cyan-400 bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-800/50">
              ⚙️ ควบคุมและตั้งค่าห้องเรียน
            </span>
            <h2 className="text-xl font-black text-amber-300 mt-1">{classroom.name}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Lock World Control */}
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-2">
            <label className="block text-xs font-bold text-slate-200">
              ปลดล็อกเฉพาะ World ที่ต้องการสอน (Lock World):
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 1, label: 'เปิดเฉพาะ World 1' },
                { val: 2, label: 'เปิดถึง World 2' },
                { val: 3, label: 'เปิดทุก World (1-3)' }
              ].map(opt => (
                <button
                  type="button"
                  key={opt.val}
                  onClick={() => {
                    sounds.playClick();
                    setSettings({ ...settings, allowedWorld: opt.val });
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition ${
                    settings.allowedWorld === opt.val
                      ? 'bg-indigo-600 border-cyan-400 text-white'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pause / Resume Game */}
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white">สถานะการเล่นเกม (Pause / Resume)</div>
              <div className="text-[11px] text-slate-400">กดพักเกมชั่วคราวเพื่อดึงความสนใจนักเรียนมาที่คุณครู</div>
            </div>
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setSettings({ ...settings, isPaused: !settings.isPaused });
              }}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
                settings.isPaused
                  ? 'bg-rose-500 text-white'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}
            >
              {settings.isPaused ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {settings.isPaused ? 'พักเกมอยู่' : 'เกมปกติ'}
            </button>
          </div>

          {/* Open / Close Registration */}
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white">การรับนักเรียนเข้าห้องเรียน (Open / Close)</div>
              <div className="text-[11px] text-slate-400">ปิดการเข้าห้องเรียนใหม่เมื่อนักเรียนมาครบแล้ว</div>
            </div>
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setSettings({ ...settings, isOpen: !settings.isOpen });
              }}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                settings.isOpen
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              }`}
            >
              {settings.isOpen ? '🔓 เปิดรับอยู่' : '🔒 ปิดห้องเรียน'}
            </button>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg"
          >
            <Save className="w-4 h-4" /> บันทึกการตั้งค่าห้องเรียน
          </button>
          {saved && <div className="text-xs text-emerald-400 font-bold text-center">บันทึกตั้งค่าเรียบร้อย!</div>}
        </form>

        {/* Danger Zone: Delete Classroom */}
        {onDeleteClassroom && (
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-rose-400">ลบห้องเรียนนี้</div>
              <div className="text-[11px] text-slate-500">ลบห้องเรียนและข้อมูลคะแนนนักเรียนทั้งหมด</div>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onDeleteClassroom();
              }}
              className="px-3.5 py-2 bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 rounded-xl text-xs font-black transition flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" /> ลบห้องเรียน
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

