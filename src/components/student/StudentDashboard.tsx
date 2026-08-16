import React, { useState, useEffect } from 'react';
import { Classroom, Student, LevelResult, WorksheetSubmission, CommandType } from '../../types';
import { subscribeToClassroom, subscribeToStudent, saveStudentLevelResult, saveAssessmentResult, saveWorksheetSubmission, saveStudentReflection, saveStudentLevelDraft } from '../../firebase/db';
import { GAME_LEVELS } from '../../data/gameData';
import { GameMap } from '../game/GameMap';
import { AlgorithmEngine } from '../game/AlgorithmEngine';
import { PrePostTest } from './PrePostTest';
import { WorksheetModal } from './WorksheetModal';
import { ReflectionModal } from './ReflectionModal';
import { CertificateModal } from './CertificateModal';
import { GameLevelDef } from '../../types';
import { Trophy, Star, FileText, Award, Bell, Sparkles, CheckCircle2, MessageSquare, ShieldAlert, Clock, Save } from 'lucide-react';
import { sounds } from '../../utils/audio';

interface Props {
  initialClassroom: Classroom;
  initialStudent: Student;
  onLeaveClassroom: () => void;
}

export const StudentDashboard: React.FC<Props> = ({
  initialClassroom,
  initialStudent,
  onLeaveClassroom
}) => {
  const [classroom, setClassroom] = useState<Classroom>(initialClassroom);
  const [student, setStudent] = useState<Student>(initialStudent);
  const [activeTab, setActiveTab] = useState<'map' | 'worksheets' | 'pretest' | 'posttest'>('map');
  const [selectedLevel, setSelectedLevel] = useState<GameLevelDef | null>(null);
  const [selectedWorksheetId, setSelectedWorksheetId] = useState<number | null>(null);
  const [showReflectionModal, setShowReflectionModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  // Subscribe to Classroom changes (e.g. locked worlds, announcements, pause)
  useEffect(() => {
    const unsub = subscribeToClassroom(classroom.id, (updatedRoom) => {
      if (updatedRoom) {
        setClassroom(updatedRoom);
      }
    });
    return () => unsub();
  }, [classroom.id]);

  // Subscribe to Student document changes (e.g. graded worksheets, teacher feedbacks, real-time score updates)
  useEffect(() => {
    const unsub = subscribeToStudent(classroom.id, student.id, (updatedStudent) => {
      if (updatedStudent) {
        setStudent(updatedStudent);
      }
    });
    return () => unsub();
  }, [classroom.id, student.id]);

  // Handle level completion from Game Engine
  const handleLevelComplete = async (res: LevelResult) => {
    // Update local state first
    const updatedLevels = { ...student.levels, [res.levelId]: res };
    let total = 0;
    let count = 0;
    for (const lid in updatedLevels) {
      if (updatedLevels[lid].completed) {
        total += updatedLevels[lid].score;
        count++;
      }
    }
    const progress = Math.min(100, Math.round((count / 12) * 100));

    const updatedStudent: Student = {
      ...student,
      levels: updatedLevels,
      totalScore: total,
      completedLevelsCount: count,
      progressPercentage: progress
    };
    setStudent(updatedStudent);
    setSelectedLevel(null);

    // Save to database
    await saveStudentLevelResult(classroom.id, student.id, res);
  };

  // Handle saving level draft commands
  const handleSaveLevelDraft = async (levelId: string, commands: CommandType[]) => {
    const updatedDrafts = { ...(student.draftLevels || {}), [levelId]: commands };
    setStudent(prev => ({ ...prev, draftLevels: updatedDrafts }));
    await saveStudentLevelDraft(classroom.id, student.id, levelId, commands);
  };

  // Handle Pre/Post Test complete
  const handleAssessmentComplete = async (type: 'pretest' | 'posttest', score: number) => {
    let pre = type === 'pretest' ? score : student.preTestScore;
    let post = type === 'posttest' ? score : student.postTestScore;

    const gain = post !== undefined && pre !== undefined ? post - pre : undefined;

    setStudent(prev => ({
      ...prev,
      preTestScore: pre,
      postTestScore: post,
      learningGain: gain,
      assessments: {
        ...(prev.assessments || {}),
        [type === 'pretest' ? 'preTestScore' : 'postTestScore']: score,
        [type === 'pretest' ? 'preTestCompletedAt' : 'postTestCompletedAt']: new Date().toISOString()
      }
    }));

    await saveAssessmentResult(classroom.id, student.id, type, score);
  };

  // Handle Worksheet Submission (Draft or Final)
  const handleWorksheetSubmit = async (sub: WorksheetSubmission) => {
    const updated = { ...student.worksheets, [sub.worksheetId]: sub };
    setStudent(prev => ({ ...prev, worksheets: updated }));
    if (sub.completed) {
      setSelectedWorksheetId(null);
    }
    await saveWorksheetSubmission(classroom.id, student.id, sub);
  };

  // Handle Reflection & Cert
  const handleReflectionSubmit = async (ref: { learnedTopics: string[]; whatToDoIfError: string }) => {
    const certId = await saveStudentReflection(classroom.id, student.id, ref);
    setStudent(prev => ({
      ...prev,
      reflection: { ...ref, completedAt: new Date().toISOString() },
      certificateId: certId
    }));
    setShowReflectionModal(false);
    setShowCertificateModal(true);
  };

  // Check Badges
  const getBadges = () => {
    const badges = [];
    if (student.completedLevelsCount >= 1) badges.push({ name: '🥉 นักคิดฝึกหัด', icon: '🥉' });
    if (student.completedLevelsCount >= 6) badges.push({ name: '🥈 นักสร้าง Algorithm', icon: '🥈' });
    if (student.completedLevelsCount >= 12) badges.push({ name: '🥇 นักคิดเชิงคำนวณ', icon: '🥇' });
    if (student.levels?.['2.3']?.completed) badges.push({ name: '🐞 นักล่า Bug', icon: '🐞' });
    if (student.totalScore >= 250) badges.push({ name: '⚡ นักคิดไว', icon: '⚡' });
    if (student.postTestScore && student.postTestScore >= 8) badges.push({ name: '👑 ปรมาจารย์ Algorithm', icon: '👑' });
    return badges;
  };

  // World progress percentages
  const getWorldProgress = (worldNum: number) => {
    const worldLevels = GAME_LEVELS.filter(l => l.world === worldNum);
    const done = worldLevels.filter(l => student.levels?.[l.id]?.completed).length;
    return Math.round((done / worldLevels.length) * 100);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Classroom Status Pause Notice */}
      {classroom.settings?.isPaused && (
        <div className="bg-amber-500/20 border-2 border-amber-500 p-4 rounded-2xl text-center text-amber-200 font-bold text-sm flex items-center justify-center gap-2 animate-pulse">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
          คุณครูกำลังกดพักเกมชั่วคราว (Pause) สำหรับการอธิบายบทเรียนในชั้นเรียน
        </div>
      )}

      {/* Announcements Banner */}
      {classroom.announcements && classroom.announcements.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-3xl flex items-start gap-3 shadow-sm text-amber-900">
          <Bell className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <span className="font-black text-amber-900">📢 ประกาศจากคุณครู: {classroom.announcements[0].title}</span>
            <p className="text-amber-800 font-bold">{classroom.announcements[0].message}</p>
          </div>
        </div>
      )}

      {/* Teacher Feedback Alert */}
      {student.feedbacks && student.feedbacks.length > 0 && (
        <div className="bg-emerald-50 border-2 border-emerald-200 p-4 rounded-3xl flex items-start gap-3 shadow-sm text-emerald-900">
          <MessageSquare className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <span className="font-black text-emerald-900">📩 ข้อความจากคุณครู:</span>
            <p className="text-emerald-800 font-bold">{student.feedbacks[student.feedbacks.length - 1].message}</p>
          </div>
        </div>
      )}

      {/* Student Profile Header Bar */}
      <div className="bg-white border-b-4 border-indigo-100 p-6 rounded-3xl shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-3xl shadow-md text-white transform rotate-2">
            👧
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-indigo-900">{student.name}</h2>
              <span className="text-xs bg-indigo-100 text-indigo-700 font-extrabold px-3 py-1 rounded-full border border-indigo-200">
                {classroom.name}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 font-bold mt-1">
              <span>คะแนนเกมรวม: <strong className="text-indigo-600 font-black">{student.totalScore} / 360</strong></span>
              <span>•</span>
              <span>ผ่านแล้ว: <strong className="text-emerald-600 font-black">{student.completedLevelsCount} / 12 ด่าน</strong></span>
            </div>
          </div>
        </div>

        {/* Action Badges & Cert */}
        <div className="flex items-center gap-3">
          {student.completedLevelsCount >= 12 && (
            <button
              onClick={() => {
                if (student.certificateId) setShowCertificateModal(true);
                else setShowReflectionModal(true);
              }}
              className="px-4 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-black rounded-2xl text-xs transition shadow-md flex items-center gap-1.5"
            >
              <Award className="w-4 h-4" />
              {student.certificateId ? 'ดูวุฒิบัตร' : 'ทำ Reflection รับวุฒิบัตร'}
            </button>
          )}

          <button
            onClick={onLeaveClassroom}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-2xl transition border border-slate-200"
          >
            ออกจากห้อง
          </button>
        </div>
      </div>

      {/* World Progress Bars */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((w) => {
          const pct = getWorldProgress(w);
          return (
            <div key={w} className="bg-white p-4 rounded-3xl border-b-4 border-slate-200 space-y-2 shadow-sm">
              <div className="flex justify-between text-xs font-black">
                <span className="text-slate-700">World {w}</span>
                <span className="text-indigo-600">{pct}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b-2 border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => { setActiveTab('map'); setSelectedLevel(null); }}
          className={`px-4 py-2.5 rounded-2xl font-black text-xs transition flex items-center gap-1.5 ${
            activeTab === 'map'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white border-2 border-slate-200 text-slate-600 hover:bg-indigo-50'
          }`}
        >
          🎮 แผนที่ภารกิจ (Game Map)
        </button>

        <button
          onClick={() => setActiveTab('pretest')}
          className={`px-4 py-2.5 rounded-2xl font-black text-xs transition flex items-center gap-1.5 ${
            activeTab === 'pretest'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white border-2 border-slate-200 text-slate-600 hover:bg-indigo-50'
          }`}
        >
          📝 Pre-test
          {student.preTestScore !== undefined && (
            <span className="ml-1 text-[10px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded-full">
              {student.preTestScore}/10
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('worksheets')}
          className={`px-4 py-2.5 rounded-2xl font-black text-xs transition flex items-center gap-1.5 ${
            activeTab === 'worksheets'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white border-2 border-slate-200 text-slate-600 hover:bg-indigo-50'
          }`}
        >
          📚 ใบงานดิจิทัล (13 ใบงาน)
        </button>

        <button
          onClick={() => setActiveTab('posttest')}
          className={`px-4 py-2.5 rounded-2xl font-black text-xs transition flex items-center gap-1.5 ${
            activeTab === 'posttest'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white border-2 border-slate-200 text-slate-600 hover:bg-indigo-50'
          }`}
        >
          🏆 Post-test
          {student.postTestScore !== undefined && (
            <span className="ml-1 text-[10px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded-full">
              {student.postTestScore}/10
            </span>
          )}
        </button>
      </div>

      {/* Active Tab View Rendering */}
      {selectedLevel ? (
        <AlgorithmEngine
          level={selectedLevel}
          initialDraftCommands={student.draftLevels?.[selectedLevel.id]}
          onSaveDraft={(cmds) => handleSaveLevelDraft(selectedLevel.id, cmds)}
          onLevelComplete={handleLevelComplete}
          onBackToMap={() => setSelectedLevel(null)}
          maxHearts={classroom.settings?.maxHearts || 3}
        />
      ) : activeTab === 'map' ? (
        <GameMap
          student={student}
          allowedWorld={classroom.settings?.allowedWorld || 3}
          onSelectLevel={(lvl) => setSelectedLevel(lvl)}
        />
      ) : activeTab === 'pretest' ? (
        <PrePostTest
          type="pretest"
          currentScore={student.preTestScore ?? student.assessments?.preTestScore}
          onComplete={(sc) => handleAssessmentComplete('pretest', sc)}
          onBackToMap={() => setActiveTab('map')}
        />
      ) : activeTab === 'posttest' ? (
        <PrePostTest
          type="posttest"
          currentScore={student.postTestScore ?? student.assessments?.postTestScore}
          onComplete={(sc) => handleAssessmentComplete('posttest', sc)}
          onBackToMap={() => setActiveTab('map')}
        />
      ) : activeTab === 'worksheets' ? (
        <div className="bg-white p-6 rounded-3xl border-b-4 border-slate-200 space-y-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-black text-indigo-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                ใบงานดิจิทัลประจำบทเรียน (13 ใบงาน)
              </h3>
              <p className="text-xs font-bold text-slate-400 mt-0.5">
                นักเรียนสามารถตอบคำถามและกดบันทึกงานค้างไว้ (แบบร่าง) เพื่อกลับมาทำต่อภายหลังได้
              </p>
            </div>

            {/* Quick Worksheet Stats */}
            <div className="flex items-center gap-2 text-xs font-black">
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-xl">
                🟢 ส่งแล้ว: {(Object.values(student.worksheets || {}) as WorksheetSubmission[]).filter(w => w.completed).length}
              </span>
              <span className="bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-xl">
                🟡 งานค้าง (แบบร่าง): {(Object.values(student.worksheets || {}) as WorksheetSubmission[]).filter(w => !w.completed && Object.keys(w.answers || {}).length > 0).length}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 13 }).map((_, idx) => {
              const wsId = idx + 1;
              const sub = student.worksheets?.[wsId];
              const isCompleted = !!sub?.completed;
              const answeredCount = Object.keys(sub?.answers || {}).length;
              const isDraft = !isCompleted && answeredCount > 0;

              return (
                <div
                  key={wsId}
                  onClick={() => {
                    sounds.playClick();
                    setSelectedWorksheetId(wsId);
                  }}
                  className={`p-4 rounded-2xl cursor-pointer transition flex items-center justify-between border-2 ${
                    isCompleted
                      ? 'bg-emerald-50/40 hover:bg-emerald-50 border-emerald-200 hover:border-emerald-400'
                      : isDraft
                      ? 'bg-amber-50/50 hover:bg-amber-50 border-amber-300 hover:border-amber-400'
                      : 'bg-slate-50 hover:bg-indigo-50/50 border-slate-200 hover:border-indigo-400'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-slate-800">ใบงานที่ {wsId}</h4>
                      {isDraft && (
                        <span className="text-[10px] bg-amber-200 text-amber-900 font-extrabold px-1.5 py-0.5 rounded-md">
                          มีงานค้าง
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-slate-400">
                      {isCompleted
                        ? sub?.score !== undefined
                          ? `คะแนนที่ได้: ${sub.score}/10`
                          : 'ส่งแล้ว (รอครูตรวจ)'
                        : isDraft
                        ? `บันทึกไว้แล้ว (${answeredCount} ข้อ)`
                        : 'ยังไม่ได้เริ่มทำ'}
                    </p>
                  </div>

                  {isCompleted ? (
                    <span className="text-xs text-emerald-700 font-black bg-emerald-100 px-3 py-1 rounded-xl border border-emerald-300">
                      {sub.score !== undefined ? `${sub.score}/10` : '✓ ส่งแล้ว'}
                    </span>
                  ) : isDraft ? (
                    <span className="text-xs text-amber-800 bg-amber-100 hover:bg-amber-200 font-black px-3 py-1 rounded-xl border border-amber-300 flex items-center gap-1">
                      ทำต่อ ✎
                    </span>
                  ) : (
                    <span className="text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 font-black px-3 py-1 rounded-xl border border-indigo-200">
                      เริ่มทำ ➔
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Worksheet Modal */}
      {selectedWorksheetId && (
        <WorksheetModal
          worksheetId={selectedWorksheetId}
          currentSubmission={student.worksheets?.[selectedWorksheetId]}
          onSubmit={handleWorksheetSubmit}
          onClose={() => setSelectedWorksheetId(null)}
        />
      )}

      {/* Reflection Modal */}
      {showReflectionModal && (
        <ReflectionModal onSubmit={handleReflectionSubmit} />
      )}

      {/* Certificate Modal */}
      {showCertificateModal && student.certificateId && (
        <CertificateModal
          student={student}
          classroom={classroom}
          certificateId={student.certificateId}
          onClose={() => setShowCertificateModal(false)}
        />
      )}
    </div>
  );
};
