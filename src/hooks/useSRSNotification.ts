import { useEffect } from 'react';
import { collection, query, where, Timestamp, getCountFromServer } from 'firebase/firestore';
import { db, auth } from '../service/firebase_setup';

// ── localStorage keys ──────────────────────────────────────────────────────
const LS_PERMISSION_ASKED = 'srs_notification_permission_asked';
const LS_LAST_NOTIFIED_DATE = 'srs_last_notified_date';

/**
 * Registers the Service Worker and, when the user has (or grants) Notification
 * permission, shows a browser notification if there are SRS cards due today.
 *
 * Rules to avoid spamming:
 *  1. We only ask for permission ONCE (flag stored in localStorage).
 *  2. We show at most ONE notification per calendar day (date stored in localStorage).
 *  3. If the user has already denied permission we do nothing silently.
 */
export function useSRSNotification() {
    useEffect(() => {
        // Guard: Notification API must be supported
        if (!('Notification' in window)) return;
        // Guard: Service Worker must be supported
        if (!('serviceWorker' in navigator)) return;

        let cancelled = false;

        const run = async () => {
            // ── 1. Register Service Worker ─────────────────────────────────
            try {
                await navigator.serviceWorker.register('/sw.js', { scope: '/' });
            } catch (err) {
                console.warn('[SRS Notification] SW registration failed:', err);
                return;
            }

            // ── 2. Request permission (only once) ──────────────────────────
            const alreadyAsked = localStorage.getItem(LS_PERMISSION_ASKED) === 'true';
            let permission = Notification.permission;

            if (permission === 'default' && !alreadyAsked) {
                permission = await Notification.requestPermission();
                localStorage.setItem(LS_PERMISSION_ASKED, 'true');
            }

            if (permission !== 'granted') return;

            // ── 3. Throttle: max 1 notification per day ────────────────────
            const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
            const lastNotified = localStorage.getItem(LS_LAST_NOTIFIED_DATE);
            if (lastNotified === today) return;

            // ── 4. Wait for Firebase Auth to settle ────────────────────────
            // auth.currentUser may be null immediately on page load
            const userId = await new Promise<string | null>((resolve) => {
                if (auth.currentUser) {
                    resolve(auth.currentUser.uid);
                    return;
                }
                const unsub = auth.onAuthStateChanged((user) => {
                    unsub();
                    resolve(user?.uid ?? null);
                });
            });

            if (!userId || cancelled) return;

            // ── 5. Count due cards (cheap aggregate query) ─────────────────
            let dueCount = 0;
            try {
                const q = query(
                    collection(db, 'srsCards'),
                    where('userId', '==', userId),
                    where('nextReview', '<=', Timestamp.now())
                );
                const snapshot = await getCountFromServer(q);
                dueCount = snapshot.data().count;
            } catch (err) {
                console.warn('[SRS Notification] Could not count due cards:', err);
                return;
            }

            if (dueCount === 0 || cancelled) return;

            // ── 6. Show notification via SW (falls back to direct API) ─────
            const title = 'Simple Quizlet – Nhắc ôn tập 📚';
            const body = `Bạn có ${dueCount} từ cần ôn hôm nay. Đừng bỏ lỡ!`;
            const icon = '/logo/brain.png';

            try {
                const reg = await navigator.serviceWorker.ready;
                await reg.showNotification(title, {
                    body,
                    icon,
                    badge: icon,
                    tag: 'srs-reminder',
                    data: { url: '/srs-review' },
                });
            } catch {
                // Fallback: direct Notification API (no SW required)
                new Notification(title, { body, icon });
            }

            localStorage.setItem(LS_LAST_NOTIFIED_DATE, today);
        };

        run();

        return () => {
            cancelled = true;
        };
    }, []); // run once on mount
}
