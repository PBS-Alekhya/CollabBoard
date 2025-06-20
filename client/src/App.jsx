import { Routes, Route } from 'react-router-dom';
// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { io } from 'socket.io-client';
import { createContext, useEffect, useState } from 'react';
import Home from './pages/Home';
import Room from './pages/Room';
import { SocketProvider } from './context/SocketContext';

export const SocketContext = createContext(null);

function App() {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, []);

  return (
    // <Router>
      <SocketProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/room/:roomId" element={<Room />} />
        </Routes>
      </SocketProvider>
    // </Router>
  );
}

export default App;