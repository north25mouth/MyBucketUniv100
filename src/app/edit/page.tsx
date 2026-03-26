"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Save, CheckCircle2, ChevronLeft, ImagePlus, FolderOpen, X, RotateCw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { my100List, TrackItem } from "@/data/my100list";

export default function EditList() {
  const router = useRouter();
  const [items, setItems] = useState<TrackItem[]>(my100List);
  const [isSaving, setIsSaving] = useState(false);
  const [mediaMeta, setMediaMeta] = useState<Record<number, { date: string, type: string, src: string }>>({});
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  
  const [selectingPoolForId, setSelectingPoolForId] = useState<number | null>(null);
  const [poolFiles, setPoolFiles] = useState<string[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const hasAccess = sessionStorage.getItem('edit_access');
    if (hasAccess === 'true') {
      setIsAuthenticated(true);
    } else {
      const pwd = window.prompt("編集用パスワードを入力してください");
      if (pwd === "1025") {
        sessionStorage.setItem('edit_access', 'true');
        setIsAuthenticated(true);
      } else {
        window.alert("パスワードが違います");
        router.push('/');
      }
    }
  }, [router]);

  const fetchMedia = () => {
    fetch('/api/photos/dates')
      .then(res => res.json())
      .then(data => setMediaMeta(data))
      .catch(console.error);
  };

  const fetchPool = () => {
    fetch('/api/photos/pool')
      .then(res => res.json())
      .then(data => setPoolFiles(data))
      .catch(console.error);
  };

  useEffect(() => {
    fetchMedia();
    fetchPool();
  }, []);

  const filledCount = useMemo(() => items.filter((i) => i.isCompleted).length, [items]);
  const progressPercent = useMemo(() => {
    const count = items.filter((item) => item.isCompleted).length;
    return Math.round((count / 100) * 100);
  }, [items]);

  if (!isAuthenticated) {
    return <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center text-slate-500 font-bold">認証中...</div>;
  }

  const handleTextChange = (id: number, val: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, text: val } : item)));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/saveList', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      });
      if (res.ok) {
        alert("保存しました！");
      } else {
        alert("保存に失敗しました...");
      }
    } catch (e) {
      console.error(e);
      alert("エラーが発生しました。");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen pb-28 bg-gradient-to-br from-sky-50 via-purple-50 to-emerald-50 text-slate-800 font-sans relative overflow-hidden">
      {/* Dynamic Glass Background Orbs */}
      <div className="fixed top-[-10%] left-[-20%] w-[60%] h-[60%] bg-purple-400/20 blur-[120px] rounded-full pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="fixed bottom-[-10%] right-[-20%] w-[70%] h-[70%] bg-emerald-400/20 blur-[120px] rounded-full pointer-events-none animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />

      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white/60 backdrop-blur-3xl border-b border-white/80 px-5 py-5 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-white/80 text-slate-500 hover:text-slate-900 transition-colors">
            <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
          </Link>
          <h1 className="text-xl font-black tracking-tight text-slate-900 drop-shadow-sm">リスト編集</h1>
          <div className="w-10"></div>
        </div>

        {/* Progress Bar */}
        <div className="flex flex-col gap-2.5">
          <div className="flex justify-between items-end">
            <span className="text-xs font-black text-slate-500 tracking-wider uppercase bg-white/50 px-2 py-0.5 rounded-md border border-white/80">
              {filledCount} / 100 完了
            </span>
            <span className="text-base font-black text-emerald-600 drop-shadow-sm">{progressPercent}%</span>
          </div>
          <div className="w-full h-2.5 bg-white/60 backdrop-blur-md rounded-full overflow-hidden shadow-inner border border-white/80">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.8 }}
            />
          </div>
        </div>
      </div>

      {/* Editor List */}
      <div className="flex flex-col px-4 py-6 gap-5 z-10 relative">
        {items.map((item) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`group p-5 bg-white/60 backdrop-blur-xl rounded-3xl border transition-all duration-300 flex gap-4 ${
              item.text.trim() ? "border-white/80 shadow-[0_8px_30px_rgba(0,0,0,0.04)]" : "border-white/40 shadow-sm hover:bg-white/80"
            }`}
          >
            <div className={`mt-0.5 flex flex-col items-center justify-center w-10 h-10 rounded-xl text-sm font-black shrink-0 transition-all shadow-sm border border-white/80 ${
              item.text.trim() ? "bg-emerald-500 text-white shadow-emerald-500/30" : "bg-white/80 text-slate-400"
            }`}>
              {item.id}
            </div>
            
            <div className="flex-1 flex flex-col pt-1">
              <textarea
                value={item.text}
                onChange={(e) => handleTextChange(item.id, e.target.value)}
                placeholder="大学時代でやりたいことは何ですか？"
                className="w-full bg-transparent outline-none resize-none text-lg placeholder:text-slate-300 min-h-[32px] text-slate-800 font-bold leading-relaxed"
                rows={1}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${target.scrollHeight}px`;
                }}
              />
              
              {/* Image Preview & Upload Row */}
              <div className="flex flex-wrap items-center gap-3 mt-4">
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/50 text-xs font-bold tracking-wide text-slate-600 hover:text-slate-900 hover:bg-white/80 cursor-pointer transition-colors border border-white/80 shrink-0 shadow-sm">
                  <ImagePlus className="w-4 h-4" />
                  <span>写真を追加</span>
                  <input 
                    type="file" 
                    accept="image/*,video/*" 
                    className="hidden" 
                    disabled={uploadingId === item.id}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setUploadingId(item.id);
                        const formData = new FormData();
                        formData.append('file', file);
                        formData.append('id', item.id.toString());
                        try {
                          const res = await fetch('/api/upload', { method: 'POST', body: formData });
                          if (res.ok) await fetchMedia();
                        } catch (err) {
                          console.error(err);
                        } finally {
                          setUploadingId(null);
                        }
                      }
                    }}
                  />
                </label>

                <button 
                  onClick={() => setSelectingPoolForId(item.id)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 text-xs font-bold tracking-wide text-emerald-700 hover:bg-emerald-500/20 transition-colors border border-emerald-500/20 shrink-0 shadow-sm"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>プール参照</span>
                </button>
                
                <div className="flex-1 flex justify-end">
                  <button
                    onClick={() => {
                       setItems(prev => prev.map(i => i.id === item.id ? { ...i, isCompleted: !i.isCompleted } : i));
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black tracking-widest transition-all border ${
                      item.isCompleted 
                        ? 'bg-emerald-500 text-white border-emerald-400 shadow-[0_4px_12px_rgba(16,185,129,0.3)] hover:bg-emerald-400 hover:scale-105' 
                        : 'bg-white/50 text-slate-400 border-white/80 hover:bg-white hover:text-slate-500 shadow-sm'
                    }`}
                  >
                    <CheckCircle2 className={`w-4 h-4 ${item.isCompleted ? 'text-white' : 'text-slate-300'}`} />
                    {item.isCompleted ? '達成!' : '未達成'}
                  </button>
                </div>
              </div>

              {/* Media Preview */}
              {(item.image || mediaMeta[item.id]) && (
                <div 
                  className="w-full h-32 mt-4 rounded-xl border border-slate-200/60 overflow-hidden relative group"
                >
                  {uploadingId === item.id && (
                    <div className="absolute inset-0 z-20 bg-white/80 flex items-center justify-center">
                      <span className="animate-pulse font-bold text-emerald-600 tracking-widest text-sm text-center">
                        処理中...
                      </span>
                    </div>
                  )}

                  {mediaMeta[item.id]?.type === 'video' ? (
                    <video 
                      src={`${mediaMeta[item.id]?.src}?t=${Date.now()}`} 
                      autoPlay loop muted playsInline 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <>
                      <div 
                        className="w-full h-full bg-cover bg-center"
                        style={{ backgroundImage: `url(${mediaMeta[item.id]?.src ? `${mediaMeta[item.id].src}?t=${Date.now()}` : item.image})` }} 
                      />
                      <button
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setUploadingId(item.id);
                          try {
                            const res = await fetch('/api/photos/rotate', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ id: item.id })
                            });
                            if (res.ok) {
                              // Re-fetch media to refresh the component with cache-busting
                              await fetchMedia();
                            } else {
                              console.error("Failed to rotate");
                            }
                          } catch (err) {
                            console.error(err);
                          } finally {
                            setUploadingId(null);
                          }
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur-md shadow-sm text-slate-600 hover:text-slate-900 hover:bg-white rounded-full opacity-0 group-hover:opacity-100 transition-all z-30 ring-1 ring-slate-900/5 hover:scale-105"
                        title="画像を回転 (90度)"
                      >
                        <RotateCw className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-xl pointer-events-none" />
                </div>
              )}
              
              {/* Comment Input */}
              <div className="mt-4">
                <textarea
                  value={item.comment || ""}
                  onChange={(e) => setItems(prev => prev.map(i => i.id === item.id ? { ...i, comment: e.target.value } : i))}
                  placeholder="画像や動画の下に表示される一言コメント（任意）"
                  className="w-full bg-white/40 backdrop-blur-sm border border-white/80 rounded-2xl px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 hover:bg-white/60 transition-all font-bold resize-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                  rows={1}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = `${target.scrollHeight}px`;
                  }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Floating Save Action */}
      <div className="fixed bottom-0 left-0 right-0 w-full z-40 p-6 pointer-events-none pb-8 flex justify-center before:content-[''] before:absolute before:inset-0 before:bg-gradient-to-t before:from-sky-50/90 before:via-purple-50/80 before:to-transparent before:-z-10">
        <motion.button
          onClick={handleSave}
          disabled={isSaving}
          whileTap={{ scale: 0.96 }}
          className="w-full max-w-sm py-4 rounded-full bg-slate-900/90 backdrop-blur-xl text-white font-bold tracking-widest flex items-center justify-center gap-2 shadow-[0_8px_30px_rgba(0,0,0,0.2)] border border-slate-700 pointer-events-auto disabled:opacity-70 transition-all hover:bg-black hover:shadow-[0_12px_40px_rgba(0,0,0,0.3)]"
        >
          {isSaving ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, ease: "linear", duration: 1 }}
            >
              <Save className="w-5 h-5" />
            </motion.div>
          ) : (
            <Save className="w-5 h-5" />
          )}
          <span>{isSaving ? "保存中..." : "リストを保存"}</span>
        </motion.button>
      </div>

      {/* Photo Pool Modal */}
      <AnimatePresence>
        {selectingPoolForId !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 flex flex-col p-4 sm:p-8 font-sans"
          >
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-white rounded-3xl flex-1 flex flex-col overflow-hidden max-w-lg mx-auto w-full shadow-2xl"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
                <div>
                  <h3 className="font-black text-xl text-slate-800">写真プールから選ぶ</h3>
                  <p className="text-sm font-medium text-slate-500 mt-1">TRACK {selectingPoolForId} に紐付ける写真を選んでください</p>
                </div>
                <button 
                  onClick={() => setSelectingPoolForId(null)}
                  className="p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 flex flex-wrap gap-2 content-start bg-slate-50">
                {poolFiles.length === 0 ? (
                  <div className="w-full h-full flex items-center justify-center flex-col gap-4 text-slate-400 font-bold text-center">
                    <span className="text-4xl">🪹</span>
                    プールに写真がありません<br/><span className="text-xs font-medium">public/photos/100/ 内に写真を入れてください</span>
                  </div>
                ) : (
                  poolFiles.map(src => (
                    <button
                      key={src}
                      onClick={async () => {
                        const id = selectingPoolForId;
                        setSelectingPoolForId(null);
                        setUploadingId(id);
                        try {
                          const res = await fetch('/api/photos/pool', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id, src })
                          });
                          if (res.ok) {
                            fetchMedia();
                            fetchPool();
                          }
                        } catch (err) { console.error(err); }
                        finally { setUploadingId(null); }
                      }}
                      className="w-[calc(33.333%-0.5rem)] aspect-square rounded-xl overflow-hidden relative group hover:ring-4 hover:ring-emerald-500 hover:z-10 transition-all shadow-sm"
                    >
                      {src.toLowerCase().endsWith('.mp4') || src.toLowerCase().endsWith('.mov') ? (
                        <video src={src} className="w-full h-full object-cover" />
                      ) : (
                        <img src={src} className="w-full h-full object-cover" />
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 text-white font-black drop-shadow-md transform scale-90 group-hover:scale-100 transition-all text-sm">
                          選択
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
