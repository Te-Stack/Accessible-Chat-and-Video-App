// components/Auth/LoginForm.tsx
import React from 'react';

interface LoginFormProps {
  userId: string;
  onChange: (userId: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  error: string | null;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  userId,
  onChange,
  onSubmit,
  isLoading,
  error
}) => {
  return (
    <form onSubmit={onSubmit} className="auth-form" aria-label="Sign in form">
      <label className="field">
        <span>User ID</span>
        <input
          className="input"
          placeholder="Enter user id"
          value={userId}
          onChange={e => onChange(e.target.value)}
          required
          aria-required="true"
          disabled={isLoading}
        />
      </label>

      <button
        type="submit"
        className="button primary"
        disabled={isLoading || !userId}
      >
        {isLoading ? 'Connecting...' : 'Sign in'}
      </button>

      {error && (
        <div role="alert" className="error-text">
          {error}
        </div>
      )}
    </form>
  );
};