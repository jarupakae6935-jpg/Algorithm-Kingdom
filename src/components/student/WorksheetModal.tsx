import React, { useState } from 'react';
import { WORKSHEETS } from '../../data/worksheets';
import { WorksheetSubmission } from '../../types';
import { X, Send, CheckCircle2, FileText, HelpCircle } from 'lucide-react';
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

  const handleInputChange = (qId: string, val: any) => {
    setAnswers(prev => ({ ...prev, [qId]: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playSuccess();
    const submission: WorksheetSubmission = {
      worksheetId: ws.id,
      answers,
      completed: true,
      status: currentSubmission?.status || 'pending',
      updatedAt: new Date().toISOString()
    };
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
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status notice */}
        {submitted && (
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            คุณได้ส่งใบงานนี้แล้ว! คุณครูสามารถเปิดตรวจคำตอบของนักเรียนได้
          </div>
        )}

        {/* Questions Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {ws.questions.map((q, idx) => (
            <div key={q.id} className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700 space-y-3">
              <label className="block text-sm font-bold text-slate-200">
                {idx + 1}. {q.prompt}
              </label>

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

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-2xl shadow-lg transition flex items-center justify-center gap-2 text-sm"
          >
            <Send className="w-4 h-4" />
            บันทึกและส่งใบงาน
          </button>
        </form>
      </div>
    </div>
  );
};
