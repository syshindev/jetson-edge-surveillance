from video.source import VideoSource
from tracking.bot_sort import BoTSortTracker
from events.intrusion import Zone, IntrusionDetector
import requests

class Pipeline:
    def __init__(self, source: str | int, model_path: str, zones: list[Zone], api_url: str = "http://localhost:8000"):
        self.source = VideoSource(source)
        self.tracker = BoTSortTracker(model_path)
        self.intrusion = IntrusionDetector(zones)
        self.api_url = api_url

    def _send_event(self, event):
        try:
            requests.post(f"{self.api_url}/events", params={
                "track_id": event["track_id"],
                "zone_name": event["zone"],
                "center_x": event["center"][0],
                "center_y": event["center"][1],
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
            events = self.intrusion.check(results)
            for event in events:
                print(f"Intrusion: ID {event['track_id']} in {event['zone']}")
                self._send_event(event)
        
        self.source.release()