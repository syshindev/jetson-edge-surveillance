import VideoStream from "./VideoStream";
import EventLog from "./EventLog";
import Analytics from "./Analytics";
import ZoneConfig from "./ZoneConfig";

function App() {
  return (
    <div>
      <h1>Edge AI Surveillance Dashboard</h1>
      <VideoStream />
      <EventLog />
      <Analytics />
      <ZoneConfig />
    </div>
  );
}

export default App;