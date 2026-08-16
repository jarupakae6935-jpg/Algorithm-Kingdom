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
  // Helper to safely get worksheet submission
  const getSub = (wsId: number): WorksheetSubmission | undefined => {
    return student.worksheets?.[wsId] || (student.worksheets as any)?.[String(wsId)];
  };

  // Find first submitted or drafted worksheet to default to what needs review
  const firstActiveWsId = React.useMemo(() => {
    for (const w of WORKSHEETS) {
      const sub = student.worksheets?.[w.id] || (student.worksheets as any)?.[String(w.id)];
      if (sub && (sub.completed || Object.keys(sub.answers || {}).length > 0)) {
        return w.id;
      }
    }
    return 1;
  }, [student.worksheets]);

  const [selectedWsId, setSelectedWsId] = useState<number>(firstActiveWsId);
  const currentSub: WorksheetSubmission | undefined = getSub(selectedWsId);
  const wsDef = WORKSHEETS.find(w => w.id === selectedWsId) || WORKSHEETS[0];

  const [score, setScore] = useState<number>(currentSub?.score ?? 10);
  const [feedback, setFeedback] = useState<string>(currentSub?.feedback || '');
  const [saved, setSaved] = useState(false);

  // Sync state whenever selected worksheet or student props update
  React.useEffect(() => {
    const sub = getSub(selectedWsId);
    setScore(sub?.score ?? 10);
    setFeedback(sub?.feedback || '');
  }, [selectedWsId, student.worksheets]);

  const allWorksheets = Object.values(student.worksheets || {}) as WorksheetSubmission[];
  const totalSubmitted = allWorksheets.filter(w => w && (w.completed || w.status === 'pending' || w.status === 'graded')).length;
  const totalDraft = allWorksheets.filter(w => w && !w.completed && (w.status === 'draft' || Object.keys(w.answers || {}).length > 0)).length;
  const totalGraded = allWorksheets.filter(w => w && w.status === 'graded').length;

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
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-amber-400 bg-amber-950/60 px-3 py-1 rounded-full border border-amber-800/50">
                📚 ตรวจใบงานดิจิทัล
              </span>
              <span className="text-[11px] font-black text-emerald-300 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800/50">
                ✓ ส่งแล้ว {totalSubmitted} ใบ
              </span>
              {totalDraft > 0 && (
                <span className="text-[11px] font-black text-amber-300 bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-800/50">
                  ✎ งานค้าง {totalDraft} ใบ
                </span>
              )}
              {totalGraded > 0 && (
                <span className="text-[11px] font-black text-cyan-300 bg-cyan-950/60 px-2.5 py-0.5 rounded-full border border-cyan-800/50">
                  ★ ตรวจแล้ว {totalGraded} ใบ
                </span>
              )}
            </div>
            <h2 className="text-xl font-black text-white mt-1">งานของ: {student.name}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Worksheet Selector Bar */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {WORKSHEETS.map((w) => {
            const sub = getSub(w.id);
            const hasCompleted = !!sub?.completed;
            const hasDraft = !hasCompleted && Object.keys(sub?.answers || {}).length > 0;
            const isSelected = selectedWsId === w.id;
            return (
              <button
                key={w.id}
                onClick={() => {
                  setSelectedWsId(w.id);
                  setScore(sub?.score || 10);
                  setFeedback(sub?.feedback || '');
                  sounds.playClick();
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-cyan-400'
                    : hasCompleted
                    ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50'
                    : hasDraft
                    ? 'bg-amber-950/40 text-amber-300 border-amber-800/50'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                ใบงานที่ {w.id} {hasCompleted ? '✓' : hasDraft ? '✎' : ''}
              </button>
            );
          })}
        </div>

        {/* Selected Worksheet Details & Student Answers */}
        <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-amber-300">{wsDef.title}</h3>
              <p className="text-xs text-slate-400">{wsDef.description}</p>
            </div>
            {currentSub?.completed ? (
              <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full font-black">
                🟢 ส่งใบงานแล้ว
              </span>
            ) : Object.keys(currentSub?.answers || {}).length > 0 ? (
              <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-full font-black">
                🟡 มีงานค้างไว้ (แบบร่าง {Object.keys(currentSub?.answers || {}).length} ข้อ)
              </span>
            ) : (
              <span className="text-xs bg-slate-800 text-slate-400 border border-slate-700 px-3 py-1 rounded-full font-black">
                ⚪ ยังไม่เริ่มทำ
              </span>
            )}
          </div>

          {!currentSub || Object.keys(currentSub.answers || {}).length === 0 ? (
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl text-center text-xs text-slate-400">
              นักเรียนยังไม่ได้เริ่มทำใบงานที่ {selectedWsId}
            </div>
          ) : (
            <div className="space-y-3">
              {wsDef.questions.map((q, idx) => {
                const ans = currentSub.answers?.[q.id];
                return (
                  <div key={q.id} className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs space-y-1">
                    <span className="font-bold text-slate-300">{idx + 1}. {q.prompt}</span>
                    <div className={`font-semibold p-2.5 rounded-lg border mt-1 ${
                      ans !== undefined && ans !== ''
                        ? 'bg-slate-950 text-cyan-300 border-slate-800'
                        : 'bg-slate-950/50 text-slate-500 border-dashed border-slate-800 italic'
                    }`}>
                      {ans !== undefined && ans !== '' ? `คำตอบของนักเรียน: "${ans}"` : '(ยังไม่ได้ตอบข้อนี้)'}
                    </div>
                  </div>
                );
              })}

              {/* Teacher Grading Form */}
              <form onSubmit={handleGrade} className="pt-4 border-t border-slate-800 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      {currentSub.completed ? 'ให้คะแนนใบงาน (เต็ม 10)' : 'ให้คะแนน/ประเมินเบื้องต้น (เต็ม 10)'}
                    </label>
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
                    <label className="block text-xs font-bold text-slate-300 mb-1">คำแนะนำ / ข้อเสนอแนะให้นักเรียน</label>
                    <input
                      type="text"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="เช่น ทำได้ดีมาก หรือ อย่าลืมทำข้อ 3 ให้ครบนะ"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-xl text-xs text-white outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-xl text-xs transition flex items-center justify-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" /> บันทึกผลการตรวจ/ข้อเสนอแนะ
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
