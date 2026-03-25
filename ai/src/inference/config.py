import os
from inference.yolo_torch import YoloDetector


def get_detector(model_path: str = None):
    if model_path:
        return YoloDetector(model_path)

    if os.path.exists("yolo11n.engine"):
        return YoloDetector("yolo11n.engine")

    return YoloDetector("yolo11n.pt")
