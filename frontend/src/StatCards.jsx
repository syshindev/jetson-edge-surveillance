import { useEffect, useState, useRef } from "react";
import { API_BASE, WS_URL } from "./constants";
import { apiFetch } from "./api";

function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    if (value !== prevRef.current) {
      const start = prevRef.current;
      const diff = value - start;
      const duration = 400;
      const startTime = Date.now();
      const tick = () => {
        const elapsed = Date.now() - startTime;
        if (elapsed >= duration) { setDisplay(value); }
        else { setDisplay(Math.round(start + diff * (elapsed / duration))); requestAnimationFrame(tick); }
      };
      requestAnimationFrame(tick);
      prevRef.current = value;
    }
  }, [value]);

  return <span className="stat-value">{display}</span>;
}

function StatCards() {
  const [stats, setStats] = useState(null);

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

  if (!stats) {
    return (
      <div className="stat-cards-wrapper">
        <div className="stat-cards stat-row-2">
          {[1, 2].map((i) => <div className="stat-card skeleton" key={i}><div className="skeleton-line wide" /><div className="skeleton-line narrow" /></div>)}
        </div>
        <div className="stat-cards stat-row-3">
          {[1, 2, 3].map((i) => <div className="stat-card skeleton" key={i}><div className="skeleton-line wide" /><div className="skeleton-line narrow" /></div>)}
        </div>
      </div>
    );
  }

  const summaryCards = [
    { label: "Total Events", value: stats.total_events, icon: "event_note", color: "#3b82f6", deleteType: null },
    { label: "Today", value: stats.today_events, icon: "today", color: "#10b981" },
  ];

  const eventCards = [
    { label: "Intrusions", value: stats.intrusions, icon: "warning", color: "#e94560", deleteType: "intrusion" },
    { label: "Loitering", value: stats.loitering, icon: "schedule", color: "#f59e0b", deleteType: "loitering" },
    { label: "Line Crossing", value: stats.line_crossing, icon: "swap_horiz", color: "#3b82f6", deleteType: "line_crossing" },
  ];

  const renderCard = (card) => (
    <div className="stat-card" key={card.label}>
      <span className="material-symbols-outlined stat-icon" style={{ color: card.color }}>
        {card.icon}
      </span>
      <div className="stat-info">
        <AnimatedNumber value={card.value} />
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
