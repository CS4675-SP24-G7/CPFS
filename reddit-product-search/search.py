import requests
import re
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from product_from_flask import get_product_data

# TODO: Interface the product name with an LLM for a shortened search term for Google
# product_name = get_product_data()
# print(f"Product Name: {product_name}")

shortened = '"nike reax"' # Need to replace this with the LLM response
shortened = shortened.replace(" ", "+")

# Forming Google Dorks queries
search_query = "site%3Areddit.com+" + shortened
url = f"https://www.google.com/search?q={search_query}"
r = requests.get(url)

# Gathering URLs from the search
soup = BeautifulSoup(r.text, "html.parser")
reddit_urls = []
for link in soup.select("div.egMi0.kCrYT a"):
    reddit_urls.append(link["href"].replace('/url?q=', ''))

# Setting up Selenium web driver
options = Options()
user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.150 Safari/537.36"
options.add_argument(f'user-agent={user_agent}')
options.add_argument("--headless")
options.add_argument("--disable-gpu")
driver = webdriver.Chrome(options=options)

# Method for gathering authenticity metrics
def get_authenticity(user):
    driver = webdriver.Chrome(options=options)
    print("Getting authenticity of user: "+user) # ? - This is printing multiple times for a single user
    driver.get("https://www.reddit.com/user/"+user+"/")
    driver.implicitly_wait(1)
    html = driver.page_source
    soup = BeautifulSoup(html, 'html.parser')
    if soup.find('shreddit-forbidden', {'reason': '"BANNED"'}): return None
    return {
        "Total Karma": sum([int(tag.get_text().strip().replace(",", "")) for tag in soup.find_all('span', {'data-testid': 'karma-number'})]),
        "Cake Day": soup.find('time', {'data-testid': 'cake-day'})['datetime'],
        "Bio": True if soup.find('p', {'data-testid': 'profile-description'}) else False,
        #"Communities Moderating": len(soup.find('ul', {'class': 'pl-0 my-0'}).contents), TODO: Fix this
        "Trophy Count": len(soup.find('ul', {'slot': 'initial-trophies'}).contents),
    }

# Gathering data from the Reddit pages
for reddit_url in reddit_urls:
    clean_url = re.sub(r'&sa.*', '', reddit_url)
    print("Starting parsing of "+clean_url)

    # Obtaining the post HTML
    driver.get(clean_url)
    driver.implicitly_wait(1)
    reddit_response = driver.page_source

    # Soup parsing
    soup = BeautifulSoup(reddit_response, 'html.parser')
    
    ## Setting post information
    post_title = soup.find('h1', {'id': re.compile(r'^post-title-t3_.*$')})
    post_title = post_title.get_text().strip() if post_title else None
    author = soup.find('shreddit-post-overflow-menu', {'author-name': re.compile(r'^.+$')})
    author = author.get('author-name', None)
    if not post_title or not author:
        print(f'Post or author not found at URL: {clean_url}')
        continue
    post_content = soup.find('div', {'id': re.compile(r'^t3_.+-post-rtjson-content$')})
    post_content = post_content.get_text().strip() if post_content else None

    ## Forming comment dictionary
    comment_elems = soup.find_all('shreddit-comment', {'author': re.compile(r"^.+$")})
    commenters = []
    comments = {}
    if comment_elems: 
        for tag in comment_elems:
            if tag['author'] == "[deleted]": continue
            comments[tag['author']] = {
                "Comment ID": tag['thingid'],
                "Parent ID": tag.get('parentid', None),
                "Content": soup.find('div', {'id': re.compile("^"+tag['thingid']+"-comment-rtjson-content$")}).get_text().strip(), # Bug here
                "Score": tag['score'],
            }
    commenters = list(set(commenters))

    # TODO: Use an LLM to filter out irrelevant posts and comments. Current plan is to assign a relevance boolean to the post or comments

    # Gathering authenticity metrics. Reddit API may prove to be more useful here later on
    authenticity = {}
    authenticity[author] = get_authenticity(author)
    for commenter in comments.keys():
        print(f'Commenter: {commenter}')
        authenticity[commenter] = get_authenticity(commenter)

    # TODO : Add authenticity scores
    post_details = {
        'Link': clean_url,
        'Title': post_title,
        'Content': post_content,
        'Author': author,
        'Comments': comments,
        'Authenticity Metrics': authenticity,
    }
    print()
    print(post_details.items())
    print("\nPost by "+author+" finished parsing")
    
driver.quit()