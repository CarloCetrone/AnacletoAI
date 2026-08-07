import urllib.request
import urllib.parse
import json

def test_all_search_apis(query):
    print(f"=== TESTING SEARCH APIS FOR QUERY: '{query}' ===\n")
    
    # Provider A: Wikipedia Search API
    print("--- PROVIDER A: WIKIPEDIA API ---")
    try:
        wiki_url = f"https://it.wikipedia.org/w/api.php?action=query&list=search&srsearch={urllib.parse.quote(query)}&format=json&origin=*"
        req = urllib.request.Request(wiki_url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req) as res:
            data = json.loads(res.read().decode("utf-8"))
            results = data.get("query", {}).get("search", [])
            print(f"Wikipedia Results Count: {len(results)}")
            for r in results[:2]:
                title = r.get("title")
                snippet = r.get("snippet", "").replace('<span class="searchmatch">', '').replace('</span>', '')
                print(f" -> [Wiki]: {title} | {snippet}")
    except Exception as e:
        print(f"Wiki Error: {e}")

    print("\n--- PROVIDER B: DUCKDUCKGO LITE POST ---")
    try:
        url = "https://lite.duckduckgo.com/lite/"
        data = urllib.parse.urlencode({"q": query}).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Content-Type": "application/x-www-form-urlencoded"
        })
        with urllib.request.urlopen(req) as res:
            html = res.read().decode("utf-8")
            import re
            snippets = re.findall(r'<td class="result-snippet">([\s\S]*?)</td>', html)
            print(f"DDG Lite Snippets Count: {len(snippets)}")
            for s in snippets[:3]:
                clean = re.sub(r'<[^>]+>', '', s).strip()
                print(f" -> [DDG Lite]: {clean}")
    except Exception as e:
        print(f"DDG Lite Error: {e}")

    print("\n--- PROVIDER C: DUCKDUCKGO HTML GET ---")
    try:
        url = f"https://html.duckduckgo.com/html/?q={urllib.parse.quote(query)}"
        req = urllib.request.Request(url, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        })
        with urllib.request.urlopen(req) as res:
            html = res.read().decode("utf-8")
            import re
            snippets = re.findall(r'<a class="result__snippet[^>]*>(.*?)</a>', html, re.DOTALL)
            print(f"DDG HTML Snippets Count: {len(snippets)}")
            for s in snippets[:3]:
                clean = re.sub(r'<[^>]+>', '', s).strip()
                print(f" -> [DDG HTML]: {clean}")
    except Exception as e:
        print(f"DDG HTML Error: {e}")

test_all_search_apis("population of senigallia")
