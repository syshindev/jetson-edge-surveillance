import { useState } from "react";
import { API_BASE } from "./constants";

function DataManagement() {
    const [msg, setMsg] = useState("");
    const [confirming, setConfirming] = useState(false);

    const handleReset = () => {
        fetch(`${API_BASE}/events-all`, { method: "DELETE" })
            .then((res) => res.json())
            .then(() => { setMsg("All events deleted"); setTimeout(() => setMsg(""), 3000); })
            .catch(() => { setMsg("Failed to delete events"); setTimeout(() => setMsg(""), 3000); })
            .finally(() => setConfirming(false));
    };

    return (
        <div className="card" style={{ marginTop: "1rem" }}>
            <h2>Data Management</h2>
            <div style={{ marginTop: "1rem" }}>
                <button className="btn-danger" onClick={() => setConfirming(true)}>
                    <span className="material-symbols-outlined">delete_forever</span>
                    Reset All Events
                </button>
            </div>
            {confirming && (
                <div className="confirm-modal">
                    <p>Delete all events?</p>
                    <div className="confirm-actions">
                        <button className="btn-danger" onClick={handleReset}>Confirm</button>
                        <button className="btn-cancel" onClick={() => setConfirming(false)}>Cancel</button>
                    </div>
                </div>
            )}
            {msg && <div className="toast">{msg}</div>}
        </div>
    );
}

export default DataManagement;
