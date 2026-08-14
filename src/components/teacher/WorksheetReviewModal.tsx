import React, { useState } from 'react';
import { Student, Classroom, WorksheetSubmission } from '../../types';
import { WORKSHEETS } from '../../data/worksheets';
import { gradeWorksheetSubmission } from '../../firebase/db';
import { X, CheckCircle, FileText, Send } from 'lucide-react';
import { sounds } from '../../utils/audio';

interface Props {
  student: Student;
  classroom: Classroom;
  onClose: () => void;
}

export const WorksheetReviewModal: React.FC<Props> = ({
  student,
  classroom,
  onClose
}) => {
  const [selectedWsId, setSelectedWsId] = useState<number>(1);
  const currentSub: WorksheetSubmission | undefined = student.worksheets?.[selectedWsId];
  const wsDef = WORKSHEETS.find(w => w.id === selectedWsId) || WORKSHEETS[0];

  const [score, setScore] = useState<number>(currentSub?.score || 10);
  const [feedback, setFeedback] = useState<string>(currentSub?.feedback || '');
  const [saved, setSaved] = useState(false);

  const handleGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playSuccess();
    await gradeWorksheetSubmission(classroom.id, student.id, selectedWsId, Number(score), feedback);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 p-6 sm:p-8 rounded-3xl max-w-3xl w-full shadow-2xl text-white my-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <span className="text-xs font-bold text-amber-400 bg-amber-950/60 px-3 py-1 rounded-full border border-amber-800/50">
              📚 ตรวจใบงานดิจิทัล
            </span>
            <h2 className="text-xl font-black text-white mt-1">งานของ: {student.name}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Worksheet Selector Bar */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {WORKSHEETS.map((w) => {
            const hasSub = !!student.worksheets?.[w.id]?.completed;
            const isSelected = selectedWsId === w.id;
            return (
              <button
                key={w.id}
                onClick={() => {
                  setSelectedWsId(w.id);
                  setScore(student.worksheets?.[w.id]?.score || 10);
                  setFeedback(student.worksheets?.[w.id]?.feedback || '');
                  sounds.playClick();
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-cyan-400'
                    : hasSub
                    ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                ใบงานที่ {w.id} {hasSub ? '✓' : ''}
              </button>
            );
          })}
        </div>

        {/* Selected Worksheet Details & Student Answers */}
        <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-4">
          <div>
            <h3 className="text-base font-bold text-amber-300">{wsDef.title}</h3>
            <p className="text-xs text-slate-400">{wsDef.description}</p>
          </div>

          {!currentSub?.completed ? (
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-center text-xs text-slate-400">
              นักเรียนยังไม่ได้ส่งใบงานที่ {selectedWsId}
            </div>
          ) : (
            <div className="space-y-3">
              {wsDef.questions.map((q, idx) => (
                <div key={q.id} className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs space-y-1">
                  <span className="font-bold text-slate-300">{idx + 1}. {q.prompt}</span>
                  <div className="text-cyan-300 font-semibold p-2 bg-slate-950 rounded-lg border border-slate-800 mt-1">
                    คำตอบของนักเรียน: "{currentSub.answers?.[q.id] || 'ไม่มีคำตอบ'}"
                  </div>
                </div>
              ))}

              {/* Teacher Grading Form */}
              <form onSubmit={handleGrade} className="pt-4 border-t border-slate-800 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">ให้คะแนนใบงาน (เต็ม 10)</label>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      value={score}
                      onChange={(e) => setScore(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-xl text-xs text-amber-300 font-bold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">คำแนะนำ / ข้อเสนอแนะ</label>
                    <input
                      type="text"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="เช่น อธิบายขั้นตอนได้ดีมาก!"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-xl text-xs text-white outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-xl text-xs transition flex items-center justify-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" /> บันทึกผลการตรวจใบงาน
                </button>
                {saved && <div className="text-[11px] text-emerald-400 text-center font-bold">บันทึกเรียบร้อย!</div>}
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
