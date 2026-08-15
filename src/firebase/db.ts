import {
  doc,
  collection,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  updateDoc,
  query,
  where,
  Unsubscribe
} from 'firebase/firestore';
import { signInAnonymously, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { initFirebase } from './config';
import {
  Classroom,
  ClassroomSettings,
  Student,
  LevelResult,
  WorksheetSubmission,
  StudentAssessment,
  StudentObservation,
  TeacherFeedback,
  ClassroomAnnouncement,
  CommandType
} from '../types';

// BroadcastChannel for Demo Mode real-time tab-to-tab synchronization
const demoSyncChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('algo_adventure_demo_sync')
  : null;

// Local persistent Demo Store
const DEMO_STORAGE_KEY = 'algo_adventure_demo_db_v1';

interface DemoDB {
  classrooms: Record<string, Classroom>;
  students: Record<string, Record<string, Student>>; // classroomId -> studentId -> Student
}

function getDemoDB(): DemoDB {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error parsing demo DB', e);
  }
  // Initialize default demo classroom if empty
  const initialClassroom: Classroom = {
    id: 'demo-class-01',
    name: 'วิทยาการคำนวณ ป.4/1 (สาธิต)',
    teacherId: 'teacher-demo-01',
    teacherName: 'ครูสายชล สมาร์ท',
    academicYear: '2569',
    roomCode: 'ALG4-K8P2',
    status: 'active',
    createdAt: new Date().toISOString(),
    settings: {
      maxTimePerLevel: 300,
      maxHearts: 3,
      enableHints: true,
      enableTimer: true,
      enableSound: true,
      enableWorksheets: true,
      allowedWorld: 3,
      privacyMode: false,
      isPaused: false,
      isOpen: true
    },
    announcements: [
      {
        id: 'ann-1',
        title: 'ยินดีต้อนรับสู่ภารกิจพิชิตอาณาจักรอัลกอริทึม!',
        message: 'วันนี้ให้นักเรียนทุกคนทำ Pre-test ก่อนเริ่มตะลุย World 1 นะครับ',
        createdAt: new Date().toISOString()
      }
    ]
  };

  const initialStudents: Record<string, Student> = {
    'student-demo-01': {
      id: 'student-demo-01',
      uid: 'anon-01',
      classroomId: 'demo-class-01',
      name: 'น้องเอ (ป.4/1)',
      joinedAt: new Date().toISOString(),
      totalScore: 280,
      progressPercentage: 100,
      completedLevelsCount: 12,
      currentWorld: 3,
      currentLevelId: '3.4',
      preTestScore: 6,
      postTestScore: 9,
      learningGain: 3,
      status: 'completed',
      levels: {
        '1.1': { levelId: '1.1', score: 30, stars: 3, attempts: 1, hints: 0, debug: 0, time: 25, completed: true, completedAt: new Date().toISOString() },
        '1.2': { levelId: '1.2', score: 30, stars: 3, attempts: 1, hints: 0, debug: 0, time: 30, completed: true, completedAt: new Date().toISOString() },
        '2.3': { levelId: '2.3', score: 25, stars: 2, attempts: 2, hints: 1, debug: 1, time: 65, completed: true, completedAt: new Date().toISOString() }
      },
      worksheets: {},
      assessments: { preTestScore: 6, postTestScore: 9 },
      certificateId: 'CERT-ALG4-8821'
    },
    'student-demo-02': {
      id: 'student-demo-02',
      uid: 'anon-02',
      classroomId: 'demo-class-01',
      name: 'น้องบี (ป.4/1)',
      joinedAt: new Date().toISOString(),
      totalScore: 190,
      progressPercentage: 66,
      completedLevelsCount: 8,
      currentWorld: 2,
      currentLevelId: '2.3',
      preTestScore: 4,
      postTestScore: 7,
      learningGain: 3,
      status: 'playing',
      levels: {
        '1.1': { levelId: '1.1', score: 25, stars: 3, attempts: 1, hints: 0, debug: 0, time: 40, completed: true, completedAt: new Date().toISOString() },
        '2.3': { levelId: '2.3', score: 15, stars: 1, attempts: 4, hints: 3, debug: 2, time: 120, completed: true, completedAt: new Date().toISOString() }
      },
      worksheets: {},
      assessments: { preTestScore: 4, postTestScore: 7 }
    }
  };

  const db: DemoDB = {
    classrooms: { 'demo-class-01': initialClassroom },
    students: { 'demo-class-01': initialStudents }
  };
  saveDemoDB(db);
  return db;
}

