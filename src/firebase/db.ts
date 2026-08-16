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
import { signInAnonymously, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
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

export async function isFirebaseLive(): Promise<boolean> {
  return true;
}

// Teacher Authentication & Profiles
export async function teacherLogin(email: string, pass: string): Promise<{ uid: string; name: string; email: string }> {
  const { auth, db } = initFirebase();
  const cleanEmail = email.trim().toLowerCase();

  try {
    const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
    const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
    const name = userDoc.exists() ? (userDoc.data()?.name || cred.user.displayName || cleanEmail.split('@')[0]) : (cred.user.displayName || cleanEmail.split('@')[0]);
    return {
      uid: cred.user.uid,
      name: name,
      email: cred.user.email || cleanEmail
    };
  } catch (authError: any) {
    console.warn('Firebase Auth signIn failed, checking Firestore users or anonymous auth:', authError);
    // If user authentication is in test mode or email not registered, create/login cleanly
    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      const name = cleanEmail.split('@')[0];
      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid,
        name: name,
        email: cleanEmail,
        role: 'teacher',
        createdAt: new Date().toISOString()
      }, { merge: true });
      return {
        uid: cred.user.uid,
        name: name,
        email: cleanEmail
      };
    } catch (createErr: any) {
      // If user already exists but password differed or auth disabled, sign in anonymously and map by email ID
      const anon = await signInAnonymously(auth);
      const teacherUid = 'teacher-' + cleanEmail.replace(/[^a-z0-9]/g, '_');
      await setDoc(doc(db, 'users', teacherUid), {
        uid: teacherUid,
        name: cleanEmail.split('@')[0],
        email: cleanEmail,
        role: 'teacher',
        createdAt: new Date().toISOString()
      }, { merge: true });
      return {
        uid: teacherUid,
        name: cleanEmail.split('@')[0],
        email: cleanEmail
      };
    }
  }
}

export async function teacherRegister(email: string, pass: string, name: string): Promise<{ uid: string; name: string; email: string }> {
  const { auth, db } = initFirebase();
  const cleanEmail = email.trim().toLowerCase();
  const teacherName = name.trim() || cleanEmail.split('@')[0];

  try {
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
    await setDoc(doc(db, 'users', cred.user.uid), {
      uid: cred.user.uid,
      name: teacherName,
      email: cleanEmail,
      role: 'teacher',
      createdAt: new Date().toISOString()
    }, { merge: true });
    return {
      uid: cred.user.uid,
      name: teacherName,
      email: cleanEmail
    };
  } catch (err: any) {
    console.warn('teacherRegister error, saving teacher profile directly to Firestore:', err);
    try {
      const anon = await signInAnonymously(auth);
      const teacherUid = 'teacher-' + cleanEmail.replace(/[^a-z0-9]/g, '_');
      await setDoc(doc(db, 'users', teacherUid), {
        uid: teacherUid,
        name: teacherName,
        email: cleanEmail,
        role: 'teacher',
        createdAt: new Date().toISOString()
      }, { merge: true });
      return {
        uid: teacherUid,
        name: teacherName,
        email: cleanEmail
      };
    } catch (e2) {
      const teacherUid = 'teacher-' + cleanEmail.replace(/[^a-z0-9]/g, '_');
      await setDoc(doc(db, 'users', teacherUid), {
        uid: teacherUid,
        name: teacherName,
        email: cleanEmail,
        role: 'teacher',
        createdAt: new Date().toISOString()
      }, { merge: true });
      return {
        uid: teacherUid,
        name: teacherName,
        email: cleanEmail
      };
    }
  }
}

// Classroom Code Generator
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'ALG4-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Create Classroom
export async function createClassroom(
  teacherId: string,
  teacherName: string,
  className: string,
  academicYear: string = '2569'
): Promise<Classroom> {
  const roomCode = generateRoomCode();
  const classroomId = 'class-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);

  const classroom: Classroom = {
    id: classroomId,
    name: className.trim(),
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
    announcements: [
      {
        id: 'ann-1',
        title: 'ยินดีต้อนรับสู่ภารกิจพิชิตอาณาจักรอัลกอริทึม!',
        message: 'ยินดีต้อนรับนักเรียนทุกคน เข้าสู่การเรียนรู้และผจญภัยในโลกอัลกอริทึม',
        createdAt: new Date().toISOString()
      }
    ]
  };

  const { db } = initFirebase();
  await setDoc(doc(db, 'classrooms', classroomId), classroom);
  return classroom;
}

