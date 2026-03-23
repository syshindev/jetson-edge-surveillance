import { useState, useEffect } from "react";
import VideoStream from "./VideoStream";
import EventLog from "./EventLog";
import Analytics from "./Analytics";
import ZoneConfig from "./ZoneConfig";
import StatCards from "./StatCards";
import RecentAlerts from "./RecentAlerts";
import "./App.css";

const pages = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "stream", label: "Live Stream", icon: "videocam" },
  { id: "events", label: "Events", icon: "notifications" },
  { id: "analytics", label: "Analytics", icon: "bar_chart" },
  { id: "settings", label: "Settings", icon: "settings" },
];

const viewModes = [
  { id: "1x1", label: "1", icon: "crop_square", count: 1 },
  { id: "2x2", label: "4", icon: "grid_view", count: 4 },
  { id: "1+3", label: "1+3", icon: "view_comfy", count: 4 },
];

function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [activePage, setActivePage] = useState("dashboard");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [viewMode, setViewMode] = useState("1x1");

  useEffect(() => {
    document.body.style.background = darkMode ? "#1a1a2e" : "#f0f2f5";
  }, [darkMode]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const renderStreamView = () => {
    switch (viewMode) {
      case "1x1":
        return (
          <div className="stream-grid grid-1x1">
            <div className="card video-stream">
              <VideoStream streamId={0} />
            </div>
          </div>
        );
      case "2x2":
        return (
          <div className="stream-grid grid-2x2">
            <div className="card video-stream"><VideoStream streamId={0} /></div>
            <div className="card video-stream"><VideoStream streamId={1} /></div>
            <div className="card video-stream"><VideoStream streamId={2} /></div>
            <div className="card video-stream placeholder"><p>No Source</p></div>
          </div>
        );
      case "1+3":
        return (
          <div className="stream-grid grid-1plus3">
            <div className="card video-stream main"><VideoStream streamId={0} /></div>
            <div className="card video-stream side"><VideoStream streamId={1} /></div>
            <div className="card video-stream side"><VideoStream streamId={2} /></div>
            <div className="card video-stream side placeholder"><p>No Source</p></div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderContent = () => {
    switch (activePage) {
      case "dashboard":
        return (
          <>
            <StatCards />
            <div className="grid">
              <div className="card video-stream">
                <h2>Live Stream</h2>
                <VideoStream streamId={0} />
              </div>
              <div className="card">
                <RecentAlerts />
              </div>
            </div>
          </>
        );
      case "stream":
        return (
          <>
            <div className="view-mode-bar">
              {viewModes.map((mode) => (
                <button
                  key={mode.id}
                  className={`view-mode-btn ${viewMode === mode.id ? "active" : ""}`}
                  onClick={() => setViewMode(mode.id)}
                >
                  <span className="material-icons-outlined">{mode.icon}</span>
                  {mode.label}
                </button>
              ))}
            </div>
            {renderStreamView()}
          </>
        );
      case "events":
        return (
          <div className="card full">
            <EventLog />
          </div>
        );
      case "analytics":
        return (
          <div className="card analytics full">
            <Analytics />
          </div>
        );
      case "settings":
        return (
          <div className="card zone-config full">
            <ZoneConfig />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`app-layout ${darkMode ? "dark" : "light"}`}>
      <aside className="sidebar">
        <div className="nav-brand">
          <h1>DOBER</h1>
          <span className="subtitle">AI Surveillance</span>
        </div>
        <ul className="nav-menu">
          {pages.map((page) => (
            <li
              key={page.id}
              className={`nav-item ${activePage === page.id ? "active" : ""}`}
              onClick={() => setActivePage(page.id)}
            >
              <span className="material-icons-outlined">{page.icon}</span>
              {page.label}
            </li>
          ))}
        </ul>
        <div className="sidebar-bottom">
          <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
            <span className="material-icons-outlined">{darkMode ? "light_mode" : "dark_mode"}</span>
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
        </div>
      </aside>
      <main className="content">
        <div className="content-header">
          <h2 className="page-title">{pages.find((p) => p.id === activePage)?.label}</h2>
          <span className="live-clock">
            <span className="material-icons-outlined">schedule</span>
            {currentTime.toLocaleDateString("en-US")} {currentTime.toLocaleTimeString("en-US")}
          </span>
        </div>
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
