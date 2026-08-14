import React, { useState } from 'react';
import { UserMinus, AlertTriangle, X } from 'lucide-react';
import { Student } from '../../types';
import { sounds } from '../../utils/audio';

interface Props {
  student: Student;
  classroomName: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export const DeleteStudentModal: React.FC<Props> = ({
  student,
  classroomName,
  onConfirm,
  onClose
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      sounds.playClick();
      await onConfirm();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white border-b-4 border-rose-200 p-6 rounded-3xl max-w-sm w-full shadow-2xl text-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-black">
              <UserMinus className="w-5 h-5" />
            </div>
            <h3 className="text-base font-black text-slate-900">ยืนยันการลบนักเรียน</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-2 text-xs">
          <div className="flex items-center gap-2 text-rose-800 font-black">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>ต้องการนำนักเรียนคนนี้ออกจากห้องเรียนหรือไม่?</span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-rose-100 space-y-1">
            <div className="font-black text-slate-800 text-sm">{student.name}</div>
            <div className="text-slate-500 font-bold text-[11px]">
              ห้องเรียน: {classroomName}
            </div>
            <div className="text-slate-500 font-bold text-[11px]">
              คะแนนสะสม: {student.totalScore} คะแนน | ผ่าน {student.completedLevelsCount || 0}/12 ด่าน
            </div>
          </div>
          <p className="text-[11px] text-rose-700 font-bold">
            * ข้อมูลคะแนน ความก้าวหน้า และใบงานของนักเรียนในห้องนี้จะถูกลบออก
          </p>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            disabled={isDeleting}
            onClick={handleDelete}
            className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-black rounded-2xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
          >
            <UserMinus className="w-4 h-4" />
            {isDeleting ? 'กำลังลบ...' : 'ยืนยันการลบ'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl text-xs font-black transition"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
};