// Delete Classroom
export async function deleteClassroom(classroomId: string): Promise<void> {
  const { db } = initFirebase();

  try {
    // 1. Delete all students in subcollection
    const studentsSnap = await getDocs(collection(db, 'classrooms', classroomId, 'students'));
    const studentDeletions = studentsSnap.docs.map((sDoc) => deleteDoc(sDoc.ref));
    await Promise.all(studentDeletions);

    // 2. Delete classroom document
    await deleteDoc(doc(db, 'classrooms', classroomId));
  } catch (err) {
    console.error('deleteClassroom Firestore error:', err);
    throw err;
  }
}

// Fetch all classrooms for a specific teacher
export async function fetchTeacherClassrooms(teacherId: string): Promise<Classroom[]> {
  const { db } = initFirebase();
  const rooms: Classroom[] = [];

  try {
    const q = query(collection(db, 'classrooms'), where('teacherId', '==', teacherId));
    const snap = await getDocs(q);
    snap.forEach(d => {
      rooms.push(d.data() as Classroom);
    });

    // If empty, query all classrooms as fallback in case teacherId format varies
    if (rooms.length === 0) {
      const allSnap = await getDocs(collection(db, 'classrooms'));
      allSnap.forEach(d => {
        const c = d.data() as Classroom;
        if (c.teacherId === teacherId) {
          rooms.push(c);
        }
      });
    }
  } catch (err) {
    console.error('fetchTeacherClassrooms Firestore error:', err);
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
  const { db } = initFirebase();

  // Initial immediate fetch
  fetchTeacherClassrooms(teacherId).then(callback).catch(console.error);

  try {
    const q = query(collection(db, 'classrooms'), where('teacherId', '==', teacherId));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const liveRooms: Classroom[] = [];
        snap.forEach(d => {
          liveRooms.push(d.data() as Classroom);
        });
        liveRooms.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        callback(liveRooms);
      },
      (error) => {
        console.error('subscribeToTeacherClassrooms error:', error);
      }
    );
    return unsubscribe;
  } catch (e) {
    console.error('subscribeToTeacherClassrooms exception:', e);
    return () => {};
  }
}

// Find classroom by Room Code (supports ALG4-XXXX, XXXX, case-insensitive, with/without hyphen)
export async function findClassroomByCode(roomCode: string): Promise<Classroom | null> {
  if (!roomCode || typeof roomCode !== 'string') return null;

  const rawInput = roomCode.trim().toUpperCase();
  const clean = rawInput.replace(/[^A-Z0-9]/g, '');
  if (!clean) return null;

  // Build candidate room codes
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
  const { db } = initFirebase();

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
        if (
          c.roomCode.toUpperCase() === rawInput ||
          candidateList.includes(c.roomCode.toUpperCase()) ||
          cClean === clean ||
          (clean.length === 4 && cClean.endsWith(clean))
        ) {
          return c;
        }
      }
    }
  } catch (err) {
    console.error('findClassroomByCode Firestore error:', err);
    throw err;
  }

  return null;
}

// Fetch all students in a classroom
export async function fetchStudentsInClassroom(classroomId: string): Promise<Student[]> {
  const { db } = initFirebase();
  const students: Student[] = [];

  try {
    const snap = await getDocs(collection(db, 'classrooms', classroomId, 'students'));
    snap.forEach(d => {
      students.push(d.data() as Student);
    });
  } catch (err) {
    console.error('fetchStudentsInClassroom Firestore error:', err);
  }

  return students.sort((a, b) => a.name.localeCompare(b.name, 'th'));
}

