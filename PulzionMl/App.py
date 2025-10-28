import requests

API_KEY = "5d4f2e276bf24a6f8b89f8a823948485"
topic = "artificial intelligence"

url = f"https://newsapi.org/v2/everything?q={topic}&sortBy=popularity&language=en&apiKey={API_KEY}"

response = requests.get(url)
data = response.json()

if data.get("status") == "ok":
    for i, article in enumerate(data["articles"], 1):
        print(f"\n{i}. {article['title']}")
        print(article['description'])
        print(article['url'])
else:
    print("Error:", data.get("message"))
