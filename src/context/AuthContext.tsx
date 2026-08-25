import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, name: string, role?: 'admin' | 'customer') => Promise<void>;
  signOut: () => Promise<void>;
  quickDemoLogin: (role: 'admin' | 'customer') => Promise<void>;
  toggleAdminPrivilege: () => void;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MASTER_ADMIN_EMAIL = 'retrokronik@gmail.com';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [adminOverride, setAdminOverride] = useState<boolean | null>(null);

  // Sync user profile from Firestore
  const fetchUserProfile = async (currentUser: User) => {
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data() as UserProfile;
        setUserProfile(data);
      } else {
        // Create initial profile if not exists
        const isMaster = currentUser.email?.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();
        const initialProfile: UserProfile = {
          uid: currentUser.uid,
          email: currentUser.email || '',
          displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Kullanıcı',
          role: isMaster ? 'admin' : 'customer',
          createdAt: new Date().toISOString(),
        };
        await setDoc(userRef, initialProfile);
        setUserProfile(initialProfile);
      }
    } catch (err) {
      console.warn('Profile fetch warning (using fallback profile):', err);
      // Create local fallback profile
      const isMaster = currentUser.email?.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();
      setUserProfile({
        uid: currentUser.uid,
        email: currentUser.email || '',
        displayName: currentUser.displayName || 'Kullanıcı',
        role: isMaster ? 'admin' : 'customer',
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchUserProfile(currentUser);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const res = await signInWithEmailAndPassword(auth, email, pass);
      await fetchUserProfile(res.user);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string,
    pass: string,
    displayName: string,
    role: 'admin' | 'customer' = 'customer'
  ) => {
    setLoading(true);
    try {
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(res.user, { displayName });

      const isMaster = email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();
      const newProfile: UserProfile = {
        uid: res.user.uid,
        email,
        displayName,
        role: isMaster || role === 'admin' ? 'admin' : 'customer',
        createdAt: new Date().toISOString(),
      };

      try {
        await setDoc(doc(db, 'users', res.user.uid), newProfile);
      } catch (err) {
        console.warn('Firestore setDoc user warning:', err);
      }

      setUserProfile(newProfile);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await fbSignOut(auth);
      setUser(null);
      setUserProfile(null);
      setAdminOverride(null);
    } finally {
      setLoading(false);
    }
  };

  // Demo Login simulator
  const quickDemoLogin = async (role: 'admin' | 'customer') => {
    setLoading(true);
    const mockUid = role === 'admin' ? 'admin_demo_uid_01' : 'customer_demo_uid_01';
    const mockEmail = role === 'admin' ? MASTER_ADMIN_EMAIL : 'musteri@eticaret.com';
    const mockName = role === 'admin' ? 'Sistem Yöneticisi' : 'Ahmet Yılmaz';

    const mockProfile: UserProfile = {
      uid: mockUid,
      email: mockEmail,
      displayName: mockName,
      role: role,
      phone: '+90 555 123 45 67',
      address: 'Bağdat Caddesi No: 42 Daire: 8',
      city: 'İstanbul',
      district: 'Kadıköy',
      createdAt: new Date().toISOString(),
    };

    setUserProfile(mockProfile);
    setAdminOverride(role === 'admin');
    setLoading(false);
  };

  const toggleAdminPrivilege = () => {
    setAdminOverride((prev) => (prev === null ? (userProfile?.role === 'admin' ? false : true) : !prev));
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!userProfile) return;
    const updated = { ...userProfile, ...data };
    setUserProfile(updated);
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), data);
      } catch (err) {
        console.warn('Profile update error:', err);
      }
    }
  };

  const isExplicitAdmin =
    userProfile?.role === 'admin' ||
    user?.email?.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();

  const isAdmin = adminOverride !== null ? adminOverride : isExplicitAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        isAdmin,
        loading,
        signIn,
        signUp,
        signOut,
        quickDemoLogin,
        toggleAdminPrivilege,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