function saveDemoDB(db: DemoDB) {
  try {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(db));
    if (demoSyncChannel) {
      demoSyncChannel.postMessage({ type: 'DB_UPDATE' });
    }
  } catch (e) {
    console.error('Error saving demo DB', e);
  }
}

// Global Demo Event Listeners
const demoListeners: Array<() => void> = [];
if (demoSyncChannel) {
  demoSyncChannel.onmessage = (event) => {
    if (event.data?.type === 'DB_UPDATE') {
      demoListeners.forEach((cb) => cb());
    }
  };
}

// --- API FUNCTIONS ---

export async function isFirebaseLive(): Promise<boolean> {
  const { isLive } = initFirebase();
  return isLive;
}

// Teacher Authentication
export async function teacherLogin(email: string, pass: string): Promise<{ uid: string; name: string; email: string }> {
  const { auth, isLive } = initFirebase();
  if (isLive && auth) {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      return {
        uid: cred.user.uid,
        name: cred.user.displayName || email.split('@')[0],
        email: cred.user.email || email
      };
    } catch (e) {
      console.warn('Firebase login failed, falling back to local teacher account:', e);
      return {
        uid: 'teacher-demo-01',
        name: email.split('@')[0] || 'คุณครูผู้สอน',
        email: email || 'teacher@school.ac.th'
      };
    }
  } else {
    // Demo mode authentication
    return {
      uid: 'teacher-demo-01',
      name: 'ครูสายชล สมาร์ท',
      email: email || 'teacher@school.ac.th'
    };
  }
}

export async function teacherRegister(email: string, pass: string, name: string): Promise<{ uid: string; name: string; email: string }> {
  const { auth, isLive } = initFirebase();
  if (isLive && auth) {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      return {
        uid: cred.user.uid,
        name: name,
        email: cred.user.email || email
      };
    } catch (e) {
      console.warn('Firebase register failed, using local teacher profile:', e);
      return {
        uid: 'teacher-demo-01',
        name: name || 'ครูผู้สอน ป.4',
        email: email
      };
    }
  } else {
    return {
      uid: 'teacher-demo-01',
      name: name || 'ครูผู้สอน ป.4',
      email: email
    };
  }
}

// Classroom Management
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'ALG4-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function createClassroom(
  teacherId: string,
  teacherName: string,
  className: string,
  academicYear: string = '2569'
): Promise<Classroom> {
  const roomCode = generateRoomCode();
  const classroomId = 'class-' + Date.now().toString(36);

  const classroom: Classroom = {
    id: classroomId,
    name: className,
    teacherId: teacherId,
    teacherName: teacherName,
    academicYear: academicYear,
    roomCode: roomCode,
    status: 'active',
    createdAt: new Date().toISOString(),
    settings: {
      maxTimePerLevel: 300,
      maxHearts: 3,
      enableHints: true,
      enableTimer: true,
      enableSound: true,
      enableWorksheets: true,
      allowedWorld: 3,
      privacyMode: false,
      isPaused: false,
      isOpen: true
    },
    announcements: []
  };

  const { db, isLive } = initFirebase();
  if (isLive && db) {
    try {
      await setDoc(doc(db, 'classrooms', classroomId), classroom);
    } catch (err) {
      console.warn('createClassroom setDoc error, saving to local demo store:', err);
    }
  }

  // Always keep in local demo DB as well to prevent any loss of previous rooms
  const demo = getDemoDB();
  demo.classrooms[classroomId] = classroom;
  if (!demo.students[classroomId]) {
    demo.students[classroomId] = {};
  }
  saveDemoDB(demo);

  return classroom;
}

// Delete Classroom
export async function deleteClassroom(classroomId: string): Promise<void> {
  const { db, isLive } = initFirebase();

  if (isLive && db) {
    try {
      // 1. Delete all students subcollection documents
      const studentsSnap = await getDocs(collection(db, 'classrooms', classroomId, 'students'));
      const studentDeletions = studentsSnap.docs.map((sDoc) => deleteDoc(sDoc.ref));
      await Promise.all(studentDeletions);

      // 2. Delete classroom document
      await deleteDoc(doc(db, 'classrooms', classroomId));
    } catch (err) {
      console.warn('deleteClassroom Firestore error:', err);
    }
  }

  // 3. Remove from local demo store
  const demo = getDemoDB();
  if (demo.classrooms[classroomId]) {
    delete demo.classrooms[classroomId];
  }
  if (demo.students[classroomId]) {
    delete demo.students[classroomId];
  }
  saveDemoDB(demo);
}

