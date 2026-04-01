import { useEffect, useState } from "react";
import { API_BASE, WS_URL } from "./constants";
import { apiFetch } from "./api";

function StatCards() {
  const [stats, setStats] = useState({
    total_events: 0,
    today_events: 0,
    intrusions: 0,
    loitering: 0,
    line_crossing: 0,
  });

  const fetchStats = () => {
    fetch(`${API_BASE}/analytics/summary`)
      .then((res) => res.json())
      .then((data) => { if (data.total_events !== undefined) setStats(data); })
      .catch(() => {});
  };

  useEffect(() => {
    fetchStats();
    const onRefresh = () => fetchStats();
    window.addEventListener("data-refresh", onRefresh);

    let ws;
    let stopped = false;
    const connectWs = () => {
      if (stopped) return;
      ws = new WebSocket(WS_URL);
      ws.onmessage = () => fetchStats();
      ws.onclose = (e) => { if (!stopped && e.code !== 1000) setTimeout(connectWs, 3000); };
    };
    connectWs();

    return () => { stopped = true; ws?.close(); window.removeEventListener("data-refresh", onRefresh); };
  }, []);

  const handleDelete = (eventType) => {
    const path = eventType
      ? `/events/${eventType}`
      : `/events`;
    apiFetch(path, { method: "DELETE" }).then(() => {
      fetchStats();
      window.dispatchEvent(new Event("data-refresh"));
    });
  };

  const summaryCards = [
    { label: "Total Events", value: stats.total_events, icon: "event_note", color: "#3b82f6", deleteType: null },
    { label: "Today", value: stats.today_events, icon: "today", color: "#10b981" },
  ];

  const eventCards = [
    { label: "Intrusions", value: stats.intrusions, icon: "warning", color: "#ef4444", deleteType: "intrusion" },
    { label: "Loitering", value: stats.loitering, icon: "schedule", color: "#f59e0b", deleteType: "loitering" },
    { label: "Line Crossing", value: stats.line_crossing, icon: "swap_horiz", color: "#8b5cf6", deleteType: "line_crossing" },
  ];

  const renderCard = (card) => (
    <div className="stat-card" key={card.label}>
      <span className="material-symbols-outlined stat-icon" style={{ color: card.color }}>
        {card.icon}
      </span>
      <div className="stat-info">
        <span className="stat-value">{card.value}</span>
        <span className="stat-label">{card.label}</span>
      </div>
      {card.deleteType !== undefined && (
        <button
          className="stat-delete-btn"
          onClick={() => handleDelete(card.deleteType)}
          title={card.deleteType ? `Clear ${card.label}` : "Clear All Events"}
        >
          <span className="material-symbols-outlined">delete</span>
        </button>
      )}
    </div>
  );

  return (
    <div className="stat-cards-wrapper">
      <div className="stat-cards stat-row-2">
        {summaryCards.map(renderCard)}
      </div>
      <div className="stat-cards stat-row-3">
        {eventCards.map(renderCard)}
      </div>
    </div>
  );
}

export default StatCards;
