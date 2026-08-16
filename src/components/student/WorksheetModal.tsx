import React, { useState } from 'react';
import { WORKSHEETS } from '../../data/worksheets';
import { WorksheetSubmission } from '../../types';
import { X, Send, CheckCircle2, FileText, Save, Bookmark, Clock } from 'lucide-react';
import { sounds } from '../../utils/audio';

interface Props {
  worksheetId: number;
  currentSubmission?: WorksheetSubmission;
  onSubmit: (submission: WorksheetSubmission) => void;
  onClose: () => void;
}

export const WorksheetModal: React.FC<Props> = ({
  worksheetId,
  currentSubmission,
  onSubmit,
  onClose
}) => {
  const ws = WORKSHEETS.find(w => w.id === worksheetId) || WORKSHEETS[0];
  const [answers, setAnswers] = useState<Record<string, any>>(
    currentSubmission?.answers || {}
  );
  const [submitted, setSubmitted] = useState(!!currentSubmission?.completed);
  const [draftSavedToast, setDraftSavedToast] = useState(false);

  const answeredCount = Object.values(answers).filter(v => v !== undefined && v !== '').length;

  const handleInputChange = (qId: string, val: any) => {
    setAnswers(prev => ({ ...prev, [qId]: val }));
  };

  const handleSaveDraft = () => {
    sounds.playClick();
    const draftSubmission: WorksheetSubmission = {
      worksheetId: ws.id,
      answers,
      completed: false,
      status: 'draft',
      updatedAt: new Date().toISOString()
    };
    onSubmit(draftSubmission);
    setDraftSavedToast(true);
    setTimeout(() => setDraftSavedToast(false), 2500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playSuccess();
    const submission: WorksheetSubmission = {
      worksheetId: ws.id,
      answers,
      completed: true,
      status: currentSubmission?.status === 'graded' ? 'graded' : 'pending',
      updatedAt: new Date().toISOString()
    };
    if (currentSubmission?.score !== undefined) {
      submission.score = currentSubmission.score;
    }
    if (currentSubmission?.feedback !== undefined) {
      submission.feedback = currentSubmission.feedback;
    }
    setSubmitted(true);
    onSubmit(submission);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 p-6 sm:p-8 rounded-3xl max-w-xl w-full shadow-2xl text-white my-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-amber-300">{ws.title}</h2>
              <p className="text-xs text-slate-400">{ws.description}</p>
            </div>
          </div>
          <button
            onClick={() => {
              // Auto-save draft on close if student has answers but not submitted
              if (!submitted && answeredCount > 0) {
                handleSaveDraft();
              }
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status notice */}
        {submitted ? (
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            คุณได้ส่งใบงานนี้แล้ว! คุณครูสามารถเปิดตรวจคำตอบของนักเรียนได้
          </div>
        ) : answeredCount > 0 ? (
          <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-2xl text-amber-300 text-xs font-semibold flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              ตอบแล้ว {answeredCount} จาก {ws.questions.length} ข้อ (บันทึกงานค้างไว้ได้ตลอดเวลา)
            </span>
            <button
              type="button"
              onClick={handleSaveDraft}
              className="text-[11px] bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 font-black px-2.5 py-1 rounded-xl border border-amber-400/40 transition"
            >
              บันทึกแบบร่าง
            </button>
          </div>
        ) : null}

        {draftSavedToast && (
          <div className="p-3 bg-indigo-500/20 border border-indigo-500/40 rounded-2xl text-indigo-200 text-xs font-black flex items-center gap-2 animate-bounce">
            <Bookmark className="w-4 h-4 text-indigo-400" />
            💾 บันทึกงานค้างไว้เรียบร้อยแล้ว! สามารถปิดและกลับมาทำต่อเมื่อไหร่ก็ได้
          </div>
        )}

        {/* Questions Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {ws.questions.map((q, idx) => (
            <div key={q.id} className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-bold text-slate-200">
                  {idx + 1}. {q.prompt}
                </label>
                {answers[q.id] !== undefined && answers[q.id] !== '' && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md font-bold">
                    ตอบแล้ว
                  </span>
                )}
              </div>

              {q.options ? (
                <div className="space-y-2">
                  {q.options.map((opt, oIdx) => (
                    <label
                      key={oIdx}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-medium cursor-pointer transition ${
                        answers[q.id] === opt
                          ? 'bg-indigo-600/30 border-cyan-400 text-cyan-200'
                          : 'bg-slate-800 border-slate-700 hover:bg-slate-700/80 text-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={opt}
                        checked={answers[q.id] === opt}
                        onChange={(e) => handleInputChange(q.id, e.target.value)}
                        className="accent-cyan-400"
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              ) : (
                <textarea
                  value={answers[q.id] || ''}
                  onChange={(e) => handleInputChange(q.id, e.target.value)}
                  placeholder={q.hint || 'เขียนคำตอบของคุณที่นี่...'}
                  rows={3}
                  className="w-full p-3 bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-xl text-xs text-white placeholder-slate-500 outline-none transition"
                />
              )}
            </div>
          ))}

          {/* Action Buttons: Save Draft (งานค้าง) vs Final Submit */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-400/30 font-black rounded-2xl transition flex items-center justify-center gap-2 text-xs shadow-md"
            >
              <Save className="w-4 h-4 text-amber-400" />
              บันทึกงานค้างไว้ (แบบร่าง)
            </button>

            <button
              type="submit"
              className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-2xl shadow-lg transition flex items-center justify-center gap-2 text-xs"
            >
              <Send className="w-4 h-4" />
              {submitted ? 'อัปเดตการส่งใบงาน' : 'ส่งใบงานให้ครูตรวจ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
