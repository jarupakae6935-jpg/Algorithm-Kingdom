import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { GameLevelDef, CommandType, Direction, GridCell, LevelResult } from '../../types';
import { sounds } from '../../utils/audio';
import { Play, RotateCcw, HelpCircle, StepForward, CheckCircle2, ShieldAlert, Sparkles, Bug } from 'lucide-react';

interface Props {
  level: GameLevelDef;
  onLevelComplete: (result: LevelResult) => void;
  onBackToMap: () => void;
  maxHearts?: number;
}

interface RobotState {
  x: number;
  y: number;
  dir: Direction;
  collectedItemsCount: number;
}

export const AlgorithmEngine: React.FC<Props> = ({
  level,
  onLevelComplete,
  onBackToMap,
  maxHearts = 3
}) => {
  // Command sequence workspace
  const [commands, setCommands] = useState<CommandType[]>(
    level.initialBuggyCommands ? [...level.initialBuggyCommands] : []
  );

  // Execution state
  const [robot, setRobot] = useState<RobotState>({
    x: level.startPos.x,
    y: level.startPos.y,
    dir: level.startPos.dir,
    collectedItemsCount: 0
  });

  const [gridItems, setGridItems] = useState<GridCell[]>(level.grid);
  const [isRunning, setIsRunning] = useState(false);
  const [activeCommandIndex, setActiveCommandIndex] = useState<number | null>(null);
  const [hearts, setHearts] = useState(maxHearts);
  const [hintUsed, setHintUsed] = useState(false);
  const [showHintModal, setShowHintModal] = useState(false);
  const [debugMode, setDebugMode] = useState(!!level.initialBuggyCommands);
  const [userDebugged, setUserDebugged] = useState(false);
  const [attempts, setAttempts] = useState(1);
  const [timeSpent, setTimeSpent] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [levelFinished, setLevelFinished] = useState(false);

  const timerRef = useRef<any>(null);

  // Timer loop
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeSpent(t => t + 1);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // Reset level to initial position
  const resetRobot = () => {
    setIsRunning(false);
    setActiveCommandIndex(null);
    setRobot({
      x: level.startPos.x,
      y: level.startPos.y,
      dir: level.startPos.dir,
      collectedItemsCount: 0
    });
    setGridItems(level.grid.map(cell => ({ ...cell, itemCollected: false })));
    setStatusMessage(null);
  };

  // Command management
  const addCommand = (cmd: CommandType) => {
    if (isRunning || levelFinished) return;
    sounds.playClick();
    setCommands(prev => [...prev, cmd]);
    if (level.initialBuggyCommands) setUserDebugged(true);
  };

  const removeCommand = (index: number) => {
    if (isRunning || levelFinished) return;
    sounds.playClick();
    setCommands(prev => prev.filter((_, i) => i !== index));
    if (level.initialBuggyCommands) setUserDebugged(true);
  };

  const clearAllCommands = () => {
    if (isRunning || levelFinished) return;
    sounds.playClick();
    setCommands([]);
    resetRobot();
  };

  // Helper direction turn logic
  const getNextDirection = (current: Direction, turn: 'LEFT' | 'RIGHT'): Direction => {
    const order: Direction[] = ['UP', 'RIGHT', 'DOWN', 'LEFT'];
    const idx = order.indexOf(current);
    if (turn === 'LEFT') {
      return order[(idx + 3) % 4];
    } else {
      return order[(idx + 1) % 4];
    }
  };

  // Execute single command step
  const executeStep = (
    cmd: CommandType,
    currentRobot: RobotState,
    currentGrid: GridCell[]
  ): { nextRobot: RobotState; nextGrid: GridCell[]; error?: string; collected?: boolean } => {
    let { x, y, dir, collectedItemsCount } = currentRobot;
    let newGrid = [...currentGrid];

    if (cmd === 'TURN_LEFT') {
      dir = getNextDirection(dir, 'LEFT');
    } else if (cmd === 'TURN_RIGHT') {
      dir = getNextDirection(dir, 'RIGHT');
    } else if (cmd === 'FORWARD') {
      if (dir === 'UP') y -= 1;
      if (dir === 'DOWN') y += 1;
      if (dir === 'LEFT') x -= 1;
      if (dir === 'RIGHT') x += 1;

      // Check boundaries
      if (x < 0 || x >= level.gridSize.cols || y < 0 || y >= level.gridSize.rows) {
        return { nextRobot: currentRobot, nextGrid: currentGrid, error: 'ชนขอบสนาม! ลองปรับแก้คำสั่ง' };
      }

      // Check obstacle
      const targetCell = newGrid.find(c => c.x === x && c.y === y);
      if (targetCell?.type === 'OBSTACLE') {
        return { nextRobot: currentRobot, nextGrid: currentGrid, error: `ชนสิ่งกีดขวาง (${targetCell.label || 'อุปสรรค'})!` };
      }
    } else if (cmd === 'PICK_ITEM') {
      const cellIndex = newGrid.findIndex(c => c.x === x && c.y === y && c.type === 'ITEM' && !c.itemCollected);
      if (cellIndex !== -1) {
        newGrid[cellIndex] = { ...newGrid[cellIndex], itemCollected: true };
        collectedItemsCount += 1;
        sounds.playCollect();
        return { nextRobot: { x, y, dir, collectedItemsCount }, nextGrid: newGrid, collected: true };
      }
    }

    return { nextRobot: { x, y, dir, collectedItemsCount }, nextGrid: newGrid };
  };

  // Run full algorithm
  const runAlgorithm = async () => {
    if (commands.length === 0) {
      setStatusMessage('กรุณาวางคำสั่งอย่างน้อย 1 คำสั่ง!');
      return;
    }

    resetRobot();
    setIsRunning(true);
    setStatusMessage('กำลังทำงาน...');

    let currentRobot: RobotState = {
      x: level.startPos.x,
      y: level.startPos.y,
      dir: level.startPos.dir,
      collectedItemsCount: 0
    };
    let currentGrid = [...level.grid];

    // Expand commands for Repeat loops or conditionals
    const expandedCommands: { type: CommandType; originalIndex: number }[] = [];
    for (let i = 0; i < commands.length; i++) {
      const cmd = commands[i];
      if (cmd === 'REPEAT_2' && i + 1 < commands.length) {
        expandedCommands.push({ type: commands[i + 1], originalIndex: i + 1 });
        expandedCommands.push({ type: commands[i + 1], originalIndex: i + 1 });
        i++; // skip next since repeated
      } else if (cmd === 'REPEAT_3' && i + 1 < commands.length) {
        expandedCommands.push({ type: commands[i + 1], originalIndex: i + 1 });
        expandedCommands.push({ type: commands[i + 1], originalIndex: i + 1 });
        expandedCommands.push({ type: commands[i + 1], originalIndex: i + 1 });
        i++;
      } else {
        expandedCommands.push({ type: cmd, originalIndex: i });
      }
    }

    for (let step = 0; step < expandedCommands.length; step++) {
      const { type: cmd, originalIndex } = expandedCommands[step];
      setActiveCommandIndex(originalIndex);

      sounds.playStep();
      await new Promise(r => setTimeout(r, 450));

      const res = executeStep(cmd, currentRobot, currentGrid);
      currentRobot = res.nextRobot;
      currentGrid = res.nextGrid;
      setRobot(currentRobot);
      setGridItems(currentGrid);

      if (res.error) {
        sounds.playError();
        setIsRunning(false);
        setStatusMessage(res.error);
        setHearts(h => Math.max(0, h - 1));
        setAttempts(a => a + 1);
        return;
      }
    }

    setIsRunning(false);
    setActiveCommandIndex(null);

    // Check Goal condition
    const requiredItems = level.itemsToCollect || 0;
    const isAtGoal = currentRobot.x === level.goalPos.x && currentRobot.y === level.goalPos.y;
    const hasCollectedAll = currentRobot.collectedItemsCount >= requiredItems;

    if (isAtGoal && hasCollectedAll) {
      if (level.id === '3.4') {
        sounds.playBossVictory();
      } else {
        sounds.playSuccess();
      }
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });

      setLevelFinished(true);
      setStatusMessage('🎉 พิชิตด่านสำเร็จ! เก่งมาก');

      // Calculate score
      let score = 10; // Base completion
      if (!hintUsed) score += 5;
      if (commands.length <= level.maxCommandsOptimum) score += 5;
      if (userDebugged || !level.initialBuggyCommands) score += 5;
      if (timeSpent <= 120) score += 5;

      const stars = score >= 25 ? 3 : score >= 18 ? 2 : 1;

      const result: LevelResult = {
        levelId: level.id,
        score,
        stars,
        attempts,
        hints: hintUsed ? 1 : 0,
        debug: userDebugged ? 1 : 0,
        time: timeSpent,
        completed: true,
        completedAt: new Date().toISOString(),
        commandSequence: commands
      };

      setTimeout(() => {
        onLevelComplete(result);
      }, 1500);
    } else if (isAtGoal && !hasCollectedAll) {
      sounds.playError();
      setStatusMessage(`ยังเก็บของไม่ครบ! เก็บไปแล้ว ${currentRobot.collectedItemsCount}/${requiredItems} ชิ้น`);
      setAttempts(a => a + 1);
    } else {
      sounds.playError();
      setStatusMessage('ยังเดินไม่ถึงจุดหมาย! ลองตรวจสอบลำดับคำสั่งอีกครั้ง');
      setAttempts(a => a + 1);
    }
  };

  const getCommandLabel = (cmd: CommandType) => {
    switch (cmd) {
      case 'FORWARD': return 'เดินหน้า ⬆️';
      case 'TURN_LEFT': return 'เลี้ยวซ้าย ⬅️';
      case 'TURN_RIGHT': return 'เลี้ยวขวา ➡️';
      case 'REPEAT_2': return 'ทำซ้ำ 2 ครั้ง 🔁';
      case 'REPEAT_3': return 'ทำซ้ำ 3 ครั้ง 🔁3';
      case 'PICK_ITEM': return 'เก็บของ ✋';
      case 'IF_CLEAR': return 'ถ้าข้างหน้าว่าง ❓';
      default: return cmd;
    }
  };

  const getDirectionArrow = (dir: Direction) => {
    switch (dir) {
      case 'UP': return '⬆️';
      case 'RIGHT': return '➡️';
      case 'DOWN': return '⬇️';
      case 'LEFT': return '⬅️';
    }
  };

  return (
    <div className="flex flex-col gap-4 max-w-5xl mx-auto p-4 bg-slate-900/90 text-white rounded-3xl border border-slate-700 shadow-2xl backdrop-blur-md">
      {/* Level Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToMap}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-sm font-semibold transition"
          >
            ‹ กลับแผนที่
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
                Level {level.id}
              </span>
              <h2 className="text-xl font-bold text-amber-300">{level.title}</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{level.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm font-medium">
          <div className="flex items-center gap-1 text-rose-400 bg-rose-950/40 px-3 py-1.5 rounded-xl border border-rose-800/50">
            <span>❤️</span>
            <span className="font-bold">{hearts}</span>
          </div>

          <div className="flex items-center gap-1.5 text-cyan-300 bg-cyan-950/40 px-3 py-1.5 rounded-xl border border-cyan-800/50">
            <span>⏱️</span>
            <span>{Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}</span>
          </div>

          <button
            onClick={() => {
              setHintUsed(true);
              setShowHintModal(true);
              sounds.playClick();
            }}
            className="flex items-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-xl transition text-xs font-bold"
          >
            <HelpCircle className="w-4 h-4" />
            คำใบ้
          </button>
        </div>
      </div>

      {/* Main Play Area Grid & Controls */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: 2D Robot Grid */}
        <div className="md:col-span-7 flex flex-col items-center justify-center bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
          <div className="mb-2 text-xs text-slate-400 flex items-center justify-between w-full px-2">
            <span>วัตถุประสงค์: <strong className="text-amber-200">{level.objective}</strong></span>
            {level.itemsToCollect && (
              <span className="text-cyan-300">
                ไอเทมสะสม: {robot.collectedItemsCount}/{level.itemsToCollect}
              </span>
            )}
          </div>

          {/* Grid Render */}
          <div
            className="grid gap-2 bg-slate-900 p-4 rounded-2xl border-2 border-indigo-500/30 shadow-inner"
            style={{
              gridTemplateColumns: `repeat(${level.gridSize.cols}, minmax(0, 1fr))`
            }}
          >
            {Array.from({ length: level.gridSize.rows }).map((_, row) =>
              Array.from({ length: level.gridSize.cols }).map((_, col) => {
                const isRobot = robot.x === col && robot.y === row;
                const cell = gridItems.find(c => c.x === col && c.y === row);
                const isGoal = level.goalPos.x === col && level.goalPos.y === row;

                return (
                  <div
                    key={`${col}-${row}`}
                    className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl flex items-center justify-center text-2xl relative transition-all duration-300 border ${
                      isRobot
                        ? 'bg-indigo-600/90 border-cyan-400 shadow-lg shadow-indigo-500/50 scale-105 z-10'
                        : isGoal
                        ? 'bg-emerald-950/80 border-emerald-400/60 shadow-md shadow-emerald-900/40'
                        : cell?.type === 'OBSTACLE'
                        ? 'bg-rose-950/70 border-rose-800/60'
                        : cell?.type === 'ITEM'
                        ? 'bg-amber-950/40 border-amber-600/40'
                        : 'bg-slate-800/80 border-slate-700/60'
                    }`}
                  >
                    {/* Background label / start */}
                    {cell?.type === 'START' && !isRobot && (
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">START</span>
                    )}

                    {/* Robot Render */}
                    {isRobot ? (
                      <div className="relative flex items-center justify-center animate-bounce">
                        <span className="text-2xl sm:text-3xl">🤖</span>
                        <span className="absolute -top-2 -right-2 text-xs bg-cyan-400 text-slate-950 px-1 rounded-full font-black">
                          {getDirectionArrow(robot.dir)}
                        </span>
                      </div>
                    ) : isGoal ? (
                      <span className="text-2xl sm:text-3xl animate-pulse">{cell?.label || '🏁'}</span>
                    ) : cell?.type === 'OBSTACLE' ? (
                      <span className="text-2xl">{cell.label || '🪨'}</span>
                    ) : cell?.type === 'ITEM' && !cell.itemCollected ? (
                      <span className="text-2xl animate-spin-slow">{cell.label || '⭐'}</span>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div className={`mt-3 w-full p-2.5 rounded-xl text-center text-xs sm:text-sm font-semibold border ${
              statusMessage.includes('สำเร็จ')
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
            }`}>
              {statusMessage}
            </div>
          )}
        </div>

        {/* Right Column: Command Palette & Program Workspace */}
        <div className="md:col-span-5 flex flex-col gap-4">
          {/* Available Command Blocks Palette */}
          <div className="bg-slate-800/90 p-3.5 rounded-2xl border border-slate-700 shadow-md">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              บล็อกคำสั่งที่ใช้ได้ (Command Palette)
            </h3>
            <div className="flex flex-wrap gap-2">
              {level.allowedCommands.map(cmd => (
                <button
                  key={cmd}
                  onClick={() => addCommand(cmd)}
                  disabled={isRunning || levelFinished}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1 border border-indigo-400/30"
                >
                  {getCommandLabel(cmd)}
                </button>
              ))}
            </div>
          </div>

          {/* Student Program Workspace */}
          <div className="flex-1 bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex flex-col min-h-[220px]">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-cyan-300">
                  ลำดับคำสั่ง ({commands.length} / เหมาะสมสุด {level.maxCommandsOptimum})
                </span>
                {level.initialBuggyCommands && (
                  <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full border border-rose-500/30 flex items-center gap-1">
                    <Bug className="w-3 h-3" /> ด่านแก้ไข Bug
                  </span>
                )}
              </div>
              <button
                onClick={clearAllCommands}
                disabled={isRunning || commands.length === 0}
                className="text-xs text-slate-400 hover:text-rose-400 transition"
              >
                ล้างทั้งหมด
              </button>
            </div>

            {/* Sequence Drop Zone */}
            <div className="flex-1 overflow-y-auto space-y-2 max-h-[260px] pr-1">
              {commands.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs text-center p-6 border-2 border-dashed border-slate-800 rounded-xl">
                  <span>กดปุ่มคำสั่งด้านบนเพื่อสร้างอัลกอริทึม</span>
                </div>
              ) : (
                commands.map((cmd, idx) => (
                  <div
                    key={`${cmd}-${idx}`}
                    onClick={() => removeCommand(idx)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                      activeCommandIndex === idx
                        ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-md scale-102'
                        : 'bg-slate-800 hover:bg-rose-950/40 text-slate-200 border-slate-700 hover:border-rose-500/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-900/60 flex items-center justify-center text-[10px] text-slate-400">
                        {idx + 1}
                      </span>
                      <span>{getCommandLabel(cmd)}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">ลบ ✕</span>
                  </div>
                ))
              )}
            </div>

            {/* Execution Control Buttons */}
            <div className="mt-4 flex gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={runAlgorithm}
                disabled={isRunning || levelFinished}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 active:scale-98 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-sm"
              >
                <Play className="w-4 h-4 fill-current" />
                {isRunning ? 'กำลังรัน...' : 'รันอัลกอริทึม (Play)'}
              </button>

              <button
                onClick={resetRobot}
                disabled={isRunning}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold transition flex items-center justify-center border border-slate-700"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hint Modal */}
      {showHintModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-amber-500/40 p-6 rounded-3xl max-w-md w-full shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center mx-auto text-2xl">
              💡
            </div>
            <h3 className="text-lg font-bold text-amber-300">คำใบ้ประจำด่าน {level.id}</h3>
            <p className="text-sm text-slate-300 leading-relaxed bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
              {level.hintMessage}
            </p>
            <button
              onClick={() => setShowHintModal(false)}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition text-sm"
            >
              เข้าใจแล้ว! ลุยต่อเลย
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
