import { useEffect, useRef } from "react";

function VideoStream() {
    const imgRef = useRef(null);

    useEffect(() => {
        const ws = new WebSocket("ws://localhost:8000/ws/stream");

        ws.onmessage = (event) => {
            imgRef.current.src = `data:image/jpeg;base64,${event.data}`;
        };

        return () => ws.close();
    }, []);

    return <img ref={imgRef} alt="Video Stream" />;
}

export default VideoStream;