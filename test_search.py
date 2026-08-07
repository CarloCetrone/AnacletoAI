import urllib.request
import urllib.parse
import json

def test_web_search(query):
    snippets = []

    # 1. Wikipedia API Search (Italian + English)
    wiki_url = f"https://it.wikipedia.org/w/api.php?action=query&list=search&srsearch={urllib.parse.quote(query)}&format=json&origin=*"
    try:
        req = urllib.request.Request(wiki_url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req) as res:
            data = json.loads(res.read().decode("utf-8"))
            results = data.get("query", {}).get("search", [])
            for r in results[:2]:
                title = r.get("title")
                snippet = r.get("snippet", "").replace('<span class="searchmatch">', '').replace('</span>', '')
                snippets.append(f"[Wikipedia: {title}]: {snippet}")
    except Exception as e:
        print(f"Wiki Search Error: {e}")

    # 2. DuckDuckGo Lite HTML Search
    ddg_url = "https://html.duckduckgo.com/html/?q=" + urllib.parse.quote(query)
    try:
        req = urllib.request.Request(ddg_url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
        with urllib.request.urlopen(req) as res:
            html = res.read().decode("utf-8")
            import re
            matches = re.findall(r'<a class="result__snippet[^>]*>(.*?)</a>', html, re.DOTALL)
            for m in matches[:3]:
                clean = re.sub(r'<[^>]+>', '', m).strip()
                if clean:
                    snippets.append(f"[DuckDuckGo]: {clean}")
    except Exception as e:
        print(f"DuckDuckGo Search Error: {e}")

    return "\n\n".join(snippets)

print("--- TESTING SEARCH FUNCTIONALITY FOR 'Marotta Fano' ---")
res1 = test_web_search("Marotta Fano")
print(res1)

print("\n--- TESTING SEARCH FUNCTIONALITY FOR 'DeepSeek V4' ---")
res2 = test_web_search("DeepSeek V4")
print(res2)
