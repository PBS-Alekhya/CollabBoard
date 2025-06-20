import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuid } from "uuid";
import { SocketContext } from "../context/SocketContext"; // Fixed import path

export default function Home() {
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const socket = useContext(SocketContext);
  
  const handleCreateRoom = () => {
    if (!username.trim()) {
      setError("Please enter a username");
      return;
    }
    const id = uuid().slice(0, 8);
    navigate(`/room/${id}?username=${encodeURIComponent(username)}`);
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (!roomId.trim() || !username.trim()) {
      setError("Please enter both fields");
      return;
    }
    navigate(`/room/${roomId}?username=${encodeURIComponent(username)}`);
  };

   return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>CollabBoard</h1>
      <p>Real-time collaborative coding</p>
      
      {error && <div style={{ color: 'red', margin: '10px 0' }}>{error}</div>}
      
      <div style={{ margin: '20px 0' }}>
        <div>
          <label>Your Name:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ width: '100%', padding: '8px', margin: '5px 0' }}
          />
        </div>
        
        <div>
          <label>Room ID (leave empty to create new):</label>
          <input
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            style={{ width: '100%', padding: '8px', margin: '5px 0' }}
          />
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '10px' }}>
        <button 
          onClick={handleCreateRoom}
          style={{ padding: '8px 16px', background: '#007bff', color: 'white', border: 'none' }}
        >
          Create New Room
        </button>
        <button
          onClick={handleJoinRoom}
          disabled={!roomId}
          style={{ 
            padding: '8px 16px', 
            background: !roomId ? '#ccc' : '#28a745', 
            color: 'white', 
            border: 'none'
          }}
        >
          Join Room
        </button>
      </div>
    </div>
  );
}
