import urllib.request
import json

RUNPOD_API_KEY = "sb_publishable_8eu0QBwgFKoECWdlqf4DvQ_mtmVsixc"  # Check RunPod API directly
RUNPOD_7B_ID = "g1cdki7dv7wb07"

url = f"https://api.runpod.ai/v2/{RUNPOD_7B_ID}/runsync"
payload = {
    "input": {
        "messages": [
            {"role": "system", "content": "You are Anacleto-7B-Turbo."},
            {"role": "user", "content": "hello, what is your name?"}
        ]
    }
}

print(f"Testing direct RunPod API call to endpoint: {RUNPOD_7B_ID}")
try:
    req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers={
        "Content-Type": "application/json"
    })
    with urllib.request.urlopen(req) as res:
        print("Status code:", res.status)
        print("Response body:", res.read().decode("utf-8"))
except Exception as e:
    print("Error:", e)
