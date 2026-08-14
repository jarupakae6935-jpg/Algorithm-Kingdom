import React, { useState } from 'react';
import { FirebaseConfigType } from '../types';
import { getStoredFirebaseConfig, saveFirebaseConfig, clearFirebaseConfig } from '../firebase/config';
import { X, CheckCircle, Database, Key, Server, RefreshCw, Copy, ShieldAlert, Check } from 'lucide-react';
import { sounds } from '../utils/audio';

interface Props {
  onClose: () => void;
  onConfigSaved: () => void;
}

const FIRESTORE_RULES_TEXT = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`;

const REALTIME_DB_RULES_TEXT = `{
  "rules": {
    ".read": true,
    ".write": true
  }
}`;

export const FirebaseGuideModal: React.FC<Props> = ({ onClose, onConfigSaved }) => {
  const current = getStoredFirebaseConfig() || {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
  };

  const [cfg, setCfg] = useState<FirebaseConfigType>(current);
  const [activeTab, setActiveTab] = useState<'config' | 'rules' | 'guide'>('config');
  const [saved, setSaved] = useState(false);
  const [copiedRules, setCopiedRules] = useState(false);
  const [copiedRtdbRules, setCopiedRtdbRules] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playSuccess();
    saveFirebaseConfig(cfg);
    setSaved(true);
    setTimeout(() => {
      onConfigSaved();
      onClose();
    }, 1000);
  };

  const handleClear = () => {
    sounds.playClick();
    clearFirebaseConfig();
    window.location.reload();
  };

  const handleCopyRules = () => {
    sounds.playClick();
    navigator.clipboard.writeText(FIRESTORE_RULES_TEXT);
    setCopiedRules(true);
    setTimeout(() => setCopiedRules(false), 2500);
  };

  const handleCopyRtdbRules = () => {
    sounds.playClick();
    navigator.clipboard.writeText(REALTIME_DB_RULES_TEXT);
    setCopiedRtdbRules(true);
    setTimeout(() => setCopiedRtdbRules(false), 2500);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
      <div className="bg-white border-b-4 border-indigo-100 p-6 sm:p-8 rounded-3xl max-w-2xl w-full shadow-2xl text-slate-800 my-8 space-y-6">
        <div className="flex items-center justify-between border-b-2 border-slate-100 pb-4">
          <div>
            <span className="text-xs font-black text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 flex items-center gap-1.5 inline-flex">
              <Database className="w-3.5 h-3.5 text-amber-600" /> Firebase Setup & Security Rules
            </span>
            <h2 className="text-xl font-black text-indigo-900 mt-1">ตั้งค่า Firebase Database จริง</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 rounded-2xl hover:bg-slate-100 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selector */}
        <div className="flex flex-wrap gap-2 border-b-2 border-slate-100 pb-2">
          <button
            onClick={() => setActiveTab('config')}
            className={`px-3 py-2 rounded-2xl text-xs font-black transition ${
              activeTab === 'config' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-indigo-50'
            }`}
          >
            🔑 ป้อน Config
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-3 py-2 rounded-2xl text-xs font-black transition ${
              activeTab === 'rules' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-indigo-50'
            }`}
          >
            🛡️ Firestore Rules (แก้สิทธิ์ Error)
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`px-3 py-2 rounded-2xl text-xs font-black transition ${
              activeTab === 'guide' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-indigo-50'
            }`}
          >
            📖 คู่มือตั้งค่า (8 ขั้นตอน)
          </button>
        </div>

        {activeTab === 'config' && (
          <form onSubmit={handleSave} className="space-y-4">
            <p className="text-xs font-bold text-slate-500">
              นำ Firebase Configuration จาก Firebase Console มาใส่เพื่อเปิดใช้งานระบบ Real-time ซิงก์คะแนนจริง
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-black text-slate-600 mb-1">API Key (apiKey)</label>
                <input
                  type="text"
                  value={cfg.apiKey}
                  onChange={(e) => setCfg({ ...cfg, apiKey: e.target.value })}
                  placeholder="AIzaSy..."
                  required
                  className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-200 focus:border-indigo-600 rounded-2xl text-xs text-slate-800 font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-600 mb-1">Auth Domain (authDomain)</label>
                <input
                  type="text"
                  value={cfg.authDomain}
                  onChange={(e) => setCfg({ ...cfg, authDomain: e.target.value })}
                  placeholder="project.firebaseapp.com"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-200 focus:border-indigo-600 rounded-2xl text-xs text-slate-800 font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-600 mb-1">Project ID (projectId)</label>
                <input
                  type="text"
                  value={cfg.projectId}
                  onChange={(e) => setCfg({ ...cfg, projectId: e.target.value })}
                  placeholder="my-algo-app"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-200 focus:border-indigo-600 rounded-2xl text-xs text-slate-800 font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-600 mb-1">Storage Bucket (storageBucket)</label>
                <input
                  type="text"
                  value={cfg.storageBucket}
                  onChange={(e) => setCfg({ ...cfg, storageBucket: e.target.value })}
                  placeholder="project.appspot.com"
                  className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-200 focus:border-indigo-600 rounded-2xl text-xs text-slate-800 font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-600 mb-1">Messaging Sender ID</label>
                <input
                  type="text"
                  value={cfg.messagingSenderId}
                  onChange={(e) => setCfg({ ...cfg, messagingSenderId: e.target.value })}
                  placeholder="123456789"
                  className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-200 focus:border-indigo-600 rounded-2xl text-xs text-slate-800 font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-600 mb-1">App ID (appId)</label>
                <input
                  type="text"
                  value={cfg.appId}
                  onChange={(e) => setCfg({ ...cfg, appId: e.target.value })}
                  placeholder="1:123:web:abc"
                  className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-200 focus:border-indigo-600 rounded-2xl text-xs text-slate-800 font-bold outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl text-xs transition shadow-md"
              >
                บันทึก Firebase Config และรีโหลด
              </button>

              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-black rounded-2xl text-xs transition"
              >
                ล้าง Config (สลับกลับ Demo)
              </button>
            </div>
            {saved && <div className="text-xs text-emerald-600 text-center font-black">บันทึก Config เรียบร้อย!</div>}
          </form>
        )}

        {activeTab === 'rules' && (
          <div className="space-y-4">
            <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 leading-relaxed font-bold">
                <p className="font-black text-amber-950">วิธีแก้ Permission Denied / Error saving rules:</p>
                <p className="mt-1">
                  • หากใช้ <strong>Firestore Database</strong> (แนะนำ) ➔ คัดลอกแบบที่ 1 ไปวางในแถบ Rules
                </p>
                <p>
                  • หากหน้าต่าง Rules ของคุณเป็น <strong>Realtime Database (มีปีกกา JSON)</strong> ➔ คัดลอกแบบที่ 2 (JSON) เพื่อไม่ให้ติด Parse Error
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-indigo-900">1. Cloud Firestore Rules (สำหรับเมนู Firestore Database):</span>
                <button
                  onClick={handleCopyRules}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black rounded-xl flex items-center gap-1.5 shadow transition"
                >
                  {copiedRules ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" /> คัดลอกแล้ว!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> คัดลอก Firestore Rules
                    </>
                  )}
                </button>
              </div>
              <pre className="bg-slate-900 text-emerald-300 p-3 rounded-2xl text-[11px] font-mono overflow-x-auto border border-slate-800">
                {FIRESTORE_RULES_TEXT}
              </pre>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-700">2. Realtime Database Rules (สำหรับเมนู Realtime Database):</span>
                <button
                  onClick={handleCopyRtdbRules}
                  className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-[11px] font-black rounded-xl flex items-center gap-1.5 shadow transition"
                >
                  {copiedRtdbRules ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" /> คัดลอกแล้ว!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> คัดลอก JSON Rules
                    </>
                  )}
                </button>
              </div>
              <pre className="bg-slate-900 text-amber-300 p-3 rounded-2xl text-[11px] font-mono overflow-x-auto border border-slate-800">
                {REALTIME_DB_RULES_TEXT}
              </pre>
            </div>
          </div>
        )}

        {activeTab === 'guide' && (
          <div className="space-y-3 text-xs text-slate-700 max-h-80 overflow-y-auto pr-2">
            <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100">
              <strong className="text-indigo-900 font-black block">STEP 1: สร้าง Firebase Project</strong>
              ไปที่ <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-indigo-600 underline font-black">console.firebase.google.com</a> แล้วสร้าง Project ใหม่
            </div>
            <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100">
              <strong className="text-indigo-900 font-black block">STEP 2: เปิด Authentication</strong>
              ไปที่เมนู Authentication ➔ Get Started
            </div>
            <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100">
              <strong className="text-indigo-900 font-black block">STEP 3: เปิด Email/Password</strong>
              เปิดใช้วิธีลงชื่อเข้าใช้ด้วย อีเมล/รหัสผ่าน สำหรับครู
            </div>
            <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100">
              <strong className="text-indigo-900 font-black block">STEP 4: เปิด Anonymous Authentication</strong>
              เปิดใช้ Anonymous Auth เพื่อให้นักเรียนเข้าร่วมได้ทันทีโดยไม่ต้องกรอกรหัสผ่าน
            </div>
            <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100">
              <strong className="text-indigo-900 font-black block">STEP 5: สร้าง Cloud Firestore Database</strong>
              ไปที่ Firestore Database ➔ Create Database เลือกโซน asia-southeast1 (Bangkok / Singapore)
            </div>
            <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100">
              <strong className="text-indigo-900 font-black block">STEP 6: วาง Security Rules</strong>
              ไปที่แถบ Rules ใน Firestore Database แล้วคัดลอก Rules จากแถบ <strong>"Firestore Rules"</strong> ไปวางแล้วกด Publish
            </div>
            <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100">
              <strong className="text-indigo-900 font-black block">STEP 7: คัดลอก Firebase Config</strong>
              ไปที่ Project Settings ⚙️ ➔ General ➔ Your apps ➔ Web (&lt;/&gt;) คัดลอก firebaseConfig นำมาวางในแอป
            </div>
            <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100">
              <strong className="text-indigo-900 font-black block">STEP 8: บันทึกและพร้อมใช้งาน</strong>
              ระบบจะสลับเป็น 🟢 Firebase Live Mode ทันทีที่มีการป้อน Config ที่ถูกต้อง!
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

