from video.source import VideoSource
from tracking.bot_sort import BoTSortTracker

class Pipeline:
    def __init__(self, source: str | int, model_path: str):
        self.source = VideoSource(source)
        self.tracker = BoTSortTracker(model_path)

    def run(self):
        self.source.open()

        while self.source.is_opened():
            ret, frame = self.source.read()
            if not ret:
                break

            results = self.tracker.update(frame)
            # TODO: process results
        
        self.source.release()