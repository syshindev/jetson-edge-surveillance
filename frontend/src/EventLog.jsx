import { useEffect, useState } from "react";
import { API_BASE, LABEL_MAP } from "./constants";

const eventTabs = [
    { id: "all", label: "All" },
    { id: "intrusion", label: "Intrusion" },
    { id: "loitering", label: "Loitering" },
    { id: "line_crossing", label: "Line Crossing" },
];

function EventLog() {
    const [events, setEvents] = useState([]);
    const [activeTab, setActiveTab] = useState("all");

    useEffect(() => {
        const fetchEvents = () => {
            fetch(`${API_BASE}/events`)
            .then((res) => res.json())
            .then((data) => { if (Array.isArray(data)) setEvents(data); })
            .catch(() => {});
        };

        fetchEvents();
        const interval = setInterval(fetchEvents, 5000);
        return () => clearInterval(interval);
    }, []);

    const filtered = activeTab === "all"
        ? events
        : events.filter((e) => e.event_type === activeTab);

    return (
        <div>
            <h2>Event Log</h2>
            <div className="event-tabs">
                {eventTabs.map((tab) => (
                    <button
                        key={tab.id}
                        className={`event-tab ${activeTab === tab.id ? "active" : ""}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Type</th>
                        <th>Track ID</th>
                        <th>Zone</th>
                        <th>Time</th>
                    </tr>
                </thead>
                <tbody>
                    {filtered.map((e) => (
                        <tr key={e.id}>
                            <td>{LABEL_MAP[e.event_type] || e.event_type}</td>
                            <td>{e.track_id}</td>
                            <td>{e.zone_name}</td>
                            <td>{e.timestamp ? new Date(e.timestamp).toLocaleTimeString("en-US") : ""}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default EventLog;
