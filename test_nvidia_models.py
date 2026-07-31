import urllib.request
import json
import time

api_key = "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"

models_to_test = [
    "nvidia/llama-3.1-nemotron-70b-instruct",
    "meta/llama-3.2-3b-instruct",
    "meta/llama-3.2-1b-instruct",
    "mistralai/mistral-large-2407",
    "qwen/qwen2.5-72b-instruct",
    "deepseek-ai/deepseek-r1-distill-llama-70b",
    "google/gemma-2-27b-it"
]

print("--- Round 2: Testing Additional NVIDIA Nim Endpoints ---")
working_models = []

for model in models_to_test:
    req_data = json.dumps({
        "model": model,
        "messages": [{"role": "user", "content": "Hi"}],
        "max_tokens": 10,
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
            working_models.append((model, latency))
    except Exception as e:
        print(f"[FAIL] {model} -> {e}")

print("\n--- Additional Working Models ---")
for m, l in sorted(working_models, key=lambda x: x[1]):
    print(f"'{m}' (Latency: {l}ms)")
