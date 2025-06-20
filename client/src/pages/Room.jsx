import { 
  useEffect, 
  useRef, 
  useState, 
  useContext, 
  useCallback  
} from "react";
import { useParams, useSearchParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
// import { SocketContext } from "../App";
import { SocketContext } from '../context/SocketContext';

import UserBadge from '../components/UserBadge';
import roomImage from '../assets/collabRoom.jpg'; // Add your image

const LANGUAGES = {
  javascript: { name: "JavaScript", defaultCode: 'console.log("Hello World!");' },
  python: { name: "Python", defaultCode: 'print("Hello World!")' },
  cpp: { name: "C++", defaultCode: '#include <iostream>\nint main() {\n  std::cout << "Hello World!";\n}' }
};

function Room() {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const username = searchParams.get("username");
  const socket = useContext(SocketContext);
  const editorRef = useRef(null);
  const [language, setLanguage] = useState("javascript");
  const [output, setOutput] = useState("");
  const [users, setUsers] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [lastEditedBy, setLastEditedBy] = useState("");

  useEffect(() => {
    // if (!socket || !username) return;
    if (!username) {
      alert("Username is required");
      window.location.href = "/";
      return;
    }

    socket.emit("join-room", { roomId, username });

    socket.on("room-state", ({ code, language, users }) => {
      setLanguage(language);
      setUsers(users);
      if (editorRef.current) {
        editorRef.current.setValue(code || LANGUAGES[language].defaultCode);
      }
    });

    socket.on("code-update", ({ code, lastEditedBy }) => {
      if (editorRef.current && code !== editorRef.current.getValue()) {
        editorRef.current.setValue(code);
        if (lastEditedBy) setLastEditedBy(lastEditedBy);
      }
    });

    socket.on("language-update", (newLanguage) => {
      setLanguage(newLanguage);
    });

    socket.on("user-joined", (username) => {
      setUsers(prev => [...prev, username]);
      setOutput(prev => `${prev}\n${username} joined the room`);
    });

    socket.on("user-left", (username) => {
      setUsers(prev => prev.filter(u => u !== username));
      setOutput(prev => `${prev}\n${username} left the room`);
    });

    return () => {
      socket.off("room-state");
      socket.off("code-update");
      socket.off("language-update");
      socket.off("user-joined");
      socket.off("user-left");
    };
  }, [socket, roomId, username]);

  // const handleEditorChange = (value) => {
  //   socket.emit("code-change", { roomId, code: value });
  // };
  const handleEditorChange = useCallback((value) => {
    socket.emit("code-change", { 
      roomId, 
      code: value, 
      userId: socket.id 
    });
    setLastEditedBy("You");
  }, [roomId, socket]);

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    socket.emit("language-change", { roomId, language: newLanguage });
    if (editorRef.current) {
      editorRef.current.setValue(LANGUAGES[newLanguage].defaultCode);
    }
  };

const executeOnServer = async (code, language) => {
  try {
    const response = await fetch("http://localhost:3001/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, language })
    });
    
    const data = await response.json();
    return data.output || "No output"; // Handle empty output case
  } catch (err) {
    return `Error: ${err.message}`;
  }
};

const executeJavascript = (code) => {
  return new Promise((resolve) => {
    try {
      let logs = [];
      const originalLog = console.log;
      console.log = (...args) => logs.push(args.join(" "));
      
      const result = eval(code);
      console.log = originalLog;
      
      const output = [
        ...logs,
        typeof result !== 'undefined' ? `>> Return: ${JSON.stringify(result)}` : null
      ].filter(Boolean).join('\n');
      
      resolve(output || "Code executed (no output)");
    } catch (err) {
      resolve(`Error: ${err.message}`);
    }
  });
};

const executeCode = async () => {
  if (!editorRef.current) return;
  
  const code = editorRef.current.getValue();
  setIsRunning(true);
  setOutput("Running...");

  try {
    let result;
    if (language === "javascript") {
      result = await executeJavascript(code);
    } else {
      result = await executeOnServer(code, language);
    }
    setOutput(result);
  } catch (err) {
    setOutput(`Error: ${err.message}`);
  } finally {
    setIsRunning(false);
  }
};
  

 return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <select
            value={language}
            onChange={handleLanguageChange}
            className="p-2 rounded border border-gray-300"
          >
            {Object.keys(LANGUAGES).map((lang) => (
              <option key={lang} value={lang}>
                {LANGUAGES[lang].name}
              </option>
            ))}
          </select>
          
          <button
            onClick={executeCode}
            disabled={isRunning}
            className={`px-4 py-2 rounded ${
              isRunning ? "bg-gray-300" : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            {isRunning ? "Running..." : "Run Code"}
          </button>
        </div>
        
        <div className="flex gap-2">
          {users.map((user) => (
            <div 
              key={user} 
              className={`px-3 py-1 rounded-full text-sm ${
                user === username ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
              }`}
            >
              {user === username ? 'You' : user}
            </div>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1">
        <Editor
          height="100%"
          language={language}
          theme="vs-dark"
          onChange={handleEditorChange}
          onMount={(editor) => {
            editorRef.current = editor;
            editor.setValue(LANGUAGES[language].defaultCode);
          }}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            automaticLayout: true,
          }}
        />
      </div>

      {/* Output */}
      <div className="bg-gray-800 p-4 border-t border-gray-700">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-mono text-green-400">Output</h3>
          <button 
            onClick={() => setOutput("")}
            className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded"
          >
            Clear
          </button>
        </div>
        <pre className="font-mono text-green-400 overflow-auto max-h-32">
          {output || "Run code to see output here..."}
        </pre>
      </div>
    </div>
  );
}
