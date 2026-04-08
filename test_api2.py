import requests

try:
    res = requests.post("http://localhost:8000/api/generate/description", json={
        "product_name": "Test Product",
        "description": "Test Description"
    })
    print(res.status_code)
    print(res.text)
except Exception as e:
    print("Error:", e)
