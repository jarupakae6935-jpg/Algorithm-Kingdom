import React, { useState } from 'react';
import { Student, Classroom, StudentObservation } from '../../types';
import { saveObservationNotes } from '../../firebase/db';
import { X, CheckSquare, Square, Save } from 'lucide-react';
import { sounds } from '../../utils/audio';

interface Props {
  student: Student;
  classroom: Classroom;
  onClose: () => void;
}

export const ObservationModal: React.FC<Props> = ({
  student,
  classroom,
  onClose
}) => {
  const currentObs = student.observation || {
    planning: false,
    sequencing: false,
    reasoning: false,
    debugging: false,
    teamwork: false,
    selfProblemSolving: false,
    notes: '',
    updatedAt: new Date().toISOString()
  };

  const [obs, setObs] = useState<StudentObservation>(currentObs);
  const [saved, setSaved] = useState(false);

  const toggleField = (field: keyof Omit<StudentObservation, 'notes' | 'updatedAt'>) => {
    sounds.playClick();
    setObs(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playSuccess();
    const updated = { ...obs, updatedAt: new Date().toISOString() };
    await saveObservationNotes(classroom.id, student.id, updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 p-6 sm:p-8 rounded-3xl max-w-lg w-full shadow-2xl text-white my-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <span className="text-xs font-bold text-cyan-400 bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-800/50">
              👀 บันทึกการสังเกตพฤติกรรมการเรียนรู้
            </span>
            <h2 className="text-xl font-black text-amber-300 mt-1">{student.name}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            {[
              { key: 'planning', label: 'วางแผนก่อนลงมือปฏิบัติ' },
              { key: 'sequencing', label: 'เรียงลำดับขั้นตอนได้อย่างถูกต้อง' },
              { key: 'reasoning', label: 'อธิบายเหตุผลของอัลกอริทึมได้' },
              { key: 'debugging', label: 'ตรวจสอบและแก้ไขจุดผิดพลาดด้วยตนเอง' },
              { key: 'teamwork', label: 'ทำงานร่วมและช่วยเหลือเพื่อนในห้อง' },
              { key: 'selfProblemSolving', label: 'มีความพยายามในการแก้ปัญหา' }
            ].map((item) => {
              const checked = (obs as any)[item.key];
              return (
                <button
                  type="button"
                  key={item.key}
                  onClick={() => toggleField(item.key as any)}
                  className={`w-full p-3 rounded-xl border text-xs font-semibold text-left transition flex items-center justify-between ${
                    checked
                      ? 'bg-indigo-600/30 border-cyan-400 text-cyan-200'
                      : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  <span>{item.label}</span>
                  <span>{checked ? '☑️' : '☐'}</span>
                </button>
              );
            })}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">หมายเหตุเพิ่มเติมเกี่ยวกับนักเรียน:</label>
            <textarea
              value={obs.notes || ''}
              onChange={(e) => setObs({ ...obs, notes: e.target.value })}
              placeholder="บันทึกข้อสังเกตเพิ่มเติมของคุณครู..."
              rows={3}
              className="w-full p-3 bg-slate-800 border border-slate-700 focus:border-cyan-400 rounded-xl text-xs text-white placeholder-slate-500 outline-none transition"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg"
          >
            <Save className="w-4 h-4" /> บันทึกการสังเกต
          </button>
          {saved && <div className="text-xs text-emerald-400 font-bold text-center">บันทึกข้อมูลสำเร็จ!</div>}
        </form>
      </div>
    </div>
  );
};
