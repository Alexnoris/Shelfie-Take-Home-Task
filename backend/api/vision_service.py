import os
from PIL import Image
from ultralytics import YOLO
from django.conf import settings

# Load the lightest YOLOv8 pre-trained model (it will download automatically the first time)
# We use the nano model (n) which is ideal for local CPU inference
MODEL_PATH = os.path.join(settings.BASE_DIR, 'yolov8n.pt')
model = YOLO(MODEL_PATH) 

def detect_book_spines(image_path):
    """
    Receives an image path, runs the local CPU YOLO model, 
    and returns a list of cropped spine images.
    """
    # Run inference strictly on CPU
    results = model(image_path, device='cpu')
    
    # Open the original image with Pillow for cropping
    original_image = Image.open(image_path)
    cropped_images = []

    # The class ID for "book" in the COCO dataset (YOLO's standard) is 73
    BOOK_CLASS_ID = 73 

    for result in results:
        boxes = result.boxes
        for box in boxes:
            # Check if the detected object is a book
            if int(box.cls[0]) == BOOK_CLASS_ID:
                # Extract bounding box coordinates [x_min, y_min, x_max, y_max]
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                
                # Crop the image using the coordinates
                cropped_spine = original_image.crop((x1, y1, x2, y2))
                cropped_images.append(cropped_spine)

    return cropped_images