// Fetch all classrooms for a specific teacher
export async function fetchTeacherClassrooms(teacherId: string): Promise<Classroom[]> {
  const { db, isLive } = initFirebase();
  const rooms: Classroom[] = [];

  if (isLive && db) {
    try {
      const q = query(collection(db, 'classrooms'), where('teacherId', '==', teacherId));
      const snap = await getDocs(q);
      snap.forEach(d => {
        rooms.push(d.data() as Classroom);
      });
    } catch (err) {
      console.warn('fetchTeacherClassrooms Firebase error, fallback to demo store:', err);
    }
  }

  // Also merge with local classrooms created by this teacher or demo classes
  const demo = getDemoDB();
  for (const cid in demo.classrooms) {
    const c = demo.classrooms[cid];
    if (c.teacherId === teacherId || teacherId === 'teacher-demo-01' || !rooms.some(r => r.id === c.id)) {
      if (!rooms.some(r => r.id === c.id)) {
        rooms.push(c);
      }
    }
  }

  // Sort by createdAt descending
  rooms.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return rooms;
}

// Subscribe to Teacher's Classrooms in Real-time
export function subscribeToTeacherClassrooms(
  teacherId: string,
  callback: (classrooms: Classroom[]) => void
): () => void {
  const { db, isLive } = initFirebase();

  // Trigger initial list from local immediately
  const initial = async () => {
    const list = await fetchTeacherClassrooms(teacherId);
    callback(list);
  };
  initial();

  if (isLive && db) {
    try {
      const q = query(collection(db, 'classrooms'), where('teacherId', '==', teacherId));
      const unsubscribe = onSnapshot(
        q,
        (snap) => {
          const liveRooms: Classroom[] = [];
          snap.forEach(d => {
            liveRooms.push(d.data() as Classroom);
          });
          // Merge with any local demo rooms
          const demo = getDemoDB();
          for (const cid in demo.classrooms) {
            const c = demo.classrooms[cid];
            if ((c.teacherId === teacherId || teacherId === 'teacher-demo-01') && !liveRooms.some(r => r.id === c.id)) {
              liveRooms.push(c);
            }
          }
          liveRooms.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          callback(liveRooms);
        },
        (error) => {
          console.warn('subscribeToTeacherClassrooms error, using local demo store:', error);
          initial();
        }
      );
      return unsubscribe;
    } catch (e) {
      console.warn('Live subscription to teacher classrooms failed:', e);
    }
  }

  // Fallback demo listener
  const handler = () => {
    initial();
  };
  demoListeners.push(handler);

  return () => {
    const idx = demoListeners.indexOf(handler);
    if (idx !== -1) demoListeners.splice(idx, 1);
  };
}

// Find classroom by Room Code (supports ALG4-XXXX, XXXX, case-insensitive, with/without hyphen)
export async function findClassroomByCode(roomCode: string): Promise<Classroom | null> {
  if (!roomCode || typeof roomCode !== 'string') return null;

  const rawInput = roomCode.trim().toUpperCase();
  const clean = rawInput.replace(/[^A-Z0-9]/g, '');
  if (!clean) return null;

  // Build list of candidate room codes
  const candidateSet = new Set<string>();
  candidateSet.add(rawInput);
  candidateSet.add(clean);

  if (clean.length === 4) {
    candidateSet.add(`ALG4-${clean}`);
  } else if (clean.startsWith('ALG4') && clean.length === 8) {
    candidateSet.add(`ALG4-${clean.substring(4)}`);
  } else if (clean.length > 4) {
    candidateSet.add(`ALG4-${clean.slice(-4)}`);
  }

  const candidateList = Array.from(candidateSet);
  const { db, isLive } = initFirebase();

  if (isLive && db) {
    try {
      // 1. Direct query with 'in' operator
      const q = query(
        collection(db, 'classrooms'),
        where('roomCode', 'in', candidateList.slice(0, 10))
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0].data() as Classroom;
      }

      // 2. Scan all classrooms in Firestore as backup if exact code didn't hit
      const allSnap = await getDocs(collection(db, 'classrooms'));
      for (const d of allSnap.docs) {
        const c = d.data() as Classroom;
        if (c.roomCode) {
          const cClean = c.roomCode.toUpperCase().replace(/[^A-Z0-9]/g, '');
          if (cClean === clean || (clean.length === 4 && cClean.endsWith(clean))) {
            return c;
          }
        }
      }
    } catch (err) {
      console.warn('findClassroomByCode Firebase query error, checking local store:', err);
    }
  }

  // Always check Demo / Local DB
  const demo = getDemoDB();
  for (const cid in demo.classrooms) {
    const c = demo.classrooms[cid];
    if (!c.roomCode) continue;

    const cClean = c.roomCode.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (
      c.roomCode.toUpperCase() === rawInput ||
      candidateList.includes(c.roomCode.toUpperCase()) ||
      cClean === clean ||
      (clean.length === 4 && cClean.endsWith(clean))
    ) {
      return c;
    }
  }

  return null;
}

