import { useEffect, useState } from "react";

function EventLog() {
    const [events, setEvents] = useState([]);

    useEffect(() => {
        fetch("http://localhost:8001/events")
        .then((res) => res.json())
        .then((data) => setEvents(data));
    }, []);

    return (
        <div>
            <h2>Event Log</h2>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Track ID</th>
                        <th>Zone</th>
                        <th>Time</th>
                    </tr>
                </thead>
                <tbody>
                    {events.map((e) => (
                        <tr key={e.id}>
                            <td>{e.id}</td>
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