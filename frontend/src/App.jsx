import { useState, useEffect } from "react";
import VideoStream from "./VideoStream";
import EventLog from "./EventLog";
import Analytics from "./Analytics";
import ZoneConfig from "./ZoneConfig";
import "./App.css";

function App() {
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    document.body.style.background = darkMode ? "#1a1a2e" : "#f0f2f5";
  }, [darkMode]);

  return (
    <div className={`dashboard ${darkMode ? "dark" : "light"}`}>
      <div className="header">
        <h1>DOBER <span className="subtitle">AI Surveillance</span></h1>
        <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            {darkMode ? (
              <path d="M12 7a5 5 0 100 10 5 5 0 000-10zM12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
            ) : (
              <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
            )}
          </svg>
        </button>
      </div>
      <div className="grid">
        <div className="card video-stream">
          <h2>Live Stream</h2>
          <VideoStream />
        </div>
        <div className="card">
          <EventLog />
        </div>
      </div>
      <div className="bottom-grid">
        <div className="card analytics">
          <Analytics />
        </div>
        <div className="card zone-config">
          <ZoneConfig />
        </div>
      </div>
    </div>
  );
}

export default App;