// Fetch all students in a classroom
export async function fetchStudentsInClassroom(classroomId: string): Promise<Student[]> {
  const { db, isLive } = initFirebase();
  const studentsMap = new Map<string, Student>();

  // 1. Fetch from Firestore if live
  if (isLive && db) {
    try {
      const snap = await getDocs(collection(db, 'classrooms', classroomId, 'students'));
      snap.forEach(d => {
        const s = d.data() as Student;
        studentsMap.set(s.id, s);
      });
    } catch (err) {
      console.warn('fetchStudentsInClassroom Firestore error:', err);
    }
  }

  // 2. Merge with demo/local store
  const demo = getDemoDB();
  if (demo.students[classroomId]) {
    for (const sid in demo.students[classroomId]) {
      const s = demo.students[classroomId][sid];
      if (!studentsMap.has(s.id)) {
        studentsMap.set(s.id, s);
      }
    }
  }

  return Array.from(studentsMap.values()).sort((a, b) => a.name.localeCompare(b.name, 'th'));
}

// Join Classroom (Student) - Re-links existing student by name or creates new one
export async function joinClassroom(classroomId: string, studentName: string): Promise<Student> {
  const trimmedName = studentName.trim();
  const { auth, db, isLive } = initFirebase();

  // First check if student already exists in this classroom
  const existingList = await fetchStudentsInClassroom(classroomId);
  const existing = existingList.find(
    s => s.name.trim().toLowerCase() === trimmedName.toLowerCase()
  );

  if (existing) {
    // Re-link existing student profile so their scores, levels, and worksheets are preserved
    const updatedStudent: Student = {
      ...existing,
      status: 'idle',
      joinedAt: existing.joinedAt || new Date().toISOString()
    };

    if (isLive && db) {
      try {
        await updateDoc(doc(db, 'classrooms', classroomId, 'students', existing.id), {
          status: 'idle'
        });
      } catch (e) {
        console.warn('Update existing student status error:', e);
      }
    }

    const demo = getDemoDB();
    if (!demo.students[classroomId]) demo.students[classroomId] = {};
    demo.students[classroomId][existing.id] = updatedStudent;
    saveDemoDB(demo);

    return updatedStudent;
  }

  // Create new student
  const studentId = 'std-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 5);

  let uid = 'anon-' + studentId;
  if (isLive && auth) {
    try {
      const anonUser = await signInAnonymously(auth);
      uid = anonUser.user.uid;
    } catch (e) {
      console.warn('Anonymous auth failed, fallback uid', e);
    }
  }

  const newStudent: Student = {
    id: studentId,
    uid: uid,
    classroomId: classroomId,
    name: trimmedName,
    joinedAt: new Date().toISOString(),
    totalScore: 0,
    progressPercentage: 0,
    completedLevelsCount: 0,
    currentWorld: 1,
    currentLevelId: '1.1',
    status: 'idle',
    levels: {},
    worksheets: {},
    assessments: {}
  };

  if (isLive && db) {
    try {
      await setDoc(doc(db, 'classrooms', classroomId, 'students', studentId), newStudent);
    } catch (err) {
      console.warn('joinClassroom setDoc error, saving to local demo store:', err);
    }
  }

  // Always keep in local demo DB
  const demo = getDemoDB();
  if (!demo.students[classroomId]) {
    demo.students[classroomId] = {};
  }
  demo.students[classroomId][studentId] = newStudent;
  saveDemoDB(demo);

  return newStudent;
}

