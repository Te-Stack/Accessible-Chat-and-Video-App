// components/Auth/SignupForm.tsx
import React from 'react';
import type { Credentials } from '../../types';

interface SignupFormProps {
  credentials: Credentials;
  onChange: (credentials: Credentials) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  error: string | null;
}

export const SignupForm: React.FC<SignupFormProps> = ({
  credentials,
  onChange,
  onSubmit,
  isLoading,
  error
}) => {
  return (
    <form onSubmit={onSubmit} className="auth-form" aria-label="Sign up form">
      <label className="field">
        <span>User ID</span>
        <input
          className="input"
          placeholder="Enter user id"
          value={credentials.id}
          onChange={e => onChange({ ...credentials, id: e.target.value })}
          required
          aria-required="true"
          disabled={isLoading}
        />
      </label>

      <label className="field">
        <span>Name</span>
        <input
          className="input"
          placeholder="Enter display name"
          value={credentials.name}
          onChange={e => onChange({ ...credentials, name: e.target.value })}
          required
          aria-required="true"
          disabled={isLoading}
        />
      </label>

      <button
        type="submit"
        className="button primary"
        disabled={isLoading || !credentials.id || !credentials.name}
      >
        {isLoading ? 'Connecting...' : 'Create account'}
      </button>

      {error && (
        <div role="alert" className="error-text">
          {error}
        </div>
      )}
    </form>
  );
};