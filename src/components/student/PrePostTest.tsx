import React, { useState } from 'react';
import { PRE_TEST_QUESTIONS, POST_TEST_QUESTIONS } from '../../data/assessments';
import { TestQuestion } from '../../types';
import { CheckCircle2, AlertCircle, ArrowRight, Award } from 'lucide-react';
import { sounds } from '../../utils/audio';

interface Props {
  type: 'pretest' | 'posttest';
  currentScore?: number;
  onComplete: (score: number) => void;
  onBackToMap?: () => void;
}

export const PrePostTest: React.FC<Props> = ({ type, currentScore, onComplete, onBackToMap }) => {
  const questions: TestQuestion[] = type === 'pretest' ? PRE_TEST_QUESTIONS : POST_TEST_QUESTIONS;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [finalScore, setFinalScore] = useState(currentScore ?? 0);
  const [isRetaking, setIsRetaking] = useState(false);

  const hasPreviousScore = currentScore !== undefined && !isRetaking;
  const currentQ = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;

  const handleSelectOption = (optIdx: number) => {
    sounds.playClick();
    setSelectedAnswers(prev => ({ ...prev, [currentQ.id]: optIdx }));
  };

  const handleNext = () => {
    sounds.playClick();
    if (!isLast) {
      setCurrentIndex(i => i + 1);
    } else {
      // Calculate score
      let correctCount = 0;
      questions.forEach((q) => {
        if (selectedAnswers[q.id] === q.correctIndex) {
          correctCount++;
        }
      });

      // Normalize to 10 points
      const normalizedScore = type === 'pretest' ? correctCount * 2 : correctCount;
      setFinalScore(normalizedScore);
      setIsFinished(true);
      sounds.playSuccess();
      // Immediately trigger save to Cloud Firestore & Local State
      onComplete(normalizedScore);
    }
  };

  // If already taken previously and not currently retaking
  if (hasPreviousScore && !isFinished) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-white border-b-4 border-indigo-100 rounded-3xl shadow-xl text-slate-800 text-center space-y-6 animate-fade-in">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto text-4xl border-2 border-emerald-200">
          ✅
        </div>
        <div>
          <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            {type === 'pretest' ? 'แบบทดสอบก่อนเรียน (Pre-test)' : 'แบบทดสอบหลังเรียน (Post-test)'}
          </span>
          <h2 className="text-2xl font-black text-indigo-900 mt-3">
            คุณได้ทำแบบทดสอบนี้เรียบร้อยแล้ว
          </h2>
          <p className="text-xs font-bold text-slate-400 mt-1">คะแนนถูกบันทึกลงในระบบของคุณครูเรียบร้อยแล้ว</p>
        </div>

        <div className="bg-indigo-50/60 p-6 rounded-3xl border-2 border-indigo-100 max-w-sm mx-auto space-y-2">
          <div className="text-xs font-extrabold text-slate-500 uppercase">คะแนนที่ได้</div>
          <div className="text-4xl font-black text-emerald-600">
            {currentScore} <span className="text-lg text-slate-400 font-bold">/ 10</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2 max-w-sm mx-auto">
          {onBackToMap && (
            <button
              onClick={onBackToMap}
              className="flex-1 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-md transition text-xs"
            >
              🎮 ไปยังแผนที่ภารกิจ
            </button>
          )}
          <button
            onClick={() => {
              sounds.playClick();
              setSelectedAnswers({});
              setCurrentIndex(0);
              setIsRetaking(true);
            }}
            className="flex-1 px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-2xl border border-slate-200 transition text-xs"
          >
            🔄 ทำแบบทดสอบใหม่
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white border-b-4 border-indigo-100 rounded-3xl shadow-xl text-slate-800">
      {!isFinished ? (
        <div className="space-y-6">
          {/* Progress Header */}
          <div className="flex items-center justify-between border-b-2 border-slate-100 pb-4">
            <div>
              <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                {type === 'pretest' ? 'แบบทดสอบก่อนเรียน (Pre-test)' : 'แบบทดสอบหลังเรียน (Post-test)'}
              </span>
              <h2 className="text-xl font-black text-indigo-900 mt-2">
                ข้อที่ {currentIndex + 1} จาก {questions.length}
              </h2>
            </div>
            <div className="text-sm font-black text-slate-400">
              {Math.round(((currentIndex + 1) / questions.length) * 100)}%
            </div>
          </div>

          {/* Question Prompt */}
          <div className="bg-slate-50 p-5 rounded-2xl border-2 border-slate-200 text-base font-extrabold text-slate-800">
            {currentQ.question}
          </div>

          {/* Options */}
          <div className="space-y-3">
            {currentQ.options.map((opt, idx) => {
              const isSelected = selectedAnswers[currentQ.id] === idx;
              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  className={`w-full p-4 rounded-2xl text-left text-sm font-extrabold transition-all flex items-center justify-between border-2 ${
                    isSelected
                      ? 'bg-indigo-50 border-indigo-600 text-indigo-900 shadow-sm'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                      isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    {opt}
                  </span>
                  {isSelected && <CheckCircle2 className="w-5 h-5 text-indigo-600" />}
                </button>
              );
            })}
          </div>

          {/* Next Button */}
          <button
            onClick={handleNext}
            disabled={selectedAnswers[currentQ.id] === undefined}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-98 disabled:opacity-40 text-white font-black rounded-2xl transition flex items-center justify-center gap-2 text-base shadow-md"
          >
            {isLast ? 'ส่งแบบทดสอบ' : 'ข้อถัดไป'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      ) : (
        /* Test Completion Screen */
        <div className="text-center space-y-6 py-6 animate-fade-in">
          <div className="w-20 h-20 bg-yellow-100 text-yellow-700 rounded-full flex items-center justify-center mx-auto text-4xl border-2 border-yellow-200">
            🏆
          </div>
          <div>
            <h2 className="text-2xl font-black text-indigo-900">
              ทำแบบทดสอบ{type === 'pretest' ? 'ก่อนเรียน' : 'หลังเรียน'}เสร็จสิ้น!
            </h2>
            <p className="text-xs font-bold text-slate-400 mt-1">คะแนนของคุณถูกบันทึกลงสู่ระบบเรียบร้อยแล้ว</p>
          </div>

          <div className="bg-indigo-50/60 p-6 rounded-3xl border-2 border-indigo-100 max-w-sm mx-auto space-y-2">
            <div className="text-xs font-extrabold text-slate-500 uppercase">คะแนนที่ได้</div>
            <div className="text-4xl font-black text-indigo-600">
              {finalScore} <span className="text-lg text-slate-400 font-bold">/ 10</span>
            </div>
          </div>

          <button
            onClick={() => {
              if (onBackToMap) onBackToMap();
              else onComplete(finalScore);
            }}
            className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-md transition text-xs"
          >
            🎮 เข้าสู่ภารกิจ (ไปยังแผนที่)
          </button>
        </div>
      )}
    </div>
  );
};