// Add Student to Classroom (by Teacher)
export async function addStudentToClassroom(classroomId: string, studentName: string): Promise<Student> {
  const studentId = 'std-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
  const { db, isLive } = initFirebase();

  const newStudent: Student = {
    id: studentId,
    uid: 'roster-' + studentId,
    classroomId: classroomId,
    name: studentName.trim(),
    joinedAt: new Date().toISOString(),
    totalScore: 0,
    progressPercentage: 0,
    completedLevelsCount: 0,
    currentWorld: 1,
    currentLevelId: '1.1',
    status: 'idle',
    levels: {},
    worksheets: {},
    assessments: {}
  };

  if (isLive && db) {
    try {
      await setDoc(doc(db, 'classrooms', classroomId, 'students', studentId), newStudent);
    } catch (err) {
      console.warn('addStudentToClassroom setDoc error, saving to local demo store:', err);
    }
  }

  // Always sync to demo store
  const demo = getDemoDB();
  if (!demo.students[classroomId]) {
    demo.students[classroomId] = {};
  }
  demo.students[classroomId][studentId] = newStudent;
  saveDemoDB(demo);

  return newStudent;
}

// Remove Student from Classroom (by Teacher)
export async function removeStudentFromClassroom(classroomId: string, studentId: string): Promise<void> {
  const { db, isLive } = initFirebase();

  if (isLive && db) {
    try {
      await deleteDoc(doc(db, 'classrooms', classroomId, 'students', studentId));
    } catch (err) {
      console.warn('removeStudentFromClassroom deleteDoc error, removing from demo store:', err);
    }
  }

  // Always delete from demo store
  const demo = getDemoDB();
  if (demo.students[classroomId] && demo.students[classroomId][studentId]) {
    delete demo.students[classroomId][studentId];
    saveDemoDB(demo);
  }
}

// Real-time Subscriptions
export function subscribeToClassroom(classroomId: string, callback: (classroom: Classroom | null) => void): Unsubscribe {
  const { db, isLive } = initFirebase();

  if (isLive && db) {
    const unsub = onSnapshot(
      doc(db, 'classrooms', classroomId),
      (snap) => {
        if (snap.exists()) {
          callback(snap.data() as Classroom);
        } else {
          // If not found in live db, check demo db
          const demo = getDemoDB();
          callback(demo.classrooms[classroomId] || null);
        }
      },
      (error) => {
        console.warn('Firestore subscribeToClassroom error (falling back to demo db):', error);
        const demo = getDemoDB();
        callback(demo.classrooms[classroomId] || null);
      }
    );
    return unsub;
  } else {
    const update = () => {
      const demo = getDemoDB();
      callback(demo.classrooms[classroomId] || null);
    };
    update();
    demoListeners.push(update);
    return () => {
      const idx = demoListeners.indexOf(update);
      if (idx !== -1) demoListeners.splice(idx, 1);
    };
  }
}

export function subscribeToStudents(classroomId: string, callback: (students: Student[]) => void): Unsubscribe {
  const { db, isLive } = initFirebase();

  if (isLive && db) {
    const colRef = collection(db, 'classrooms', classroomId, 'students');
    const unsub = onSnapshot(
      colRef,
      (snap) => {
        const list: Student[] = [];
        snap.forEach((doc) => {
          list.push(doc.data() as Student);
        });
        if (list.length > 0) {
          callback(list);
        } else {
          // Fallback to local demo students if empty
          const demo = getDemoDB();
          const stdMap = demo.students[classroomId] || {};
          const localList = Object.values(stdMap);
          callback(localList);
        }
      },
      (error) => {
        console.warn('Firestore subscribeToStudents error (falling back to demo db):', error);
        const demo = getDemoDB();
        const stdMap = demo.students[classroomId] || {};
        callback(Object.values(stdMap));
      }
    );
    return unsub;
  } else {
    const update = () => {
      const demo = getDemoDB();
      const stdMap = demo.students[classroomId] || {};
      callback(Object.values(stdMap));
    };
    update();
    demoListeners.push(update);
    return () => {
      const idx = demoListeners.indexOf(update);
      if (idx !== -1) demoListeners.splice(idx, 1);
    };
  }
}

// Save in-progress draft block commands for a level
export async function saveStudentLevelDraft(
  classroomId: string,
  studentId: string,
  levelId: string,
  commands: CommandType[]
): Promise<void> {
  const { db, isLive } = initFirebase();

  if (isLive && db) {
    try {
      const studentRef = doc(db, 'classrooms', classroomId, 'students', studentId);
      const snap = await getDoc(studentRef);
      if (snap.exists()) {
        const current = snap.data() as Student;
        const draftLevels = { ...(current.draftLevels || {}), [levelId]: commands };
        await updateDoc(studentRef, { draftLevels });
      }
    } catch (err) {
      console.warn('saveStudentLevelDraft live error, fallback to demo store:', err);
    }
  }

  // Always update local demo DB
  const demo = getDemoDB();
  if (demo.students[classroomId]?.[studentId]) {
    const st = demo.students[classroomId][studentId];
    st.draftLevels = { ...(st.draftLevels || {}), [levelId]: commands };
    saveDemoDB(demo);
  }
}

