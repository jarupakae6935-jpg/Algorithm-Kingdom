import { GameLevelDef } from '../types';

export const WORLDS_INFO = [
  {
    id: 1,
    title: 'World 1: พื้นฐานลำดับขั้นตอน (Sequencing & Basics)',
    description: 'เรียนรู้การเรียงลำดับคำสั่งเบื้องต้นและก้าวแรกของนักคิดอัลกอริทึม',
    color: 'from-blue-500 to-cyan-500',
    icon: '🚀'
  },
  {
    id: 2,
    title: 'World 2: การออกแบบเส้นทางและการทำซ้ำ (Optimization & Loops)',
    description: 'ใช้คำสั่งทำซ้ำ (Loop) วางแผนเส้นทางที่มีประสิทธิภาพ และค้นหาจุดผิดพลาด (Debugging)',
    color: 'from-purple-500 to-indigo-500',
    icon: '🧩'
  },
  {
    id: 3,
    title: 'World 3: อัลกอริทึมขั้นสูงและเงื่อนไข (Advanced Logic & Boss)',
    description: 'แก้อัลกอริทึมที่ซับซ้อน ใช้เงื่อนไขตัดสินใจ และเอาชนะจอมป่วนอัลกอริทึม!',
    color: 'from-amber-500 to-rose-500',
    icon: '👑'
  }
];

