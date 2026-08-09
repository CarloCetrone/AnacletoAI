import json
import sys
import urllib.request

SUPABASE_FUNCTION_URL = "https://zzlptwfqqnjhxtvmebqb.supabase.co/functions/v1/chat"
SUPABASE_ANON_KEY = "sb_publishable_8eu0QBwgFKoECWdlqf4DvQ_mtmVsixc"

def test_chat_streaming(prompt: str, model: str = "anacleto-32b", web_search: bool = False, deep_reasoning: bool = False):
    print("========================================================")
    print(" TESTING REAL-TIME STREAMING CHAT RESPONSE IN TERMINAL")
    print(f" Model: {model} | WebSearch: {web_search} | DeepReasoning: {deep_reasoning}")
    print(f" Prompt: '{prompt}'")
    print("========================================================\n")
    print("[STREAMING OUTPUT]: ", end="", flush=True)

    payload = json.dumps({
        "message": prompt,
        "attachment": "",
        "fileContent": "",
        "webSearch": web_search,
        "deepReasoning": deep_reasoning,
        "model": model,
        "history": []
    }).encode("utf-8")

    req = urllib.request.Request(
        SUPABASE_FUNCTION_URL,
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {SUPABASE_ANON_KEY}"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(req) as response:
            buffer = ""
            for chunk in response:
                line = chunk.decode("utf-8")
                buffer += line
                
                if "\n\n" in buffer:
                    blocks = buffer.split("\n\n")
                    buffer = blocks.pop()
                    
                    for block in blocks:
                        event_type = ""
                        data_str = ""
                        for l in block.split("\n"):
                            if l.startswith("event: "):
                                event_type = l[7:].strip()
                            elif l.startswith("data: "):
                                data_str = l[6:].strip()
                        
                        if data_str:
                            try:
                                data = json.loads(data_str)
                                if event_type == "status":
                                    sys.stdout.write(f"\n[{data.get('message')}]\n")
                                    sys.stdout.flush()
                                elif event_type == "searchSummary":
                                    sys.stdout.write(f"\n[SEARCH SOURCES: {len(data.get('sources', []))}]\n")
                                    sys.stdout.flush()
                                elif event_type == "text" and "chunk" in data:
                                    sys.stdout.write(data["chunk"])
                                    sys.stdout.flush()
                                elif event_type == "done":
                                    sys.stdout.write(f"\n\n[STREAM COMPLETE - Engine: {data.get('model')} | Latency: {data.get('latency')}]\n")
                                    sys.stdout.flush()
                            except Exception:
                                pass

    except Exception as e:
        print(f"\n[STREAM ERROR]: {e}")

if __name__ == "__main__":
    prompt_input = sys.argv[1] if len(sys.argv) > 1 else "Explain recursion in programming in 3 simple bullet points."
    test_chat_streaming(prompt_input, model="anacleto-32b")