// Save level completion result & score
export async function saveStudentLevelResult(
  classroomId: string,
  studentId: string,
  result: LevelResult
): Promise<void> {
  const { db, isLive } = initFirebase();

  if (isLive && db) {
    try {
      const studentRef = doc(db, 'classrooms', classroomId, 'students', studentId);
      const snap = await getDoc(studentRef);
      if (snap.exists()) {
        const current = snap.data() as Student;
        const levels = { ...current.levels, [result.levelId]: result };

        let total = 0;
        let count = 0;
        for (const k in levels) {
          if (levels[k].completed) {
            total += levels[k].score;
            count++;
          }
        }
        const progress = Math.min(100, Math.round((count / 12) * 100));

        await updateDoc(studentRef, {
          levels: levels,
          totalScore: total,
          completedLevelsCount: count,
          progressPercentage: progress,
          status: count >= 12 ? 'completed' : 'playing'
        });
      }
    } catch (err) {
      console.warn('saveStudentLevelResult live error, falling back to demo db:', err);
      const demo = getDemoDB();
      if (demo.students[classroomId]?.[studentId]) {
        const st = demo.students[classroomId][studentId];
        st.levels[result.levelId] = result;
        let total = 0;
        let count = 0;
        for (const k in st.levels) {
          if (st.levels[k].completed) {
            total += st.levels[k].score;
            count++;
          }
        }
        st.totalScore = total;
        st.completedLevelsCount = count;
        st.progressPercentage = Math.min(100, Math.round((count / 12) * 100));
        st.status = count >= 12 ? 'completed' : 'playing';
        saveDemoDB(demo);
      }
    }
  } else {
    const demo = getDemoDB();
    if (demo.students[classroomId]?.[studentId]) {
      const st = demo.students[classroomId][studentId];
      st.levels[result.levelId] = result;

      let total = 0;
      let count = 0;
      for (const k in st.levels) {
        if (st.levels[k].completed) {
          total += st.levels[k].score;
          count++;
        }
      }
      st.totalScore = total;
      st.completedLevelsCount = count;
      st.progressPercentage = Math.min(100, Math.round((count / 12) * 100));
      st.status = count >= 12 ? 'completed' : 'playing';

      saveDemoDB(demo);
    }
  }
}

// Save Pre/Post Test Assessment
export async function saveAssessmentResult(
  classroomId: string,
  studentId: string,
  type: 'pretest' | 'posttest',
  score: number
): Promise<void> {
  const { db, isLive } = initFirebase();

  if (isLive && db) {
    try {
      const studentRef = doc(db, 'classrooms', classroomId, 'students', studentId);
      const snap = await getDoc(studentRef);
      if (snap.exists()) {
        const st = snap.data() as Student;
        const assessments = { ...st.assessments };
        let pre = st.preTestScore;
        let post = st.postTestScore;

        if (type === 'pretest') {
          assessments.preTestScore = score;
          assessments.preTestCompletedAt = new Date().toISOString();
          pre = score;
        } else {
          assessments.postTestScore = score;
          assessments.postTestCompletedAt = new Date().toISOString();
          post = score;
        }

        const gain = post !== undefined && pre !== undefined ? post - pre : undefined;

        await updateDoc(studentRef, {
          assessments: assessments,
          preTestScore: pre,
          postTestScore: post,
          learningGain: gain
        });
      }
    } catch (err) {
      console.warn('saveAssessmentResult live error, fallback to demo db:', err);
      const demo = getDemoDB();
      if (demo.students[classroomId]?.[studentId]) {
        const st = demo.students[classroomId][studentId];
        if (type === 'pretest') {
          st.preTestScore = score;
          st.assessments.preTestScore = score;
        } else {
          st.postTestScore = score;
          st.assessments.postTestScore = score;
        }
        if (st.postTestScore !== undefined && st.preTestScore !== undefined) {
          st.learningGain = st.postTestScore - st.preTestScore;
        }
        saveDemoDB(demo);
      }
    }
  } else {
    const demo = getDemoDB();
    if (demo.students[classroomId]?.[studentId]) {
      const st = demo.students[classroomId][studentId];
      if (type === 'pretest') {
        st.preTestScore = score;
        st.assessments.preTestScore = score;
      } else {
        st.postTestScore = score;
        st.assessments.postTestScore = score;
      }
      if (st.postTestScore !== undefined && st.preTestScore !== undefined) {
        st.learningGain = st.postTestScore - st.preTestScore;
      }
      saveDemoDB(demo);
    }
  }
}

