import urllib.request
import urllib.parse
import json
import re

def test_search_engine(query):
    snippets = []
    sources = []

    # DuckDuckGo HTML Engine
    search_url = f"https://html.duckduckgo.com/html/?q={urllib.parse.quote(query)}"
    try:
        req = urllib.request.Request(search_url, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9,it;q=0.8"
        })
        with urllib.request.urlopen(req) as res:
            html = res.read().decode("utf-8")
            snippet_matches = re.findall(r'<a class="result__snippet[^>]*>(.*?)</a>', html, re.DOTALL)
            url_matches = re.findall(r'<a class="result__url[^>]*>(.*?)</a>', html, re.DOTALL)
            
            for i in range(min(5, len(snippet_matches))):
                clean_snippet = re.sub(r'<[^>]+>', '', snippet_matches[i]).strip()
                clean_url = re.sub(r'<[^>]+>', '', url_matches[i]).strip() if i < len(url_matches) else ""
                if clean_snippet:
                    snippets.append(f"[Source {i+1} ({clean_url})]: {clean_snippet}")
                    sources.append(clean_url)
    except Exception as e:
        print(f"DDG Error: {e}")

    return "\n\n".join(snippets), sources

snips, srcs = test_search_engine('camping mare blu location')
print("SNIPPETS FOR 'camping mare blu location':\n")
print(snips)
