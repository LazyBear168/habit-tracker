// File: src/components/Login.jsx
// Author: Cheng
// Description:
//   Handles user authentication using Firebase.
//   Supports both email/password login and Google OAuth login via popup.
//   If login fails with email/password, the component attempts auto signup.
//   On successful authentication, invokes onLogin() with the authenticated user.

import { useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { auth } from '../firebase';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const provider = new GoogleAuthProvider();

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      onLogin(result.user);
    } catch (err) {
      alert('Google Sign-in failed: ' + err.message);
    }
  };

  const handleSignIn = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      onLogin(userCredential.user);
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        // 只有「帳號不存在」才自動註冊
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          onLogin(userCredential.user);
        } catch (signupErr) {
          alert('Signup failed: ' + signupErr.message);
        }
      } else if (err.code === 'auth/wrong-password') {
        alert('Wrong password');
      } else {
        alert(err.message);
      }
    }
  };

  const loginWithDemo = async (demoEmail, demoPass) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, demoEmail, demoPass);
      onLogin(userCredential.user);
    } catch (err) {
      alert('Demo login failed: ' + err.message);
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h2>🔐 Sign In</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <br />
      <br />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <br />
      <br />
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <button onClick={handleSignIn}>Login / Sign Up</button>
        <br />
        <br />
        <button onClick={handleGoogleLogin}>Sign in with Google</button>
        <br />
        <br />
        <button onClick={() => loginWithDemo('demo1@habit.com', 'demo123')}>
          Log in as Demo User 1
        </button>
        <button onClick={() => loginWithDemo('demo2@habit.com', 'demo123')}>
          Log in as Demo User 2
        </button>
      </div>
    </div>
  );
}
