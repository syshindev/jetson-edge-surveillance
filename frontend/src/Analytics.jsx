import { useEffect, useState } from "react";
import { API_BASE, LABEL_MAP } from "./constants";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
    LineChart, Line,
} from "recharts";

const TYPE_COLORS = {
    intrusion: "#e94560",
    loitering: "#f59e0b",
    line_crossing: "#3b82f6",
};

function Analytics() {
    const [typeCounts, setTypeCounts] = useState([]);
    const [hourly, setHourly] = useState([]);
    const [total, setTotal] = useState(0);
    const [byStream, setByStream] = useState([]);

    useEffect(() => {
        const fetchData = () => {
            fetch(`${API_BASE}/analytics/type-count`)
                .then((res) => res.json())
                .then((data) => {
                    if (Array.isArray(data)) {
                        setTypeCounts(data.map((d) => ({ ...d, label: LABEL_MAP[d.type] || d.type })));
                    }
                })
                .catch(() => {});

            fetch(`${API_BASE}/analytics/total`)
                .then((res) => res.json())
                .then((data) => setTotal(data.total))
                .catch(() => {});

            fetch(`${API_BASE}/analytics/hourly`)
                .then((res) => res.json())
                .then((data) => { if (Array.isArray(data)) setHourly(data); })
                .catch(() => {});

            fetch(`${API_BASE}/analytics/by-stream`)
                .then((res) => res.json())
                .then((data) => { if (Array.isArray(data)) setByStream(data.map((d) => ({ ...d, name: `Camera ${d.stream_id + 1}` }))); })
                .catch(() => {});
        };

        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="analytics-page">
            <h2>Analytics</h2>
            <p className="analytics-total">Total Events: {total}</p>

            <div className="analytics-grid">
                <div className="card analytics-card">
                    <h3 className="chart-title">Events by Type</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={typeCounts}>
                            <XAxis dataKey="label" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="count">
                                {typeCounts.map((d, i) => (
                                    <Cell key={i} fill={TYPE_COLORS[d.type] || "#6b7280"} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="card analytics-card">
                    <h3 className="chart-title">Distribution</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie data={typeCounts} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={80} label>
                                {typeCounts.map((d, i) => (
                                    <Cell key={i} fill={TYPE_COLORS[d.type] || "#6b7280"} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="card analytics-card">
                <h3 className="chart-title">Hourly Trend</h3>
                <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={hourly} margin={{ bottom: 5 }}>
                        <XAxis dataKey="hour" ticks={["00:00", "06:00", "12:00", "18:00", "23:00"]} tick={{ dy: 5 }} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Line type="monotone" dataKey="count" stroke="#e94560" strokeWidth={2} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="card analytics-card" style={{ marginTop: "1rem" }}>
                <h3 className="chart-title">Events by Camera</h3>
                <table className="camera-stats-table">
                    <thead>
                        <tr>
                            <th>Camera</th>
                            <th style={{ color: "#e94560" }}>Intrusion</th>
                            <th style={{ color: "#3b82f6" }}>Line Crossing</th>
                            <th style={{ color: "#f59e0b" }}>Loitering</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {byStream.map((row) => (
                            <tr key={row.stream_id}>
                                <td>{row.name}</td>
                                <td>{row.intrusion}</td>
                                <td>{row.line_crossing}</td>
                                <td>{row.loitering}</td>
                                <td>{row.intrusion + row.loitering + row.line_crossing}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Analytics;
