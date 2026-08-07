import urllib.request
import urllib.parse
import json

def test_tavily_or_ddg_html(query):
    snippets = []
    
    # 1. DuckDuckGo HTML Engine (Real Web Results)
    url = f"https://html.duckduckgo.com/html/?q={urllib.parse.quote(query)}"
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,it;q=0.8"
    })
    
    try:
        with urllib.request.urlopen(req) as res:
            html = res.read().decode("utf-8")
            import re
            # Extract actual result snippet text
            snippets_found = re.findall(r'<a class="result__snippet[^>]*>(.*?)</a>', html, re.DOTALL)
            titles_found = re.findall(r'<a class="result__url[^>]*>(.*?)</a>', html, re.DOTALL)
            
            for i in range(min(4, len(snippets_found))):
                clean_text = re.sub(r'<[^>]+>', '', snippets_found[i]).strip()
                clean_url = re.sub(r'<[^>]+>', '', titles_found[i]).strip() if i < len(titles_found) else ""
                snippets.append(f"[Web Result {i+1} ({clean_url})]: {clean_text}")
    except Exception as e:
        print(f"HTML Error: {e}")

    return "\n\n".join(snippets)

print("--- TESTING DDG HTML PARSER FOR 'where is marotta' ---")
print(test_tavily_or_ddg_html("where is marotta"))
