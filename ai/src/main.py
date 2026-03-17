from inference.yolo_torch import YoloTorchDetector
from video.source import VideoSource

def main():
    # Set video source (0 = webcam, or file path)
    source = VideoSource(0)
    # Load YOLO model
    detector = YoloTorchDetector("yolo11n.pt")

    # Open video source
    source.open()

    # Read frames until video ends
    while source.is_opened():
        ret, frame = source.read()
        if not ret:
            break

        # Run detection on frame
        detections = detector.detect(frame)

        # TODO: draw results on frame

    # Release resources
    source.release()

if __name__ == "__main__":
    main()