import requests
import json

url = 'http://127.0.0.1:8000/api/process-photo/'
image_path = 'api/img/dun.jpg'

print(f"Sending {image_path} to the API...")

try:
    with open(image_path, 'rb') as image_file:
        files = {'image': image_file}
        response = requests.post(url, files=files)
        
        print(f"Status Code: {response.status_code}\n")
        
        if response.status_code == 200:
            parsed_json = response.json()
            print(json.dumps(parsed_json, indent=4))
        else:
            print("Error Response:")
            print(response.text)

except FileNotFoundError:
    print(f"Error: The image '{image_path}' was not found. Please add it to the directory.")
except Exception as e:
    print(f"An error occurred: {e}")