export const GAME_LEVELS: GameLevelDef[] = [
  // --- WORLD 1 ---
  {
    id: '1.1',
    world: 1,
    title: '1.1 เรียงให้ถูก',
    description: 'ช่วย Codey เดินตรงไปยังจุดหมายโดยการวางคำสั่ง "เดินหน้า" ให้ถูกต้อง',
    objective: 'การเรียงลำดับคำสั่งแบบตรงไปตรงมา (Sequencing)',
    learningObjectiveKey: 'sequencing',
    gridSize: { cols: 5, rows: 5 },
    startPos: { x: 0, y: 2, dir: 'RIGHT' },
    goalPos: { x: 3, y: 2 },
    grid: [
      { x: 0, y: 2, type: 'START' },
      { x: 1, y: 2, type: 'EMPTY' },
      { x: 2, y: 2, type: 'EMPTY' },
      { x: 3, y: 2, type: 'GOAL' }
    ],
    allowedCommands: ['FORWARD'],
    maxCommandsOptimum: 3,
    hintMessage: 'วางคำสั่ง "เดินหน้า" จำนวน 3 ครั้งเพื่อไปยังจุดเป้าหมาย!'
  },
  {
    id: '1.2',
    world: 1,
    title: '1.2 เชฟตัวน้อย',
    description: 'พา Codey เดินไปเก็บวัตถุดิบทำอาหารก่อนจะเดินทางไปยังห้องครัว!',
    objective: 'การเก็บไอเทมตามลำดับก่อนเข้าสู่จุดหมาย',
    learningObjectiveKey: 'sequencing',
    gridSize: { cols: 5, rows: 5 },
    startPos: { x: 0, y: 4, dir: 'RIGHT' },
    goalPos: { x: 4, y: 4 },
    grid: [
      { x: 0, y: 4, type: 'START' },
      { x: 1, y: 4, type: 'EMPTY' },
      { x: 2, y: 4, type: 'ITEM', label: '🍎' },
      { x: 3, y: 4, type: 'EMPTY' },
      { x: 4, y: 4, type: 'GOAL', label: '🍳' }
    ],
    itemsToCollect: 1,
    allowedCommands: ['FORWARD', 'PICK_ITEM'],
    maxCommandsOptimum: 5,
    hintMessage: 'เดินหน้า 2 ครั้ง -> เก็บวัตถุดิบ -> เดินหน้าต่ออีก 2 ครั้ง!'
  },
  {
    id: '1.3',
    world: 1,
    title: '1.3 พาหุ่นยนต์กลับบ้าน',
    description: 'ทางไปบ้านมีเลี้ยวโค้ง! ใช้คำสั่งเลี้ยวซ้ายและเลี้ยวขวาเพื่อนำทาง Codey',
    objective: 'การเลี้ยวและเปลี่ยนทิศทางหุ่นยนต์',
    learningObjectiveKey: 'algorithm_design',
    gridSize: { cols: 5, rows: 5 },
    startPos: { x: 0, y: 4, dir: 'RIGHT' },
    goalPos: { x: 2, y: 2 },
    grid: [
      { x: 0, y: 4, type: 'START' },
      { x: 1, y: 4, type: 'EMPTY' },
      { x: 2, y: 4, type: 'EMPTY' },
      { x: 2, y: 3, type: 'EMPTY' },
      { x: 2, y: 2, type: 'GOAL', label: '🏠' }
    ],
    allowedCommands: ['FORWARD', 'TURN_LEFT', 'TURN_RIGHT'],
    maxCommandsOptimum: 5,
    hintMessage: 'เดินหน้า 2 ครั้ง -> เลี้ยวซ้าย -> เดินหน้า 2 ครั้งเพื่อถึงบ้าน!'
  },
  {
    id: '1.4',
    world: 1,
    title: '1.4 กล่องปริศนา',
    description: 'เก็บกุญแจทองคำเพื่อเปิดกล่องปริศนาแล้วเข้าสู่จุดหมาย',
    objective: 'อัลกอริทึมการแก้ปัญหาด้วยไอเทมบังคับ',
    learningObjectiveKey: 'algorithm_design',
    gridSize: { cols: 5, rows: 5 },
    startPos: { x: 0, y: 0, dir: 'DOWN' },
    goalPos: { x: 3, y: 3 },
    grid: [
      { x: 0, y: 0, type: 'START' },
      { x: 0, y: 1, type: 'EMPTY' },
      { x: 0, y: 2, type: 'ITEM', label: '🔑' },
      { x: 0, y: 3, type: 'EMPTY' },
      { x: 1, y: 3, type: 'EMPTY' },
      { x: 2, y: 3, type: 'EMPTY' },
      { x: 3, y: 3, type: 'GOAL', label: '🎁' }
    ],
    itemsToCollect: 1,
    allowedCommands: ['FORWARD', 'TURN_LEFT', 'TURN_RIGHT', 'PICK_ITEM'],
    maxCommandsOptimum: 7,
    hintMessage: 'เดินลงไปเก็บกุญแจก่อน แล้วเลี้ยวซ้ายตรงไปยังกล่องของขวัญ!'
  },

  // --- WORLD 2 ---
  {
    id: '2.1',
    world: 2,
    title: '2.1 ภารกิจเจ้าหุ่นยนต์',
    description: 'ใช้คำสั่ง "ทำซ้ำ 2 ครั้ง" หรือ "ทำซ้ำ 3 ครั้ง" เพื่อลดจำนวนบรรทัดของอัลกอริทึม',
    objective: 'การวนซ้ำ (Loops / Repetition)',
    learningObjectiveKey: 'optimization',
    gridSize: { cols: 6, rows: 5 },
    startPos: { x: 0, y: 2, dir: 'RIGHT' },
    goalPos: { x: 5, y: 2 },
    grid: [
      { x: 0, y: 2, type: 'START' },
      { x: 1, y: 2, type: 'EMPTY' },
      { x: 2, y: 2, type: 'EMPTY' },
      { x: 3, y: 2, type: 'EMPTY' },
      { x: 4, y: 2, type: 'EMPTY' },
      { x: 5, y: 2, type: 'GOAL' }
    ],
    allowedCommands: ['FORWARD', 'REPEAT_3', 'REPEAT_2'],
    maxCommandsOptimum: 2,
    hintMessage: 'ใช้คำสั่ง "ทำซ้ำ 3 ครั้ง" (เดินหน้า 3 ครั้ง) รวมกันจะช่วยย่อคำสั่งให้สั้นลง!'
  },
  {
    id: '2.2',
    world: 2,
    title: '2.2 นักออกแบบเส้นทาง',
    description: 'มีสิ่งกีดขวาง (ก้อนหิน) ขวางทางอยู่ ออกแบบเส้นทางอ้อมหลบสิ่งกีดขวางไปจุดหมาย!',
    objective: 'การวางแผนและหลบหลีกสิ่งกีดขวาง (Path Optimization)',
    learningObjectiveKey: 'problem_solving',
    gridSize: { cols: 5, rows: 5 },
    startPos: { x: 0, y: 2, dir: 'RIGHT' },
    goalPos: { x: 4, y: 2 },
    grid: [
      { x: 0, y: 2, type: 'START' },
      { x: 1, y: 2, type: 'EMPTY' },
      { x: 2, y: 2, type: 'OBSTACLE', label: '🪨' },
      { x: 1, y: 1, type: 'EMPTY' },
      { x: 2, y: 1, type: 'EMPTY' },
      { x: 3, y: 1, type: 'EMPTY' },
      { x: 3, y: 2, type: 'EMPTY' },
      { x: 4, y: 2, type: 'GOAL' }
    ],
    allowedCommands: ['FORWARD', 'TURN_LEFT', 'TURN_RIGHT'],
    maxCommandsOptimum: 8,
    hintMessage: 'เลี้ยวซ้ายขึ้นข้างบนเพื่อเดินอ้อมหิน แล้วเลี้ยวขวากลับลงมา!'
  },
  {
    id: '2.3',
    world: 2,
    title: '2.3 นักสืบอัลกอริทึม (Debugging)',
    description: 'คำสั่งที่ตั้งไว้มีข้อผิดพลาด (Bug)! ช่วยตรวจสอบและแก้ไขให้หุ่นยนต์เดินได้ถูกต้อง',
    objective: 'การตรวจหาและแก้ไขข้อผิดพลาด (Debugging)',
    learningObjectiveKey: 'debugging',
    gridSize: { cols: 5, rows: 5 },
    startPos: { x: 0, y: 2, dir: 'RIGHT' },
    goalPos: { x: 3, y: 0 },
    grid: [
      { x: 0, y: 2, type: 'START' },
      { x: 1, y: 2, type: 'EMPTY' },
      { x: 2, y: 2, type: 'EMPTY' },
      { x: 3, y: 2, type: 'EMPTY' },
      { x: 3, y: 1, type: 'EMPTY' },
      { x: 3, y: 0, type: 'GOAL' }
    ],
    allowedCommands: ['FORWARD', 'TURN_LEFT', 'TURN_RIGHT'],
    maxCommandsOptimum: 6,
    initialBuggyCommands: ['FORWARD', 'FORWARD', 'TURN_RIGHT', 'FORWARD', 'FORWARD'], // Wrong turn! Should be TURN_LEFT
    hintMessage: 'สังเกตทิศทางเลี้ยว! เลี้ยวขวาจะลงล่าง แต่เราต้องการไปข้างบน ต้องเปลี่ยนเป็นเลี้ยวซ้าย!'
  },
  {
    id: '2.4',
    world: 2,
    title: '2.4 ส่งจรวดขึ้นดาว',
    description: 'เก็บดาวพลังงานทั้ง 3 ดวง แล้วไปส่งจรวดขึ้นสู่อวกาศ!',
    objective: 'การวางลำดับขั้นตอนที่ซับซ้อนและเก็บไอเทมครบถ้วน',
    learningObjectiveKey: 'problem_solving',
    gridSize: { cols: 5, rows: 5 },
    startPos: { x: 0, y: 0, dir: 'RIGHT' },
    goalPos: { x: 4, y: 4 },
    grid: [
      { x: 0, y: 0, type: 'START' },
      { x: 2, y: 0, type: 'ITEM', label: '⭐' },
      { x: 2, y: 2, type: 'ITEM', label: '⭐' },
      { x: 4, y: 2, type: 'ITEM', label: '⭐' },
      { x: 4, y: 4, type: 'GOAL', label: '🚀' },
      { x: 0, y: 1, type: 'EMPTY' },
      { x: 1, y: 0, type: 'EMPTY' },
      { x: 2, y: 1, type: 'EMPTY' },
      { x: 3, y: 2, type: 'EMPTY' },
      { x: 4, y: 3, type: 'EMPTY' }
    ],
    itemsToCollect: 3,
    allowedCommands: ['FORWARD', 'TURN_LEFT', 'TURN_RIGHT', 'PICK_ITEM', 'REPEAT_2'],
    maxCommandsOptimum: 10,
    hintMessage: 'วางแผนเส้นทางเชื่อมต่อจากดาวดวงที่ 1 -> 2 -> 3 และเก็บดาวทุกดวงก่อนเข้าจรวด!'
  },

  // --- WORLD 3 ---
  {
    id: '3.1',
    world: 3,
    title: '3.1 แก้อัลกอริทึมที่เสียหาย',
    description: 'มีคำสั่งหลุดลอยและวนซ้ำผิดที่ แก้ไขเพื่อผ่านขวากหนาม!',
    objective: 'การ Debugging ขั้นสูงร่วมกับระบบวนซ้ำ',
    learningObjectiveKey: 'debugging',
    gridSize: { cols: 6, rows: 5 },
    startPos: { x: 0, y: 1, dir: 'RIGHT' },
    goalPos: { x: 5, y: 1 },
    grid: [
      { x: 0, y: 1, type: 'START' },
      { x: 1, y: 1, type: 'EMPTY' },
      { x: 2, y: 1, type: 'OBSTACLE', label: '🌵' },
      { x: 1, y: 0, type: 'EMPTY' },
      { x: 2, y: 0, type: 'EMPTY' },
      { x: 3, y: 0, type: 'EMPTY' },
      { x: 3, y: 1, type: 'EMPTY' },
      { x: 4, y: 1, type: 'EMPTY' },
      { x: 5, y: 1, type: 'GOAL' }
    ],
    allowedCommands: ['FORWARD', 'TURN_LEFT', 'TURN_RIGHT', 'REPEAT_2'],
    maxCommandsOptimum: 7,
    initialBuggyCommands: ['FORWARD', 'FORWARD', 'FORWARD', 'FORWARD'], // Crashes into obstacle
    hintMessage: 'คำสั่งเดิมเดินชนต้นกระบองเพชร! ลบคำสั่งเก่า แล้วเลี้ยวซ้ายเดินอ้อมทางด้านบน'
  },
  {
    id: '3.2',
    world: 3,
    title: '3.2 ทางเลือกของนักคิด',
    description: 'ใช้คำสั่งตรวจสอบเงื่อนไข "ถ้าข้างหน้าว่าง ให้เดินหน้า"',
    objective: 'โครงสร้างการทำงานแบบมีเงื่อนไข (Conditionals)',
    learningObjectiveKey: 'algorithm_design',
    gridSize: { cols: 5, rows: 5 },
    startPos: { x: 0, y: 2, dir: 'RIGHT' },
    goalPos: { x: 4, y: 2 },
    grid: [
      { x: 0, y: 2, type: 'START' },
      { x: 1, y: 2, type: 'EMPTY' },
      { x: 2, y: 2, type: 'EMPTY' },
      { x: 3, y: 2, type: 'EMPTY' },
      { x: 4, y: 2, type: 'GOAL' }
    ],
    allowedCommands: ['FORWARD', 'IF_CLEAR', 'REPEAT_3'],
    maxCommandsOptimum: 2,
    hintMessage: 'ลองใช้คำสั่ง "ถ้าทางข้างหน้าว่าง" ร่วมกับการเดินหน้า!'
  },
  {
    id: '3.3',
    world: 3,
    title: '3.3 ภารกิจจับเวลา',
    description: 'ทดสอบความไวและความกระชับของอัลกอริทึม! เขียนคำสั่งให้สั้นที่สุด',
    objective: 'การหาอัลกอริทึมที่มีประสิทธิภาพสูงสุด (Algorithm Optimization)',
    learningObjectiveKey: 'optimization',
    gridSize: { cols: 6, rows: 5 },
    startPos: { x: 0, y: 0, dir: 'DOWN' },
    goalPos: { x: 5, y: 4 },
    grid: [
      { x: 0, y: 0, type: 'START' },
      { x: 0, y: 1, type: 'EMPTY' },
      { x: 0, y: 2, type: 'EMPTY' },
      { x: 0, y: 3, type: 'EMPTY' },
      { x: 0, y: 4, type: 'EMPTY' },
      { x: 1, y: 4, type: 'EMPTY' },
      { x: 2, y: 4, type: 'EMPTY' },
      { x: 3, y: 4, type: 'EMPTY' },
      { x: 4, y: 4, type: 'EMPTY' },
      { x: 5, y: 4, type: 'GOAL' }
    ],
    allowedCommands: ['FORWARD', 'TURN_LEFT', 'TURN_RIGHT', 'REPEAT_3', 'REPEAT_2'],
    maxCommandsOptimum: 5,
    hintMessage: 'ใช้ Repeat 3 ครั้งสำหรับทางตรงยาวทิศลงล่าง แล้วเลี้ยวซ้าย ใช้ Repeat อีกครั้ง!'
  },
  {
    id: '3.4',
    world: 3,
    title: '3.4 BOSS — จอมป่วนอัลกอริทึม',
    description: 'จอมป่วนวางขวากหนามและซ่อนคริสตัลพลังงานไว้! ใช้ทักษะทั้งหมดเพื่อเอาชนะ BOSS',
    objective: 'การประยุกต์ใช้อัลกอริทึมขั้นสูง (Computational Thinking / Final Boss)',
    learningObjectiveKey: 'problem_solving',
    gridSize: { cols: 6, rows: 6 },
    startPos: { x: 0, y: 0, dir: 'RIGHT' },
    goalPos: { x: 5, y: 5 },
    grid: [
      { x: 0, y: 0, type: 'START' },
      { x: 2, y: 0, type: 'ITEM', label: '💎' },
      { x: 2, y: 1, type: 'OBSTACLE', label: '👾' },
      { x: 2, y: 3, type: 'ITEM', label: '💎' },
      { x: 4, y: 3, type: 'OBSTACLE', label: '🔥' },
      { x: 5, y: 5, type: 'GOAL', label: '🏆' },
      { x: 1, y: 0, type: 'EMPTY' },
      { x: 3, y: 0, type: 'EMPTY' },
      { x: 3, y: 1, type: 'EMPTY' },
      { x: 3, y: 2, type: 'EMPTY' },
      { x: 3, y: 3, type: 'EMPTY' },
      { x: 3, y: 4, type: 'EMPTY' },
      { x: 3, y: 5, type: 'EMPTY' },
      { x: 4, y: 5, type: 'EMPTY' }
    ],
    itemsToCollect: 2,
    allowedCommands: ['FORWARD', 'TURN_LEFT', 'TURN_RIGHT', 'PICK_ITEM', 'REPEAT_2', 'REPEAT_3'],
    maxCommandsOptimum: 12,
    hintMessage: 'วางแผนเส้นทางหลบ BOSS 👾 และไฟ 🔥 พร้อมเก็บคริสตัลทั้ง 2 ชิ้นก่อนเข้าถ้วยรางวัล!'
  }
];
