import { useEffect, useState } from "react";

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
            fetch("http://localhost:8001/events")
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
                        <th>ID</th>
                        <th>Type</th>
                        <th>Track ID</th>
                        <th>Zone</th>
                        <th>Time</th>
                    </tr>
                </thead>
                <tbody>
                    {filtered.map((e) => (
                        <tr key={e.id}>
                            <td>{e.id}</td>
                            <td>{e.event_type}</td>
                            <td>{e.track_id}</td>
                            <td>{e.zone_name}</td>
                            <td>{e.timestamp}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default EventLog;
