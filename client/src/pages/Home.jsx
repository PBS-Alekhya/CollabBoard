import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

const Home = () => {
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  const [roomName, setRoomName] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [password, setPassword] = useState(""); // For creating private rooms
  const [joinPassword, setJoinPassword] = useState(""); // For joining private rooms
  const [showJoinFields, setShowJoinFields] = useState(false);
  const [showCreateFields, setShowCreateFields] = useState(false);
  const [isPrivateRoom, setIsPrivateRoom] = useState(false); // Track if joining private room
  const navigate = useNavigate();
  const API_BASE_URL = "http://localhost:5000";
  // Create a new room (now connects to backend)
  const handleCreateRoom = async () => {
    if (!username || !roomName) return alert("Enter your name and room name");
    if (visibility === "private" && !password) return alert("Set a password for private rooms");

    try {
      const response = await axios.post(`${API_BASE_URL}/api/rooms/create`, {
        roomName,
        admin: username,
        visibility,
        password: visibility === "private" ? password : undefined
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      navigate(`/room/${response.data.roomId}`, {
        state: {
          username,
          roomName,
          isAdmin: true,
          visibility
        }
      });
    } catch (error) {
      console.error("Creation error:", error);
      alert(error.response?.data?.error || "Failed to create room. Check console for details.");
    }
  };

  // Join an existing room (now connects to backend)
  const handleJoinRoom = async () => {
    if (!username || !roomId) return alert("Enter both name and room ID");
    if (isPrivateRoom && !joinPassword) return alert("Enter room password");

    try {
      const response = await axios.post("http://localhost:5000/api/rooms/join", {
        roomId,
        password: isPrivateRoom ? joinPassword : undefined
      });

      navigate(`/room/${roomId}`, {
        state: {
          username,
          isAdmin: false,
          roomName: response.data.roomName,
          visibility: response.data.visibility
        }
      });
    } catch (error) {
      alert(error.response?.data?.error || "Failed to join room");
    }
  };

  // Check room visibility before joining
  const checkRoomVisibility = async () => {
    if (!roomId) return alert("Enter room ID");
    
    try {
      const response = await axios.get(`http://localhost:5000/api/rooms/${roomId}/visibility`);
      if (response.data.visibility === "private") {
        setIsPrivateRoom(true); // Show password field
      } else {
        handleJoinRoom(); // Proceed directly if public
      }
    } catch (error) {
      alert(error.response?.data?.error || "Room not found");
    }
  };

  return (
    <div style={styles.container}>
      {/* Header (unchanged) */}
      <div style={styles.header}>
        <div style={styles.name}>
          <img
            src="https://cdn-icons-png.flaticon.com/512/3039/3039396.png"
            alt="Logo"
            style={styles.logo}
          />
          <h1 style={styles.title}>CollabBoard</h1>
        </div>
        <div style={styles.authButtons}>
          <button style={styles.navButton}>Sign In</button>
          <button style={styles.navButton}>Sign Up</button>
        </div>
      </div>

      {/* Hero Section (unchanged) */}
      <div style={styles.hero}>
        <div style={styles.left}>
          <h2 style={{ fontSize: "38px", color: "#333", marginBottom: "6px" }}>
            Code, Collaborate, Create - Together in Real Time
          </h2>
          <p style={{ fontSize: "28px" }}> Work seamlessly with your team from anywhere. CollabBoard combines real-time coding, interactive whiteboards, and instant chat to make collaboration effortless and productive. </p>
        </div>

        <div style={styles.right}>
          <h2 style={{ fontSize: "32px" }}>Start Collaborating</h2>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              style={styles.button}
              onClick={() => {
                setShowCreateFields(true);
                setShowJoinFields(false);
              }}
            >
              Create New Room
            </button>
            <button
              style={styles.button}
              onClick={() => {
                setShowJoinFields(true);
                setShowCreateFields(false);
                setIsPrivateRoom(false); // Reset private room check
              }}
            >
              Join Now
            </button>
          </div>

          {/* Create Room Form */}
                      {showCreateFields && (
              <form onSubmit={(e) => {
                e.preventDefault();
                handleCreateRoom();
              }} style={styles.form}>
                <input
                  type="text"
                  placeholder="Your name (Admin)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={styles.input}
                  required
                />
                <input
                  type="text"
                  placeholder="Room Name"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  style={styles.input}
                  required
                />
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                  style={styles.input}
                >
                  <option value="public">Public (Anyone can join)</option>
                  <option value="private">Private (Password required)</option>
                </select>
                
                {visibility === 'private' && (
                  <input
                    type="password"
                    placeholder="Set Room Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={styles.input}
                    required={visibility === 'private'}
                    autoComplete="current-password" 
                  />
                )}
                
                <button type="submit" style={styles.button}>
                  Create Room
                </button>
              </form>
            )}

          {/* Join Room Form */}
          {showJoinFields && (
            <div style={styles.form}>
              <input
                type="text"
                placeholder="Your name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={styles.input}
              />
              <input
                type="text"
                placeholder="Room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                style={styles.input}
              />
              
              {isPrivateRoom && (
                <input
                  type="password"
                  placeholder="Enter Room Password"
                  value={joinPassword}
                  onChange={(e) => setJoinPassword(e.target.value)}
                  style={styles.input}
                />
              )}
              
              <button 
                onClick={isPrivateRoom ? handleJoinRoom : checkRoomVisibility} 
                style={styles.button}
              >
                {isPrivateRoom ? "Join Room" : "Check Room"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Features Section (unchanged) */}
      <div style={styles.features}>
        <h3 style={styles.featuresTitle}> Key Features</h3>
        <div style={styles.featureCards}>
          <div style={styles.featureCard}>
            <h4>💻 Code Editor</h4>
            <p>Collaborate in real-time with support for JavaScript and Python.</p>
          </div>
          <div style={styles.featureCard}>
            <h4>🧠 Whiteboard</h4>
            <p>Sketch ideas visually to explain and brainstorm with your team.</p>
          </div>
          <div style={styles.featureCard}>
            <h4>💬 In-room Chat</h4>
            <p>Communicate instantly with teammates while working on code.</p>
          </div>
        </div>
      </div>

      {/* Footer (unchanged) */}
      <div style={styles.footer}>
        <p>&copy; 2025 CollabBoard. All rights reserved.</p>
      </div>
    </div>
  );
};

// Styles (unchanged)
const styles = {
  container: {
    fontFamily: "sans-serif",
    padding: "0 70px",
    color: "black",
    backgroundColor: "white"
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
    padding: "10px 20px",
    position: "fixed",
    width: "100%",
    top: "0",
    left: "0",
    right: "0",
    backgroundColor: "#fff",
    borderBottom: "1px solid transparent",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    zIndex: 1000,
    paddingLeft: "15px",
    paddingRight: "15px",
  },
  name: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: "900px"
  },
  logo: {
    width: "50px",
    height: "50px",
    marginRight: "5px",
  },
  title: {
    fontSize: "35px",
    color: "#444",
    paddingLeft: "0"
  },
  authButtons: {
    display: "flex",
    gap: "10px",
  },
  navButton: {
    padding: "8px 16px",
    backgroundColor: "#1976d2",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  hero: {
    display: "flex",
    justifyContent: "space-around",
    width: "90%",
    padding: "160px 0 60px 0",
    margin: "50px 120px"
  },
  left: {
    flex: 1,
  },
  right: {
    flex: 1,
    paddingLeft: "200px",
    paddingTop: "50px"
  },
  button: {
    padding: "12px 20px",
    backgroundColor: "#1976d2",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  form: {
    marginTop: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    backgroundColor: "white",
    color: "black"
  },
  input: {
    padding: "10px",
    fontSize: "16px",
    backgroundColor: "white",
    color: "black"
  },
  features: {
    padding: "60px 0",
    borderTop: "1px solid #ccc",
    textAlign: "center",
    backgroundColor: "#f9f9f9",
  },
  featuresTitle: {
    fontSize: "28px",
    marginBottom: "40px",
    color: "#0d47a1",
  },
  featureCards: {
    display: "flex",
    justifyContent: "center",
    gap: "30px",
    flexWrap: "wrap",
  },
  featureCard: {
    width: "280px",
    backgroundColor: "#fff",
    border: "1px solid #ddd",
    borderRadius: "10px",
    padding: "20px",
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
    cursor: "default",
  },
  footer: {
    padding: "20px 0",
    borderTop: "1px solid #ccc",
    textAlign: "center",
  },
};

export default Home;
