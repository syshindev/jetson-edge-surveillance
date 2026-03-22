import { useState } from "react";

function ZoneConfig() {
    const [zoneName, setZoneName] = useState("");
    const [polygon, setPolygon] = useState("");

    const handleSubmit = () => {
        try {
            const points = JSON.parse(polygon);
            console.log("Zone saved:", { name: zoneName, polygon: points });
        } catch {
            console.error("Invalid polygon JSON");
        }
    };

    return (
        <div>
            <h2>Zone Configuration</h2>
            <input
                type="text"
                placeholder="Zone name"
                value={zoneName}
                onChange={(e) => setZoneName(e.target.value)}
            />
            <input
                type="text"
                placeholder='Polygon e.g. [[100,200],[300,200],[300,400]]'
                value={polygon}
                onChange={(e) => setPolygon(e.target.value)}
            />
            <button onClick={handleSubmit}>Save Zone</button>
        </div>
    );
}

export default ZoneConfig;