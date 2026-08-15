import React, { useState } from 'react';
import { FirebaseConfigType } from '../types';
import { getStoredFirebaseConfig, saveFirebaseConfig, clearFirebaseConfig, testFirebaseConnection, FirebaseConnectionStatus } from '../firebase/config';
import { X, CheckCircle, Database, Key, Server, RefreshCw, Copy, ShieldAlert, Check, Play, AlertCircle, Sparkles } from 'lucide-react';
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
  const [rawSnippet, setRawSnippet] = useState('');
  const [activeTab, setActiveTab] = useState<'config' | 'rules' | 'guide'>('config');
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<FirebaseConnectionStatus | null>(null);
  const [copiedRules, setCopiedRules] = useState(false);
  const [copiedRtdbRules, setCopiedRtdbRules] = useState(false);

  // Auto parser for pasted snippet
  const handleParseSnippet = (text: string) => {
    setRawSnippet(text);
    if (!text.trim()) return;

    try {
      const extracted: Partial<FirebaseConfigType> = {};
      const apiKeyMatch = text.match(/apiKey\s*:\s*["']([^"']+)["']/);
      const authDomainMatch = text.match(/authDomain\s*:\s*["']([^"']+)["']/);
      const projectIdMatch = text.match(/projectId\s*:\s*["']([^"']+)["']/);
      const storageBucketMatch = text.match(/storageBucket\s*:\s*["']([^"']+)["']/);
      const messagingSenderIdMatch = text.match(/messagingSenderId\s*:\s*["']([^"']+)["']/);
      const appIdMatch = text.match(/appId\s*:\s*["']([^"']+)["']/);

      if (apiKeyMatch) extracted.apiKey = apiKeyMatch[1];
      if (authDomainMatch) extracted.authDomain = authDomainMatch[1];
      if (projectIdMatch) extracted.projectId = projectIdMatch[1];
      if (storageBucketMatch) extracted.storageBucket = storageBucketMatch[1];
      if (messagingSenderIdMatch) extracted.messagingSenderId = messagingSenderIdMatch[1];
      if (appIdMatch) extracted.appId = appIdMatch[1];

      if (extracted.apiKey || extracted.projectId) {
        setCfg((prev) => ({
          ...prev,
          ...extracted
        }));
        sounds.playSuccess();
      }
    } catch (e) {
      console.warn('Error parsing snippet', e);
    }
  };

  const handleTestConnection = async () => {
    sounds.playClick();
    setTesting(true);
    setTestResult(null);
    // Temporary save to test
    saveFirebaseConfig(cfg);
    const res = await testFirebaseConnection();
    setTestResult(res);
    setTesting(false);
  };

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
            <h2 className="text-xl font-black text-indigo-900 mt-1">ตั้งค่า Firebase Cloud Database</h2>
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
            🔑 ป้อน Firebase Config
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
            📖 คู่มือ 8 ขั้นตอน (สร้างฟรี 100%)
          </button>
        </div>

        {activeTab === 'config' && (
          <form onSubmit={handleSave} className="space-y-4">
            {/* Quick Paste Code Box */}
            <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-2">
              <label className="block text-xs font-black text-indigo-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> วางโค้ด firebaseConfig ทั้งก้อนแบบเร็ว (Auto-Fill)
              </label>
              <textarea
                value={rawSnippet}
                onChange={(e) => handleParseSnippet(e.target.value)}
                placeholder={'วางโค้ด เช่น:\nconst firebaseConfig = {\n  apiKey: "AIzaSy...",\n  authDomain: "...",\n  projectId: "..."\n};'}
                rows={2}
                className="w-full px-3 py-2 bg-white border border-indigo-200 focus:border-indigo-600 rounded-xl text-xs font-mono outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-black text-slate-600 mb-1">API Key (apiKey) *</label>
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
                <label className="block text-[11px] font-black text-slate-600 mb-1">Project ID (projectId) *</label>
                <input
                  type="text"
                  value={cfg.projectId}
                  onChange={(e) => setCfg({ ...cfg, projectId: e.target.value })}
                  placeholder="my-classroom-app"
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

            {/* Test Connection Button & Result Banner */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing || !cfg.apiKey || !cfg.projectId}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black rounded-2xl text-xs transition border border-slate-300 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 text-indigo-600 fill-indigo-600" />
                {testing ? 'กำลังทดสอบเชื่อมต่อ Firestore...' : '🔍 ทดสอบการเชื่อมต่อ Firebase ทันที (Test Connection)'}
              </button>

              {testResult && (
                <div
                  className={`mt-2.5 p-3 rounded-2xl text-xs font-bold flex items-start gap-2.5 ${
                    testResult.status === 'live'
                      ? 'bg-emerald-50 border border-emerald-300 text-emerald-900'
                      : 'bg-rose-50 border border-rose-300 text-rose-900'
                  }`}
                >
                  {testResult.status === 'live' ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="font-black">
                      {testResult.status === 'live' ? '✅ เชื่อมต่อสำเร็จ!' : '❌ เชื่อมต่อไม่สำเร็จ'}
                    </div>
                    <p className="text-[11px] mt-0.5 leading-relaxed">{testResult.message}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl text-xs transition shadow-md"
              >
                บันทึก Firebase Config และเริ่มใช้งาน
              </button>

              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-black rounded-2xl text-xs transition"
              >
                ล้าง Config (กลับ Demo Mode)
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
                <p className="font-black text-amber-950">วิธีแก้ Permission Denied / นักเรียนกรอกรหัสไม่ได้:</p>
                <p className="mt-1">
                  1. ไปที่ Firebase Console ➔ <strong>Firestore Database</strong> ➔ แถบ <strong>Rules</strong>
                </p>
                <p>
                  2. วางโค้ดด้านล่างนี้ลงไป แล้วกดปุ่ม <strong>Publish</strong> เพื่ออนุญาตให้นักเรียนและคุณครูอ่าน/เขียนห้องเรียนได้
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-indigo-900">Cloud Firestore Rules:</span>
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
          </div>
        )}

        {activeTab === 'guide' && (
          <div className="space-y-3 text-xs text-slate-700 max-h-80 overflow-y-auto pr-2">
            <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100">
              <strong className="text-indigo-900 font-black block">STEP 1: สร้าง Firebase Project ฟรี</strong>
              ไปที่ <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-indigo-600 underline font-black">console.firebase.google.com</a> แล้วสร้าง Project ใหม่
            </div>
            <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100">
              <strong className="text-indigo-900 font-black block">STEP 2: สร้าง Cloud Firestore Database</strong>
              ไปที่ Firestore Database ➔ Create Database เลือกโซน asia-southeast1
            </div>
            <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100">
              <strong className="text-indigo-900 font-black block">STEP 3: ตั้งค่า Rules (สำคัญมาก)</strong>
              ไปที่แถบ Rules ใน Firestore Database แล้วคัดลอก Rules จากแถบ <strong>"Firestore Rules"</strong> ไปวางแล้วกด Publish
            </div>
            <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100">
              <strong className="text-indigo-900 font-black block">STEP 4: นำ Firebase Config มาใส่</strong>
              ไปที่ Project Settings ⚙️ ➔ General ➔ Your apps ➔ Web (&lt;/&gt;) คัดลอก firebaseConfig นำมาวางในช่อง Auto-Fill
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


