import cv2

class VideoSource:
    def __init__(self, source: str | int):
        self.source = source
        self.cap = None

    def open(self):
        self.cap = cv2.VideoCapture(self.source)
        if not self.cap.isOpened():
            raise RuntimeError(f"Failed to open video source: {self.source}")

    def read(self):
        return self.cap.read()
    
    def release(self):
        if self.cap:
            self.cap.release()

    def is_opened(self):
        return self.cap is not None and self.cap.isOpened()
    
    def get_fps(self):
        return self.cap.get(cv2.CAP_PROP_FPS)

    def get_resolution(self):
        w = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        h = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        return w, h