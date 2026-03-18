from ultralytics import YOLO

class BoTSortTracker:
    def __init__(self, model_path: str):
        self.model = YOLO(model_path)
    
    def update(self, frame):
        results = self.model.track(frame, persist=True, classes=[0])
        return results
    
    def reset(self):
        self.model = YOLO(self.model.model_name)