import { useEffect, useState } from "react";
import { API_BASE, WS_URL, LABEL_MAP } from "./constants";

const severityMap = {
  intrusion: { color: "#e94560", icon: "error" },
  loitering: { color: "#f59e0b", icon: "schedule" },
  line_crossing: { color: "#3b82f6", icon: "swap_horiz" },
};

function timeAgo(timestamp) {
  if (!timestamp) return "";
  const diff = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function RecentAlerts() {
  const [alerts, setAlerts] = useState(null);

  useEffect(() => {
    const fetchAlerts = () => {
      fetch(`${API_BASE}/analytics/recent-alerts`)
        .then((res) => res.json())
        .then((data) => { if (Array.isArray(data)) setAlerts(data); })
        .catch(() => {});
    };

    fetchAlerts();
    const onRefresh = () => fetchAlerts();
    window.addEventListener("data-refresh", onRefresh);

    let ws;
    let stopped = false;
    const connectWs = () => {
      if (stopped) return;
      ws = new WebSocket(WS_URL);
      ws.onmessage = () => fetchAlerts();
      ws.onclose = (e) => { if (!stopped && e.code !== 1000) setTimeout(connectWs, 3000); };
    };
    connectWs();

    return () => { stopped = true; ws?.close(); window.removeEventListener("data-refresh", onRefresh); };
  }, []);

  return (
    <div>
      <h2>Recent Alerts</h2>
      <div className="alerts-list">
        {!alerts && [1, 2, 3].map((i) => (
          <div className="alert-item skeleton" key={i}>
            <div className="skeleton-circle" />
            <div style={{ flex: 1 }}><div className="skeleton-line wide" /><div className="skeleton-line narrow" /></div>
          </div>
        ))}
        {alerts && alerts.length === 0 && <p className="no-alerts">No alerts yet</p>}
        {(alerts || []).map((alert) => {
          const severity = severityMap[alert.event_type] || { color: "#6b7280", icon: "info" };
          return (
            <div className="alert-item" key={alert.id}>
              <span
                className="material-symbols-outlined alert-icon"
                style={{ color: severity.color }}
              >
                {severity.icon}
              </span>
              <div className="alert-info">
                <span className="alert-type">{LABEL_MAP[alert.event_type] || alert.event_type}</span>
                <span className="alert-detail">
                  Zone: {alert.zone_name} · Track #{alert.track_id}
                </span>
              </div>
              <span className="alert-time">{timeAgo(alert.timestamp)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default RecentAlerts;
