'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, ArrowLeft, Download, Award, FileSpreadsheet, Loader2, Users, ClipboardCheck, Percent } from 'lucide-react';

interface Weakness {
  scene_title: string;
  quiz_title: string;
  total_answers: string;
  wrong_answers: string;
  error_rate: string;
}

interface QuizStat {
  quiz_id: number;
  title: string;
  avg_score: string;
  attempts_count: string;
}

interface RecentAttempt {
  score: number;
  completed_at: string;
  name: string;
  department: string;
  quiz_title: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  
  // Stats State
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [quizStats, setQuizStats] = useState<QuizStat[]>([]);
  const [weaknesses, setWeaknesses] = useState<Weakness[]>([]);
  const [recentAttempts, setRecentAttempts] = useState<RecentAttempt[]>([]);

  useEffect(() => {
    // Basic auth check: redirect to login if no profile found
    const savedUser = localStorage.getItem('clinical-user');
    if (!savedUser) {
      router.push('/');
      return;
    }

    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/stats');
        if (!response.ok) {
          throw new Error('無法載入統計數據');
        }
        const data = await response.json();
        setTotalUsers(data.stats.totalUsers);
        setTotalAttempts(data.stats.totalAttempts);
        setQuizStats(data.stats.quizStats);
        setWeaknesses(data.stats.weaknesses);
        setRecentAttempts(data.stats.recentAttempts);
      } catch (err: any) {
        setError(err.message || '載入數據發生錯誤');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [router]);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      // Trigger browser file download directly from our API route
      window.location.href = '/api/admin/export';
    } catch (err) {
      console.error(err);
      alert('匯出失敗，請稍後再試');
    } finally {
      // Simulate download time to let loader spin
      setTimeout(() => setExporting(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center bg-slate-950 p-6">
        <Loader2 className="w-10 h-10 text-teal-500 animate-spin mb-4" />
        <p className="text-sm text-slate-300">正在加載主管統計分析數據...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center bg-slate-950 p-6 text-center">
        <ShieldAlert className="w-12 h-12 text-rose-500 mb-4" />
        <h3 className="text-lg font-bold text-white mb-2">載入錯誤</h3>
        <p className="text-xs text-slate-400 mb-6">{error}</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="bg-slate-800 text-white font-bold py-2.5 px-6 rounded-xl text-sm"
        >
          返回大廳
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-5 bg-slate-950 overflow-y-auto">
      {/* Top Header */}
      <div className="flex justify-between items-center mb-6 border-b border-slate-800/80 pb-4">
        <button
          onClick={() => router.push('/dashboard')}
          className="p-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
        >
          <ArrowLeft size={14} />
          <span>大廳</span>
        </button>
        <span className="text-xs font-bold text-teal-400 tracking-wider">
          📊 主管管理後台
        </span>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="glass-card rounded-2xl p-4 border border-slate-800/80 shadow-md">
          <div className="text-slate-400 mb-2 flex items-center gap-1">
            <Users size={14} className="text-teal-400" />
            <span className="text-[10px] font-bold uppercase">註冊同仁數</span>
          </div>
          <span className="text-2xl font-black text-white">{totalUsers}</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">內科病房同仁</span>
        </div>
        <div className="glass-card rounded-2xl p-4 border border-slate-800/80 shadow-md">
          <div className="text-slate-400 mb-2 flex items-center gap-1">
            <ClipboardCheck size={14} className="text-rose-400" />
            <span className="text-[10px] font-bold uppercase">累計受測次數</span>
          </div>
          <span className="text-2xl font-black text-white">{totalAttempts}</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">總答題次數</span>
        </div>
      </div>

      {/* Quiz Average Scores */}
      <div className="mb-6">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          各主題測驗平均得分
        </h3>
        <div className="flex flex-col gap-3">
          {quizStats.map(stat => (
            <div key={stat.quiz_id} className="p-3.5 bg-slate-900/60 border border-slate-850 rounded-xl flex justify-between items-center">
              <div>
                <h4 className="text-xs font-black text-white">{stat.title}</h4>
                <span className="text-[10px] text-slate-500">已受測 {stat.attempts_count} 次</span>
              </div>
              <div className="text-right">
                <span className="text-base font-extrabold text-teal-400 block">{stat.avg_score}分</span>
                <span className="text-[9px] text-slate-500">平均分數</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weakness Analysis Chart (Top 5 Error Rates) */}
      <div className="mb-6">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <ShieldAlert size={14} className="text-amber-400" />
          <span>臨床照護弱點排名 (錯誤率最高)</span>
        </h3>
        
        {weaknesses.length === 0 ? (
          <div className="text-center p-6 bg-slate-900/30 border border-slate-900 rounded-xl text-xs text-slate-500">
            尚無答題錯題紀錄數據
          </div>
        ) : (
          <div className="flex flex-col gap-4 p-4 bg-slate-900/40 border border-slate-800 rounded-2xl">
            {weaknesses.map((weak, index) => (
              <div key={index} className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1.5 pr-2">
                    <span className="w-4 h-4 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[9px] font-bold flex items-center justify-center rounded">
                      {index + 1}
                    </span>
                    <span className="font-extrabold text-slate-200 truncate max-w-[180px]" title={weak.scene_title}>
                      {weak.scene_title}
                    </span>
                  </div>
                  <span className="text-[10px] text-amber-400 font-bold">{weak.error_rate}% 錯誤率</span>
                </div>
                
                {/* Horizontal Progress Bar */}
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-500"
                    style={{ width: `${weak.error_rate}%` }}
                  />
                </div>
                <span className="text-[9px] text-slate-500">{weak.quiz_title}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Export to Excel Section */}
      <div className="mb-6 p-4 rounded-2xl border border-teal-500/15 bg-teal-500/5 flex flex-col gap-3">
        <h4 className="text-xs font-bold text-slate-200">受測結果匯出 (總表試算表)</h4>
        <p className="text-[10px] text-slate-400 leading-relaxed">
          下載各科部同仁受測成績清單。本報表符合 Traditional Chinese UTF-8 BOM 編碼，可直接以 Excel 開啟無亂碼。
        </p>
        <button
          onClick={handleExportCSV}
          disabled={exporting}
          className="w-full bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white font-bold py-3.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-teal-600/10"
        >
          {exporting ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>正在匯出報表...</span>
            </>
          ) : (
            <>
              <FileSpreadsheet size={16} />
              <span>匯出科部測驗 Excel 報表</span>
            </>
          )}
        </button>
      </div>

      {/* Recent Attempts Log */}
      <div className="mb-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          近期受測同仁紀錄
        </h3>
        
        {recentAttempts.length === 0 ? (
          <div className="text-center p-6 bg-slate-900/30 border border-slate-900 rounded-xl text-xs text-slate-500">
            尚無最近作答紀錄
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 max-h-60 overflow-y-auto pr-1">
            {recentAttempts.map((attempt, index) => (
              <div key={index} className="p-3 bg-slate-900/40 border border-slate-850 rounded-xl flex justify-between items-center text-xs">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white">{attempt.name}</span>
                    <span className="text-[9px] text-slate-500 bg-slate-800 px-1 py-0.5 rounded">{attempt.department}</span>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1">{attempt.quiz_title}</p>
                </div>
                <div className="text-right">
                  <span className={`font-bold block ${attempt.score >= 80 ? 'text-teal-400' : 'text-amber-400'}`}>
                    {attempt.score} 分
                  </span>
                  <span className="text-[8px] text-slate-500">
                    {new Date(attempt.completed_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
