// App.tsx - Refactored with new structure
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  useAnnouncements, 
  useAccessibilitySettings,
  useStreamConnection,
  useCallManagement 
} from './hooks';
import { ErrorBoundary, LoadingSpinner } from './components/Common';
import { AuthView } from './components/Auth';
import { HubView } from './components/Hub/HubView';
import { MeetingView } from './components/Meeting/MeetingView';
import { ChatView } from './components/Chat/ChatView';
import type { AppState, MeetingState, View, AccessibleMessage } from './types';
import { cleanupMediaTracks } from './utils';
import { UserSelectView } from './components/UserSelect/UserSelectView';


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

  const [authed, setAuthed] = useState(false);
  const [view, setView] = useState<View>('hub');
  const [currentMeeting, setCurrentMeeting] = useState<MeetingState>({ id: '', call: null });
  const [messages, setMessages] = useState<AccessibleMessage[]>([]);
const [users, setUsers] = useState<Array<{ id: string; name?: string; image?: string }>>([]);

  const { announce } = useAnnouncements();
  const { settings } = useAccessibilitySettings();
  
  const baseUrl = useMemo(() => 
    import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000',
    []
  );

  const { connect, isConnecting, error: connectionError } = useStreamConnection(baseUrl);

  const { 
    joinMeeting, 
    leaveMeeting, 
    isJoining, 
    transcriptionAvailable 
  } = useCallManagement({
    videoClient: state.videoClient,
    userId: state.user?.id || null,
    onSuccess: (call) => {
      setCurrentMeeting({ id: call.id, call });
      setState(prev => ({ ...prev, call }));
      announce('Successfully joined the meeting', 'polite');
    },
    onError: (error) => {
      setState(prev => ({ ...prev, error: error.message }));
      announce('Failed to join meeting', 'assertive');
    }
  });

  const handleAuth = useCallback(async (id: string, name?: string) => {
    try {
      const result = await connect(id, name);
      setState({
        chatClient: result.chatClient,
        videoClient: result.videoClient,
        channel: null,
        call: null,
        user: result.user,
        loading: false,
        error: null
      });
      setAuthed(true);
      setView('hub');
      announce('Successfully signed in', 'polite');
    } catch (error) {
      announce('Failed to sign in', 'assertive');
    }
  }, [connect, announce]);

  const handleJoinMeeting = useCallback(async (meetingId: string) => {
    setState(prev => ({ ...prev, loading: true }));
    await joinMeeting(meetingId);
    setState(prev => ({ ...prev, loading: false }));
  }, [joinMeeting]);

  const handleLeaveMeeting = useCallback(async () => {
    if (!currentMeeting.call) return;
    
    setState(prev => ({ ...prev, loading: true }));
    try {
      await leaveMeeting(currentMeeting.call);
      setCurrentMeeting({ id: '', call: null });
      setState(prev => ({ ...prev, call: null, loading: false }));
      setView('hub');
      announce('Successfully left the meeting', 'polite');
    } catch (error) {
      announce('Error leaving meeting', 'assertive');
      setView('hub');
      setCurrentMeeting({ id: '', call: null });
      setState(prev => ({ ...prev, call: null, loading: false }));
    }
  }, [currentMeeting.call, leaveMeeting, announce]);


const handleMessageSubmit = useCallback(async (message: string, attachments?: File[]) => {
  if (!state.channel || !state.chatClient) {
    announce('No active channel', 'assertive');
    return;
  }

  try {
    if (attachments && attachments.length > 0) {
      // Upload files to Stream's CDN
      const uploadPromises = attachments.map(async (file) => {
        const response = await state.chatClient!.uploadFile(file);
        return {
          asset_url: response?.file,
          file_size: file.size,
          mime_type: file.type,
          title: file.name,
          type: 'file' as const
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);

      // Send message with attachments
      await state.channel.sendMessage({
        text: message,
        attachments: uploadedFiles.filter(file => file.asset_url)
      });
    } else {
      // Send text-only message
      await state.channel.sendMessage({
        text: message
      });
    }
    
    announce('Message sent successfully', 'polite');
  } catch (error) {
    console.error('Error sending message:', error);
    announce('Failed to send message', 'assertive');
    throw error;
  }
}, [state.channel, state.chatClient, announce]);

useEffect(() => {
  const channel = state.channel;
  if (!channel) {
    setMessages([]);
    return;
  }
  
  // Initial load of messages
  const loadMessages = async () => {
    try {
      await channel.query({
        messages: { limit: 50 }
      });
      setMessages(channel.state.messages as AccessibleMessage[]);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };
  
  loadMessages();
  
  const handleMessageUpdate = () => {
    setMessages([...channel.state.messages] as AccessibleMessage[]);
  };
  
  channel.on('message.new', handleMessageUpdate);
  channel.on('message.updated', handleMessageUpdate);
  channel.on('message.deleted', handleMessageUpdate);
  
  return () => {
    channel.off('message.new', handleMessageUpdate);
    channel.off('message.updated', handleMessageUpdate);
    channel.off('message.deleted', handleMessageUpdate);
  };
}, [state.channel]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentMeeting.call) {
        cleanupMediaTracks(currentMeeting.call);
      }
    };
  }, [currentMeeting.call]);

  if (!authed) {
    return (
      <ErrorBoundary>
        <AuthView 
          onAuth={handleAuth}
          isLoading={isConnecting}
          error={connectionError}
        />
      </ErrorBoundary>
    );
  }

  if (state.loading) {
    return <LoadingSpinner message="Loading..." />;
  }

  return (
    <ErrorBoundary>
      <div className={`app ${settings.highContrast ? 'high-contrast' : ''} ${settings.reducedMotion ? 'reduced-motion' : ''}`}>
        <header className="app-header" role="banner">
          <h1>Accessible Video Chat</h1>
          {state.user && (
          <div className="user-info">
        <h2>Welcome, {state.user.name || state.user.id}</h2>
        {transcriptionAvailable && (
          <span className="feature-badge" role="status">
            Live Captions Available
          </span>
        )}
      </div>)}
        </header>

        {view === 'hub' && state.user && (
          <HubView 
            onNavigate={setView}
            transcriptionAvailable={transcriptionAvailable}
          />
        )}

        {view === 'meeting' && state.videoClient && (
          <MeetingView
            videoClient={state.videoClient}
            currentCall={currentMeeting.call}
            onJoinMeeting={handleJoinMeeting}
            onLeaveMeeting={handleLeaveMeeting}
            onBack={() => setView('hub')}
            isLoading={isJoining}
            error={state.error}
            transcriptionAvailable={transcriptionAvailable}
          />
        )}

         
    {view === 'chat-select' && state.chatClient && state.user && (
      <UserSelectView
        chatClient={state.chatClient}
        currentUser={state.user}
        baseUrl={baseUrl}
        onUserSelect={(channel) => {
          setState(prev => ({ ...prev, channel }));
          setView('chat');
        }}
        onBack={() => setView('hub')}
      />
    )}
        {view === 'chat' && state.channel && state.chatClient && (
          <ChatView 
            chatClient={state.chatClient}
            channel={state.channel}
            onBack={() => setView('hub')}
            messages={messages}
          onSubmit={handleMessageSubmit}
          />
        )}

      
      

        {/* Chat view would go here - simplified for brevity */}
      </div>
    </ErrorBoundary>
  );
};

export default App;