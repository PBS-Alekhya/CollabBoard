import React, { useEffect, useRef, useState } from 'react';
import { EditorView } from "@codemirror/view";
import { EditorState } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { basicSetup } from 'codemirror';
import { FaPlay, FaSave } from 'react-icons/fa';
import { toast } from 'react-toastify';

// Pyodide configuration
let pyodide;
let pyodideOutput = [];

async function loadPyodide() {
  if (!window.loadPyodide) {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js';
    document.body.appendChild(script);
    await new Promise(resolve => {
      script.onload = resolve;
    });
  }

  pyodide = await window.loadPyodide({
    stdout: msg => pyodideOutput.push(msg),
    stderr: msg => pyodideOutput.push(`ERROR: ${msg}`),
    indexURL: "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/"
  });
  await pyodide.loadPackage(['micropip']);
}

const CodeEditor = ({ 
  code = '', 
  language = 'javascript', 
  onCodeChange = () => {},
  onLanguageChange = () => {},
  onRunCode = () => {},
  onSaveCode = () => {},
  activeCoder = null,
  socket, 
  roomId   
}) => {
  const editorRef = useRef(null);
  const editorViewRef = useRef(null);
  const isRemoteChange = useRef(false);
  const [pyodideLoaded, setPyodideLoaded] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  // Initialize Pyodide for Python
  useEffect(() => {
    if (language === 'python' && !pyodideLoaded) {
      loadPyodide().then(() => {
        setPyodideLoaded(true);
      });
    }
  }, [language]);

  // Handle incoming socket code change
  useEffect(() => {
    if (!socket) return;

    const handleRemoteCodeChange = ({ code: incomingCode }) => {
      const currentCode = editorViewRef.current?.state.doc.toString();
      if (incomingCode !== currentCode) {
        isRemoteChange.current = true;
        const transaction = editorViewRef.current.state.update({
          changes: {
            from: 0,
            to: editorViewRef.current.state.doc.length,
            insert: incomingCode
          }
        });
        editorViewRef.current.dispatch(transaction);
      }
    };

    socket.on('CODE_CHANGE', handleRemoteCodeChange);

    return () => {
      socket.off('CODE_CHANGE', handleRemoteCodeChange);
    };
  }, [socket]);

  // Handle prop code changes
  useEffect(() => {
    if (editorViewRef.current && code !== editorViewRef.current.state.doc.toString()) {
      const transaction = editorViewRef.current.state.update({
        changes: {
          from: 0,
          to: editorViewRef.current.state.doc.length,
          insert: code
        }
      });
      editorViewRef.current.dispatch(transaction);
    }
  }, [code]);

  // Setup CodeMirror editor
  useEffect(() => {
    if (!editorRef.current) return;

    const extensions = [
      basicSetup,
      language === "python" ? python() : javascript(),
      EditorView.updateListener.of(update => {
        if (update.docChanged) {
          const newCode = update.state.doc.toString();

          if (isRemoteChange.current) {
            isRemoteChange.current = false;
            return;
          }

          onCodeChange(newCode);
          
        }
      }),
      EditorView.theme({
        "&": {
          height: "100%",
          backgroundColor: "#fff",
          color: "#000"
        },
        ".cm-content": {
          caretColor: "#000",
          fontFamily: "monospace",
          fontSize: "14px"
        },
        ".cm-gutters": {
          backgroundColor: "#f5f5f5",
          color: "#666",
          borderRight: "1px solid #ddd"
        }
      })
    ];

    const state = EditorState.create({
      doc: code,
      extensions
    });

    const view = new EditorView({
      state,
      parent: editorRef.current
    });
    editorViewRef.current = view;

    return () => {
      if (view) view.destroy();
    };
  }, [language]);

  const executeCode = async () => {
    if (isRunning) return;
    setIsRunning(true);

    try {
      if (language === "javascript") {
        try {
          const result = new Function(code)();
          onRunCode(result !== undefined ? String(result) : "Code executed (no return value)");
        } catch (error) {
          onRunCode(`JavaScript Error: ${error.message}`);
        }
      } else if (language === "python") {
        if (!pyodideLoaded) {
          toast.warn("Python environment is still loading...");
          return;
        }

        pyodideOutput = [];
        try {
          const result = await pyodide.runPythonAsync(code);
          const output = [
            ...pyodideOutput,
            result !== undefined ? `Return: ${result}` : null
          ].filter(Boolean).join("\n");

          onRunCode(output || "Python code executed (no output)");
        } catch (error) {
          onRunCode(`Python Error: ${error.message}`);
        }
      }
    } finally {
      setIsRunning(false);
    }
  };

  const handleSave = () => {
    onSaveCode({
      code,
      language,
      timestamp: new Date().toISOString()
    });
    toast.success("Code saved successfully!");
  };

  return (
    <div style={styles.container}>
      <div style={styles.toolbar}>
        <div style={styles.languageSelector}>
          <label style={styles.label}>Language: </label>
          <select 
            value={language} 
            onChange={e => onLanguageChange(e.target.value)}
            style={styles.select}
            disabled={isRunning || (language === 'python' && !pyodideLoaded)}
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
          </select>
          {!pyodideLoaded && language === 'python' && (
            <span style={styles.loading}>Loading Python runtime...</span>
          )}
        </div>
        
        <div style={styles.controls}>
          {activeCoder && (
            <div style={styles.activeCoder}>
              {activeCoder} is typing...
            </div>
          )}
          <div style={styles.buttonGroup}>
            <button 
              onClick={executeCode} 
              style={styles.button}
              disabled={isRunning || (language === 'python' && !pyodideLoaded)}
            >
              <FaPlay style={styles.icon} /> Run
            </button>
            <button onClick={handleSave} style={styles.button}>
              <FaSave style={styles.icon} /> Save
            </button>
          </div>
        </div>
      </div>

      <div ref={editorRef} style={styles.editor} />
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    border: '1px solid #ccc',
    borderRadius: '4px',
    backgroundColor: '#fff',
    color: '#000'
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px',
    backgroundColor: '#f5f5f5',
    borderBottom: '1px solid #ddd',
    flexWrap: 'wrap',
    gap: '10px'
  },
  languageSelector: {
    display: 'flex',
    alignItems: 'center',
    minWidth: '200px'
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  },
  activeCoder: {
    backgroundColor: '#e3f2fd',
    padding: '5px 10px',
    borderRadius: '4px',
    fontSize: '0.85rem',
    whiteSpace: 'nowrap'
  },
  label: {
    marginRight: '8px',
    fontSize: '14px'
  },
  select: {
    padding: '5px 10px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    backgroundColor: '#fff',
    fontSize: '14px',
    color: '#000'
  },
  loading: {
    marginLeft: '10px',
    fontSize: '12px',
    color: '#666'
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px'
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '6px 12px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  icon: {
    fontSize: '14px'
  },
  editor: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#fff'
  }
};

export default CodeEditor;
