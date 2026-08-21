'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ShieldAlert, CheckCircle2, XCircle, ArrowRight, Loader2, Play, Volume2, Award, Home, RefreshCw } from 'lucide-react';

interface Question {
  id: string;
  scene_id: string;
  sub_question_order: number;
  question_text: string;
  options: { id: string; text: string }[];
  correct_option: string;
  explanation: string;
  points: number;
}

interface Scene {
  id: string;
  scene_title: string;
  scenario_description: string;
  media_type: string;
  media_url: string;
  questions: Question[];
}

export default function QuizPage() {
  const router = useRouter();
  const params = useParams();
  const quizId = parseInt(params.id as string, 10);

  const [user, setUser] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Data State
  const [quizTitle, setQuizTitle] = useState('');
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [flatQuestions, setFlatQuestions] = useState<{ question: Question; scene: Scene }[]>([]);
  
  // Navigation State
  const [currentIdx, setCurrentIdx] = useState(0); // Index from 0 to totalQuestions - 1
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [answersLog, setAnswersLog] = useState<{ questionId: string; selectedOption: string; isCorrect: boolean; scoreEarned: number }[]>([]);

  // Results State
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Load User and Quiz questions
  useEffect(() => {
    const savedUser = localStorage.getItem('clinical-user');
    if (!savedUser) {
      router.push('/');
      return;
    }
    setUser(JSON.parse(savedUser));

    const fetchQuizData = async () => {
      try {
        const response = await fetch(`/api/quiz?quizId=${quizId}`);
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || '無法載入題目，請稍後再試');
        }
        const data = await response.json();
        setQuizTitle(data.quiz.title);
        setScenes(data.scenes);

        // Flatten questions for sequential linear navigation
        const flat: { question: Question; scene: Scene }[] = [];
        data.scenes.forEach((scene: Scene) => {
          scene.questions.forEach((question: Question) => {
            flat.push({ question, scene });
          });
        });
        setFlatQuestions(flat);
      } catch (err: any) {
        setError(err.message || '連線錯誤');
      } finally {
        setLoading(false);
      }
    };

    fetchQuizData();
  }, [quizId, router]);

  // Restart video playback when scene changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {
        // Ignore autoplay blocks
      });
    }
  }, [currentIdx, flatQuestions]);

  const handleSelectOption = (optionId: string) => {
    if (showFeedback) return; // Prevent clicking after submission
    setSelectedOption(optionId);
  };

  const handleVerifyAnswer = () => {
    if (!selectedOption || showFeedback) return;

    const currentItem = flatQuestions[currentIdx];
    const isCorrect = selectedOption === currentItem.question.correct_option;
    const scoreEarned = isCorrect ? currentItem.question.points : 0;

    // Log answer
    setAnswersLog(prev => [
      ...prev,
      {
        questionId: currentItem.question.id,
        selectedOption,
        isCorrect,
        scoreEarned
      }
    ]);

    setShowFeedback(true);
  };

  const handleNext = async () => {
    if (currentIdx < flatQuestions.length - 1) {
      // Go to next question
      setCurrentIdx(prev => prev + 1);
      setSelectedOption(null);
      setShowFeedback(false);
    } else {
      // Completed all questions! Submit results to Neon
      setSubmitting(true);
      
      // Calculate final score based on accumulated points
      const correctAnswers = answersLog.filter(a => a.isCorrect);
      // Ensure exactly 10 questions and 100 points
      const score = Math.round((correctAnswers.length / flatQuestions.length) * 100);
      setFinalScore(score);

      try {
        const response = await fetch('/api/attempts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user?.id,
            quizId,
            score,
            answers: answersLog
          }),
        });

        if (!response.ok) {
          throw new Error('儲存測驗記錄失敗');
        }

        setQuizCompleted(true);
      } catch (err: any) {
        console.error(err);
        // Still show completion even if network save failed temporarily
        setQuizCompleted(true);
      } finally {
        setSubmitting(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center bg-slate-950 p-6">
        <Loader2 className="w-10 h-10 text-teal-500 animate-spin mb-4" />
        <p className="text-sm text-slate-300">正在為您隨機抽選情境題組，請稍後...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center bg-slate-950 p-6 text-center">
        <ShieldAlert className="w-12 h-12 text-rose-500 mb-4 animate-bounce" />
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

  // ----------------------------------------------------
  // RENDER: Score Screen (Completed Quiz)
  // ----------------------------------------------------
  if (quizCompleted) {
    const isPassing = finalScore >= 80;
    
    return (
      <div className="flex-1 flex flex-col justify-between p-6 bg-slate-950">
        <div className="text-center my-auto flex flex-col items-center">
          <div className={`p-4 rounded-full border mb-6 ${
            isPassing 
              ? 'bg-teal-500/10 border-teal-500/30 text-teal-400' 
              : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
          }`}>
            <Award size={48} />
          </div>
          
          <h2 className="text-xl font-black text-white mb-2">測驗評量完成！</h2>
          <p className="text-xs text-slate-400 mb-8">{quizTitle}</p>

          {/* Large Circle Score Display */}
          <div className="relative w-40 h-40 flex items-center justify-center rounded-full border-4 border-slate-800 mb-6">
            {/* Background Glow */}
            <div className={`absolute inset-0 rounded-full blur-xl opacity-20 ${
              isPassing ? 'bg-teal-500' : 'bg-amber-500'
            }`} />
            <div className="text-center z-10">
              <span className="text-5xl font-black text-white">{finalScore}</span>
              <span className="text-xs block text-slate-400 mt-1">得分 / 滿分 100</span>
            </div>
          </div>

          <h3 className={`text-base font-bold ${isPassing ? 'text-teal-400' : 'text-amber-400'}`}>
            {isPassing ? '🎉 通過評值！專業技能非常優秀' : '💡 還差一點！建議重溫教案再次挑戰'}
          </h3>
          <p className="text-xs text-slate-500 mt-2 px-6">
            測驗成績已上傳至主管品質管理追蹤庫，您可以隨時返回大廳重新測驗。
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3 mt-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-white font-bold py-3.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2"
          >
            <Home size={16} />
            <span>返回測驗大廳</span>
          </button>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white font-bold py-3.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2"
          >
            <RefreshCw size={16} />
            <span>重新隨機抽題測驗</span>
          </button>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER: Running Quiz Screen
  // ----------------------------------------------------
  const currentItem = flatQuestions[currentIdx];
  const { question, scene } = currentItem;
  const isAnswered = showFeedback;

  return (
    <div className="flex-1 flex flex-col justify-between bg-slate-950 overflow-y-auto">
      {/* Top Header */}
      <div className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-5 py-3 sticky top-0 z-20 flex justify-between items-center">
        <div>
          <span className="text-[10px] font-bold text-teal-400 tracking-wider block uppercase">
            {quizTitle}
          </span>
          <span className="text-sm font-black text-white">
            問題 {currentIdx + 1} / {flatQuestions.length}
          </span>
        </div>
        <button
          onClick={() => {
            if (confirm('確定要放棄本次測驗並返回大廳？已答對分數將不會被存檔。')) {
              router.push('/dashboard');
            }
          }}
          className="text-xs text-slate-500 hover:text-slate-300 font-bold px-3 py-1.5 rounded-lg border border-slate-800"
        >
          放棄
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1 bg-slate-800">
        <div
          className="h-1 bg-teal-500 transition-all duration-300"
          style={{ width: `${((currentIdx) / flatQuestions.length) * 100}%` }}
        />
      </div>

      {/* Main Container */}
      <div className="p-5 flex-1 flex flex-col gap-4">
        {/* Scene Heading */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800/80 rounded-xl px-3.5 py-2">
          <span className="w-2.5 h-2.5 bg-teal-500 rounded-full animate-ping" />
          <span className="text-xs font-bold text-slate-300">目前臨床場景：{scene.scene_title}</span>
        </div>

        {/* Video / Image Showcase Box */}
        <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-inner flex items-center justify-center">
          {scene.media_type === 'video' ? (
            <video
              ref={videoRef}
              src={scene.media_url}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={scene.media_url}
              alt={scene.scene_title}
              className="w-full h-full object-cover"
            />
          )}
          {/* Overlay Tag */}
          <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md border border-slate-800 text-[10px] text-teal-400 font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
            <Play size={10} className="fill-current" />
            <span>臨床互動影片模擬</span>
          </div>
        </div>

        {/* Expandable Scenario Card */}
        <div className="glass-card rounded-2xl p-4 border border-slate-800 shadow-md">
          <span className="text-[10px] text-teal-400 font-bold uppercase tracking-wider block mb-1">
            病患現況簡介 (Scenario)
          </span>
          <p className="text-xs text-slate-300 leading-relaxed font-medium">
            {scene.scenario_description}
          </p>
        </div>

        {/* Question Text */}
        <div className="my-2">
          <h2 className="text-sm font-extrabold text-white leading-relaxed">
            {question.question_text}
          </h2>
        </div>

        {/* Options List */}
        <div className="flex flex-col gap-2.5">
          {question.options.map((opt) => {
            const isSelected = selectedOption === opt.id;
            const isCorrectAnswer = opt.id === question.correct_option;
            
            let btnStyle = 'border-slate-800/80 bg-slate-900/60 text-slate-300 hover:border-slate-700';
            
            if (isSelected) {
              btnStyle = 'border-teal-500 bg-teal-500/10 text-teal-300';
            }

            if (isAnswered) {
              if (isCorrectAnswer) {
                btnStyle = 'border-emerald-500 bg-emerald-500/10 text-emerald-400';
              } else if (isSelected) {
                btnStyle = 'border-rose-500 bg-rose-500/10 text-rose-400';
              } else {
                btnStyle = 'border-slate-900 bg-slate-950/40 text-slate-600 opacity-60';
              }
            }

            return (
              <button
                key={opt.id}
                onClick={() => handleSelectOption(opt.id)}
                disabled={isAnswered}
                className={`w-full text-left border rounded-2xl px-4 py-3 text-xs leading-relaxed font-semibold transition-all relative flex gap-3 ${btnStyle}`}
              >
                <span className="w-5 h-5 flex items-center justify-center rounded-full bg-black/25 text-[10px] border border-white/5 font-bold shrink-0">
                  {opt.id}
                </span>
                <span>{opt.text}</span>

                {/* Rightmost check indicators */}
                {isAnswered && isCorrectAnswer && (
                  <CheckCircle2 size={16} className="text-emerald-400 ml-auto shrink-0 self-center" />
                )}
                {isAnswered && isSelected && !isCorrectAnswer && (
                  <XCircle size={16} className="text-rose-400 ml-auto shrink-0 self-center" />
                )}
              </button>
            );
          })}
        </div>

        {/* Correct/Incorrect Explanation Section */}
        {isAnswered && (
          <div className={`rounded-2xl p-4 border animate-fadeIn mt-2 ${
            selectedOption === question.correct_option
              ? 'bg-emerald-500/5 border-emerald-500/20 text-slate-300'
              : 'bg-rose-500/5 border-rose-500/20 text-slate-300'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {selectedOption === question.correct_option ? (
                <>
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  <span className="text-xs font-black text-emerald-400">解答正確 (+10 分)</span>
                </>
              ) : (
                <>
                  <XCircle size={16} className="text-rose-400" />
                  <span className="text-xs font-black text-rose-400">解答錯誤 (本題 0 分)</span>
                </>
              )}
            </div>
            <p className="text-xs font-medium leading-relaxed">
              <strong className="text-slate-200">【機轉解析】</strong>
              {question.explanation}
            </p>
          </div>
        )}
      </div>

      {/* Sticky Bottom Actions Bar */}
      <div className="bg-slate-900/80 border-t border-slate-800 px-5 py-4 flex items-center justify-between sticky bottom-0 z-20 backdrop-blur-md">
        <span className="text-[10px] text-slate-500">本題配分 10 分 ‧ 心導管評核</span>
        
        {!isAnswered ? (
          <button
            onClick={handleVerifyAnswer}
            disabled={!selectedOption}
            className={`px-6 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all ${
              selectedOption
                ? 'bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800/80'
            }`}
          >
            核對答案
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={submitting}
            className="bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            {submitting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : currentIdx < flatQuestions.length - 1 ? (
              <>
                <span>下一題</span>
                <ArrowRight size={12} />
              </>
            ) : (
              <span>完成測驗</span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
