const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { exec } = require("child_process");

const app = express();
app.use(cors());
app.use(express.json()); 
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Track rooms and their state
const rooms = new Map();

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join room and initialize if needed
  socket.on("join-room", ({ roomId, username }) => {
    socket.join(roomId);
    
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        code: "",
        language: "javascript",
        users: new Map()
      });
    }
    
    const room = rooms.get(roomId);
    room.users.set(socket.id, username);
    
    // Send current state to new user
    socket.emit("room-state", {
      code: room.code,
      language: room.language,
      users: Array.from(room.users.values())
    });
    
    // Notify others about new user
    socket.to(roomId).emit("user-joined", username);
  });

  // Handle code changes
  socket.on("code-change", ({ roomId, code, userId }) => {
    if (rooms.has(roomId)) {
      const room = rooms.get(roomId);
      room.code = code;
      
      // Broadcast change with user info
      socket.to(roomId).emit("code-update", { 
        code, 
        lastEditedBy: room.users.get(userId) 
      });
    }
  });

  // Handle language changes
  socket.on("language-change", ({ roomId, language }) => {
    if (rooms.has(roomId)) {
      rooms.get(roomId).language = language;
      socket.to(roomId).emit("language-update", language);
    }
  });
  
  socket.on("typing", (roomId) => {
  const username = rooms.get(roomId)?.users.get(socket.id);
  socket.to(roomId).emit("user-typing", username);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    rooms.forEach((room, roomId) => {
      if (room.users.has(socket.id)) {
        const username = room.users.get(socket.id);
        room.users.delete(socket.id);
        socket.to(roomId).emit("user-left", username);
        
        // Clean up empty rooms
        if (room.users.size === 0) {
          rooms.delete(roomId);
        }
      }
    });
  });
});

// Add this route before server.listen()
app.post("/run", (req, res) => {
  try {
    const { code, language } = req.body;
    
    if (!code || !language) {
      return res.status(400).json({ error: "Missing code or language" });
    }

    if (language === "javascript") {
      // For security, don't execute JS on server in production
      return res.status(400).json({ error: "JS runs in browser only" });
    }
    else if (language === "python") {
    // Create a temporary Python file
    const fs = require('fs');
    const path = require('path');
    const tempDir = path.join(__dirname, 'temp');
    const tempFile = path.join(tempDir, 'temp.py');
    
    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    
    // Write code to file
    fs.writeFileSync(tempFile, code);
    
    // Execute Python file
    exec(`python ${tempFile}`, (err, stdout, stderr) => {
      // Clean up
      try {
        fs.unlinkSync(tempFile);
      } catch (e) {}
      
      if (err) {
        return res.json({ output: stderr || "Execution error" });
      }
      res.json({ output: stdout || "No output" }); // Handle empty output
    });
  }
    else if (language === "cpp") {
      // Basic C++ execution (requires proper setup)
      res.json({ output: "C++ execution requires additional server setup" });
    }
    else {
      res.status(400).json({ output: "Unsupported language" });
    }
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});


const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