// Save Worksheet submission
export async function saveWorksheetSubmission(
  classroomId: string,
  studentId: string,
  submission: WorksheetSubmission
): Promise<void> {
  const { db, isLive } = initFirebase();

  if (isLive && db) {
    try {
      const studentRef = doc(db, 'classrooms', classroomId, 'students', studentId);
      const snap = await getDoc(studentRef);
      if (snap.exists()) {
        const st = snap.data() as Student;
        const worksheets = { ...st.worksheets, [submission.worksheetId]: submission };
        await updateDoc(studentRef, { worksheets });
      }
    } catch (err) {
      console.warn('saveWorksheetSubmission live error, fallback to demo db:', err);
      const demo = getDemoDB();
      if (demo.students[classroomId]?.[studentId]) {
        const st = demo.students[classroomId][studentId];
        st.worksheets[submission.worksheetId] = submission;
        saveDemoDB(demo);
      }
    }
  } else {
    const demo = getDemoDB();
    if (demo.students[classroomId]?.[studentId]) {
      const st = demo.students[classroomId][studentId];
      st.worksheets[submission.worksheetId] = submission;
      saveDemoDB(demo);
    }
  }
}

// Grade Worksheet (Teacher)
export async function gradeWorksheetSubmission(
  classroomId: string,
  studentId: string,
  worksheetId: number,
  score: number,
  feedback: string
): Promise<void> {
  const { db, isLive } = initFirebase();

  if (isLive && db) {
    try {
      const studentRef = doc(db, 'classrooms', classroomId, 'students', studentId);
      const snap = await getDoc(studentRef);
      if (snap.exists()) {
        const st = snap.data() as Student;
        if (st.worksheets[worksheetId]) {
          st.worksheets[worksheetId].score = score;
          st.worksheets[worksheetId].feedback = feedback;
          st.worksheets[worksheetId].status = 'graded';
          await updateDoc(studentRef, { worksheets: st.worksheets });
        }
      }
    } catch (err) {
      console.warn('gradeWorksheetSubmission live error, fallback to demo db:', err);
      const demo = getDemoDB();
      if (demo.students[classroomId]?.[studentId]?.worksheets[worksheetId]) {
        const ws = demo.students[classroomId][studentId].worksheets[worksheetId];
        ws.score = score;
        ws.feedback = feedback;
        ws.status = 'graded';
        saveDemoDB(demo);
      }
    }
  } else {
    const demo = getDemoDB();
    if (demo.students[classroomId]?.[studentId]?.worksheets[worksheetId]) {
      const ws = demo.students[classroomId][studentId].worksheets[worksheetId];
      ws.score = score;
      ws.feedback = feedback;
      ws.status = 'graded';
      saveDemoDB(demo);
    }
  }
}

// Save Student Reflection & Certificate ID
export async function saveStudentReflection(
  classroomId: string,
  studentId: string,
  reflection: { learnedTopics: string[]; whatToDoIfError: string }
): Promise<string> {
  const certId = 'CERT-ALG4-' + Math.floor(1000 + Math.random() * 9000);
  const { db, isLive } = initFirebase();

  const data = {
    reflection: { ...reflection, completedAt: new Date().toISOString() },
    certificateId: certId
  };

  if (isLive && db) {
    try {
      const studentRef = doc(db, 'classrooms', classroomId, 'students', studentId);
      await updateDoc(studentRef, data);
    } catch (err) {
      console.warn('saveStudentReflection live error, fallback to demo db:', err);
      const demo = getDemoDB();
      if (demo.students[classroomId]?.[studentId]) {
        const st = demo.students[classroomId][studentId];
        st.reflection = { ...reflection, completedAt: new Date().toISOString() };
        st.certificateId = certId;
        saveDemoDB(demo);
      }
    }
  } else {
    const demo = getDemoDB();
    if (demo.students[classroomId]?.[studentId]) {
      const st = demo.students[classroomId][studentId];
      st.reflection = { ...reflection, completedAt: new Date().toISOString() };
      st.certificateId = certId;
      saveDemoDB(demo);
    }
  }

  return certId;
}

