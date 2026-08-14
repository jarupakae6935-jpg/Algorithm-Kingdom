import React, { useState } from 'react';
import { WORLDS_INFO, GAME_LEVELS } from '../../data/gameData';
import { GameLevelDef, Student } from '../../types';
import { Lock, Star, CheckCircle, ChevronRight, Trophy, Sparkles } from 'lucide-react';
import { sounds } from '../../utils/audio';

interface Props {
  student: Student;
  allowedWorld?: number; // Teacher setting (1, 2, or 3)
  onSelectLevel: (level: GameLevelDef) => void;
}

export const GameMap: React.FC<Props> = ({
  student,
  allowedWorld = 3,
  onSelectLevel
}) => {
  const [selectedWorldTab, setSelectedWorldTab] = useState<number>(student.currentWorld || 1);

  const levelsInWorld = GAME_LEVELS.filter(l => l.world === selectedWorldTab);

  const getLevelProgress = (levelId: string) => {
    return student.levels?.[levelId];
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4">
      {/* World Selection Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {WORLDS_INFO.map((world) => {
          const isLockedByTeacher = world.id > allowedWorld;
          const isSelected = selectedWorldTab === world.id;

          return (
            <button
              key={world.id}
              onClick={() => {
                if (!isLockedByTeacher) {
                  setSelectedWorldTab(world.id);
                  sounds.playClick();
                }
              }}
              disabled={isLockedByTeacher}
              className={`p-5 rounded-3xl text-left transition-all relative overflow-hidden border-2 ${
                isLockedByTeacher
                  ? 'bg-slate-900/60 opacity-60 border-slate-800 cursor-not-allowed'
                  : isSelected
                  ? 'bg-gradient-to-br from-indigo-900/90 to-purple-900/90 border-cyan-400 shadow-xl shadow-indigo-500/20 scale-102'
                  : 'bg-slate-900/80 hover:bg-slate-800/90 border-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-3xl">{world.icon}</span>
                {isLockedByTeacher ? (
                  <span className="text-xs font-bold text-rose-400 bg-rose-950/60 px-2.5 py-1 rounded-full border border-rose-800/50 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> ล็อกโดยครู
                  </span>
                ) : (
                  <span className="text-xs font-bold text-cyan-300 bg-cyan-950/60 px-2.5 py-1 rounded-full border border-cyan-800/50">
                    World {world.id}
                  </span>
                )}
              </div>

              <h3 className="text-lg font-bold text-white mb-1">{world.title}</h3>
              <p className="text-xs text-slate-400 line-clamp-2">{world.description}</p>
            </button>
          );
        })}
      </div>

      {/* Selected World Levels Grid */}
      <div className="bg-slate-900/90 p-6 rounded-3xl border border-slate-800 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-xl font-bold text-amber-300 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              ด่านใน World {selectedWorldTab}
            </h2>
            <p className="text-xs text-slate-400">คลิกที่ด่านเพื่อเริ่มภารกิจคำสั่งอัลกอริทึม</p>
          </div>
          <span className="text-xs font-semibold text-slate-400 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
            {levelsInWorld.filter(l => student.levels?.[l.id]?.completed).length} / {levelsInWorld.length} ผ่านแล้ว
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {levelsInWorld.map((level) => {
            const prog = getLevelProgress(level.id);
            const isCompleted = prog?.completed;

            return (
              <div
                key={level.id}
                onClick={() => {
                  sounds.playClick();
                  onSelectLevel(level);
                }}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between group ${
                  isCompleted
                    ? 'bg-slate-800/90 hover:bg-slate-800 border-emerald-500/50 shadow-lg shadow-emerald-950/30'
                    : 'bg-slate-900/80 hover:bg-indigo-950/50 border-slate-700 hover:border-cyan-400/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-extrabold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                      ด่าน {level.id}
                    </span>
                    {isCompleted && (
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> ผ่านแล้ว
                      </span>
                    )}
                  </div>

                  <h4 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                    {level.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{level.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  {/* Stars earned */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3].map((starIdx) => (
                      <Star
                        key={starIdx}
                        className={`w-4 h-4 ${
                          prog && prog.stars >= starIdx
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-700'
                        }`}
                      />
                    ))}
                  </div>

                  <span className="text-xs font-bold text-cyan-400 flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                    เริ่มภารกิจ <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
