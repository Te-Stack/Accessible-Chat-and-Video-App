// components/UserSelect/UserSelectView.tsx
import React, { useState, useEffect } from 'react';
import type { StreamChat } from 'stream-chat';
import type { StreamUser } from '../../types';

interface User {
  id: string;
  name?: string;
  image?: string;
}

interface UserSelectViewProps {
  chatClient: StreamChat;
  currentUser: StreamUser;
  baseUrl: string;
  onUserSelect: (channel: any) => void;
  onBack: () => void;
}

export const UserSelectView: React.FC<UserSelectViewProps> = ({
  chatClient,
  currentUser,
  baseUrl,
  onUserSelect,
  onBack
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`${baseUrl}/users`);
      if (!res.ok) throw new Error('Failed to load users');
      
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : (data.users || []));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load users';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

const handleUserSelect = async (user: User) => {
  try {
    // Create channel with both users
    const channel = chatClient.channel('messaging', undefined, {
      members: [currentUser.id, user.id],
    });
    
    // Watch the channel to load messages
    await channel.watch();
    
    // Query existing messages
    await channel.query({
      messages: { limit: 50 }
    });
    
    onUserSelect(channel);
  } catch (err) {
    console.error('Failed to create channel:', err);
    setError('Failed to start chat');
  }
};

  const getUserInitial = (user: User): string => {
    return (user.name || user.id).slice(0, 1).toUpperCase();
  };

  const filteredUsers = users.filter(u => u.id !== currentUser.id);

  return (
    <section className="panel" aria-label="Select a user to chat">
      <h2 className="panel-title">Choose a user</h2>

      {error && (
        <div className="error-text" role="alert">
          {error}
        </div>
      )}

      <div className="user-list" role="list">
        {!users.length && !isLoading && (
          <div className="empty-state">
            <p>Load available users to start chatting</p>
            <button
              className="button primary"
              onClick={loadUsers}
              type="button"
            >
              Load users
            </button>
          </div>
        )}

        {isLoading && (
          <div className="hint" role="status" aria-live="polite">
            Loading users...
          </div>
        )}

        {filteredUsers.map(user => (
          <button
            key={user.id}
            className="user-item"
            role="listitem"
            onClick={() => handleUserSelect(user)}
            aria-label={`Chat with ${user.name || user.id}`}
            type="button"
          >
            {user.image ? (
              <img 
                src={user.image} 
                alt="" 
                className="user-avatar"
                aria-hidden="true"
              />
            ) : (
              <span className="user-avatar" aria-hidden="true">
                {getUserInitial(user)}
              </span>
            )}
            <span className="user-name">{user.name || user.id}</span>
          </button>
        ))}
      </div>

      <div className="panel-actions">
        <button 
          className="button" 
          onClick={onBack}
          type="button"
        >
          Back
        </button>
      </div>
    </section>
  );
};