import time


class LineCrossingDetector:
    CONFIRM_FRAMES = 5   # consecutive frames on a side to confirm position
    COOLDOWN = 2.0       # seconds between crossings per track_id
    REUSE_GAP = 60       # frames absent before treating as new track
    MAX_DIST = 150       # max px from line segment to count as crossing

    def __init__(self, line_start: tuple, line_end: tuple):
        self.line_start = line_start
        self.line_end = line_end
        self.confirmed_side = {}   # {track_id: +1 or -1}
        self.streak_side = {}      # {track_id: side currently being streaked}
        self.streak_count = {}     # {track_id: consecutive frames on streak_side}
        self.last_cross_time = {}  # {track_id: timestamp}
        self.last_seen = {}        # {track_id: frame index}
        self._frame = 0

    def _side(self, point):
        x, y = point
        x1, y1 = self.line_start
        x2, y2 = self.line_end
        val = (x2 - x1) * (y - y1) - (y2 - y1) * (x - x1)
        if val > 0:
            return 1
        elif val < 0:
            return -1
        return 0

    def _dist_to_segment(self, point):
        # Distance from point to the actual line segment (not infinite line)
        px, py = point
        ax, ay = self.line_start
        bx, by = self.line_end
        dx, dy = bx - ax, by - ay
        if dx == 0 and dy == 0:
            return ((px - ax) ** 2 + (py - ay) ** 2) ** 0.5
        t = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
        proj_x = ax + t * dx
        proj_y = ay + t * dy
        return ((px - proj_x) ** 2 + (py - proj_y) ** 2) ** 0.5

    def check(self, tracks):
        events = []
        self._frame += 1

        for box in tracks[0].boxes:
            if box.id is None:
                continue
            track_id = int(box.id[0])
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            center = (int((x1 + x2) / 2), int(y2))

            curr_side = self._side(center)
            if curr_side == 0:
                continue

            # Reset state if track_id was absent long enough to be reused
            if self._frame - self.last_seen.get(track_id, 0) > self.REUSE_GAP:
                self.confirmed_side.pop(track_id, None)
                self.streak_side.pop(track_id, None)
                self.streak_count.pop(track_id, None)
            self.last_seen[track_id] = self._frame

            if curr_side == self.streak_side.get(track_id):
                self.streak_count[track_id] = self.streak_count.get(track_id, 0) + 1
            else:
                self.streak_side[track_id] = curr_side
                self.streak_count[track_id] = 1

            if self.streak_count[track_id] >= self.CONFIRM_FRAMES:
                prev_confirmed = self.confirmed_side.get(track_id)
                if prev_confirmed is not None and prev_confirmed != curr_side:
                    dist = self._dist_to_segment(center)
                    if dist <= self.MAX_DIST:
                        now = time.time()
                        if now - self.last_cross_time.get(track_id, 0) >= self.COOLDOWN:
                            self.last_cross_time[track_id] = now
                            events.append({"track_id": track_id, "center": center})
                self.confirmed_side[track_id] = curr_side

        return events
