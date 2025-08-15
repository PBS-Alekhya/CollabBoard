import React, { useEffect, useState } from 'react';

const ChatBox = ({ socket, username, roomId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  // Receive messages from other users
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (message) => {
      setMessages(prev => [...prev, message]);
    };

    socket.on('chat_message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    return () => {
      socket.off('chat_message', handleMessage);
    };
  }, [socket]);

  const sendMessage = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const messageData = {
      text: trimmed,
      sender: username,
      roomId,
      time: new Date().toLocaleTimeString()
    };

    socket.emit('chat_message', messageData); // send to others
    setMessages(prev => [...prev, messageData]); // show to self
    setInput('');
  };

  return (
    <div style={styles.container}>
      <h3>Chat</h3>
      <div style={styles.chatArea}>
        {messages.map((msg, index) => (
          <div key={index} style={styles.message}>
            <strong>{msg.sender}</strong> <span style={styles.time}>[{msg.time}]</span>: {msg.text}
          </div>
        ))}
      </div>
      <div>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={styles.input}
          placeholder="Type a message"
        />
        <button onClick={sendMessage} style={styles.button}>Send</button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    border: '1px solid #ddd',
    padding: '10px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  chatArea: {
    flex: 1,
    overflowY: 'auto',
    marginBottom: '10px',
    maxHeight: '300px'
  },
  message: {
    marginBottom: '5px',
    fontSize: '14px'
  },
  time: {
    fontSize: '12px',
    color: '#555'
  },
  input: {
    width: '70%',
    padding: '6px'
  },
  button: {
    padding: '6px 10px',
    marginLeft: '5px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '3px'
  }
};

export default ChatBox;
