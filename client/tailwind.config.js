// /** @type {import('tailwindcss').Config} */
// export default {
//   content: [
//     "./index.html",
//     "./src/**/*.{js,ts,jsx,tsx}",
//   ],
//   theme: {
//     extend: {
//       colors: {
//         // Custom colors for editor theme
//         'editor-dark': '#1e1e1e',
//         'editor-line': '#2d2d2d',
//         'editor-selection': '#264f78',
        
//         // User presence colors
//         'user-you': '#10B981',      // Green
//         'user-other': '#3B82F6',    // Blue
//         'user-typing': '#F59E0B',   // Amber
        
//         // Status colors
//         'status-running': '#6366F1', // Indigo
//         'status-error': '#EF4444',   // Red
        
//         // Syntax highlight colors
//         'syntax-keyword': '#569CD6',
//         'syntax-string': '#CE9178',
//         'syntax-number': '#B5CEA8',
//       },
//       fontFamily: {
//         'mono': ['"Fira Code"', '"Courier New"', 'monospace'], // Better code font
//       },
//       boxShadow: {
//         'editor': '0 0 10px rgba(0, 0, 0, 0.5)',
//       },
//       animation: {
//         'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
//         'typing-indicator': 'pulse 1.5s ease-in-out infinite',
//       }
//     },
//   },
//   plugins: [
//     require('@tailwindcss/typography'), // For better code output formatting
//   ],
// }

// /** @type {import('tailwindcss').Config} */
// export default {
//   content: [
//     "./index.html",
//     "./src/**/*.{js,ts,jsx,tsx}",
//   ],
//   theme: {
//     extend: {},
//   },
//   plugins: [],
// }

// /** @type {import('tailwindcss').Config} */
// export default {
//   content: [
//     "./index.html",
//     "./src/**/*.{js,ts,jsx,tsx}",
//   ],
//   theme: {
//     extend: {
//       colors: {
//         // Primary colors
//         primary: {
//           50: '#f0f9ff',
//           100: '#e0f2fe',
//           400: '#38bdf8',
//           600: '#0284c7',
//           700: '#0369a1',
//         },
//         // Editor colors
//         editor: {
//           dark: '#1e1e1e',
//           line: '#2d2d2d',
//           selection: '#264f78',
//         },
//         // User status colors
//         user: {
//           you: '#10B981',      // Green
//           other: '#3B82F6',    // Blue
//           typing: '#F59E0B',   // Amber
//         },
//         // Syntax highlight colors
//         syntax: {
//           keyword: '#569CD6',
//           string: '#CE9178',
//           number: '#B5CEA8',
//         }
//       },
//       fontFamily: {
//         sans: ['Inter', 'sans-serif'],
//         mono: ['"Fira Code"', 'monospace'],
//       },
//       boxShadow: {
//         'editor': '0 0 15px rgba(0, 0, 0, 0.1)',
//         'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
//       },
//       animation: {
//         'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
//         'typing': 'pulse 1.5s ease-in-out infinite',
//       },
//       backgroundImage: {
//         'hero-pattern': "url('/src/assets/collab-hero.jpg')",
//         'room-header': "url('/src/assets/collab-room.jpg')",
//       }
//     },
//   },
//   plugins: [
//     require('@tailwindcss/typography'),
//     require('@tailwindcss/forms'),
//   ],
// }
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        blue: {
          50: '#eff6ff',
          100: '#dbeafe',
          600: '#2563eb',
          700: '#1d4ed8',
        }
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}