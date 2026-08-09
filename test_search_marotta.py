import json
import urllib.request
import urllib.parse
import re

try:
    from ddgs import DDGS
except ImportError:
    from duckduckgo_search import DDGS

try:
    import trafilatura
except ImportError:
    trafilatura = None

def test_ddgs_python(query: str):
    """1. Tests DuckDuckGo Search via DDGS Python package."""
    print(f"\n--- [1] DDGS Python Search for: '{query}' ---")
    try:
        results = list(DDGS().text(query, max_results=5))
        for idx, item in enumerate(results, 1):
            print(f"[{idx}] Title: {item.get('title')}")
            print(f"    Link:  {item.get('href')}")
            print(f"    Snippet: {item.get('body')[:150]}...\n")
        return results
    except Exception as e:
        print(f"DDGS Error: {e}")
        return []

def test_edge_function_search_logic(query: str):
    """2. Replicates exact executeWebSearch logic from index.ts."""
    print(f"--- [2] Edge Function Search Logic (index.ts replica) for: '{query}' ---")
    
    clean_query = re.sub(r'\b(location|where is|what is|find|info|search|map|coordinates|details)\b', '', query, flags=re.IGNORECASE)
    clean_query = re.sub(r'[,;:]+', ' ', clean_query).strip()
    
    # Engine 1: DuckDuckGo HTML GET
    print(f"  -> Testing DDG HTML GET with clean query: '{clean_query}'...")
    try:
        formatted_query = urllib.parse.quote(clean_query).replace("%20", "+")
        url = f"https://html.duckduckgo.com/html/?q={formatted_query}"
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7",
                "Referer": "https://html.duckduckgo.com/"
            }
        )
        with urllib.request.urlopen(req) as res:
            html = res.read().decode('utf-8')
            titles = re.findall(r'<a class="result__a[^>]*>([\s\S]*?)</a>', html)
            snippets = re.findall(r'<a class="result__snippet[^>]*>([\s\S]*?)</a>', html)
            links = re.findall(r'href="([^"]*uddg=[^"]*)"', html)
            
            if snippets:
                print(f"  [SUCCESS] Found {len(snippets)} results from DuckDuckGo HTML:")
                for i in range(min(5, len(snippets))):
                    c_title = re.sub(r'<[^>]+>', '', titles[i]).strip() if i < len(titles) else "Result"
                    c_snip = re.sub(r'<[^>]+>', '', snippets[i]).strip()
                    raw_link = links[i] if i < len(links) else ""
                    if "uddg=" in raw_link:
                        raw_link = urllib.parse.unquote(raw_link.split("uddg=")[1].split("&")[0])
                    print(f"  [{i+1}] Title: {c_title}")
                    print(f"      Link:  {raw_link}")
                    print(f"      Snippet: {c_snip[:150]}...\n")
                return
    except Exception as e:
        print(f"  [DDG HTML Failed]: {e}")

    # Engine 2: Wikipedia Search API
    print(f"  -> Testing Wikipedia Search API fallback for: '{clean_query}'...")
    try:
        wiki_url = f"https://it.wikipedia.org/w/api.php?action=query&list=search&srsearch={urllib.parse.quote(clean_query)}&format=json"
        req = urllib.request.Request(wiki_url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req) as res:
            data = json.loads(res.read().decode('utf-8'))
            results = data.get('query', {}).get('search', [])
            print(f"  [SUCCESS] Found {len(results)} Wikipedia results:")
            for i, r in enumerate(results[:3], 1):
                title = r.get('title')
                snippet = re.sub(r'<[^>]+>', '', r.get('snippet')).strip()
                link = f"https://it.wikipedia.org/wiki/{urllib.parse.quote(title)}"
                print(f"  [{i}] Title: {title}")
                print(f"      Link:  {link}")
                print(f"      Snippet: {snippet[:150]}...\n")
    except Exception as e:
        print(f"  [Wikipedia Search Failed]: {e}")

def test_read_webpage_tool(url: str, focus_query: str = ""):
    """3. Tests read_webpage tool extraction and query filtering."""
    print(f"--- [3] Testing read_webpage('{url}', focus_query='{focus_query}') ---")
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req) as res:
            html = res.read().decode('utf-8')
            clean_text = re.sub(r'<script[\s\S]*?</script>', '', html, flags=re.IGNORECASE)
            clean_text = re.sub(r'<style[\s\S]*?</style>', '', clean_text, flags=re.IGNORECASE)
            clean_text = re.sub(r'<[^>]+>', ' ', clean_text)
            clean_text = re.sub(r'\s+', ' ', clean_text).strip()
            print(f"  [Extracted Webpage Text Length]: {len(clean_text)} characters")
            print(f"  [Sample Extract]: {clean_text[:300]}...\n")
    except Exception as e:
        print(f"  [Read Webpage Failed]: {e}")

if __name__ == "__main__":
    query_target = "marotta, marche"
    print("==================================================================")
    print(f"LOCAL WEB SEARCH & WEBPAGE RECAP TEST SCRIPT FOR: '{query_target}'")
    print("==================================================================")
    
    test_ddgs_python(query_target)
    test_edge_function_search_logic(query_target)
    test_read_webpage_tool("https://www.italia.it/en/marche/marotta", "things to do in marotta")
