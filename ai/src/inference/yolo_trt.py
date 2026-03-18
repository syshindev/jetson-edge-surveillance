from ultralytics import YOLO
from .base import BaseDetector, Detection
import numpy as np

class YoloTrtDetector(BaseDetector):
    def __init__(self, model_path: str = "yolo11n.engine", confidence: float = 0.5):
        self.model = YOLO(model_path)
        self.confidence = confidence

    def detect(self, frame: np.ndarray) -> list[Detection]:
        results = self.model.predict(frame, conf=self.confidence, verbose=False)
        detections = []
        for result in results:
            for box in result.boxes:
                detections.append(Detection(
                    bbox=box.xyxy[0].tolist(),
                    confidence=float(box.conf[0]),
                    class_id=int(box.cls[0]),
                    class_name=result.names[int(box.cls[0])],
                ))
        return detections