import { useState, useEffect, useRef } from "react";
import VideoStream from "./VideoStream";
import EventLog from "./EventLog";
import Analytics from "./Analytics";
import ZoneConfig from "./ZoneConfig";
import DataManagement from "./DataManagement";
import StreamOverlay from "./StreamOverlay";
import StatCards from "./StatCards";
import RecentAlerts from "./RecentAlerts";
import Login from "./Login";
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
  { id: "1x2", label: "2", icon: "view_column_2", count: 2 },
  { id: "1x3", label: "3", icon: "view_week", count: 3 },
  { id: "2x2", label: "4", icon: "grid_view", count: 4 },
];

function App() {
  const [authed, setAuthed] = useState(!!localStorage.getItem("token"));
  const [darkMode, setDarkMode] = useState(true);
  const [activePage, setActivePage] = useState("dashboard");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [viewMode, setViewMode] = useState("1x1");
  const [focusedStream, setFocusedStream] = useState(null);
  const [soloStream, setSoloStream] = useState(0);
  const [dashStream, setDashStream] = useState(0);
  const [streamOrder, setStreamOrder] = useState([0, 1, 2, 3]);
  const [dragIdx, setDragIdx] = useState(null);
  const [videoHeight, setVideoHeight] = useState(400);
  const videoCardRef = useRef(null);

  useEffect(() => {
    document.body.style.background = darkMode ? "#1a1a2e" : "#f0f2f5";
  }, [darkMode]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      if (videoCardRef.current) {
        setVideoHeight(videoCardRef.current.offsetHeight);
      }
    });
    if (videoCardRef.current) observer.observe(videoCardRef.current);
    return () => observer.disconnect();
  }, [activePage]);

  const streamCell = (id, idx, placeholder = false) => {
    if (placeholder) return <div className="card video-stream placeholder"><p>No Source</p></div>;
    const isFocused = focusedStream === id;
    const clickable = viewMode !== "1x1";
    const draggable = viewMode !== "1x1" && focusedStream === null;
    return (
      <div
        key={id}
        className={`card video-stream ${clickable ? "clickable" : ""} ${isFocused ? "stream-focused" : ""} ${dragIdx === idx ? "dragging" : ""}`}
        draggable={draggable}
        onDragStart={(e) => { if (!draggable) { e.preventDefault(); return; } setDragIdx(idx); }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => {
          if (dragIdx === null || dragIdx === idx) return;
          const newOrder = [...streamOrder];
          [newOrder[dragIdx], newOrder[idx]] = [newOrder[idx], newOrder[dragIdx]];
          setStreamOrder(newOrder);
          setDragIdx(null);
        }}
        onDragEnd={() => setDragIdx(null)}
        onClick={clickable ? () => setFocusedStream(isFocused ? null : id) : undefined}
        style={{ cursor: draggable ? "grab" : clickable ? "pointer" : "default", position: "relative" }}
      >
        <VideoStream streamId={id} />
        <StreamOverlay streamId={id} />
      </div>
    );
  };

  const renderStreamView = () => {
    if (focusedStream !== null) {
      return (
        <div className="stream-grid grid-1x1">
          {streamCell(focusedStream)}
        </div>
      );
    }
    const count = viewModes.find((m) => m.id === viewMode)?.count || 1;
    const cells = streamOrder.slice(0, count).map((id, idx) =>
      id >= 3 ? streamCell(id, idx, true) : streamCell(id, idx)
    );
    switch (viewMode) {
      case "1x1":
        return <div className="stream-grid grid-1x1">{streamCell(soloStream, 0)}</div>;
      case "1x2":
        return <div className="stream-grid grid-1x2">{cells}</div>;
      case "1x3":
        return <div className="stream-grid grid-1x3">{cells}</div>;
      case "2x2":
        return <div className="stream-grid grid-2x2">{cells}</div>;
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
              <div className="card video-stream" ref={videoCardRef}>
                <div className="dash-stream-header">
                  <h2>Live Stream</h2>
                  <div className="cam-selector">
                    {[0, 1, 2].map((id) => (
                      <button
                        key={id}
                        className={`cam-btn ${dashStream === id ? "active" : ""}`}
                        onClick={() => setDashStream(id)}
                      >
                        Cam {id + 1}
                      </button>
                    ))}
                  </div>
                </div>
                <VideoStream streamId={dashStream} />
              </div>
              <div className="card alerts-card" style={{ maxHeight: videoHeight }}>
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
                  onClick={() => { setViewMode(mode.id); setFocusedStream(null); }}
                >
                  <span className="material-symbols-outlined">{mode.icon}</span>
                </button>
              ))}
              {viewMode === "1x1" && (
                <div className="cam-selector">
                  {[0, 1, 2].map((id) => (
                    <button
                      key={id}
                      className={`cam-btn ${soloStream === id ? "active" : ""}`}
                      onClick={() => setSoloStream(id)}
                    >
                      Cam {id + 1}
                    </button>
                  ))}
                </div>
              )}
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
        return <Analytics />;
      case "settings":
        return (
          <>
            <div className="card zone-config no-scroll">
              <ZoneConfig />
            </div>
            <DataManagement />
          </>
        );
      default:
        return null;
    }
  };

  if (!authed) return <Login onLogin={() => setAuthed(true)} />;

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
              <span className="material-symbols-outlined">{page.icon}</span>
              {page.label}
            </li>
          ))}
        </ul>
        <div className="sidebar-bottom">
          <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
            <span className="material-symbols-outlined">{darkMode ? "light_mode" : "dark_mode"}</span>
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
          <button className="theme-toggle" onClick={() => { localStorage.removeItem("token"); setAuthed(false); }}>
            <span className="material-symbols-outlined">logout</span>
            Logout
          </button>
        </div>
      </aside>
      <main className="content">
        <div className="content-header">
          <h2 className="page-title">{pages.find((p) => p.id === activePage)?.label}</h2>
          <span className="live-clock">
            <span className="material-symbols-outlined">schedule</span>
            {currentTime.toLocaleDateString("en-US")} {currentTime.toLocaleTimeString("en-US")}
          </span>
        </div>
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
