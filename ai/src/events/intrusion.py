import cv2
import numpy as np

class Zone:
    def __init__(self, name: str, polygon: list[list[int]]):
        self.name = name                    # Zone name (e.g. "entrance")
        self.polygon = np.array(polygon)    # Polygon coordinates [[x1, y1], [x2, y2], ...]
    
    def contains(self, point: tuple[int, int]) -> bool:
        # Check if a point is inside the polygon
        result = cv2.pointPolygonTest(self.polygon.astype(np.float32), point, False)
        return result >= 0
    
class IntrusionDetector:
    def __init__(self, zones: list[Zone]):
        self.zones = zones

    def check(self, tracks):
        # Check if tracked objects are inside any zone
        events = []
        for box in tracks[0].boxes:
            if box.id is None:
                continue
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            center = (int((x1 + x2) / 2), int(y2))   # Bbox bottom center point

            for zone in self.zones:
                if zone.contains(center):
                    events.append({
                        "track_id": int(box.id[0]),
                        "zone": zone.name,
                        "center": center,
                    })
        return events