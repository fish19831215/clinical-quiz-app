'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Wind, ShieldAlert, LogOut, Award, ClipboardCheck, ArrowRight, User } from 'lucide-react';

interface Quiz {
  id: number;
  title: string;
  description: string;
  icon: any;
  color: string;
  textColor: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; name: string; staff_id: string; department: string } | null>(null);
  const [scores, setScores] = useState<Record<number, { max_score: number; attempts_count: number }>>({});
  const [loading, setLoading] = useState(true);

  const quizzes: Quiz[] = [
    {
      id: 1,
      title: '心導管照護',
      description: '包含橈動脈板加壓、股動脈平躺限制、6Ps 肢體血流與腹膜後出血等致命紅旗。',
      icon: Heart,
      color: 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/15',
      textColor: 'text-rose-400',
    },
    {
      id: 2,
      title: '呼吸道感染與肺炎',
      description: '包含吸入性肺炎好發部位、qSOFA 敗血評分、給氧升階、排痰 4 部曲與管灌 SOP。',
      icon: Wind,
      color: 'bg-teal-500/10 border-teal-500/20 text-teal-400 hover:bg-teal-500/15',
      textColor: 'text-teal-400',
    },
    {
      id: 3,
      title: '化學治療患者評估',
      description: '包含 ANC 與血小板安全門檻、PICC 導管通路檢查、化療發泡藥外滲與過敏處置。',
      icon: ShieldAlert,
      color: 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/15',
      textColor: 'text-amber-400',
    },
  ];

  useEffect(() => {
    const savedUser = localStorage.getItem('clinical-user');
    if (!savedUser) {
      router.push('/');
      return;
    }

    const parsedUser = JSON.parse(savedUser);
    setUser(parsedUser);

    // Fetch scores from Neon
    const fetchScores = async () => {
      try {
        const response = await fetch(`/api/attempts?userId=${parsedUser.id}`);
        if (response.ok) {
          const data = await response.json();
          const scoreMap: Record<number, { max_score: number; attempts_count: number }> = {};
          data.attemptsSummary.forEach((item: any) => {
            scoreMap[item.quiz_id] = {
              max_score: item.max_score,
              attempts_count: parseInt(item.attempts_count, 10),
            };
          });
          setScores(scoreMap);
        }
      } catch (err) {
        console.error('Error fetching scores:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchScores();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('clinical-user');
    router.push('/');
  };

  const handleStartQuiz = (quizId: number) => {
    router.push(`/quiz/${quizId}`);
  };

  if (!user) return null;

  return (
    <div className="flex-1 flex flex-col p-5 bg-slate-950 overflow-y-auto">
      {/* Top Header Section */}
      <div className="flex justify-between items-center mb-6 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-teal-500/10 rounded-xl border border-teal-500/30 text-teal-400">
            <User size={20} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-base">{user.name}</span>
              <span className="text-[10px] bg-slate-800 border border-slate-700/60 rounded px-1.5 py-0.5 text-slate-400">{user.staff_id}</span>
            </div>
            <span className="text-xs text-slate-400">{user.department}</span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="p-2.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl transition-colors cursor-pointer border border-slate-800/60"
          title="登出"
        >
          <LogOut size={18} />
        </button>
      </div>

      {/* Title */}
      <div className="mb-6">
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <ClipboardCheck className="text-teal-500" />
          <span>測驗主題清單</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">請選擇以下其中一個臨床主題進行情境問答：</p>
      </div>

      {/* Main Quizzes List */}
      <div className="flex flex-col gap-4 flex-1">
        {quizzes.map((quiz) => {
          const QuizIcon = quiz.icon;
          const scoreInfo = scores[quiz.id];
          const hasScore = scoreInfo !== undefined;
          
          return (
            <div
              key={quiz.id}
              onClick={() => handleStartQuiz(quiz.id)}
              className={`glass-card rounded-2xl p-5 border shadow-lg hover:shadow-xl transition-all cursor-pointer flex flex-col gap-3 group relative overflow-hidden ${quiz.color}`}
            >
              {/* Score Badge */}
              <div className="absolute top-4 right-4">
                {loading ? (
                  <div className="w-12 h-5 bg-slate-800 animate-pulse rounded-full" />
                ) : hasScore ? (
                  <div className="flex items-center gap-1 bg-teal-500/20 border border-teal-500/30 text-teal-300 font-bold px-2 py-0.5 rounded-full text-[10px]">
                    <Award size={10} />
                    <span>最高得 {scoreInfo.max_score} 分</span>
                  </div>
                ) : (
                  <span className="text-[10px] bg-slate-800/60 border border-slate-700/50 text-slate-400 px-2 py-0.5 rounded-full">
                    尚未受測
                  </span>
                )}
              </div>

              {/* Title Section */}
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl border border-current bg-current/5`}>
                  <QuizIcon size={22} />
                </div>
                <h3 className="font-extrabold text-white text-base group-hover:translate-x-0.5 transition-transform">
                  {quiz.title}
                </h3>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-300 leading-relaxed pr-16">
                {quiz.description}
              </p>

              {/* Footer Button Indicator */}
              <div className="flex justify-between items-center border-t border-slate-800/50 pt-3 mt-1">
                <span className="text-[10px] text-slate-500">共 10 題 ‧ 滿分 100 分</span>
                <span className={`text-xs font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform ${quiz.textColor}`}>
                  <span>{hasScore ? '再次挑戰' : '進入測驗'}</span>
                  <ArrowRight size={12} />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Admin Panel Link */}
      <div
        onClick={() => router.push('/admin')}
        className="mt-6 p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 transition-all flex justify-between items-center cursor-pointer group"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-slate-800 rounded-lg text-slate-400">
            📊
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">主管管理專區</h4>
            <p className="text-[10px] text-slate-500 mt-0.5">查看科部同仁測驗進度及匯出 Excel 報表</p>
          </div>
        </div>
        <ArrowRight size={14} className="text-slate-500 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </div>
  );
}
