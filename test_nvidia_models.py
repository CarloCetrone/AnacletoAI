import urllib.request
import json
import time

api_key = "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"

# Testing GLM 5.2, MiniMax M3, OpenAI 120B, DeepSeek Flash, and Llama 3.1 70B
target_models = [
    "z-ai/glm-5.2",
    "minimaxai/minimax-m3",
    "openai/gpt-oss-120b",
    "deepseek-ai/deepseek-v4-flash",
    "meta/llama-3.1-70b-instruct",
    "mistralai/mistral-large-2-instruct",
    "nvidia/llama-3.1-nemotron-70b-instruct"
]

print("--- Testing GLM 5.2, MiniMax M3, OpenAI GPT 120B & NVIDIA Models ---")
working_models = []

for model in target_models:
    req_data = json.dumps({
        "model": model,
        "messages": [{"role": "user", "content": "Hi"}],
        "max_tokens": 15,
        "temperature": 0.5
    }).encode("utf-8")

    req = urllib.request.Request(
        "https://integrate.api.nvidia.com/v1/chat/completions",
        data=req_data,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    )

    start_time = time.time()
    try:
        with urllib.request.urlopen(req) as response:
            latency = int((time.time() - start_time) * 1000)
            res_body = json.loads(response.read().decode("utf-8"))
            reply = res_body["choices"][0]["message"]["content"].strip()
            print(f"[OK] {latency}ms -> {model}")
            working_models.append((model, latency, reply))
    except Exception as e:
        print(f"[FAIL] {model} -> {e}")

print("\n--- Verified Working Models Summary ---")
for m, l, r in sorted(working_models, key=lambda x: x[1]):
    print(f"Model: '{m}' | Latency: {l}ms | Sample: {r[:50]}")
