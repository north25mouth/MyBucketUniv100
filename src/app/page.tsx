"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, LayoutGrid, UserCircle, CheckCircle2, X, Heart } from "lucide-react";
import Link from "next/link";
import { my100List } from "@/data/my100list";
import { useAuth } from "@/context/AuthContext";
import { useTrackLike } from "@/hooks/useTrackLike";

// Map all 100 tracks regardless of completion status
const allTracks = my100List;

const variants = {
  enter: (direction: number) => {
    return {
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.9,
    };
  },
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => {
    return {
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.9,
    };
  }
};

export default function SwipeViewer() {
  const [[page, direction], setPage] = useState([0, 0]);
  const [showList, setShowList] = useState(false);
  const [imageErrorMap, setImageErrorMap] = useState<Record<number, boolean>>({});
  const [mediaMeta, setMediaMeta] = useState<Record<number, { date: string, type: string, src: string }>>({});
  const { user, signInWithGoogle } = useAuth();

  useEffect(() => {
    fetch('/api/photos/dates')
      .then(res => res.json())
      .then(data => setMediaMeta(data))
      .catch(console.error);
  }, []);

  const activeIndex = page;
  const isFinished = activeIndex >= allTracks.length;
  const card = !isFinished ? allTracks[activeIndex] : null;
  const { count, liked, busy, toggleLike } = useTrackLike(card?.id, user?.uid ?? null);

  const handleLikeTap = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      await signInWithGoogle();
      return;
    }
    await toggleLike();
  };

  const paginate = (newDirection: number) => {
    const nextIndex = page + newDirection;
    if (nextIndex >= 0 && nextIndex <= allTracks.length) {
      setPage([nextIndex, newDirection]);
    }
  };

  const handleDragEnd = (e: any, { offset, velocity }: any) => {
    const swipe = Math.abs(offset.x) * velocity.x;
    const swipeThreshold = 50;
    
    // Standard Touch UI: Swipe Left -> Next, Swipe Right -> Prev
    if (offset.x > swipeThreshold) {
      paginate(-1); // Swipe Right -> Prev
    } else if (offset.x < -swipeThreshold) {
      paginate(1); // Swipe Left -> Next
    }
  };

  const handleImageError = (id: number) => {
    setImageErrorMap(prev => ({ ...prev, [id]: true }));
  };

  if (isFinished) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-gradient-to-br from-indigo-50 via-purple-50 to-emerald-50 text-slate-800 font-sans relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-purple-300/30 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[80%] h-[80%] bg-emerald-300/30 blur-[120px] rounded-full pointer-events-none" />
        
        <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }} className="z-10">
          <CheckCircle2 className="w-20 h-20 text-emerald-500 mb-6 drop-shadow-lg" />
        </motion.div>
        <h2 className="text-4xl font-black mb-4 text-slate-800 tracking-tight z-10 drop-shadow-sm">達成リストを完走！</h2>
        <p className="text-slate-600 mb-12 font-medium leading-relaxed max-w-sm z-10 text-lg">
          全 {allTracks.length} 件の「大学時代でやりたいこと」をご覧いただきありがとうございます！<br/>達成できていないこと、ぜひ一緒にやりましょう！
        </p>
        <button onClick={() => setPage([0, -1])} className="z-10 bg-white/60 backdrop-blur-md px-8 py-4 rounded-full font-bold text-slate-700 shadow-lg border border-white/80 hover:bg-white/80 hover:scale-105 transition-all">
          もう一度最初から見る
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-sky-50 via-purple-50 to-emerald-50 overflow-hidden relative font-sans">
      {/* Dynamic Glass Background Orbs */}
      <div className="absolute top-[-10%] left-[-20%] w-[60%] h-[60%] bg-purple-400/20 blur-[120px] rounded-full pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-[-10%] right-[-20%] w-[70%] h-[70%] bg-emerald-400/20 blur-[120px] rounded-full pointer-events-none animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
      <div className="absolute top-[30%] left-[20%] w-[40%] h-[40%] bg-sky-400/20 blur-[100px] rounded-full pointer-events-none animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s' }} />

      {/* Header */}
      <div className="flex justify-between items-center p-6 z-20 w-full absolute top-0">
        <div className="font-extrabold text-xl text-slate-800 tracking-tight drop-shadow-sm bg-white/40 px-4 py-2 rounded-2xl backdrop-blur-md border border-white/60">
          大学時代でやりたいこと100
        </div>
        <Link href="/edit" className="text-slate-600 hover:text-slate-900 transition-colors p-3 bg-white/50 backdrop-blur-md rounded-2xl border border-white/80 shadow-[0_8px_16px_rgba(0,0,0,0.05)] hover:bg-white/70 hover:scale-105" title="編集画面">
          <UserCircle className="w-6 h-6" />
        </Link>
      </div>

      {/* Grid View Overlay */}
      <AnimatePresence>
        {showList && (
          <motion.div 
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-white/80 backdrop-blur-2xl flex flex-col font-sans"
          >
            <div className="flex items-center justify-between p-6 border-b border-black/5">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">やりたいこと一覧</h2>
              <button onClick={() => setShowList(false)} className="p-3 rounded-full bg-black/5 text-slate-700 hover:bg-black/10 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 pb-24 content-start">
              {allTracks.map((item, idx) => (
                <button 
                  key={item.id}
                  onClick={() => {
                    setPage([idx, idx > activeIndex ? 1 : -1]);
                    setShowList(false);
                  }}
                  className={`flex items-center gap-5 text-left p-4 rounded-2xl border transition-all ${
                    activeIndex === idx 
                      ? 'bg-emerald-500/10 border-emerald-500/30 shadow-md ring-1 ring-emerald-500/20 backdrop-blur-md' 
                      : 'bg-white/60 border-white/80 shadow-sm hover:bg-white/80 hover:shadow-md backdrop-blur-md'
                  }`}
                >
                  <span className={`font-black text-xl tracking-widest shrink-0 w-14 text-center rounded-xl py-2 ${
                    activeIndex === idx ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-black/5 text-slate-500'
                  }`}>
                    {item.id}
                  </span>
                  <div className="flex-1 flex flex-col">
                    <span className={`font-bold text-lg leading-snug break-words ${activeIndex === idx ? 'text-emerald-900' : 'text-slate-800'}`}>
                      {item.text}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cards Container */}
      <div className="flex-1 flex items-center justify-center relative w-full px-4 mt-24 sm:mt-16 mb-4 sm:mb-0 z-10">
        <AnimatePresence initial={false} custom={direction}>
          {card && (
            <motion.div
              key={page}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={1}
              onDragEnd={handleDragEnd}
              className="absolute w-full max-w-[380px] h-[calc(100%-2rem)] max-h-[750px] min-h-[450px] rounded-[2.5rem] bg-white/50 backdrop-blur-2xl border border-white/80 shadow-[0_30px_80px_rgba(0,0,0,0.1),0_0_40px_rgba(255,255,255,0.5)_inset] flex flex-col p-4 sm:p-5 cursor-grab active:cursor-grabbing overflow-hidden"
            >
              {/* Content Top: Text */}
              <div className="flex flex-col items-center justify-center min-h-[80px] mb-3 mt-1 px-2 text-center pointer-events-none">
                <div className="flex items-center gap-2 mb-2.5 flex-wrap justify-center">
                  <span className="text-slate-500 font-black tracking-widest text-sm bg-white/60 px-3 py-1 rounded-full shadow-sm border border-white/80">
                    TRACK {card.id}
                  </span>
                  {card.isCompleted ? (
                    <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-black tracking-widest shadow-md shadow-emerald-500/20">達成!</span>
                  ) : (
                    <span className="bg-slate-200/80 text-slate-600 px-3 py-1 rounded-full text-xs font-black tracking-widest">未達成</span>
                  )}
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-800 leading-tight break-words drop-shadow-sm">
                  {card.text}
                </h2>
              </div>
              
              {/* Content Bottom: Media / Fallback - Taller! */}
              <div className="flex-1 w-full bg-black/5 rounded-[1.8rem] relative overflow-hidden border border-black/5 flex items-center justify-center pointer-events-none shadow-inner">
                {!imageErrorMap[card.id] ? (
                  mediaMeta[card.id]?.type === 'video' ? (
                    <video 
                      src={mediaMeta[card.id].src} 
                      autoPlay 
                      loop 
                      muted 
                      playsInline
                      onError={() => handleImageError(card.id)}
                      className="w-full h-full object-contain sm:object-cover" 
                    />
                  ) : (
                    <img 
                      src={card.image || mediaMeta[card.id]?.src || `/photos/${card.id}.jpg`} 
                      onError={() => handleImageError(card.id)}
                      className="w-full h-full object-contain sm:object-cover" 
                      alt={card.text} 
                      draggable={false}
                    />
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <span className="font-extrabold text-lg tracking-widest">NO MEDIA</span>
                    <span className="text-sm mt-1 font-medium bg-white/40 px-3 py-1 rounded-full mt-3">/photos/{card.id}.*</span>
                  </div>
                )}
              </div>

              {/* Like */}
              <div
                className="mt-3 flex items-center justify-center gap-2 pointer-events-auto"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={handleLikeTap}
                  disabled={busy}
                  className="flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 backdrop-blur-md border border-white/90 shadow-sm text-slate-700 hover:bg-white/90 disabled:opacity-60 transition-all active:scale-95"
                  aria-label={liked ? "いいねを取り消す" : "いいねする"}
                >
                  <Heart
                    className={`w-5 h-5 shrink-0 transition-colors ${
                      liked ? "fill-rose-500 text-rose-500" : "text-slate-500"
                    }`}
                    strokeWidth={2}
                  />
                  <span className="font-black tabular-nums">{count}</span>
                </button>
                {!user && (
                  <span className="text-xs font-bold text-slate-500 max-w-[9rem] leading-tight">
                    タップでログインしていいね
                  </span>
                )}
              </div>

              {/* Comment Display */}
              {card.comment && (
                <div className="mt-4 px-5 py-4 bg-white/60 backdrop-blur-xl rounded-2xl border border-white/80 text-base text-slate-800 font-bold leading-relaxed shadow-[0_8px_20px_rgba(0,0,0,0.06)] break-words overflow-y-auto max-h-[120px]">
                  {card.comment}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action Buttons (Thumb Access) */}
      <div className="flex justify-center items-center gap-6 sm:gap-8 p-4 sm:p-8 z-20 w-full mb-6 sm:mb-8">
        <button 
          onClick={() => setShowList(true)}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/60 backdrop-blur-xl border border-white/80 flex items-center justify-center text-slate-600 shadow-[0_8px_20px_rgba(0,0,0,0.06)] hover:bg-white hover:text-slate-900 transition-all group shrink-0"
        >
          <LayoutGrid className="w-6 h-6 sm:w-8 sm:h-8 stroke-[2.5] group-hover:scale-110 transition-transform" />
        </button>
        <button 
          onClick={() => paginate(1)}
          className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-full bg-slate-900/90 backdrop-blur-xl flex items-center justify-center text-white shadow-[0_12px_40px_rgba(0,0,0,0.2)] hover:bg-black hover:scale-105 transition-all group border border-slate-700/50"
        >
          <ChevronRight className="w-10 h-10 sm:w-12 sm:h-12 group-hover:translate-x-1.5 transition-transform stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
}
