FROM python:3.12-slim

WORKDIR /app

COPY pyproject.toml .
COPY src/ src/

RUN pip install ultralytics opencv-python-headless numpy

CMD ["python", "src/main.py"]