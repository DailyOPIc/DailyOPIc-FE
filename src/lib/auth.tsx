import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  GoogleAuthProvider,
  OAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { auth } from "./firebase";
import { callNative, nativeApp } from "./native";

type AuthState = { user: User | null; ready: boolean };

const AuthContext = createContext<AuthState>({ user: null, ready: false });

// iOS 앱 안: 로그인은 앱이 이미 했다(익명 → Google/Apple 연결). 웹은 그 uid로 화면만 그린다.
// 화면이 쓰는 건 uid(와 웹 결제용 email)뿐이라 Firebase User 전체를 흉내 내지 않는다.
const APP_STATE: AuthState | null = nativeApp ? { user: { uid: nativeApp.uid } as User, ready: true } : null;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(APP_STATE ?? { user: auth.currentUser, ready: false });
  useEffect(() => (APP_STATE ? undefined : onAuthStateChanged(auth, (user) => setState({ user, ready: true }))), []);
  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

export function signInWithGoogle() {
  return signInWithPopup(auth, new GoogleAuthProvider());
}

export function signInWithApple() {
  const provider = new OAuthProvider("apple.com");
  provider.addScope("email");
  provider.setCustomParameters({ locale: "ko" });
  return signInWithPopup(auth, provider);
}

export const signOut = () => (nativeApp ? callNative("openAccount") : firebaseSignOut(auth));
