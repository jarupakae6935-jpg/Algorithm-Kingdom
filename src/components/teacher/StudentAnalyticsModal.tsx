import React from 'react';
import { Student, Classroom } from '../../types';
import { GAME_LEVELS } from '../../data/gameData';
import { X, Award, FileText, Send, Star, CheckCircle, HelpCircle } from 'lucide-react';
import { sendTeacherFeedback } from '../../firebase/db';
import { sounds } from '../../utils/audio';

interface Props {
  student: Student;
  classroom: Classroom;
  onClose: () => void;
}

export const StudentAnalyticsModal: React.FC<Props> = ({
  student,
  classroom,
  onClose
}) => {
  const [feedbackMsg, setFeedbackMsg] = React.useState('');
  const [feedbackSent, setFeedbackSent] = React.useState(false);

  const handleSendFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackMsg.trim()) return;
    sounds.playSuccess();
    await sendTeacherFeedback(classroom.id, student.id, feedbackMsg.trim());
    setFeedbackMsg('');
    setFeedbackSent(true);
    setTimeout(() => setFeedbackSent(false), 2000);
  };

  const gain = student.learningGain;

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 p-6 sm:p-8 rounded-3xl max-w-2xl w-full shadow-2xl text-white my-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <span className="text-xs font-bold text-cyan-400 bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-800/50">
              รายงานการเรียนรู้รายบุคคล
            </span>
            <h2 className="text-xl font-black text-amber-300 mt-2">{student.name}</h2>
            <p className="text-xs text-slate-400">ห้องเรียน: {classroom.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700 text-center">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Pre-test</div>
            <div className="text-xl font-black text-white mt-0.5">{student.preTestScore ?? '-'} / 10</div>
          </div>
          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700 text-center">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Game Score</div>
            <div className="text-xl font-black text-amber-300 mt-0.5">{student.totalScore} / 360</div>
          </div>
          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700 text-center">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Post-test</div>
            <div className="text-xl font-black text-cyan-400 mt-0.5">{student.postTestScore ?? '-'} / 10</div>
          </div>
          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700 text-center">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Learning Gain</div>
            <div className="text-xl font-black text-emerald-400 mt-0.5">
              {gain !== undefined ? (gain >= 0 ? `+${gain}` : `${gain}`) : '-'}
            </div>
          </div>
        </div>

        {/* Level Breakdown Table */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            รายละเอียดผลงานทุกด่าน (Level Analytics)
          </h3>
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-x-auto p-2 max-h-48">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 border-b border-slate-800 text-[11px]">
                <tr>
                  <th className="p-2">ด่าน</th>
                  <th className="p-2">สถานะ</th>
                  <th className="p-2">คะแนน</th>
                  <th className="p-2">ดาว</th>
                  <th className="p-2">ลองทำ (ครั้ง)</th>
                  <th className="p-2">เวลา (วินาที)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {GAME_LEVELS.map((lvl) => {
                  const res = student.levels?.[lvl.id];
                  return (
                    <tr key={lvl.id} className="hover:bg-slate-900/60">
                      <td className="p-2 font-bold text-indigo-300">{lvl.id} - {lvl.title}</td>
                      <td className="p-2">
                        {res?.completed ? (
                          <span className="text-emerald-400 font-bold">✓ ผ่าน</span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="p-2 font-bold text-amber-300">{res?.score || 0}</td>
                      <td className="p-2">{res ? '⭐'.repeat(res.stars) : '-'}</td>
                      <td className="p-2">{res?.attempts || 0}</td>
                      <td className="p-2">{res?.time || 0}s</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Reflection Response */}
        {student.reflection && (
          <div className="bg-indigo-950/60 p-4 rounded-2xl border border-indigo-500/30 space-y-2 text-xs">
            <h4 className="font-bold text-amber-300">🌟 ผลการสะท้อนความคิด (Reflection):</h4>
            <p className="text-slate-200">หัวข้อที่เข้าใจ: {student.reflection.learnedTopics?.join(', ') || '-'}</p>
            <p className="text-slate-200">แผนการแก้เมื่อเจอ Bug: "{student.reflection.whatToDoIfError}"</p>
          </div>
        )}

        {/* Teacher Feedback Sender */}
        <form onSubmit={handleSendFeedback} className="space-y-2 pt-2 border-t border-slate-800">
          <label className="block text-xs font-bold text-slate-300">
            ส่งข้อความ Feedback / คำแนะนำไปยังนักเรียน
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={feedbackMsg}
              onChange={(e) => setFeedbackMsg(e.target.value)}
              placeholder="เช่น ลองตรวจสอบคำสั่งที่ 4 อีกครั้งนะครับ..."
              className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 focus:border-cyan-400 rounded-xl text-xs text-white placeholder-slate-500 outline-none transition"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shrink-0"
            >
              <Send className="w-3.5 h-3.5" /> ส่งข้อความ
            </button>
          </div>
          {feedbackSent && (
            <div className="text-[11px] text-emerald-400 font-semibold">ส่งข้อความถึงนักเรียนเรียบร้อยแล้ว!</div>
          )}
        </form>
      </div>
    </div>
  );
};
