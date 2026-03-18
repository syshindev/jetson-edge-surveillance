from video.source import VideoSource
from tracking.bot_sort import BoTSortTracker
from events.intrusion import Zone, IntrusionDetector

class Pipeline:
    def __init__(self, source: str | int, model_path: str, zones: list[Zone]):
        self.source = VideoSource(source)
        self.tracker = BoTSortTracker(model_path)
        self.intrusion = IntrusionDetector(zones)

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
        
        self.source.release()