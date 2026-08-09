try:
    from ddgs import DDGS
except ImportError:
    from duckduckgo_search import DDGS

import trafilatura

def web_search(query: str) -> str:
    """Executes a free web search using DuckDuckGo (DDGS)."""
    try:
        results = DDGS().text(query, max_results=5) 
        
        search_results = []
        for item in results:
            search_results.append(
                f"Title: {item.get('title')}\n"
                f"Snippet: {item.get('body')}\n"
                f"Link: {item.get('href')}"
            )
            
        return "\n\n".join(search_results) if search_results else "No results found."
        
    except Exception as e:
        return f"Search failed: {str(e)}"

def read_webpage(url: str) -> str:
    """Fetches a webpage and extracts ONLY the main article text, ignoring menus and sidebars."""
    try:
        downloaded = trafilatura.fetch_url(url)
        
        if not downloaded:
            return f"Failed to download webpage at {url}. The site might be blocking bots."
            
        text = trafilatura.extract(
            downloaded, 
            include_links=False, 
            include_images=False, 
            include_tables=False
        )
        
        if text:
            return text[:10000] 
        else:
            return "Successfully loaded page, but could not find main article text."
            
    except Exception as e:
        return f"Error reading webpage {url}: {str(e)}"

if __name__ == "__main__":
    print("=== TESTING WEB SEARCH ===")
    search_output = web_search("camping mare blu fano")
    print(search_output)
    print("\n=== TESTING READ WEBPAGE ===")
    page_output = read_webpage("https://www.campingmareblu.net/")
    print(page_output[:500] + "...\n[Truncated]")