// Save Observation Notes (Teacher)
export async function saveObservationNotes(
  classroomId: string,
  studentId: string,
  obs: StudentObservation
): Promise<void> {
  const { db, isLive } = initFirebase();

  if (isLive && db) {
    try {
      const studentRef = doc(db, 'classrooms', classroomId, 'students', studentId);
      await updateDoc(studentRef, { observation: obs });
    } catch (err) {
      console.warn('saveObservationNotes live error, fallback to demo db:', err);
      const demo = getDemoDB();
      if (demo.students[classroomId]?.[studentId]) {
        demo.students[classroomId][studentId].observation = obs;
        saveDemoDB(demo);
      }
    }
  } else {
    const demo = getDemoDB();
    if (demo.students[classroomId]?.[studentId]) {
      demo.students[classroomId][studentId].observation = obs;
      saveDemoDB(demo);
    }
  }
}

// Send Teacher Feedback to Student
export async function sendTeacherFeedback(
  classroomId: string,
  studentId: string,
  message: string
): Promise<void> {
  const { db, isLive } = initFirebase();
  const feedback: TeacherFeedback = {
    id: 'fb-' + Date.now(),
    message: message,
    createdAt: new Date().toISOString(),
    read: false
  };

  if (isLive && db) {
    try {
      const studentRef = doc(db, 'classrooms', classroomId, 'students', studentId);
      const snap = await getDoc(studentRef);
      if (snap.exists()) {
        const st = snap.data() as Student;
        const list = st.feedbacks ? [...st.feedbacks, feedback] : [feedback];
        await updateDoc(studentRef, { feedbacks: list });
      }
    } catch (err) {
      console.warn('sendTeacherFeedback live error, fallback to demo db:', err);
      const demo = getDemoDB();
      if (demo.students[classroomId]?.[studentId]) {
        const st = demo.students[classroomId][studentId];
        st.feedbacks = st.feedbacks ? [...st.feedbacks, feedback] : [feedback];
        saveDemoDB(demo);
      }
    }
  } else {
    const demo = getDemoDB();
    if (demo.students[classroomId]?.[studentId]) {
      const st = demo.students[classroomId][studentId];
      st.feedbacks = st.feedbacks ? [...st.feedbacks, feedback] : [feedback];
      saveDemoDB(demo);
    }
  }
}

// Send Classroom Announcement
export async function sendAnnouncement(classroomId: string, title: string, message: string): Promise<void> {
  const { db, isLive } = initFirebase();
  const ann: ClassroomAnnouncement = {
    id: 'ann-' + Date.now(),
    title,
    message,
    createdAt: new Date().toISOString()
  };

  if (isLive && db) {
    try {
      const roomRef = doc(db, 'classrooms', classroomId);
      const snap = await getDoc(roomRef);
      if (snap.exists()) {
        const current = snap.data() as Classroom;
        const list = current.announcements ? [ann, ...current.announcements] : [ann];
        await updateDoc(roomRef, { announcements: list });
      }
    } catch (err) {
      console.warn('sendAnnouncement live error, fallback to demo db:', err);
      const demo = getDemoDB();
      if (demo.classrooms[classroomId]) {
        const room = demo.classrooms[classroomId];
        room.announcements = room.announcements ? [ann, ...room.announcements] : [ann];
        saveDemoDB(demo);
      }
    }
  } else {
    const demo = getDemoDB();
    if (demo.classrooms[classroomId]) {
      const room = demo.classrooms[classroomId];
      room.announcements = room.announcements ? [ann, ...room.announcements] : [ann];
      saveDemoDB(demo);
    }
  }
}

// Update Classroom Settings
export async function updateClassroomSettings(
  classroomId: string,
  settings: Partial<ClassroomSettings>
): Promise<void> {
  const { db, isLive } = initFirebase();

  if (isLive && db) {
    try {
      const roomRef = doc(db, 'classrooms', classroomId);
      const snap = await getDoc(roomRef);
      if (snap.exists()) {
        const room = snap.data() as Classroom;
        const newSettings = { ...room.settings, ...settings };
        await updateDoc(roomRef, { settings: newSettings });
      }
    } catch (err) {
      console.warn('updateClassroomSettings live error, fallback to demo db:', err);
      const demo = getDemoDB();
      if (demo.classrooms[classroomId]) {
        demo.classrooms[classroomId].settings = {
          ...demo.classrooms[classroomId].settings,
          ...settings
        };
        saveDemoDB(demo);
      }
    }
  } else {
    const demo = getDemoDB();
    if (demo.classrooms[classroomId]) {
      demo.classrooms[classroomId].settings = {
        ...demo.classrooms[classroomId].settings,
        ...settings
      };
      saveDemoDB(demo);
    }
  }
}
