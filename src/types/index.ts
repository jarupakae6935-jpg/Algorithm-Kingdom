export type UserRole = 'teacher' | 'student';

export interface FirebaseConfigType {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface TeacherUser {
  uid: string;
  name: string;
  email: string;
  role: 'teacher';
}

export interface ClassroomSettings {
  maxTimePerLevel: number; // in seconds
  maxHearts: number;
  enableHints: boolean;
  enableTimer: boolean;
  enableSound: boolean;
  enableWorksheets: boolean;
  allowedWorld: number; // 1, 2, or 3 (locks higher worlds if < allowedWorld)
  privacyMode: boolean; // Hide real names on projector
  isPaused: boolean;
  isOpen: boolean;
}

export interface Classroom {
  id: string;
  name: string; // e.g. "วิทยาการคำนวณ ป.4/1"
  teacherId: string;
  teacherName: string;
  academicYear: string; // e.g. "2569"
  roomCode: string; // e.g. "ALG4-K8P2"
  status: 'active' | 'archived';
  createdAt: string; // ISO string
  settings: ClassroomSettings;
  announcements?: ClassroomAnnouncement[];
}

export interface ClassroomAnnouncement {
  id: string;
  title: string;
  message: string;
  createdAt: string;
}

export interface LevelResult {
  levelId: string; // e.g. "1.1", "3.4"
  score: number; // Max 30
  stars: number; // 1-3
  attempts: number;
  hints: number;
  debug: number;
  time: number; // seconds spent
  completed: boolean;
  completedAt: string;
  commandSequence?: string[];
}

export interface WorksheetSubmission {
  worksheetId: number; // 1 to 13
  answers: Record<string, any>;
  score?: number; // Teacher graded score out of 10
  feedback?: string;
  status: 'pending' | 'graded';
  completed: boolean;
  updatedAt: string;
}

export interface StudentAssessment {
  preTestScore?: number; // Out of 10
  preTestCompletedAt?: string;
  postTestScore?: number; // Out of 10
  postTestCompletedAt?: string;
}

export interface StudentObservation {
  planning: boolean;
  sequencing: boolean;
  reasoning: boolean;
  debugging: boolean;
  teamwork: boolean;
  selfProblemSolving: boolean;
  notes: string;
  updatedAt: string;
}

export interface TeacherFeedback {
  id: string;
  message: string;
  createdAt: string;
  read?: boolean;
}

export interface Student {
  id: string; // student document ID
  uid: string;
  classroomId: string;
  name: string;
  joinedAt: string;
  totalScore: number;
  progressPercentage: number; // 0 - 100
  completedLevelsCount: number;
  currentWorld: number;
  currentLevelId: string;
  preTestScore?: number;
  postTestScore?: number;
  learningGain?: number; // postTestScore - preTestScore
  status: 'playing' | 'idle' | 'completed' | 'working_worksheet';
  levels: Record<string, LevelResult>;
  worksheets: Record<string, WorksheetSubmission>;
  assessments: StudentAssessment;
  reflection?: {
    learnedTopics: string[];
    whatToDoIfError: string;
    completedAt: string;
  };
  observation?: StudentObservation;
  feedbacks?: TeacherFeedback[];
  certificateId?: string;
}

export type Direction = 'UP' | 'RIGHT' | 'DOWN' | 'LEFT';

export type CommandType =
  | 'FORWARD'
  | 'TURN_LEFT'
  | 'TURN_RIGHT'
  | 'REPEAT_2'
  | 'REPEAT_3'
  | 'PICK_ITEM'
  | 'IF_CLEAR'
  | 'IF_OBSTACLE';

export interface CommandItem {
  id: string;
  type: CommandType;
  label: string;
  icon?: string;
}

export interface GridCell {
  x: number;
  y: number;
  type: 'EMPTY' | 'START' | 'GOAL' | 'OBSTACLE' | 'ITEM' | 'BREAKABLE';
  itemCollected?: boolean;
  label?: string;
}

export interface GameLevelDef {
  id: string; // "1.1", "1.2", etc.
  world: number; // 1, 2, 3
  title: string;
  description: string;
  objective: string; // e.g. "Sequencing"
  learningObjectiveKey: 'sequencing' | 'algorithm_design' | 'problem_solving' | 'debugging' | 'optimization';
  gridSize: { cols: number; rows: number };
  startPos: { x: number; y: number; dir: Direction };
  goalPos: { x: number; y: number };
  grid: GridCell[];
  itemsToCollect?: number;
  allowedCommands: CommandType[];
  maxCommandsOptimum: number;
  hintMessage: string;
  initialBuggyCommands?: CommandType[]; // For debugging levels
}

export interface TestQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface WorksheetDef {
  id: number;
  title: string;
  levelTarget: string;
  description: string;
  type: 'ordering' | 'multiple_choice' | 'text_answer' | 'drag_fill';
  questions: {
    id: string;
    prompt: string;
    options?: string[];
    correctAnswer?: any;
    hint?: string;
  }[];
}
