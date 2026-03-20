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
          <span className="material-icons-outlined">{darkMode ? "light_mode" : "dark_mode"}</span>
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
