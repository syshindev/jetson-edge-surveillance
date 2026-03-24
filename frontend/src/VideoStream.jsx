import { useEffect, useRef } from "react";

function VideoStream({ streamId = 0 }) {
    const imgRef = useRef(null);

    useEffect(() => {
        const ws = new WebSocket(`ws://localhost:8001/ws/stream/${streamId}`);
        ws.binaryType = "arraybuffer";

        ws.onmessage = (event) => {
            const blob = new Blob([event.data], { type: "image/jpeg" });
            const url = URL.createObjectURL(blob);
            if (imgRef.current.src) URL.revokeObjectURL(imgRef.current.src);
            imgRef.current.src = url;
        };

        return () => ws.close();
    }, [streamId]);

    return <img ref={imgRef} alt="Video Stream" />;
}

export default VideoStream;
