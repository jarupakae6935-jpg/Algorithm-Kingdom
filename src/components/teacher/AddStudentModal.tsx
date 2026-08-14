import React, { useState } from 'react';
import { UserPlus, X, CheckCircle, Users } from 'lucide-react';
import { sounds } from '../../utils/audio';

interface Props {
  classroomName: string;
  onAddStudent: (name: string) => Promise<void>;
  onClose: () => void;
}

export const AddStudentModal: React.FC<Props> = ({
  classroomName,
  onAddStudent,
  onClose
}) => {
  const [studentName, setStudentName] = useState('');
  const [bulkNames, setBulkNames] = useState('');
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  const handleSubmitSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      sounds.playSuccess();
      await onAddStudent(studentName.trim());
      setStudentName('');
      setSuccessCount(1);
      setTimeout(() => {
        setSuccessCount(null);
        onClose();
      }, 1000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitBulk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkNames.trim() || isSubmitting) return;

    const names = bulkNames
      .split('\n')
      .map(n => n.trim())
      .filter(n => n.length > 0);

    if (names.length === 0) return;

    setIsSubmitting(true);
    try {
      sounds.playSuccess();
      for (const name of names) {
        await onAddStudent(name);
      }
      setBulkNames('');
      setSuccessCount(names.length);
      setTimeout(() => {
        setSuccessCount(null);
        onClose();
      }, 1200);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white border-b-4 border-indigo-200 p-6 rounded-3xl max-w-md w-full shadow-2xl text-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-indigo-950">เพิ่มนักเรียนในชั้นเรียน</h3>
              <p className="text-[11px] font-bold text-slate-400">ห้อง: {classroomName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher: Single vs Bulk */}
        <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setMode('single');
            }}
            className={`flex-1 py-1.5 rounded-xl text-xs font-black transition ${
              mode === 'single'
                ? 'bg-white text-indigo-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            เพิ่มรายคน
          </button>
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setMode('bulk');
            }}
            className={`flex-1 py-1.5 rounded-xl text-xs font-black transition ${
              mode === 'bulk'
                ? 'bg-white text-indigo-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            เพิ่มหลายคนพร้อมกัน
          </button>
        </div>

        {successCount !== null && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-black flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            เพิ่มนักเรียนสำเร็จ {successCount} คน!
          </div>
        )}

        {mode === 'single' ? (
          <form onSubmit={handleSubmitSingle} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-600 mb-1.5">
                ชื่อ-นามสกุล หรือชื่อเล่นนักเรียน
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="เช่น ด.ช. ก้องภพ ยอดเยี่ยม (น้องก้อง)"
                required
                autoFocus
                className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 focus:border-indigo-600 rounded-2xl text-xs text-slate-800 font-bold outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                * นักเรียนสามารถเข้าใช้งานด้วยชื่อนี้ได้ทันที หรือครูสามารถสร้างรายชื่อล่วงหน้าไว้ได้
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !studentName.trim()}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black rounded-2xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <UserPlus className="w-4 h-4" />
                {isSubmitting ? 'กำลังบันทึก...' : 'เพิ่มนักเรียน'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl text-xs font-black transition"
              >
                ยกเลิก
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmitBulk} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-600 mb-1.5 flex items-center justify-between">
                <span>รายชื่อนักเรียน (1 บรรทัด = 1 คน)</span>
                <span className="text-[10px] text-indigo-600 font-extrabold flex items-center gap-1">
                  <Users className="w-3 h-3" /> วางรายชื่อจาก Excel / Word ได้
                </span>
              </label>
              <textarea
                rows={5}
                value={bulkNames}
                onChange={(e) => setBulkNames(e.target.value)}
                placeholder={"ด.ช. ภูมิพัฒน์ ใจดี\nด.ญ. กัญญาณี รักษาสัตย์\nด.ช. ธีรภัทร ชาญฉลาด\nด.ญ. นภัสสร มณีรัตน์"}
                required
                className="w-full p-3 bg-slate-50 border-2 border-slate-200 focus:border-indigo-600 rounded-2xl text-xs text-slate-800 font-bold outline-none resize-none leading-relaxed"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                ตรวจพบ:{' '}
                <strong className="text-indigo-600 font-black">
                  {bulkNames.split('\n').filter(n => n.trim().length > 0).length}
                </strong>{' '}
                รายชื่อ
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !bulkNames.trim()}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black rounded-2xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <UserPlus className="w-4 h-4" />
                {isSubmitting ? 'กำลังนำเข้า...' : 'นำเข้ารายชื่อทั้งหมด'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl text-xs font-black transition"
              >
                ยกเลิก
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