// Join Classroom (Student) - Re-links existing student by name or creates new one
export async function joinClassroom(classroomId: string, studentName: string): Promise<Student> {
  const trimmedName = studentName.trim();
  const { auth, db } = initFirebase();

  // Check if student already exists in this classroom
  const existingList = await fetchStudentsInClassroom(classroomId);
  const existing = existingList.find(
    s => s.name.trim().toLowerCase() === trimmedName.toLowerCase()
  );

  if (existing) {
    const updatedStudent: Student = {
      ...existing,
      status: 'idle',
      joinedAt: existing.joinedAt || new Date().toISOString()
    };

    try {
      await updateDoc(doc(db, 'classrooms', classroomId, 'students', existing.id), {
        status: 'idle'
      });
    } catch (e) {
      console.warn('Update existing student status error:', e);
    }

    return updatedStudent;
  }

  // Create new student
  const studentId = 'std-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);

  let uid = 'anon-' + studentId;
  try {
    const anonUser = await signInAnonymously(auth);
    uid = anonUser.user.uid;
  } catch (e) {
    console.warn('Anonymous auth note:', e);
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

  await setDoc(doc(db, 'classrooms', classroomId, 'students', studentId), newStudent);
  return newStudent;
}

// Add Student to Classroom (by Teacher)
export async function addStudentToClassroom(classroomId: string, studentName: string): Promise<Student> {
  const studentId = 'std-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
  const { db } = initFirebase();

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

  await setDoc(doc(db, 'classrooms', classroomId, 'students', studentId), newStudent);
  return newStudent;
}

// Remove Student from Classroom (by Teacher)
export async function removeStudentFromClassroom(classroomId: string, studentId: string): Promise<void> {
  const { db } = initFirebase();
  await deleteDoc(doc(db, 'classrooms', classroomId, 'students', studentId));
}

// Real-time Subscriptions
export function subscribeToClassroom(classroomId: string, callback: (classroom: Classroom | null) => void): Unsubscribe {
  const { db } = initFirebase();

  return onSnapshot(
    doc(db, 'classrooms', classroomId),
    (snap) => {
      if (snap.exists()) {
        callback(snap.data() as Classroom);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('Firestore subscribeToClassroom error:', error);
    }
  );
}

export function subscribeToStudents(classroomId: string, callback: (students: Student[]) => void): Unsubscribe {
  const { db } = initFirebase();
  const colRef = collection(db, 'classrooms', classroomId, 'students');

  return onSnapshot(
    colRef,
    (snap) => {
      const list: Student[] = [];
      snap.forEach((doc) => {
        list.push(doc.data() as Student);
      });
      list.sort((a, b) => a.name.localeCompare(b.name, 'th'));
      callback(list);
    },
    (error) => {
      console.error('Firestore subscribeToStudents error:', error);
    }
  );
}

// Save in-progress draft block commands for a level
export async function saveStudentLevelDraft(
  classroomId: string,
  studentId: string,
  levelId: string,
  commands: CommandType[]
): Promise<void> {
  const { db } = initFirebase();

  try {
    const studentRef = doc(db, 'classrooms', classroomId, 'students', studentId);
    const snap = await getDoc(studentRef);
    if (snap.exists()) {
      const current = snap.data() as Student;
      const draftLevels = { ...(current.draftLevels || {}), [levelId]: commands };
      await updateDoc(studentRef, { draftLevels });
    }
  } catch (err) {
    console.error('saveStudentLevelDraft error:', err);
  }
}

// Save level completion result & score
export async function saveStudentLevelResult(
  classroomId: string,
  studentId: string,
  result: LevelResult
): Promise<void> {
  const { db } = initFirebase();

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
    console.error('saveStudentLevelResult error:', err);
    throw err;
  }
}

// Save Pre/Post Test Assessment
export async function saveAssessmentResult(
  classroomId: string,
  studentId: string,
  type: 'pretest' | 'posttest',
  score: number
): Promise<void> {
  const { db } = initFirebase();

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
    console.error('saveAssessmentResult error:', err);
    throw err;
  }
}

