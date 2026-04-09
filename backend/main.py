import os
import uuid
import httpx
import base64
from io import BytesIO
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Optional
from parser import parse_webhook_response, get_val

app = FastAPI(title="Product Studio API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Webhook URLs ──────────────────────────────────────────────────────────────
N8N_DESCRIPTION = "https://n8n.intelligens.app/webhook/description"
N8N_IMAGE       = "https://n8n.intelligens.app/webhook/image"
N8N_VIDEO       = "https://n8n.intelligens.app/webhook/video"

# ── Request Models ────────────────────────────────────────────────────────────
class GenerateDescriptionRequest(BaseModel):
    product_name: Optional[str] = ""
    description: Optional[str] = ""
    image_base64: Optional[str] = None
    file_name: Optional[str] = None
    unique_key: Optional[str] = None

class GenerateImageRequest(BaseModel):
    product_name: str
    description: str
    unique_key: str

class GenerateVideoRequest(BaseModel):
    product_name: str
    description: str
    image_url: Optional[str] = None
    unique_key: str

class VideoCompleteRequest(BaseModel):
    unique_key: str
    video_url: str

# ── In-Memory Store ───────────────────────────────────────────────────────────
async_video_jobs = {}


class PublishRequest(BaseModel):
    product_name: str
    description: str
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    unique_key: str

# ── Helpers ───────────────────────────────────────────────────────────────────
async def call_n8n(url: str, payload: dict, files: dict = None) -> dict:
    """Forward a payload to an n8n webhook and return the parsed response."""
    async with httpx.AsyncClient(timeout=None) as client:
        if files:
            res = await client.post(url, data=payload, files=files)
        else:
            res = await client.post(url, json=payload)
        res.raise_for_status()
        raw = res.json()
    return parse_webhook_response(raw), raw


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {"status": "Product Studio API is running"}


@app.post("/api/generate/description")
async def generate_description(body: GenerateDescriptionRequest):
    """Step 1: Generate AI product description via n8n."""
    unique_key = body.unique_key or str(uuid.uuid4())

    data_payload = {
        "workflow": "description",
        "product_name": body.product_name,
        "description": body.description,
        "unique_key": unique_key,
        "image_base64": body.image_base64 or "",
        "file_name": body.file_name or "",
    }

    files = None
    if body.image_base64:
        # Strip the data:image/...;base64, prefix if present
        prefix, encoded = "", body.image_base64
        if "," in body.image_base64:
            prefix, encoded = body.image_base64.split(",", 1)
        
        # Get mime type from prefix (default to png)
        mime_type = "image/png"
        if prefix.startswith("data:"):
            mime_type = prefix.split(";")[0].replace("data:", "")

        image_bytes = base64.b64decode(encoded)
        fname = body.file_name or "uploaded_image.jpg"
        files = {"file": (fname, image_bytes, mime_type)}

    output, raw = await call_n8n(N8N_DESCRIPTION, payload=data_payload, files=files)


    name = get_val(output, ["title", "product_name", "product name", "name"], body.product_name)
    desc = get_val(output, ["description", "enhanced_description", "enhanced description", "content", "desc"], body.description)
    
    # Securely extract from raw in case wrapper discarded top level keys
    raw_dict = raw[0] if isinstance(raw, list) and raw else raw if isinstance(raw, dict) else {}
    
    key  = get_val(output, ["unique_key", "unique key", "uniqueKey"],
                   get_val(raw_dict, ["unique_key", "unique key"], unique_key))
                   
    image_url = get_val(output, ["image_url", "image url", "imageUrl", "image", "secure_url", "url"],
                    get_val(raw_dict, ["image_url", "image url", "imageUrl", "image", "secure_url", "url"]))

    if isinstance(image_url, list) and image_url:
        image_url = image_url[0]
    if isinstance(image_url, dict):
        image_url = image_url.get("secure_url") or image_url.get("url") or str(image_url)

    return {"product_name": name, "description": desc, "unique_key": key, "image_url": image_url}


@app.post("/api/generate/image")
async def generate_image(body: GenerateImageRequest):
    """Step 2: Generate AI product image via n8n."""
    output, raw = await call_n8n(N8N_IMAGE, {
        "workflow": "photo",
        "product_name": body.product_name,
        "description": body.description,
        "unique_key": body.unique_key,
    })

    raw_dict = raw[0] if isinstance(raw, list) and raw else raw if isinstance(raw, dict) else {}
    
    image_url = get_val(output, ["image_url", "image url", "imageUrl", "image", "secure_url", "url"],
                    get_val(raw_dict, ["image_url", "image url", "imageUrl", "image", "secure_url", "url"]))
    
    if isinstance(image_url, list) and image_url:
        image_url = image_url[0]
    if isinstance(image_url, dict):
        image_url = image_url.get("secure_url") or image_url.get("url") or str(image_url)

    key = get_val(output, ["unique_key", "unique key", "uniqueKey"],
                  get_val(raw_dict, ["unique_key", "unique key"], body.unique_key))

    return {"image_url": image_url, "unique_key": key}


@app.post("/api/generate/video")
async def generate_video(body: GenerateVideoRequest):
    """Step 3: Generate AI product video via n8n synchronously."""
    output, raw = await call_n8n(N8N_VIDEO, {
        "workflow": "video",
        "product_name": body.product_name,
        "description": body.description,
        "image_url": body.image_url,
        "unique_key": body.unique_key,
    })

    raw_dict = raw[0] if isinstance(raw, list) and raw else raw if isinstance(raw, dict) else {}
    
    video_url = get_val(output, ["video_url", "video url", "videoUrl", "video", "secure_url", "url"],
                    get_val(raw_dict, ["video_url", "video url", "videoUrl", "video", "secure_url", "url"]))
    
    if isinstance(video_url, list) and video_url:
        video_url = video_url[0]
    if isinstance(video_url, dict):
        video_url = video_url.get("secure_url") or video_url.get("url") or str(video_url)

    key = get_val(output, ["unique_key", "unique key", "uniqueKey"],
                  get_val(raw_dict, ["unique_key", "unique key"], body.unique_key))

    return {"video_url": video_url, "unique_key": key}


@app.post("/api/webhook/video-complete")
async def video_complete(body: VideoCompleteRequest):
    """Step 3.5: n8n POSTs here when Replicate finishes generating the video."""
    async_video_jobs[body.unique_key] = body.video_url
    return {"status": "success"}


@app.get("/api/status/video/{unique_key}")
async def video_status(unique_key: str):
    """Frontend polls here every 10 seconds to check if n8n returned the video."""
    video_url = async_video_jobs.get(unique_key)
    if video_url:
        return {"status": "completed", "video_url": video_url, "unique_key": unique_key}
    return {"status": "processing", "unique_key": unique_key}


@app.post("/api/publish")
async def publish(body: PublishRequest):
    """Step 4: Publish the final product to the store."""
    # Fire and forget to n8n description webhook (or a dedicated publish webhook)
    async with httpx.AsyncClient(timeout=30.0) as client:
        await client.post(N8N_DESCRIPTION, json={
            "workflow": "publish",
            "product_name": body.product_name,
            "description": body.description,
            "image_url": body.image_url,
            "video_url": body.video_url,
            "unique_key": body.unique_key,
        })
    return {"status": "published"}


@app.get("/api/proxy/image")
async def proxy_image(url: str):
    """
    Server-side image proxy to bypass Google Drive CORS restrictions.
    Downloads the image and re-serves it with correct headers.
    Also converts to JPEG for video generation compatibility.
    """
    try:
        async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client:
            headers = {"Referer": ""}
            res = await client.get(url, headers=headers)
            res.raise_for_status()
            content_type = res.headers.get("content-type", "image/jpeg")
            image_bytes = res.content

        # Use Pillow to normalize format to JPEG
        try:
            from PIL import Image
            img = Image.open(BytesIO(image_bytes)).convert("RGB")
            buf = BytesIO()
            img.save(buf, format="JPEG", quality=90)
            image_bytes = buf.getvalue()
            content_type = "image/jpeg"
        except Exception:
            pass  # Return raw bytes if Pillow fails

        return Response(content=image_bytes, media_type=content_type, headers={
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, max-age=3600",
        })
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch image: {str(e)}")


@app.get("/api/proxy/image/base64")
async def proxy_image_base64(url: str):
    """
    Returns the image as base64 JPEG — useful for passing to video generation APIs.
    """
    try:
        async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client:
            res = await client.get(url, headers={"Referer": ""})
            res.raise_for_status()

        from PIL import Image
        img = Image.open(BytesIO(res.content)).convert("RGB")
        buf = BytesIO()
        img.save(buf, format="JPEG", quality=90)
        b64 = base64.b64encode(buf.getvalue()).decode("utf-8")

        return {"base64": f"data:image/jpeg;base64,{b64}"}
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
