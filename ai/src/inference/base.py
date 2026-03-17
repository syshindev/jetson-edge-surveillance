from abc import ABC, abstractmethod
from dataclasses import dataclass
import numpy as np

@dataclass
class Detection:
    bbox: list[float]
    confidence: float
    class_id: int
    class_name: str

class BaseDetector(ABC):
    @abstractmethod
    def detect(self, frame: np.ndarray) -> list[Detection]:
        pass