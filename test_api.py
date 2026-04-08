import asyncio
import httpx

async def run():
    async with httpx.AsyncClient() as client:
        res = await client.post("http://localhost:8000/api/generate/description", json={
            "product_name": "Test Product",
            "description": "Test Description"
        })
        print(res.status_code)
        if res.status_code != 200:
            print(res.text)

asyncio.run(run())
