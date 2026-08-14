import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Classroom } from '../../types';
import { X, Copy, Check, Printer, Download, ExternalLink } from 'lucide-react';
import { sounds } from '../../utils/audio';

interface Props {
  classroom: Classroom;
  onClose: () => void;
}

export const QrDisplayModal: React.FC<Props> = ({ classroom, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const joinUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?room=${classroom.roomCode}`
    : `https://algorithm-adventure.web.app/?room=${classroom.roomCode}`;

  useEffect(() => {
    QRCode.toDataURL(
      joinUrl,
      { margin: 1, width: 280, color: { dark: '#0f172a', light: '#ffffff' } },
      (err, url) => {
        if (!err && url) setQrDataUrl(url);
      }
    );
  }, [joinUrl]);

  const handleCopyLink = () => {
    sounds.playClick();
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 p-8 rounded-3xl max-w-lg w-full shadow-2xl text-white text-center space-y-6 my-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="text-left">
            <span className="text-xs font-bold text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded-full border border-cyan-800/50">
              📱 สแกนเพื่อเข้าห้องเรียน
            </span>
            <h2 className="text-xl font-black text-amber-300 mt-1">{classroom.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Room Code Display */}
        <div className="bg-slate-800/90 p-4 rounded-2xl border border-slate-700">
          <div className="text-xs font-bold text-slate-400 uppercase">ROOM CODE</div>
          <div className="text-3xl font-black text-amber-400 tracking-widest mt-1">
            {classroom.roomCode}
          </div>
        </div>

        {/* Big QR Code */}
        {qrDataUrl && (
          <div className="p-4 bg-white rounded-3xl inline-block shadow-2xl border-4 border-indigo-500/40">
            <img src={qrDataUrl} alt="Classroom QR Code" className="w-60 h-60 mx-auto" />
          </div>
        )}

        {/* Action Controls */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={handleCopyLink}
            className="py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-xs transition flex items-center justify-center gap-2 shadow-lg"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            {copied ? 'คัดลอกแล้ว!' : 'คัดลอกลิงก์ให้นักเรียน'}
          </button>

          <button
            onClick={handlePrint}
            className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-2xl text-xs transition flex items-center justify-center gap-2 border border-slate-700"
          >
            <Printer className="w-4 h-4" /> พิมพ์แผ่น QR (A4)
          </button>
        </div>
      </div>
    </div>
  );
};
