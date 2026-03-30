import { useEffect, useState, useRef } from "react";
import { API_BASE, LABEL_MAP } from "./constants";

const severityColor = {
    intrusion: "#e94560",
    loitering: "#f59e0b",
    line_crossing: "#3b82f6",
};

const severityIcon = {
    intrusion: "error",
    loitering: "schedule",
    line_crossing: "swap_horiz",
};

function StreamOverlay({ streamId }) {
    const [alert, setAlert] = useState(null);
    const [visible, setVisible] = useState(false);
    const lastIdRef = useRef(null);
    const initializedRef = useRef(false);
    const timerRef = useRef(null);

    useEffect(() => {
        const fetchAlerts = () => {
            fetch(`${API_BASE}/analytics/recent-alerts?stream_id=${streamId}`)
                .then((res) => res.json())
                .then((data) => {
                    if (!Array.isArray(data) || data.length === 0) return;
                    const latest = data[0];
                    if (!initializedRef.current) {
                        lastIdRef.current = latest.id;
                        initializedRef.current = true;
                        return;
                    }
                    if (latest.id !== lastIdRef.current) {
                        lastIdRef.current = latest.id;
                        setAlert(latest);
                        setVisible(true);
                        clearTimeout(timerRef.current);
                        timerRef.current = setTimeout(() => setVisible(false), 5000);
                    }
                })
                .catch(() => {});
        };

        fetchAlerts();
        const interval = setInterval(fetchAlerts, 1000);
        return () => {
            clearInterval(interval);
            clearTimeout(timerRef.current);
        };
    }, [streamId]);

    if (!visible || !alert) return null;

    return (
        <div className="stream-badge" style={{ background: severityColor[alert.event_type] }} title={`${LABEL_MAP[alert.event_type] || alert.event_type} · ${alert.zone_name}`}>
            <span className="material-symbols-outlined">
                {severityIcon[alert.event_type] || "info"}
            </span>
        </div>
    );
}

export default StreamOverlay;
