import { useEffect, useRef } from "react";

function VideoStream({ streamId = 0 }) {
    const imgRef = useRef(null);

    useEffect(() => {
        const ws = new WebSocket(`ws://localhost:8001/ws/stream/${streamId}`);

        ws.onmessage = (event) => {
            imgRef.current.src = `data:image/jpeg;base64,${event.data}`;
        };

        return () => ws.close();
    }, [streamId]);

    return <img ref={imgRef} alt="Video Stream" />;
}

export default VideoStream;
