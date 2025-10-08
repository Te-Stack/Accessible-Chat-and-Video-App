 // components/Auth/AuthView.tsx
import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';
import type { AuthMode, Credentials } from '../../types';

interface AuthViewProps {
  onAuth: (id: string, name?: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export const AuthView: React.FC<AuthViewProps> = ({ onAuth, isLoading, error }) => {
  const [authMode, setAuthMode] = useState<AuthMode>('signup');
  const [credentials, setCredentials] = useState<Credentials>({ id: '', name: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === 'signup') {
      await onAuth(credentials.id, credentials.name);
    } else {
      await onAuth(credentials.id);
    }
  };

  return (
    <div className="auth-container" role="main" aria-label="Authentication">
      <div className="auth-card" role="region" aria-labelledby="auth-title">
        <h2 id="auth-title" className="auth-title">
          {authMode === 'signup' ? 'Sign up' : 'Sign in'}
        </h2>

        {authMode === 'signup' ? (
          <SignupForm
            credentials={credentials}
            onChange={setCredentials}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
          />
        ) : (
          <LoginForm
            userId={credentials.id}
            onChange={(id) => setCredentials({ ...credentials, id })}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
          />
        )}

        <div className="auth-toggle">
          <button
            type="button"
            className="link-button"
            onClick={() => setAuthMode(prev => prev === 'signup' ? 'signin' : 'signup')}
            aria-label={authMode === 'signup' ? 'Switch to sign in' : 'Switch to sign up'}
          >
            {authMode === 'signup' 
              ? 'Already have an account? Sign in' 
              : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
};