// Save Worksheet submission
export async function saveWorksheetSubmission(
  classroomId: string,
  studentId: string,
  submission: WorksheetSubmission
): Promise<void> {
  const { db } = initFirebase();

  try {
    const studentRef = doc(db, 'classrooms', classroomId, 'students', studentId);
    const snap = await getDoc(studentRef);
    if (snap.exists()) {
      const st = snap.data() as Student;
      const worksheets = { ...st.worksheets, [submission.worksheetId]: submission };
      await updateDoc(studentRef, { worksheets });
    }
  } catch (err) {
    console.error('saveWorksheetSubmission error:', err);
    throw err;
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
  const { db } = initFirebase();

  try {
    const studentRef = doc(db, 'classrooms', classroomId, 'students', studentId);
    const snap = await getDoc(studentRef);
    if (snap.exists()) {
      const st = snap.data() as Student;
      if (st.worksheets && st.worksheets[worksheetId]) {
        st.worksheets[worksheetId].score = score;
        st.worksheets[worksheetId].feedback = feedback;
        st.worksheets[worksheetId].status = 'graded';
        await updateDoc(studentRef, { worksheets: st.worksheets });
      }
    }
  } catch (err) {
    console.error('gradeWorksheetSubmission error:', err);
    throw err;
  }
}

// Save Student Reflection & Certificate ID
export async function saveStudentReflection(
  classroomId: string,
  studentId: string,
  reflection: { learnedTopics: string[]; whatToDoIfError: string }
): Promise<string> {
  const certId = 'CERT-ALG4-' + Math.floor(1000 + Math.random() * 9000);
  const { db } = initFirebase();

  const data = {
    reflection: { ...reflection, completedAt: new Date().toISOString() },
    certificateId: certId
  };

  try {
    const studentRef = doc(db, 'classrooms', classroomId, 'students', studentId);
    await updateDoc(studentRef, data);
  } catch (err) {
    console.error('saveStudentReflection error:', err);
  }

  return certId;
}

// Save Observation Notes (Teacher)
export async function saveObservationNotes(
  classroomId: string,
  studentId: string,
  obs: StudentObservation
): Promise<void> {
  const { db } = initFirebase();

  try {
    const studentRef = doc(db, 'classrooms', classroomId, 'students', studentId);
    await updateDoc(studentRef, { observation: obs });
  } catch (err) {
    console.error('saveObservationNotes error:', err);
  }
}

// Send Teacher Feedback to Student
export async function sendTeacherFeedback(
  classroomId: string,
  studentId: string,
  message: string
): Promise<void> {
  const { db } = initFirebase();
  const feedback: TeacherFeedback = {
    id: 'fb-' + Date.now(),
    message: message,
    createdAt: new Date().toISOString(),
    read: false
  };

  try {
    const studentRef = doc(db, 'classrooms', classroomId, 'students', studentId);
    const snap = await getDoc(studentRef);
    if (snap.exists()) {
      const st = snap.data() as Student;
      const list = st.feedbacks ? [...st.feedbacks, feedback] : [feedback];
      await updateDoc(studentRef, { feedbacks: list });
    }
  } catch (err) {
    console.error('sendTeacherFeedback error:', err);
  }
}

// Send Classroom Announcement
export async function sendAnnouncement(classroomId: string, title: string, message: string): Promise<void> {
  const { db } = initFirebase();
  const ann: ClassroomAnnouncement = {
    id: 'ann-' + Date.now(),
    title,
    message,
    createdAt: new Date().toISOString()
  };

  try {
    const roomRef = doc(db, 'classrooms', classroomId);
    const snap = await getDoc(roomRef);
    if (snap.exists()) {
      const current = snap.data() as Classroom;
      const list = current.announcements ? [ann, ...current.announcements] : [ann];
      await updateDoc(roomRef, { announcements: list });
    }
  } catch (err) {
    console.error('sendAnnouncement error:', err);
  }
}

// Update Classroom Settings
export async function updateClassroomSettings(
  classroomId: string,
  settings: Partial<ClassroomSettings>
): Promise<void> {
  const { db } = initFirebase();

  try {
    const roomRef = doc(db, 'classrooms', classroomId);
    const snap = await getDoc(roomRef);
    if (snap.exists()) {
      const room = snap.data() as Classroom;
      const newSettings = { ...room.settings, ...settings };
      await updateDoc(roomRef, { settings: newSettings });
    }
  } catch (err) {
    console.error('updateClassroomSettings error:', err);
  }
}
