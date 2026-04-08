def get_val(obj, keys, default=None):
    if not isinstance(obj, dict):
        return default
    def normalize(s):
        return "".join(c for c in s.lower() if c.isalnum())
    norm_keys = [normalize(k) for k in keys]
    for k, v in obj.items():
        if normalize(k) in norm_keys:
            return v
    return default

# The exact payload shape from the screenshot
raw = [{
    "Unique Key": "123",
    "image url": "https://lh3.googleusercontent.com/drive-storage/...",
    "product_name": "Pot",
    "description": "Pot",
    "output": '{"title": "Title"}'
}]

raw_dict = raw[0] if isinstance(raw, list) and raw else raw if isinstance(raw, dict) else {}

# Notice how output is usually unwrapped in the real code
import json
output = json.loads(raw_dict["output"])

image_url = get_val(output, ["image_url", "image url", "imageUrl", "image", "secure_url", "url"],
                get_val(raw_dict, ["image_url", "image url", "imageUrl", "image", "secure_url", "url"]))
print(f"Extraction result: {image_url}")
