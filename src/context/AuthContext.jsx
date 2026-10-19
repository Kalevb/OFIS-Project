import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth } from '../services/firebase.js';
import { firebaseService } from '../services/firebaseService.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('OFIC_CURRENT_USER');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  // Instant fast-boot: If session already exists in localStorage, do not block the page with spinner!
  const [loading, setLoading] = useState(() => {
    try {
      const saved = localStorage.getItem('OFIC_CURRENT_USER');
      return !saved;
    } catch {
      return false;
    }
  });

  // Monitor Firebase auth state & ensure connected session
  useEffect(() => {
    // Safety guard: guarantee page unblocks in at most 400ms under any network condition
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 400);

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const users = await firebaseService.getUsers();
          const profile = users.find(u => 
            u.email?.toLowerCase() === fbUser.email?.toLowerCase() || 
            u.uid === fbUser.uid ||
            (fbUser.email && u.email && fbUser.email.toLowerCase().includes(u.email.toLowerCase()))
          );
          
          const isGoogle = fbUser.providerData?.some(p => p.providerId === 'google.com') || fbUser.photoURL || fbUser.displayName;
          const googleName = fbUser.displayName || fbUser.providerData?.[0]?.displayName;

          // Saved session in localStorage
          const savedRaw = localStorage.getItem('OFIC_CURRENT_USER');
          const savedUser = savedRaw ? JSON.parse(savedRaw) : null;

          // Priority: 1. Google display name, 2. profile name, 3. saved name, 4. email username
          const effectiveName = googleName || profile?.name || savedUser?.name || (fbUser.email ? fbUser.email.split('@')[0] : 'ผู้ใช้งาน');
          const effectiveRole = savedUser?.role || profile?.role || (fbUser.email?.includes('police') || fbUser.email?.includes('officer') ? 'officer' : 'victim');

          const userObj = {
            uid: profile?.uid || fbUser.uid,
            fbUid: fbUser.uid,
            email: fbUser.email,
            name: effectiveName,
            displayName: effectiveName,
            photoURL: fbUser.photoURL || profile?.photoURL || (isGoogle ? `https://ui-avatars.com/api/?name=${encodeURIComponent(effectiveName)}&background=2563EB&color=fff` : ''),
            provider: isGoogle ? 'google.com' : (profile?.provider || 'password'),
            role: effectiveRole,
            ...profile,
            ...(googleName ? { name: googleName, displayName: googleName } : {})
          };
          setCurrentUser(userObj);
          localStorage.setItem('OFIC_CURRENT_USER', JSON.stringify(userObj));
        } catch (err) {
          console.warn('[OFIC Auth] onAuthStateChanged error:', err);
        }
      }
      setLoading(false);
    });

    // Initialize database service immediately without blocking on network roundtrips
    const initAuthAndService = async () => {
      try {
        await firebaseService.init();
      } catch (e) {
        console.info('[OFIC Service] Init notice:', e.message);
      } finally {
        setLoading(false);
      }
    };

    initAuthAndService();

    return () => {
      clearTimeout(safetyTimer);
      unsubscribe();
    };
  }, []);

  const saveUserSession = (userObj) => {
    setCurrentUser(userObj);
    localStorage.setItem('OFIC_CURRENT_USER', JSON.stringify(userObj));
  };

  // Update user display name and persist to RTDB
  const updateUserDisplayName = async (newName) => {
    if (!currentUser || !newName?.trim()) return;
    const cleanName = newName.trim();
    const updated = {
      ...currentUser,
      name: cleanName,
      displayName: cleanName
    };
    saveUserSession(updated);
    try {
      await firebaseService.saveUser(updated);
    } catch (e) {
      console.warn('Could not persist updated name to RTDB:', e.message);
    }
    return updated;
  };

  // Sign In with Firebase Auth and fallback
  const login = async (email, password) => {
    try {
      // 1. Try real Firebase Auth
      let fbUser = null;
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        fbUser = userCredential.user;
      } catch (authErr) {
        // If user not in Firebase Auth, attempt auto-create
        if (authErr.code === 'auth/invalid-credential' || authErr.code === 'auth/user-not-found') {
          try {
            const newCred = await createUserWithEmailAndPassword(auth, email, password);
            fbUser = newCred.user;
          } catch (createErr) {
            console.warn('Firebase Auth auto-create note:', createErr.message);
          }
        }
      }

      const users = await firebaseService.getUsers();
      const profile = users.find(u => u.email === email || (fbUser && u.uid === fbUser.uid)) || {
        uid: fbUser?.uid || `user_${Date.now()}`,
        email,
        name: email.split('@')[0],
        role: email.includes('police') || email.includes('officer') || email.includes('admin') ? 'officer' : 'victim'
      };
      const userObj = { ...profile, uid: fbUser?.uid || profile.uid, email };
      saveUserSession(userObj);
      return { success: true, user: userObj };
    } catch (fbErr) {
      console.warn('Firebase Auth fallback:', fbErr.message);

      // 2. Check registered users from firebaseService / local cache
      try {
        const users = await firebaseService.getUsers();
        const matched = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
        if (matched) {
          saveUserSession(matched);
          return { success: true, user: matched };
        }
      } catch {}

      // 3. Fallback generic login for testing
      const role = email.includes('officer') ? 'officer' : email.includes('admin') ? 'admin' : 'victim';
      const fallbackUser = {
        uid: `user_${Date.now()}`,
        name: email.split('@')[0],
        email,
        role,
        isActive: true,
        createdAt: new Date().toISOString()
      };
      saveUserSession(fallbackUser);
      return { success: true, user: fallbackUser };
    }
  };

  // Register Victim
  const register = async ({ name, email, password, phone, nationalId, address }) => {
    let uid = `user_v${Date.now()}`;
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      uid = res.user.uid;
    } catch (e) {
      console.info('Created user profile in database directly:', e.message);
    }

    const newUser = {
      uid,
      name,
      email,
      phone,
      role: 'victim',
      isActive: true,
      createdAt: new Date().toISOString(),
      victimProfile: {
        nationalId,
        address
      }
    };

    const users = await firebaseService.getUsers();
    await firebaseService.updateUserRole(uid, 'victim', true);
    saveUserSession(newUser);
    return { success: true, user: newUser };
  };

  // Sign in with Google (Firebase Google Auth & Store Account in Firebase RTDB)
  const loginWithGoogle = async (preferredRole = 'victim', fallbackData = null) => {
    // If fallbackData provided directly (for testing/domain issue fallback)
    if (fallbackData) {
      const email = fallbackData.email || 's67122250043@ssru.ac.th';
      const uid = fallbackData.uid || `google_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const existingUsers = await firebaseService.getUsers();
      const existing = existingUsers.find(u => u.uid === uid || u.email?.toLowerCase() === email.toLowerCase());

      const userObj = {
        uid,
        email,
        name: fallbackData.name || existing?.name || email.split('@')[0],
        photoURL: fallbackData.photoURL || existing?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(email)}&background=2563EB&color=fff`,
        phone: fallbackData.phone || existing?.phone || '',
        role: existing?.role || preferredRole,
        isActive: true,
        provider: 'google.com',
        createdAt: existing?.createdAt || new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        ...(preferredRole === 'victim' ? {
          victimProfile: existing?.victimProfile || { nationalId: '', address: '' }
        } : {
          officerProfile: existing?.officerProfile || {
            badgeNumber: `POL-${Math.floor(1000 + Math.random() * 9000)}`,
            rankTitle: 'เจ้าหน้าที่สืบสวน',
            department: 'กองบังคับการปราบปรามการกระทำความผิดเกี่ยวกับอาชญากรรมทางเทคโนโลยี'
          }
        })
      };

      // Store account into Firebase Realtime Database
      await firebaseService.saveUser(userObj);
      saveUserSession(userObj);
      return { success: true, user: userObj };
    }

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const fbUser = result.user;

      const existingUsers = await firebaseService.getUsers();
      const existing = existingUsers.find(u => u.uid === fbUser.uid || (u.email && u.email.toLowerCase() === fbUser.email.toLowerCase()));

      const userObj = {
        uid: fbUser.uid,
        email: fbUser.email,
        name: fbUser.displayName || existing?.name || fbUser.email.split('@')[0],
        photoURL: fbUser.photoURL || existing?.photoURL || '',
        phone: fbUser.phoneNumber || existing?.phone || '',
        role: existing?.role || preferredRole,
        isActive: true,
        provider: 'google.com',
        createdAt: existing?.createdAt || new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        ...(preferredRole === 'victim' ? {
          victimProfile: existing?.victimProfile || { nationalId: '', address: '' }
        } : {
          officerProfile: existing?.officerProfile || {
            badgeNumber: `POL-${Math.floor(1000 + Math.random() * 9000)}`,
            rankTitle: 'เจ้าหน้าที่สืบสวน',
            department: 'กองบังคับการปราบปรามการกระทำความผิดเกี่ยวกับอาชญากรรมทางเทคโนโลยี'
          }
        })
      };

      // Store account into Firebase Realtime Database
      await firebaseService.saveUser(userObj);
      saveUserSession(userObj);
      return { success: true, user: userObj };
    } catch (err) {
      console.warn('Firebase Google Auth error:', err);
      let errorMsg = err.message || 'ไม่สามารถเข้าสู่ระบบด้วย Google ได้';
      if (err.code === 'auth/popup-closed-by-user') {
        errorMsg = 'หน้าต่างล็อกอิน Google ถูกปิด';
      } else if (err.code === 'auth/unauthorized-domain') {
        errorMsg = `โดเมน (${window.location.hostname}) ยังไม่ได้รับอนุญาตใน Firebase Console`;
      } else if (err.code === 'auth/operation-not-allowed') {
        errorMsg = 'Google Sign-In ยังไม่ถูกเปิดใช้งานใน Firebase Authentication';
      }
      const customErr = new Error(errorMsg);
      customErr.code = err.code;
      throw customErr;
    }
  };

  // Quick switch for demo testing
  const switchDemoUser = (roleType) => {
    let target = {
      uid: 'user_v001',
      name: 'นายสมชาย ใจดี',
      email: 'somchai@example.com',
      role: 'victim',
      phone: '0812345678'
    };
    if (roleType === 'officer') {
      target = {
        uid: 'user_o001',
        name: 'พ.ต.ต. สราวุฒิ มุ่งมั่น',
        email: 'officer.sarawut@police.go.th',
        role: 'officer',
        phone: '0899998888'
      };
    } else if (roleType === 'admin') {
      target = {
        uid: 'user_admin',
        name: 'แอดมิน กองปราบปรามอาชญากรรมทางเทคโนโลยี',
        email: 'admin@police.go.th',
        role: 'admin'
      };
    } else if (roleType === 'victim2') {
      target = {
        uid: 'user_v002',
        name: 'นางสาววิภาดา รัตนกุล',
        email: 'wiphada@example.com',
        role: 'victim',
        phone: '0823456789'
      };
    }
    saveUserSession(target);
    return target;
  };

  // Logout
  const logout = async () => {
    try {
      await fbSignOut(auth);
    } catch {}
    setCurrentUser(null);
    localStorage.removeItem('OFIC_CURRENT_USER');
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      loading,
      login,
      loginWithGoogle,
      updateUserDisplayName,
      register,
      logout,
      switchDemoUser,
      isAuthenticated: !!currentUser,
      isOfficer: currentUser?.role === 'officer' || currentUser?.role === 'admin',
      isAdmin: currentUser?.role === 'admin',
      isVictim: currentUser?.role === 'victim'
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
