class LineCrossingDetector:
    def __init__(self, line_start: tuple, line_end: tuple):
        self.line_start = line_start    # (x1, y1)
        self.line_end = line_end        # (x2, y2)
        self.prev_positions = {}        # {track_id: (x, y)}

    def _side(self, point):
        # Check which side of the line the point is on
        x, y = point
        x1, y1 = self.line_start
        x2, y2 = self.line_end
        return (x2 - x1) * (y - y1) - (y2 - y1) * (x - x1)
    
    def check(self, tracks):
        events = []

        for box in tracks[0].boxes:
            if box.id is None:
                continue
            track_id = int(box.id[0])
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            center = (int((x1 + x2) / 2), int(y2))

            if track_id in self.prev_positions:
                prev_side = self._side(self.prev_positions[track_id])
                curr_side = self._side(center)

                # Sign change means line was crossed
                if prev_side * curr_side < 0:
                    events.append({
                        "track_id": track_id,
                        "center": center,
                    })
            
            self.prev_positions[track_id] = center

        return events