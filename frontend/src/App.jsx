import VideoStream from "./VideoStream";
import EventLog from "./EventLog";
import Analytics from "./Analytics";
import ZoneConfig from "./ZoneConfig";
import "./App.css";

function App() {
  return (
    <div className="dashboard">
      <h1>Edge AI Surveillance Dashboard</h1>
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