import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { FaPaintBrush, FaComments, FaBars, FaUserFriends, FaSignOutAlt } from 'react-icons/fa';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { toast } from 'react-toastify';
import CodeEditor from './CodeEditor';
import WhiteBoard from './WhiteBoard';
import ChatBox from './ChatBox';

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const Room = () => {
  const { state } = useLocation();
  const { roomId } = useParams();
  const username = state?.username || 'Guest';
  const roomName = state?.roomName || 'Unnamed Room';
  const isAdmin = state?.isAdmin || false;

  const [activeTab, setActiveTab] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [output, setOutput] = useState('// Output will appear here');
  const [participants, setParticipants] = useState([]);
  const [socket, setSocket] = useState(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [activeCoder, setActiveCoder] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Refs for tracking state
  const typingTimeoutRef = useRef(null);
  const codeUpdateTimeoutRef = useRef(null);
  const pendingCodeUpdates = useRef([]);
  const lastReceivedRevision = useRef(0);

  // Initialize socket connection with enhanced options
  useEffect(() => {
    const newSocket = io(API_BASE_URL, {
      withCredentials: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true,
      transports: ['websocket']
    });

    setSocket(newSocket);

    // Connection events
    newSocket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
      
      // Join room with current state
      newSocket.emit('join_room', { 
        roomId, 
        username,
        isAdmin,
        currentCode: code
      });
    });
    
    newSocket.on('load-initial-code', (existingCode) => {
      console.log('Initial code received:', existingCode);
      setCode(existingCode);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });
    
    

    newSocket.on('connect_error', (err) => {
      console.error('Connection error:', err);
      toast.error('Connection lost. Reconnecting...');
    });

    // Room state synchronization
    newSocket.on('room_state', ({ code: initialCode, language: initialLanguage, revision, participants:updatedParticipants }) => {
      if (revision > lastReceivedRevision.current) {
        setCode(initialCode);
        setLanguage(initialLanguage);
        lastReceivedRevision.current = revision;
      }
      if(updatedParticipants){
        setParticipants(updatedParticipants);
      }
    });

    // Real-time code updates with conflict resolution
    newSocket.on('CODE_CHANGE', ({ code: newCode, senderName, revision }) => {
      if (senderName !== username && revision > lastReceivedRevision.current) {
        setCode(newCode);
        lastReceivedRevision.current = revision;
        
        setActiveCoder(senderName);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setActiveCoder(null), 2000);
      }
    });

    // Language change synchronization
    newSocket.on('language_changed', ({ language: newLanguage, senderName }) => {
      if (senderName !== username) {
        setLanguage(newLanguage);
        toast.info(`${senderName} changed language to ${newLanguage}`, {
          position: "top-center",
          autoClose: 3000,
        });
      }
    });

    // Participant synchronization
    newSocket.on('participants_updated', (updatedParticipants) => {
      setParticipants(updatedParticipants || []);
    });

    // newSocket.on('participant_joined', (participant) => {
    //   setParticipants(prev => [...prev, participant]);
    // });

    newSocket.on('participant_left', ({ socketId }) => {
      setParticipants(prev => prev.filter(p => p.socketId !== socketId));
    });


    // Initialize with empty state
    setCode('');
    setLanguage('javascript');
    setParticipants([]);

    return () => {
      newSocket.emit('leave_room', { roomId, username });
      newSocket.disconnect();
      clearTimeout(typingTimeoutRef.current);
      clearTimeout(codeUpdateTimeoutRef.current);
    };
  }, [roomId, username, isAdmin]);

  // Enhanced code change handler with debouncing and revision tracking
  const handleCodeChange = useCallback((newCode) => {
    const revision = Date.now();
    setCode(newCode);
    lastReceivedRevision.current = revision;

    // Notify others that user is typing
    socket?.emit('user_typing', username);
    
    // Debounce the code update (300ms)
    clearTimeout(codeUpdateTimeoutRef.current);
    codeUpdateTimeoutRef.current = setTimeout(() => {
      socket?.emit('CODE_CHANGE', { 
        roomId, 
        code: newCode, 
        senderName: username,
        revision
      });
    }, 300);
  }, [socket, roomId, username]);

  // Language change handler
  const handleLanguageChange = useCallback((newLanguage) => {
    setLanguage(newLanguage);
    socket?.emit('language_change', {
      roomId,
      language: newLanguage,
      senderName: username
    });
  }, [socket, roomId, username]);

  const handleLeaveRoom = async () => {
    try {
      socket?.emit('leave_room', { roomId, username });
      socket?.disconnect();
      window.location.href = '/';
    } catch (err) {
      console.error("Leave error:", err);
    }
  };

  const togglePanel = (panelName) => {
    setActiveTab(activeTab === panelName ? null : panelName);
  };

  const renderRightPanel = () => {
    switch (activeTab) {
      case 'whiteboard':
        return <WhiteBoard />;
      case 'chat':
        return <ChatBox socket={socket} roomId={roomId} username={username} />;
      case 'people':
        return (
          <div style={{ padding: '20px' }}>
            <h3>Participants ({participants.length})</h3>
            {participants.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {participants.map((participant, index) => (
                  <li key={index} style={styles.participantItem}>
                    <div>
                      {participant.username}
                      {participant.isAdmin && <span style={styles.adminBadge}>Admin</span>}
                    </div>
                    <span style={styles.joinTime}>
                      Joined: {new Date(participant.joinedAt).toLocaleTimeString()}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No participants</p>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const isError = output.startsWith('JavaScript Error:') || output.startsWith('Python Error:');

  return (
    <div style={styles.container}>
      {/* Top Navbar */}
      <div style={styles.navbar}>
        <div style={styles.title}>CollabBoard</div>
        <div style={styles.items}>Room Name: {roomName}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          
          <div style={styles.items}>Room ID: {roomId}</div>
          <button 
            onClick={handleLeaveRoom}
            style={styles.leaveButton}
            title="Leave Room"
          >
            <FaSignOutAlt /> Leave
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={styles.body}>
        {/* Sidebar */}
        <div style={{
          ...styles.sidebar,
          width: sidebarOpen ? '220px' : '75px',
          alignItems: sidebarOpen ? 'flex-start' : 'center',
        }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={styles.iconBtn}
            title="Toggle Menu"
          >
            <FaBars style={styles.icon} />
          </button>
          <button
            onClick={() => togglePanel('whiteboard')}
            style={styles.menuBtn}
          >
            <FaPaintBrush style={styles.icon} />
            {sidebarOpen && <span style={styles.label}>Whiteboard</span>}
          </button>
          <button
            onClick={() => togglePanel('chat')}
            style={styles.menuBtn}
          >
            <FaComments style={styles.icon} />
            {sidebarOpen && <span style={styles.label}>Chat</span>}
          </button>
          <button
            onClick={() => togglePanel('people')}
            style={styles.menuBtn}
          >
            <FaUserFriends style={styles.icon} />
            {sidebarOpen && <span style={styles.label}>People</span>}
          </button>
        </div>

        {/* Main Content */}
        <div style={{
          ...styles.mainContent,
          width: sidebarOpen ? 'calc(100vw - 220px)' : 'calc(100vw - 75px)'
        }}>
          {activeTab ? (
            <PanelGroup direction="horizontal" style={styles.panelGroup}>
              <Panel defaultSize={70} minSize={30}>
                <div style={styles.editorContainer}>
                  <CodeEditor 
                    code={code}
                    language={language}
                    onCodeChange={handleCodeChange}
                    onLanguageChange={handleLanguageChange}
                    onRunCode={setOutput}
                    activeCoder={activeCoder}
                  />
                  <div style={{
                    ...styles.outputBox,
                    ...(isError ? styles.errorOutput : {})
                  }}>
                    <h4>Output:</h4>
                    <pre style={styles.outputText}>{output}</pre>
                  </div>
                </div>
              </Panel>
              <PanelResizeHandle style={styles.resizeHandle} />
              <Panel minSize={20}>
                <div style={styles.rightPanel}>
                  {renderRightPanel()}
                </div>
              </Panel>
            </PanelGroup>
          ) : (
            <div style={styles.fullEditorContainer}>
              <CodeEditor 
                code={code}
                language={language}
                onCodeChange={handleCodeChange}
                onLanguageChange={handleLanguageChange}
                onRunCode={setOutput}
                activeCoder={activeCoder}
              />
              <div style={{
                ...styles.outputBox,
                ...(isError ? styles.errorOutput : {})
              }}>
                <h4>Output:</h4>
                <pre style={styles.outputText}>{output}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    fontFamily: 'sans-serif',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    color: "#000",
    backgroundColor: "#fff"
  },
  navbar: {
    display: 'flex',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    justifyContent: 'center',
    flexDirection: 'row',
    borderBottom: '1px solid #ccc',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    zIndex: 10,
    height: '80px',
    alignItems: 'center'
  },
  title: {
    fontSize: '30px',
    borderBottom: '2px solid blue',
    padding: '2px',
    marginRight: '390px',
  },
  items: {
    fontSize: '20px',
    margin: '0 50px'
  },
  activeCoderIndicator: {
    backgroundColor: '#e3f2fd',
    padding: '5px 10px',
    borderRadius: '4px',
    fontSize: '0.9em',
    marginRight: '20px'
  },
  leaveButton: {
    backgroundColor: '#ff4444',
    color: 'white',
    border: 'none',
    padding: '5px 10px',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    height: '30px'
  },
  body: {
    display: 'flex',
    flex: 1,
    marginTop: '80px',
    height: 'calc(100vh - 80px)',
    overflow: 'hidden',
    width: '100vw'
  },
  sidebar: {
    backgroundColor: '#f1f1f1',
    padding: '10px',
    transition: 'width 0.3s ease',
    borderRight: '1px solid #ccc',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    height: '100%',
    flexShrink: 0
  },
  mainContent: {
    flex: 1,
    height: '100%',
    overflow: 'hidden',
    position: 'relative'
  },
  panelGroup: {
    height: '100%',
    width: '100%'
  },
  editorContainer: {
    padding: '0px',
    height: '100%',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column'
  },
  fullEditorContainer: {
    padding: '0px',
    height: '100%',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    width: '100%'
  },
  rightPanel: {
    padding: '20px',
    height: '100%',
    overflowY: 'auto',
    width: '100%'
  },
  menuBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    fontSize: '18px',
    gap: '10px',
    width: '100%',
    color: '#000'
  },
  label: {
    fontSize: '16px',
    color: '#000'
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '20px',
    marginBottom: '10px',
    color: '#000'
  },
  icon: {
    color: '#000',
    fontSize: '20px'
  },
  outputBox: {
    marginTop: '16px',
    backgroundColor: '#eee',
    padding: '12px',
    borderRadius: '6px',
    minHeight: '100px',
    whiteSpace: 'pre-wrap',
    margin: '20px',
    overflow: 'auto'
  },
  errorOutput: {
    backgroundColor: '#fdd',
    color: '#d00',
    border: '1px solid #d99'
  },
  outputText: {
    margin: 0,
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
    fontFamily: 'monospace'
  },
  resizeHandle: {
    width: '5px',
    background: '#ccc',
    cursor: 'col-resize',
    height: '100%'
  },
  participantItem: {
    margin: '8px 0',
    padding: '12px',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  adminBadge: {
    marginLeft: '8px',
    backgroundColor: '#1976d2',
    color: 'white',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '0.8em'
  },
  joinTime: {
    fontSize: '0.8em',
    color: '#666'
  }
};

export default Room;