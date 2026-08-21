'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, ShieldAlert, Award } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [staffId, setStaffId] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('13樓內科病房');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto redirect if already logged in
  useEffect(() => {
    const savedUser = localStorage.getItem('clinical-user');
    if (savedUser) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffId.trim() || !name.trim() || !department) {
      setError('請填寫所有欄位');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId, name, department }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '登入失敗，請稍後再試');
      }

      // Save user session
      localStorage.setItem('clinical-user', JSON.stringify(data.user));
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || '連線錯誤');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-6 relative overflow-hidden bg-slate-950">
      {/* Background Decorative Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[50%] pulse-glow-teal z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[120%] h-[50%] pulse-glow-rose z-0" />

      {/* Top Title Section */}
      <div className="z-10 text-center mt-10">
        <div className="inline-flex items-center justify-center p-3 bg-teal-500/10 rounded-full border border-teal-500/30 text-teal-400 mb-4 animate-pulse">
          <Activity size={32} />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white mb-2">
          臨床照護情境互動測驗
        </h1>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800/80 border border-slate-700/60 rounded-full text-xs text-slate-300 font-medium">
          <ShieldAlert size={14} className="text-rose-400" />
          <span>降低延遲下班 ‧ 精實交班系列</span>
        </div>
      </div>

      {/* Middle Login Card */}
      <div className="z-10 my-auto">
        <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
          <h2 className="text-lg font-bold text-slate-100 mb-2 border-b border-slate-800 pb-2">
            醫護同仁登入
          </h2>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-lg p-3 text-sm flex items-center gap-2">
              <ShieldAlert size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Staff ID Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400 font-semibold" htmlFor="staffId">
              員工工號 (Staff ID)
            </label>
            <input
              id="staffId"
              type="text"
              placeholder="例如: N12345"
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-500 transition-colors"
              disabled={loading}
            />
          </div>

          {/* Name Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400 font-semibold" htmlFor="name">
              姓名 (Name)
            </label>
            <input
              id="name"
              type="text"
              placeholder="例如: 王小美"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-500 transition-colors"
              disabled={loading}
            />
          </div>

          {/* Department Select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400 font-semibold" htmlFor="department">
              服務單位 (Department)
            </label>
            <div className="relative">
              <select
                id="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-500 transition-colors appearance-none cursor-pointer"
                disabled={loading}
              >
                <option value="13樓內科病房">13樓內科病房</option>
                <option value="12樓內科病房">12樓內科病房</option>
                <option value="11樓內科病房">11樓內科病房</option>
                <option value="加護病房 (ICU)">加護病房 (ICU)</option>
                <option value="急診室 (ER)">急診室 (ER)</option>
                <option value="門診部">門診部</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 text-xs">
                ▼
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-teal-600/10 hover:shadow-teal-600/20 transition-all text-sm mt-2 flex items-center justify-center"
            disabled={loading}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              '開始測驗'
            )}
          </button>
        </form>
      </div>

      {/* Footer Section */}
      <div className="z-10 text-center text-xs text-slate-500 flex flex-col gap-1">
        <div className="flex items-center justify-center gap-1">
          <Award size={14} className="text-teal-500" />
          <span>品質管理委員會教育訓練小組</span>
        </div>
        <span>© 2026 Hospital Quality Control Project</span>
      </div>
    </div>
  );
}
