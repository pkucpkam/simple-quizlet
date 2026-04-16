import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../service/firebase_setup';
import { getUserInfo } from '../service/userService';

export interface AuthUser {
  uid: string;
  username: string;
  email: string | null;
  role: string;
  isLoggedIn: boolean;
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check sessionStorage first for immediate response
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      // Even if we have session storage, let Firebase verify in background
    }

    // 2. Setup Firebase auth listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && firebaseUser.emailVerified) {
        try {
          const userInfo = await getUserInfo(firebaseUser);
          const userData: AuthUser = {
            uid: firebaseUser.uid,
            username: userInfo.username,
            email: firebaseUser.email,
            role: userInfo.role || 'USER',
            isLoggedIn: true,
          };
          setUser(userData);
          sessionStorage.setItem('user', JSON.stringify(userData));
        } catch (error) {
          console.error("Error fetching user info:", error);
          setUser(null);
          sessionStorage.removeItem('user');
        }
      } else {
        setUser(null);
        sessionStorage.removeItem('user');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading };
};
