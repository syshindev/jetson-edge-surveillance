import time

class LoiteringDetector:
    def __init__(self, zones, threshold: float = 5.0):
        self.zones = zones
        self.threshold = threshold  # Seconds before alert
        self.track_times = {}       # {track_id: first_seen_time}

    def check(self, tracks):
        events = []
        current_time = time.time()

        for box in tracks[0].boxes:
            if box.id is None:
                continue
            track_id = int(box.id[0])
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            center = (int((x1 + x2) / 2), int(y2))

            for zone in self.zones:
                if zone.contains(center):
                    if track_id not in self.track_times:
                        self.track_times[track_id] = current_time

                    elapsed = current_time - self.track_times[track_id]
                    if elapsed >= self.threshold:
                        events.append({
                            "track_id": track_id,
                            "zone": zone.name,
                            "duration": round(elapsed, 1),
                        })
                else:
                    self.track_times.pop(track_id, None)

        return events