import { Student, LevelResult } from '../types';
import { GAME_LEVELS } from '../data/gameData';

export interface ClassAnalyticsResult {
  totalStudents: number;
  avgPreTest: number; // Out of 10
  avgGameScore: number; // Out of 360
  avgPostTest: number; // Out of 10
  avgLearningGain: number; // avgPost - avgPre
  completionRate: number; // Percentage
  totalStarsCollected: number;
  totalBugsFixed: number;
  competencyScores: {
    sequencing: number; // Percentage
    algorithmDesign: number;
    problemSolving: number;
    debugging: number;
    optimization: number;
  };
  levelDifficulty: {
    levelId: string;
    title: string;
    avgAttempts: number;
    avgTime: number;
    failRate: number; // % failed > 1 time
    status: 'EASY' | 'MODERATE' | 'HARD';
  }[];
  earlyWarningStudents: {
    student: Student;
    reason: string;
    levelId?: string;
  }[];
  interpretationNarratives: string[];
}

export function calculateClassAnalytics(students: Student[]): ClassAnalyticsResult {
  const total = students.length;
  if (total === 0) {
    return {
      totalStudents: 0,
      avgPreTest: 0,
      avgGameScore: 0,
      avgPostTest: 0,
      avgLearningGain: 0,
      completionRate: 0,
      totalStarsCollected: 0,
      totalBugsFixed: 0,
      competencyScores: { sequencing: 0, algorithmDesign: 0, problemSolving: 0, debugging: 0, optimization: 0 },
      levelDifficulty: [],
      earlyWarningStudents: [],
      interpretationNarratives: ['ยังไม่มีข้อมูลนักเรียนในห้องเรียน']
    };
  }

  let preSum = 0, preCount = 0;
  let postSum = 0, postCount = 0;
  let gameSum = 0;
  let completedCount = 0;
  let starsSum = 0;
  let bugsSum = 0;

  // Track key competency categories
  const competencyTotals = {
    sequencing: { score: 0, max: 0 },
    algorithmDesign: { score: 0, max: 0 },
    problemSolving: { score: 0, max: 0 },
    debugging: { score: 0, max: 0 },
    optimization: { score: 0, max: 0 }
  };

  const levelStats: Record<string, { attempts: number; time: number; fails: number; count: number }> = {};
  GAME_LEVELS.forEach(lvl => {
    levelStats[lvl.id] = { attempts: 0, time: 0, fails: 0, count: 0 };
  });

  const earlyWarnings: { student: Student; reason: string; levelId?: string }[] = [];

  students.forEach((std) => {
    if (std.preTestScore !== undefined) {
      preSum += std.preTestScore;
      preCount++;
    }
    if (std.postTestScore !== undefined) {
      postSum += std.postTestScore;
      postCount++;
    }
    gameSum += std.totalScore || 0;
    if (std.completedLevelsCount >= 12 || std.status === 'completed') {
      completedCount++;
    }

    // Process levels
    let highAttemptsCount = 0;
    let highHintsCount = 0;

    for (const levelId in std.levels) {
      const res: LevelResult = std.levels[levelId];
      if (res.completed) {
        starsSum += res.stars || 0;
        bugsSum += res.debug || 0;
      }

      if (levelStats[levelId]) {
        levelStats[levelId].attempts += res.attempts || 1;
        levelStats[levelId].time += res.time || 0;
        levelStats[levelId].count += 1;
        if (res.attempts > 1) {
          levelStats[levelId].fails += 1;
        }
      }

      // Map to learning objective
      const levelDef = GAME_LEVELS.find(g => g.id === levelId);
      if (levelDef && res.completed) {
        const key = levelDef.learningObjectiveKey;
        if (key === 'sequencing') {
          competencyTotals.sequencing.score += res.score;
          competencyTotals.sequencing.max += 30;
        } else if (key === 'algorithm_design') {
          competencyTotals.algorithmDesign.score += res.score;
          competencyTotals.algorithmDesign.max += 30;
        } else if (key === 'problem_solving') {
          competencyTotals.problemSolving.score += res.score;
          competencyTotals.problemSolving.max += 30;
        } else if (key === 'debugging') {
          competencyTotals.debugging.score += res.score;
          competencyTotals.debugging.max += 30;
        } else if (key === 'optimization') {
          competencyTotals.optimization.score += res.score;
          competencyTotals.optimization.max += 30;
        }
      }

      if (res.attempts >= 3) highAttemptsCount++;
      if (res.hints >= 2) highHintsCount++;
    }

    if (highAttemptsCount >= 2) {
      earlyWarnings.push({
        student: std,
        reason: 'ทำด่านเดิมผิดซ้ำมากกว่า 3 ครั้ง อาจต้องการคำแนะนำเพิ่มเติมเรื่อง Debugging'
      });
    } else if (highHintsCount >= 3) {
      earlyWarnings.push({
        student: std,
        reason: 'มีการใช้คำใบ้สะสมบ่อยครั้ง ควรได้รับการสาธิตการลำดับขั้นตอน'
      });
    }
  });

  const avgPre = preCount > 0 ? Number((preSum / preCount).toFixed(1)) : 0;
  const avgPost = postCount > 0 ? Number((postSum / postCount).toFixed(1)) : 0;
  const avgGame = Number((gameSum / total).toFixed(1));
  const avgGain = Number((avgPost - avgPre).toFixed(1));
  const compRate = Math.round((completedCount / total) * 100);

  const calcPct = (pair: { score: number; max: number }) =>
    pair.max > 0 ? Math.round((pair.score / pair.max) * 100) : 75;

  const competencyScores = {
    sequencing: calcPct(competencyTotals.sequencing),
    algorithmDesign: calcPct(competencyTotals.algorithmDesign),
    problemSolving: calcPct(competencyTotals.problemSolving),
    debugging: calcPct(competencyTotals.debugging),
    optimization: calcPct(competencyTotals.optimization)
  };

  const levelDifficulty = GAME_LEVELS.map(lvl => {
    const st = levelStats[lvl.id];
    const cnt = st.count || 1;
    const avgAtt = Number((st.attempts / cnt).toFixed(1));
    const avgT = Math.round(st.time / cnt);
    const failRate = Math.round((st.fails / cnt) * 100);

    let status: 'EASY' | 'MODERATE' | 'HARD' = 'EASY';
    if (avgAtt >= 2.2 || failRate >= 40) {
      status = 'HARD';
    } else if (avgAtt >= 1.5 || failRate >= 20) {
      status = 'MODERATE';
    }

    return {
      levelId: lvl.id,
      title: lvl.title,
      avgAttempts: avgAtt,
      avgTime: avgT,
      failRate,
      status
    };
  });

  // Automated interpretation messages
  const narratives: string[] = [];
  narratives.push(`นักเรียนในห้องเรียนมีพัฒนาการเรียนรู้เฉลี่ย (Learning Gain) เพิ่มขึ้น +${avgGain} คะแนน จากการทำ Pre-test และ Post-test`);

  if (competencyScores.sequencing >= 80) {
    narratives.push('นักเรียนมากกว่า 80% มีทักษะการเรียงลำดับขั้นตอน (Sequencing) ที่แข็งแกร่งและเข้าใจอย่างถ่องแท้');
  }

  const hardLevel = levelDifficulty.find(l => l.status === 'HARD');
  if (hardLevel) {
    narratives.push(`ด่าน ${hardLevel.title} เป็นจุดที่พบข้อผิดพลาดสูงสุด (${hardLevel.failRate}% ของนักเรียนทำผิดซ้ำ) ควรเน้นย้ำทักษะ ${hardLevel.title.includes('Debug') ? 'Debugging' : 'การวางแผนเส้นทาง'}`);
  } else {
    narratives.push('นักเรียนส่วนใหญ่สามารถผ่านด่านต่างๆ ได้อย่างราบรื่นโดยใช้เวลาเฉลี่ยตามเกณฑ์');
  }

  return {
    totalStudents: total,
    avgPreTest: avgPre,
    avgGameScore: avgGame,
    avgPostTest: avgPost,
    avgLearningGain: avgGain,
    completionRate: compRate,
    totalStarsCollected: starsSum,
    totalBugsFixed: bugsSum,
    competencyScores,
    levelDifficulty,
    earlyWarningStudents: earlyWarnings,
    interpretationNarratives: narratives
  };
}
