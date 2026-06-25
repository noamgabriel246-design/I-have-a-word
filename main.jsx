import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// נקודת הכניסה של האפליקציה: React "נתפס" אל ה-<div id="root"> שב-index.html,
// טוען את העיצוב (index.css) ומרנדר את כל האפליקציה (App.jsx).
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
