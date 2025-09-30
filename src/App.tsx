// App.tsx with Stream native transcription support - FIXED
import React, { useEffect, useState } from 'react';
import { StreamChat } from 'stream-chat';
import { Chat } from 'stream-chat-react';
import { StreamVideo, StreamVideoClient, Call } from '@stream-io/video-react-sdk';
import AccessibleChatContainer from './components/AccessibleChat/ChatContainer';
import AccessibleMessageList from './components/AccessibleChat/MessageList';
import AccessibleMessageInput from './components/AccessibleChat/MessageInput';
import AccessibleVideoContainer from './components/AccessibleVideo/VideoContainer';
import { useAnnouncements } from './hooks/useAnnouncements';
import { useAccessibilitySettings } from './hooks/useAccessibilitySettings';
import type { StreamUser, AccessibleMessage } from './types/stream';

interface AppState {
  chatClient: StreamChat | null;
  videoClient: StreamVideoClient | null;
  channel: any;
  call: Call | null;
  user: StreamUser | null;
  loading: boolean;
  error: string | null;
}

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    chatClient: null,
    videoClient: null,
    channel: null,
    call: null,
    user: null,
    loading: false,
    error: null
  });

  const { announce } = useAnnouncements();
  const { settings } = useAccessibilitySettings();

  const [creds, setCreds] = useState({ id: '', name: '' });
  const [authed, setAuthed] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'signup' | 'signin'>('signup');
  const [view, setView] = useState<'hub' | 'chat-select' | 'chat' | 'meeting'>('hub');
  const [currentMeeting, setCurrentMeeting] = useState<{ id: string; call: Call | null }>({
    id: '',
    call: null
  });
  const [users, setUsers] = useState<Array<{ id: string; name?: string; image?: string }>>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [meetingId, setMeetingId] = useState('');
  const [messages, setMessages] = useState<AccessibleMessage[]>([]);

  // Handle message and attachment submission
  const handleMessageSubmit = async (message: string, attachments?: File[]) => {
    if (!state.channel || !state.chatClient) {
      announce('No active channel');
      return;
    }

    try {
      if (attachments && attachments.length > 0) {
        // First upload each file to Stream's CDN
        const uploadPromises = attachments.map(async (file) => {
          const response = await state.chatClient?.uploadFile(file);
          return {
            asset_url: response?.file,
            file_size: file.size,
            mime_type: file.type,
            title: file.name,
            type: 'file'
          };
        });

        const uploadedFiles = await Promise.all(uploadPromises);

        // Send message with attachments
        await state.channel.sendMessage({
          text: message,
          attachments: uploadedFiles.filter(file => file.asset_url) // Only include successfully uploaded files
        });
      } else {
        // Send text-only message
        await state.channel.sendMessage({
          text: message
        });
      }
      
      announce('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      announce('Failed to send message');
      throw error;
    }
  };
  const [transcriptionAvailable, setTranscriptionAvailable] = useState(true);

  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

  const startSession = async (id: string, name?: string) => {
    setAuthLoading(true);
    setState(prev => ({ ...prev, error: null }));
    
    try {
      const res = await fetch(`${baseUrl}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name }),
      });
      
      if (!res.ok) throw new Error('Auth failed');
      const { apiKey, user, token } = await res.json();

      const chatClient = StreamChat.getInstance(apiKey);
      await chatClient.connectUser(user, token);

      const videoClient = StreamVideoClient.getOrCreateInstance({ 
        apiKey, 
        user, 
        token 
      });

      setState({ 
        chatClient, 
        videoClient, 
        channel: null, 
        call: null, 
        user, 
        loading: false, 
        error: null 
      });
      
      setAuthed(true);
      setView('hub');
      announce('Successfully signed in with transcription support');
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Failed to connect';
      setState(prev => ({ ...prev, error: errorMsg }));
      announce('Failed to sign in');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleJoinMeeting = async (meetingId: string) => {
    if (!state.videoClient || !state.user) {
      announce('Cannot join meeting. Please check your connection.');
      return;
    }
    
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      announce('Creating meeting with transcription support...');
      
      // Create the call using Stream's direct API
      const call = state.videoClient.call('default', meetingId);
      
      // Enable transcription at call level BEFORE joining
      try {
        await call.getOrCreate({
          data: {
            // Store user ID in custom data
            custom: {
              createdById: state.user.id
            },
            settings_override: {
              transcription: {
                mode: 'available', // Make transcription available
                closed_caption_mode: 'available', // Make closed captions available
                language: 'en'
              }
            }
          }
        });
        
        console.log('Call created with transcription support');
        setTranscriptionAvailable(true);
        announce('Meeting created with live caption support');
      } catch (transcriptionError) {
        console.warn('Could not enable transcription:', transcriptionError);
        // Still create the call without transcription
        await call.getOrCreate({
          data: {
            custom: {
              createdById: state.user.id
            }
          }
        });
        setTranscriptionAvailable(false);
        announce('Meeting created but live captions may not be available');
      }
      
      // Join the call
      await call.join();
      
      // Update state
      setCurrentMeeting({ id: meetingId, call });
      setState(prev => ({ ...prev, call, loading: false }));
      
      // Enable devices with proper error handling
      setTimeout(async () => {
        try {
          if (call.camera) {
            await call.camera.enable();
            console.log('Camera enabled successfully');
          }
          if (call.microphone) {
            await call.microphone.enable();
            console.log('Microphone enabled successfully');
          }
          announce('Camera and microphone enabled');
        } catch (error) {
          console.warn('Could not enable devices:', error);
          announce('Joined meeting, but some devices may not be available');
        }
      }, 500);
      
      announce('Successfully joined the meeting');
      
    } catch (error) {
      console.error('Error joining meeting:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: `Failed to join meeting: ${errorMessage}` 
      }));
      announce('Failed to join meeting');
    }
  };

  const handleLeaveMeeting = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      announce('Leaving meeting...');

      if (currentMeeting.call) {
        console.log('Starting device cleanup...');
        
        // Stop closed captions if active using Stream's direct API
        try {
          if (currentMeeting.call.state.transcribing) {
            await currentMeeting.call.stopClosedCaptions();
            console.log('Stopped closed captions');
          }
        } catch (captionError) {
          console.warn('Could not stop closed captions:', captionError);
        }

        // Stop all media tracks first
        try {
          const localParticipant = currentMeeting.call.state.localParticipant;
          
          if (localParticipant?.videoStream) {
            localParticipant.videoStream.getTracks().forEach(track => {
              console.log('Stopping video track:', track.kind);
              track.stop();
            });
          }
          
          if (localParticipant?.audioStream) {
            localParticipant.audioStream.getTracks().forEach(track => {
              console.log('Stopping audio track:', track.kind);
              track.stop();
            });
          }
        } catch (error) {
          console.warn('Error stopping media tracks:', error);
        }

        // Disable camera and microphone through Stream API
        try {
          if (currentMeeting.call.camera && currentMeeting.call.camera.enabled) {
            console.log('Disabling camera...');
            await currentMeeting.call.camera.disable();
          }
        } catch (error) {
          console.warn('Error disabling camera:', error);
        }

        try {
          if (currentMeeting.call.microphone && currentMeeting.call.microphone.enabled) {
            console.log('Disabling microphone...');
            await currentMeeting.call.microphone.disable();
          }
        } catch (error) {
          console.warn('Error disabling microphone:', error);
        }

        // Leave the call
        try {
          console.log('Leaving call...');
          await currentMeeting.call.leave();
        } catch (error) {
          console.warn('Error leaving call:', error);
        }
      }

      // Reset application state
      setCurrentMeeting({ id: '', call: null });
      setState(prev => ({ 
        ...prev, 
        call: null, 
        loading: false 
      }));
      setView('hub');
      
      console.log('Meeting cleanup completed');
      announce('Successfully left the meeting');
      
    } catch (error) {
      console.error('Error leaving meeting:', error);
      announce('Error leaving meeting');
      
      // Still navigate back even if there was an error
      setView('hub');
      setCurrentMeeting({ id: '', call: null });
      setState(prev => ({ ...prev, call: null, loading: false }));
    }
  };

  // Load messages when channel changes
  useEffect(() => {
    const channel = state.channel;
    if (!channel) return;
    
    setMessages(channel.state.messages as AccessibleMessage[]);
    
    const handleNew = () => {
      setMessages([...channel.state.messages] as AccessibleMessage[]);
    };
    
    channel.on('message.new', handleNew);
    channel.on('message.updated', handleNew);
    channel.on('message.deleted', handleNew);
    
    return () => {
      channel.off('message.new', handleNew);
      channel.off('message.updated', handleNew);
      channel.off('message.deleted', handleNew);
    };
  }, [state.channel]);

  // Cleanup on page unload
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (currentMeeting.call) {
        try {
          const localParticipant = currentMeeting.call.state.localParticipant;
          if (localParticipant?.videoStream) {
            localParticipant.videoStream.getTracks().forEach(track => track.stop());
          }
          if (localParticipant?.audioStream) {
            localParticipant.audioStream.getTracks().forEach(track => track.stop());
          }
        } catch (error) {
          console.warn('Cleanup error on unload:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (currentMeeting.call) {
        handleBeforeUnload();
      }
    };
  }, [currentMeeting.call]);

  if (!authed) {
    return (
      <div className="auth-container" role="main" aria-label="Authentication">
        <div className="auth-card" role="region" aria-labelledby="auth-title">
          <h2 id="auth-title" className="auth-title">
            {authMode === 'signup' ? 'Sign up' : 'Sign in'}
          </h2>
          <form
            onSubmit={e => {
              e.preventDefault();
              if (authMode === 'signup') {
                void startSession(creds.id, creds.name);
              } else {
                void startSession(creds.id);
              }
            }}
            className="auth-form"
            aria-label={authMode === 'signup' ? 'Sign up form' : 'Sign in form'}
          >
            <label className="field">
              <span>User ID</span>
              <input
                className="input"
                placeholder="Enter user id"
                value={creds.id}
                onChange={e => setCreds({ ...creds, id: e.target.value })}
                required
              />
            </label>
            {authMode === 'signup' && (
              <label className="field">
                <span>Name</span>
                <input
                  className="input"
                  placeholder="Enter display name"
                  value={creds.name}
                  onChange={e => setCreds({ ...creds, name: e.target.value })}
                  required
                />
              </label>
            )}
            <button
              type="submit"
              className="button primary"
              disabled={authLoading || !creds.id || (authMode === 'signup' && !creds.name)}
            >
              {authLoading ? 'Connecting...' : (authMode === 'signup' ? 'Create account' : 'Sign in')}
            </button>
            {state.error && (
              <div role="alert" className="error-text">
                {state.error}
              </div>
            )}
          </form>
          <div className="auth-toggle">
            <button
              type="button"
              className="link-button"
              onClick={() => setAuthMode(prev => (prev === 'signup' ? 'signin' : 'signup'))}
              aria-label={authMode === 'signup' ? 'Switch to sign in' : 'Switch to sign up'}
            >
              {authMode === 'signup' ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // handleSendMessage has been replaced by handleMessageSubmit

  if (state.loading) {
    return (
      <div className="loading-container" role="status" aria-live="polite">
        <div className="loading-spinner" aria-hidden="true"></div>
        <span>Loading...</span>
      </div>
    );
  }

  if (state.error && view === 'hub') {
    return (
      <div className="error-container" role="alert">
        <h1>Connection Failed</h1>
        <p>{state.error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="retry-button"
          type="button"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className={`app ${settings.highContrast ? 'high-contrast' : ''} ${settings.reducedMotion ? 'reduced-motion' : ''}`}>
      <header className="app-header" role="banner">
        <h1>Accessible Video Chat</h1>
        {state.user && (
          <div className="user-info">
            Welcome, {state.user.name || state.user.id}
            {transcriptionAvailable && (
              <div className="feature-badge">
                Live Captions Available
              </div>
            )}
          </div>
        )}
      </header>

      {view === 'hub' && (
        <div className="hub" role="navigation" aria-label="Main actions">
          <div className="hub-grid">
            <button 
              className="button primary" 
              onClick={() => setView('chat-select')} 
              aria-label="Chat with user"
            >
              Chat with user
            </button>
            <button 
              className="button secondary" 
              onClick={() => setView('meeting')} 
              aria-label="Start or join meeting"
            >
              Start / Join meeting
              {transcriptionAvailable && <span className="feature-hint">with live captions</span>}
            </button>
          </div>
        </div>
      )}

      {view === 'chat-select' && (
        <section className="panel" aria-label="Select a user to chat">
          <h2 className="panel-title">Choose a user</h2>
          <div className="user-list" role="list">
            {!users.length && !usersLoading && (
              <button
                className="button"
                onClick={async () => {
                  if (usersLoading) return;
                  setUsersLoading(true);
                  try {
                    const res = await fetch(`${baseUrl}/users`);
                    if (res.ok) {
                      const data = await res.json();
                      setUsers(Array.isArray(data) ? data : (data.users || []));
                    }
                  } finally {
                    setUsersLoading(false);
                  }
                }}
              >
                Load users
              </button>
            )}
            {usersLoading && <div className="hint">Loading users...</div>}
            {users.filter(u => u.id !== state.user?.id).map(u => (
              <button
                key={u.id}
                className="user-item"
                role="listitem"
                onClick={async () => {
                  if (!state.chatClient || !state.user) return;
                  const channel = state.chatClient.channel('messaging', undefined, {
                    members: [state.user.id, u.id],
                  });
                  await channel.watch();
                  setState(prev => ({ ...prev, channel }));
                  setView('chat');
                }}
                aria-label={`Chat with ${u.name || u.id}`}
              >
                <span className="user-avatar" aria-hidden="true">
                  {(u.name || u.id).slice(0,1).toUpperCase()}
                </span>
                <span className="user-name">{u.name || u.id}</span>
              </button>
            ))}
          </div>
          <div className="panel-actions">
            <button className="button" onClick={() => setView('hub')}>
              Back
            </button>
          </div>
        </section>
      )}

      {view === 'chat' && state.channel && (
        <section className="chat-section" aria-label="Chat">
          <Chat client={state.chatClient!}>
            <AccessibleChatContainer>
              <AccessibleMessageList messages={messages} client={state.chatClient!} />
              <AccessibleMessageInput 
                onSubmit={handleMessageSubmit}
                maxLength={1000}
                maxFileSize={10 * 1024 * 1024} // 10MB
                allowedFileTypes={[
                  'image/*',
                  'video/*',
                  'audio/*',
                  '.pdf',
                  '.doc',
                  '.docx',
                  '.xls',
                  '.xlsx'
                ]}
              />
            </AccessibleChatContainer>
          </Chat>
          <div className="panel-actions">
            <button className="button" onClick={() => setView('hub')}>
              Back
            </button>
          </div>
        </section>
      )}

      {view === 'meeting' && (
        <section className="panel" aria-label="Start or join a meeting">
          {!currentMeeting.call ? (
            <>
              <h2 className="panel-title">Start or join a meeting</h2>
              {transcriptionAvailable && (
                <div className="feature-notice" role="note">
                  This meeting will support live captions powered by Stream Video closed captions.
                </div>
              )}
              <div className="meeting-form">
                <label className="field">
                  <span>Meeting ID</span>
                  <input
                    className="input"
                    placeholder="Enter meeting ID (or generate one)"
                    value={meetingId}
                    onChange={e => setMeetingId(e.target.value)}
                  />
                </label>
                <div className="buttons-row">
                  <button
                    className="button primary"
                    onClick={() => {
                      if (!meetingId) {
                        const id = `meeting-${Math.random().toString(36).slice(2, 7)}`;
                        setMeetingId(id);
                        announce(`Generated meeting ID: ${id}`);
                      } else {
                        handleJoinMeeting(meetingId);
                      }
                    }}
                    disabled={state.loading}
                  >
                    {state.loading ? 'Starting...' : (meetingId ? 'Start Meeting' : 'Generate ID')}
                  </button>
                  <button
                    className="button secondary"
                    onClick={() => handleJoinMeeting(meetingId)}
                    disabled={!meetingId || state.loading}
                  >
                    {state.loading ? 'Joining...' : 'Join Meeting'}
                  </button>
                  <button 
                    className="button"
                    onClick={() => setView('hub')}
                    disabled={state.loading}
                  >
                    Back
                  </button>
                </div>
              </div>
              {state.error && (
                <div role="alert" className="error-text">
                  {state.error}
                </div>
              )}
            </>
          ) : (
            <div className="video-wrapper">
              {state.videoClient && (
                <StreamVideo client={state.videoClient}>
                  <AccessibleVideoContainer
                    call={currentMeeting.call}
                    onLeaveMeeting={handleLeaveMeeting}
                    showPreview={false}
                  />
                </StreamVideo>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default App;