import { useEffect, useState } from "react";

function StatCards() {
  const [stats, setStats] = useState({
    total_events: 0,
    today_events: 0,
    intrusions: 0,
    loitering: 0,
    line_crossing: 0,
  });

  useEffect(() => {
    const fetchStats = () => {
      fetch("http://localhost:8001/analytics/summary")
        .then((res) => res.json())
        .then((data) => { if (data.total_events !== undefined) setStats(data); })
        .catch(() => {});
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const summaryCards = [
    { label: "Total Events", value: stats.total_events, icon: "event_note", color: "#3b82f6" },
    { label: "Today", value: stats.today_events, icon: "today", color: "#10b981" },
  ];

  const eventCards = [
    { label: "Intrusions", value: stats.intrusions, icon: "warning", color: "#ef4444" },
    { label: "Loitering", value: stats.loitering, icon: "schedule", color: "#f59e0b" },
    { label: "Line Crossing", value: stats.line_crossing, icon: "swap_horiz", color: "#8b5cf6" },
  ];

  const renderCard = (card) => (
    <div className="stat-card" key={card.label}>
      <span className="material-icons-outlined stat-icon" style={{ color: card.color }}>
        {card.icon}
      </span>
      <div className="stat-info">
        <span className="stat-value">{card.value}</span>
        <span className="stat-label">{card.label}</span>
      </div>
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
