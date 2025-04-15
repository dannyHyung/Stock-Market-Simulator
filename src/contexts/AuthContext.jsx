import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function signup(email, password) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    // Create initial portfolio with $10,000
    await setDoc(doc(db, "portfolios", result.user.uid), {
      cash: 10000,
      totalValue: 10000,
      stocks: [],
      createdAt: new Date()
    });
    return result;
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    
    // Check if this is the first login for this Google user
    const userDoc = await getDoc(doc(db, "portfolios", result.user.uid));
    
    // If user doesn't have a portfolio, create one
    if (!userDoc.exists()) {
      await setDoc(doc(db, "portfolios", result.user.uid), {
        cash: 10000,
        totalValue: 10000,
        stocks: [],
        createdAt: new Date()
      });
      
      // Also set display name if provided by Google
      if (result.user.displayName) {
        await setDoc(doc(db, "users", result.user.uid), {
          displayName: result.user.displayName,
          createdAt: new Date()
        });
      }
    }
    
    return result;
  }

  function logout() {
    return signOut(auth);
  }

  async function getUserPortfolio() {
    if (!currentUser) return null;
    
    const docRef = doc(db, "portfolios", currentUser.uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      return null;
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    login,
    signup,
    logout,
    loginWithGoogle,
    getUserPortfolio
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}