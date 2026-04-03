import { useEffect, useRef, useState } from "react";
import { API_BASE } from "./constants";

function VideoStream({ streamId = 0 }) {
    const videoRef = useRef(null);
    const imgRef = useRef(null);
    const [webrtcReady, setWebrtcReady] = useState(false);
    const [imgLoaded, setImgLoaded] = useState(false);

    useEffect(() => {
        const pc = new RTCPeerConnection();

        pc.ontrack = (event) => {
            videoRef.current.srcObject = event.streams[0];
            setWebrtcReady(true);
        };

        pc.addTransceiver("video", { direction: "recvonly" });
        pc.createOffer().then((offer) => {
            return pc.setLocalDescription(offer);
        }).then(() => {
            return new Promise((resolve) => {
                if (pc.iceGatheringState === "complete") {
                    resolve();
                } else {
                    const timeout = setTimeout(resolve, 500);
                    pc.onicegatheringstatechange = () => {
                        if (pc.iceGatheringState === "complete") {
                            clearTimeout(timeout);
                            resolve();
                        }
                    };
                }
            });
        }).then(() => {
            return fetch(`${API_BASE}/webrtc/offer/${streamId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sdp: pc.localDescription.sdp,
                    type: pc.localDescription.type,
                }),
            });
        })
        .then((res) => res.json())
        .then((answer) => {
            pc.setRemoteDescription(new RTCSessionDescription(answer));
        });

        return () => {
            pc.close();
            setWebrtcReady(false);
            setImgLoaded(false);
        };
    }, [streamId]);

    return (
        <div style={{ position: "relative" }}>
            <img
                ref={imgRef}
                src={`${API_BASE}/mjpeg/${streamId}`}
                onLoad={() => setImgLoaded(true)}
                onError={() => setImgLoaded(false)}
                style={{ width: "100%", display: webrtcReady ? "none" : "block" }}
            />
            {!imgLoaded && !webrtcReady && (
                <div className="video-spinner" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
                    <div className="spinner" />
                </div>
            )}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: "100%", display: webrtcReady ? "block" : "none" }}
            />
        </div>
    );
}

export default VideoStream;
