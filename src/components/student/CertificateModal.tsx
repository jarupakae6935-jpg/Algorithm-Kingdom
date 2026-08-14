import React from 'react';
import QRCode from 'qrcode';
import { Student, Classroom } from '../../types';
import { Award, Printer, Download, CheckCircle2, X } from 'lucide-react';

interface Props {
  student: Student;
  classroom: Classroom;
  certificateId: string;
  onClose: () => void;
}

export const CertificateModal: React.FC<Props> = ({
  student,
  classroom,
  certificateId,
  onClose
}) => {
  const [qrUrl, setQrUrl] = React.useState<string>('');

  React.useEffect(() => {
    const verifyUrl = `${window.location.origin}/?verify=${certificateId}`;
    QRCode.toDataURL(verifyUrl, { margin: 1, width: 100 }, (err, url) => {
      if (!err && url) setQrUrl(url);
    });
  }, [certificateId]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
      <div className="max-w-3xl w-full my-8 space-y-4">
        <div className="flex justify-end gap-2 print:hidden">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-lg"
          >
            <Printer className="w-4 h-4" /> พิมพ์วุฒิบัตร (A4)
          </button>
          <button
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Certificate Printable Canvas */}
        <div className="bg-amber-50/95 text-slate-900 border-8 border-amber-600/80 p-8 sm:p-12 rounded-3xl shadow-2xl relative overflow-hidden font-serif text-center space-y-6 print:p-8 print:border-4">
          <div className="absolute top-0 left-0 w-32 h-32 bg-amber-200/40 rounded-br-full pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-amber-200/40 rounded-tl-full pointer-events-none" />

          {/* Badge icon */}
          <div className="w-20 h-20 bg-amber-500 text-slate-950 rounded-full flex items-center justify-center mx-auto shadow-xl text-4xl border-4 border-amber-300">
            👑
          </div>

          <div>
            <div className="text-xs font-sans font-extrabold tracking-widest text-amber-800 uppercase">
              CERTIFICATE OF COMPUTATIONAL THINKING EXCELLENCE
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-amber-950 mt-1">
              ประกาศนียบัตรปรมาจารย์อัลกอริทึม
            </h1>
            <p className="text-xs font-sans text-amber-900/80 mt-1">
              ขอมอบประกาศนียบัตรฉบับนี้เพื่อแสดงว่า
            </p>
          </div>

          <div className="text-2xl sm:text-3xl font-black text-indigo-950 border-b-2 border-amber-600/50 inline-block px-8 py-1">
            {student.name}
          </div>

          <p className="text-xs sm:text-sm font-sans text-slate-800 max-w-lg mx-auto leading-relaxed">
            ได้ผ่านภารกิจพิชิตอาณาจักรอัลกอริทึมครบถ้วนทั้ง 12 ด่าน รายวิชาวิทยาการคำนวณ ชั้นประถมศึกษาปีที่ 4
            ห้องเรียน <strong>{classroom.name}</strong> ประจำปีการศึกษา {classroom.academicYear}
          </p>

          <div className="pt-6 border-t border-amber-300 flex items-end justify-between font-sans text-xs text-left">
            <div className="space-y-1">
              <div>ครูผู้สอน: <strong>{classroom.teacherName}</strong></div>
              <div>วันที่ออกวุฒิบัตร: {new Date().toLocaleDateString('th-TH')}</div>
              <div className="text-[10px] text-amber-800 font-mono">ID: {certificateId}</div>
            </div>

            {qrUrl && (
              <div className="text-center">
                <img src={qrUrl} alt="Verify Certificate QR" className="w-16 h-16 rounded border border-amber-400 mx-auto" />
                <span className="text-[9px] text-amber-900 block mt-1">สแกนตรวจสอบ</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
