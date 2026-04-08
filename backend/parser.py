import json
from typing import Any


def parse_webhook_response(raw: Any) -> dict:
    """
    Robustly parse n8n webhook responses which can come in many shapes:
    - A plain dict
    - A list wrapping a dict
    - A dict with an 'output' key containing stringified JSON
    - Multiple levels of string-encoding
    """
    payload = raw

    # 1. Unwrap list
    if isinstance(payload, list) and len(payload) > 0:
        payload = payload[0]

    # 2. Unwrap common wrapper keys
    if isinstance(payload, dict):
        payload = (
            payload.get("output")
            or payload.get("body")
            or payload.get("data")
            or payload
        )

    # 3. Handle stringified JSON (recursively)
    if isinstance(payload, str):
        try:
            parsed = json.loads(payload)
            return parse_webhook_response(parsed)
        except (json.JSONDecodeError, ValueError):
            pass

    if not isinstance(payload, dict):
        return {}

    return payload


def get_val(obj: dict, keys: list[str], default=None):
    """
    Case-insensitive, whitespace-tolerant key lookup.
    Normalizes keys by stripping non-alphanumeric characters.
    """
    if not isinstance(obj, dict):
        return default

    def normalize(s: str) -> str:
        return "".join(c for c in s.lower() if c.isalnum())

    norm_keys = [normalize(k) for k in keys]

    for k, v in obj.items():
        if normalize(k) in norm_keys:
            return v

    return default
