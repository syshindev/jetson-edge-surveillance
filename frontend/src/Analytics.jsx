import { useEffect, useState } from "react";

function Analytics() {
    const [total, setTotal] = useState(0);
    const [zoneCounts, setZoneCounts] = useState([]);

    useEffect(() => {
        fetch("http://localhost:8000/analytics/total")
            .then((res) => res.json())
            .then((data) => setTotal(data.total))
            .catch(() => {});

        fetch("http://localhost:8000/analytics/zone-count")
            .then((res) => res.json())
            .then((data) => { if (Array.isArray(data)) setZoneCounts(data); })
            .catch(() => {});
    }, []);

    return (
        <div>
            <h2>Analytics</h2>
            <p>Total Events: {total}</p>
            <ul>
                {zoneCounts.map((z) => (
                    <li key={z.zone}>{z.zone}: {z.count}</li>
                ))}
            </ul>
        </div>
    );
}

export default Analytics;