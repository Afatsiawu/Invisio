import cv2
import numpy as np

def remove_logo(image_path, mask_path, output_path):
    # 1. Load the original image
    img = cv2.imread(image_path)
    
    # 2. Load the mask (must be grayscale)
    # The mask should have the logo area in white (255) and rest in black (0)
    mask = cv2.imread(mask_path, cv2.IMREAD_GRAYSCALE)
    
    if img is None or mask is None:
        print("Error: Could not load images. Check your file paths.")
        return

    # 3. Apply Inpainting
    # Parameter 3: Inpaint radius (usually 3-5 is good)
    # Parameter 4: Algorithm (cv2.INPAINT_TELEA or cv2.INPAINT_NS)
    result = cv2.inpaint(img, mask, 3, cv2.INPAINT_TELEA)

    # 4. Save and show the result
    cv2.imwrite(output_path, result)
    print(f"Success! Image saved to {output_path}")
    
    # Optional: Display the results
    cv2.imshow('Original', img)
    cv2.imshow('Restored', result)
    cv2.waitKey(0)
    cv2.destroyAllWindows()

# Usage
remove_logo('your_image.jpg', 'your_mask.jpg', 'cleaned_image.jpg')