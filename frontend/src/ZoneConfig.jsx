import { useState, useRef, useEffect } from "react";

function ZoneConfig() {
    const canvasRef = useRef(null);
    const imgRef = useRef(null);
    const [points, setPoints] = useState([]);
    const [streamId, setStreamId] = useState(0);
    const [zoneType, setZoneType] = useState("intrusion");
    const [zoneName, setZoneName] = useState("");
    const [frameLoaded, setFrameLoaded] = useState(false);
    const [saveMsg, setSaveMsg] = useState("");

    // Load first frame from stream
    useEffect(() => {
        const ws = new WebSocket(`ws://localhost:8001/ws/stream/${streamId}`);
        ws.binaryType = "arraybuffer";

        ws.onmessage = (event) => {
            const blob = new Blob([event.data], { type: "image/jpeg" });
            const url = URL.createObjectURL(blob);
            const img = new Image();
            img.onload = () => {
                imgRef.current = img;
                setFrameLoaded(true);
                drawCanvas(img, points);
                URL.revokeObjectURL(url);
            };
            img.src = url;
            ws.close();
        };

        return () => ws.close();
    }, [streamId]);

    const drawCanvas = (img, pts) => {
        const canvas = canvasRef.current;
        if (!canvas || !img) return;
        const ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Draw points and lines
        if (pts.length > 0) {
            ctx.strokeStyle = "#e94560";
            ctx.lineWidth = 2;
            ctx.fillStyle = "rgba(233, 69, 96, 0.15)";

            ctx.beginPath();
            ctx.moveTo(pts[0][0], pts[0][1]);
            for (let i = 1; i < pts.length; i++) {
                ctx.lineTo(pts[i][0], pts[i][1]);
            }
            if (pts.length > 2) {
                ctx.closePath();
                ctx.fill();
            }
            ctx.stroke();

            // Draw dots
            pts.forEach((pt) => {
                ctx.beginPath();
                ctx.arc(pt[0], pt[1], 5, 0, Math.PI * 2);
                ctx.fillStyle = "#00d4ff";
                ctx.fill();
            });
        }
    };

    const handleClick = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = Math.round((e.clientX - rect.left) * scaleX);
        const y = Math.round((e.clientY - rect.top) * scaleY);

        const newPoints = [...points, [x, y]];
        setPoints(newPoints);
        drawCanvas(imgRef.current, newPoints);
    };

    const handleClear = () => {
        setPoints([]);
        drawCanvas(imgRef.current, []);
    };

    const handleSave = () => {
        const minPoints = zoneType === "line_crossing" ? 2 : 3;
        if (!zoneName.trim()) {
            setSaveMsg("Enter a zone name.");
            setTimeout(() => setSaveMsg(""), 3000);
            return;
        }
        if (points.length < minPoints) {
            setSaveMsg(`Draw at least ${minPoints} points.`);
            setTimeout(() => setSaveMsg(""), 3000);
            return;
        }
        // Delete existing zones for this stream first
        fetch(`http://localhost:8001/zones/${streamId}`, { method: "DELETE" })
        .then(() => {
            // Save new zone
            return fetch(`http://localhost:8001/zones?stream_id=${streamId}&name=${zoneName || zoneType}&zone_type=${zoneType}&polygon=${JSON.stringify(points)}`, {
                method: "POST",
            });
        })
        .then((res) => res.json())
        .then(() => { setSaveMsg("Zone saved!"); setTimeout(() => setSaveMsg(""), 3000); })
        .catch(() => { setSaveMsg("Failed to save."); setTimeout(() => setSaveMsg(""), 3000); });
    };

    return (
        <div>
            <h2>Zone Configuration</h2>
            <div className="zone-controls">
                <select value={streamId} onChange={(e) => { setStreamId(Number(e.target.value)); setPoints([]); }}>
                    <option value={0}>Camera 1</option>
                    <option value={1}>Camera 2</option>
                    <option value={2}>Camera 3</option>
                </select>
                <select value={zoneType} onChange={(e) => setZoneType(e.target.value)}>
                    <option value="intrusion">Intrusion</option>
                    <option value="loitering">Loitering</option>
                    <option value="line_crossing">Line Crossing</option>
                </select>
                <input
                    type="text"
                    placeholder="Zone name (e.g. Front Door)"
                    value={zoneName}
                    onChange={(e) => setZoneName(e.target.value)}
                />
            </div>
            <div className="zone-canvas-wrapper">
                <canvas
                    ref={canvasRef}
                    onClick={handleClick}
                    style={{ width: "100%", cursor: "crosshair", borderRadius: "4px" }}
                />
                {!frameLoaded && <p style={{ opacity: 0.5 }}>Loading frame...</p>}
            </div>
            <div className="zone-actions">
                <div>
                    <button onClick={handleClear}>Clear</button>
                    <button onClick={handleSave}>Save Zone</button>
                </div>
            </div>
            {saveMsg && <div className="toast">{saveMsg}</div>}
        </div>
    );
}

export default ZoneConfig;
