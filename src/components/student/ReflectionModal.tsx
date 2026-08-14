import React, { useState } from 'react';
import { Send, Sparkles, HeartHandshake } from 'lucide-react';
import { sounds } from '../../utils/audio';

interface Props {
  onSubmit: (reflection: { learnedTopics: string[]; whatToDoIfError: string }) => void;
}

export const ReflectionModal: React.FC<Props> = ({ onSubmit }) => {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [errorPlan, setErrorPlan] = useState('');

  const topicsList = [
    'การเรียงลำดับขั้นตอน (Sequencing)',
    'การใช้คำสั่งทำซ้ำ (Loops)',
    'การแก้บั๊กจุดผิดพลาด (Debugging)',
    'การคิดแบบมีเงื่อนไข (Conditionals)',
    'การวางแผนเส้นทางสั้นที่สุด (Optimization)'
  ];

  const toggleTopic = (topic: string) => {
    sounds.playClick();
    setSelectedTopics(prev =>
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playSuccess();
    onSubmit({
      learnedTopics: selectedTopics,
      whatToDoIfError: errorPlan
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 p-6 sm:p-8 rounded-3xl max-w-lg w-full shadow-2xl text-white space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-amber-500/20 text-amber-300 rounded-full flex items-center justify-center mx-auto text-3xl border border-amber-500/40">
            🌟
          </div>
          <h2 className="text-xl font-black text-amber-300">สะท้อนความคิดการเรียนรู้ (Reflection)</h2>
          <p className="text-xs text-slate-400">วันนี้ฉันเรียนรู้อะไรจากภารกิจพิชิตอาณาจักรอัลกอริทึม?</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">
              1. สิ่งที่ฉันเข้าใจและได้เรียนรู้ในวันนี้ (เลือกได้หลายข้อ):
            </label>
            <div className="space-y-2">
              {topicsList.map((topic) => {
                const isChecked = selectedTopics.includes(topic);
                return (
                  <button
                    type="button"
                    key={topic}
                    onClick={() => toggleTopic(topic)}
                    className={`w-full p-3 rounded-xl border text-xs font-semibold text-left transition flex items-center gap-2 ${
                      isChecked
                        ? 'bg-indigo-600/40 border-cyan-400 text-cyan-200'
                        : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    <span>{isChecked ? '☑️' : '☐'}</span>
                    {topic}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              2. ถ้า Algorithm ของฉันทำงานผิดพลาด (เกิด Bug) ฉันจะทำอย่างไร?
            </label>
            <textarea
              value={errorPlan}
              onChange={(e) => setErrorPlan(e.target.value)}
              placeholder="เช่น หยุดดูคำสั่งทีละบรรทัด สังเกตทิศทางเลี้ยว แล้วแก้ไขจุดที่ผิด..."
              rows={3}
              required
              className="w-full p-3 bg-slate-800 border border-slate-700 focus:border-cyan-400 rounded-xl text-xs text-white placeholder-slate-500 outline-none transition"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-2xl shadow-lg transition flex items-center justify-center gap-2 text-sm"
          >
            <Sparkles className="w-4 h-4" />
            รับวุฒิบัตร ปรมาจารย์อัลกอริทึม
          </button>
        </form>
      </div>
    </div>
  );
};
