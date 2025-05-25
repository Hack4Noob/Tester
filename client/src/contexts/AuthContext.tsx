import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User } from '@shared/schema';
import { wsManager } from '@/lib/websocket';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    email: string;
    password: string;
    name: string;
    surname: string;
    gender?: string;
    birthDate?: Date;
    photoURL?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        setFirebaseUser(firebaseUser);
        
        if (firebaseUser) {
          try {
            // Get user data from Firestore
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data() as User;
              setUser(userData);
              wsManager.setUser(userData);
            } else {
              // Create user document if it doesn't exist
              const newUser: User = {
                id: 0, // Will be set by database
                uid: firebaseUser.uid,
                email: firebaseUser.email!,
                name: firebaseUser.displayName?.split(' ')[0] || '',
                surname: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
                photoURL: firebaseUser.photoURL,
                gender: null,
                birthDate: null,
                createdAt: new Date(),
              };
              
              await setDoc(doc(db, 'users', firebaseUser.uid), {
                ...newUser,
                createdAt: serverTimestamp(),
              });
              
              setUser(newUser);
              wsManager.setUser(newUser);
            }
          } catch (error) {
            console.error('Error fetching user data:', error);
            setUser(null);
          }
        } else {
          setUser(null);
          wsManager.setUser(null);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Auth state change error:', error);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to login');
    }
  };

  const register = async (userData: {
    email: string;
    password: string;
    name: string;
    surname: string;
    gender?: string;
    birthDate?: Date;
    photoURL?: string;
  }) => {
    try {
      // Create Firebase user
      const { user: firebaseUser } = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );

      // Update Firebase profile
      await updateProfile(firebaseUser, {
        displayName: `${userData.name} ${userData.surname}`,
        photoURL: userData.photoURL || null,
      });

      // Create user document in Firestore
      const newUser: Omit<User, 'id'> = {
        uid: firebaseUser.uid,
        email: userData.email,
        name: userData.name,
        surname: userData.surname,
        photoURL: userData.photoURL || null,
        gender: userData.gender || null,
        birthDate: userData.birthDate || null,
        createdAt: new Date(),
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), {
        ...newUser,
        createdAt: serverTimestamp(),
      });

    } catch (error: any) {
      throw new Error(error.message || 'Failed to create account');
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to logout');
    }
  };

  const updateUserProfile = async (updates: Partial<User>) => {
    if (!user || !firebaseUser) {
      throw new Error('No user logged in');
    }

    try {
      // Update Firestore document
      await setDoc(doc(db, 'users', user.uid), updates, { merge: true });

      // Update Firebase profile if needed
      if (updates.name || updates.surname || updates.photoURL) {
        await updateProfile(firebaseUser, {
          displayName: updates.name && updates.surname 
            ? `${updates.name} ${updates.surname}` 
            : firebaseUser.displayName,
          photoURL: updates.photoURL || firebaseUser.photoURL,
        });
      }

      // Update local state
      setUser(prev => prev ? { ...prev, ...updates } : null);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update profile');
    }
  };

  const value: AuthContextType = {
    user,
    firebaseUser,
    loading,
    login,
    register,
    logout,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
