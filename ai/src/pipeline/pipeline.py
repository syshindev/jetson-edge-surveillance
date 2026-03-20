from video.source import VideoSource
from tracking.bot_sort import BoTSortTracker
from events.intrusion import Zone, IntrusionDetector
from events.loitering import LoiteringDetector
from events.line_crossing import LineCrossingDetector
import requests

class Pipeline:
    def __init__(self, source: str | int, model_path: str, zones: list[Zone], lines: list = None, api_url: str = "http://localhost:8000"):
        self.source = VideoSource(source)
        self.tracker = BoTSortTracker(model_path)
        self.intrusion = IntrusionDetector(zones)
        self.loitering = LoiteringDetector(zones)
        self.line_detectors = []
        if lines:
            for line in lines:
                self.line_detectors.append(LineCrossingDetector(line[0], line[1]))
        self.api_url = api_url
        self.sent_ids = {"intrusion": set(), "loitering": set(), "line_crossing": set()}

    def _send_event(self, event):
        try:
            requests.post(f"{self.api_url}/events", params={
                "track_id": event["track_id"],
                "zone_name": event.get("zone", "line"),
                "center_x": event.get("center", (0, 0))[0],
                "center_y": event.get("center", (0, 0))[1],
            })
        except Exception:
            pass

    def run(self):
        self.source.open()

        while self.source.is_opened():
            ret, frame = self.source.read()
            if not ret:
                break

            results = self.tracker.update(frame)
            
            # Check intrusion events
            for event in self.intrusion.check(results):
                if event["track_id"] not in self.sent_ids["intrusion"]:
                    print(f"Intrusion: ID {event['track_id']} in {event['zone']}")
                    self._send_event(event)
                    self.sent_ids["intrusion"].add(event["track_id"])

            # Check loitering events
            for event in self.loitering.check(results):
                if event["track_id"] not in self.sent_ids["loitering"]:
                    print(f"Loitering: ID {event['track_id']} in {event['zone']} ({event['duration']}s)")
                    self._send_event(event)
                    self.sent_ids["loitering"].add(event["track_id"])

            # Check line crossing events
            for detector in self.line_detectors:
                for event in detector.check(results):
                    if event["track_id"] not in self.sent_ids["line_crossing"]:
                        print(f"Line Crossing: ID {event['track_id']}")
                        self._send_event(event)
                        self.sent_ids["line_crossing"].add(event["track_id"])
        
        self.source.release()