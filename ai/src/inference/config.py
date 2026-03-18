import os
from inference.yolo_torch import YoloTorchDetector
from inference.yolo_trt import YoloTrtDetector

def get_detector(model_path: str = None):
    if model_path and model_path.endswith(".engine"):
        return YoloTrtDetector(model_path)
    
    if os.path.exists("yolo11n.engine"):
        return YoloTrtDetector("yolo11n.engine")
    
    return YoloTorchDetector(model_path or "yolo11n.pt")