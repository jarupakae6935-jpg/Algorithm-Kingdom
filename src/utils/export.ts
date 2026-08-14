import { Student, Classroom } from '../types';
import { calculateClassAnalytics } from './analytics';

export function exportClassroomToCSV(classroom: Classroom, students: Student[]) {
  // UTF-8 BOM for Excel compatibility in Thai language
  let csv = '\uFEFF';

  // Header Info
  csv += `รายงานสรุปผลการเรียนรู้ - ${classroom.name}\n`;
  csv += `รหัสห้องเรียน: ${classroom.roomCode}, ครูผู้สอน: ${classroom.teacherName}, ปีการศึกษา: ${classroom.academicYear}\n`;
  csv += `วันที่ส่งออกรายงาน: ${new Date().toLocaleDateString('th-TH')}\n\n`;

  // Student Table Header
  csv += 'ลำดับ,ชื่อ-นามสกุล,สถานะ,คะแนนเกมรวม (360),Pre-test (10),Post-test (10),Learning Gain,ผ่านกี่ด่าน,ดาวสะสม,ใบงานที่ส่ง\n';

  students.forEach((std, index) => {
    let stars = 0;
    for (const lid in std.levels) {
      if (std.levels[lid].completed) stars += std.levels[lid].stars || 0;
    }
    const wsCount = Object.keys(std.worksheets || {}).length;
    const gainStr = std.learningGain !== undefined ? (std.learningGain >= 0 ? `+${std.learningGain}` : `${std.learningGain}`) : '-';

    csv += `"${index + 1}","${std.name}","${std.status}","${std.totalScore}","${std.preTestScore ?? '-'}","${std.postTestScore ?? '-'}","${gainStr}","${std.completedLevelsCount}/12","${stars}","${wsCount}/13"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `รายงาน_${classroom.name}_${classroom.roomCode}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportClassroomToJSON(classroom: Classroom, students: Student[]) {
  const analytics = calculateClassAnalytics(students);
  const data = {
    classroom,
    students,
    analytics,
    exportedAt: new Date().toISOString()
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `รายงาน_${classroom.name}_${classroom.roomCode}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function printA4Document() {
  window.print();
}
