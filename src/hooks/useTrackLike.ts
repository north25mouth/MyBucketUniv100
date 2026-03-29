"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getFirebaseDb } from "@/lib/firebase";
import {
  doc,
  increment,
  onSnapshot,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

export function useTrackLike(trackId: number | undefined, uid: string | null) {
  const [count, setCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState(false);
  const busyLock = useRef(false);

  useEffect(() => {
    if (trackId == null) return;
    const db = getFirebaseDb();
    const tid = String(trackId);
    const summaryRef = doc(db, "track_likes", tid);
    const unsubSummary = onSnapshot(summaryRef, (snap) => {
      setCount(snap.exists() ? Number(snap.data().count ?? 0) : 0);
    });

    let unsubVote: (() => void) | undefined;
    if (uid) {
      const voteRef = doc(db, "track_likes", tid, "votes", uid);
      unsubVote = onSnapshot(voteRef, (snap) => {
        setLiked(snap.exists());
      });
    } else {
      setLiked(false);
    }

    return () => {
      unsubSummary();
      unsubVote?.();
    };
  }, [trackId, uid]);

  const toggleLike = useCallback(async () => {
    if (!uid || trackId == null || busyLock.current) return;
    busyLock.current = true;
    setBusy(true);
    try {
      const db = getFirebaseDb();
      const tid = String(trackId);
      const summaryRef = doc(db, "track_likes", tid);
      const voteRef = doc(db, "track_likes", tid, "votes", uid);
      await runTransaction(db, async (transaction) => {
        const voteSnap = await transaction.get(voteRef);
        if (voteSnap.exists()) {
          transaction.delete(voteRef);
          transaction.set(summaryRef, { count: increment(-1) }, { merge: true });
        } else {
          transaction.set(voteRef, { createdAt: serverTimestamp() });
          transaction.set(summaryRef, { count: increment(1) }, { merge: true });
        }
      });
    } catch (e) {
      console.error("toggleLike failed", e);
    } finally {
      busyLock.current = false;
      setBusy(false);
    }
  }, [uid, trackId]);

  return { count, liked, busy, toggleLike };
}
