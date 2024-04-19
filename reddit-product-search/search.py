import multiprocessing.queues
import requests
import re
import time
import json
import multiprocessing
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities
from product_from_flask import get_product_data
from openai import OpenAI


# OpenAI relevance evaluation
client = OpenAI()


def evaluate_relevance(comment):
    response = client.chat.completions.create(model="gpt-3.5-turbo-0125", messages=[
        {"role": "user",
         "content": "Respond with 'Y' for yes or 'N' for no: whether the following comment provides a relevant opinion about the specific product, " + shortened + ", that other buyers may want to hear. \n\nComment: " + comment,}
    ])
    output = response.choices[0].message.content.strip().lower()[0]
    if output == 'y':
        print("Relevant comment: " + comment)
        return True
    elif output == 'n':
        print("Irrelevant comment: " + comment)
        return False
    else:
        print("Unknown output: " + output + "\nWill be returned as relevant")
        return True


# Reddit post parsing logic
def parse(session_id, driver, reddit_url, assist_queue, l):
    clean_url = re.sub(r'&sa.*', '', reddit_url)


    print(f'Session {session_id}: Starting parsing of '+clean_url)


    # Obtaining the post HTML
    driver.get(clean_url)
    driver.implicitly_wait(0.1)
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
        return
    post_content = soup.find('div', {'id': re.compile(r'^t3_.+-post-rtjson-content$')})
    post_content = post_content.get_text().strip() if post_content else None


    ## Forming comment dictionary
    comment_elems = soup.find_all('shreddit-comment', {'author': re.compile(r"^.+$")})
    commenters = []
    comments = {}
    if comment_elems:
        for tag in comment_elems:
            if tag['author'] == "[deleted]": continue
            content = soup.find('div', {'id': tag['thingid']+"-comment-rtjson-content"}).get_text().strip()
            if evaluate_relevance(content) == False: continue
            comments[tag['author']] = {
                "Comment ID": tag['thingid'],
                "Parent ID": tag.get('parentid', None),
                "Content": content,
                "Score": tag['score'],
            }
    users = list(set(commenters)).append(author)


    # Gathering authenticity metrics. Reddit API may prove to be more useful here later on
    for user in users:
        assist_queue.put((user, session_id))


    while True:
        try:
            user = assist_queue.get(block=False)[0]
            parse_user(user, driver, l, session_id)
        except multiprocessing.queues.Empty:
            break


    # TODO : Add authenticity scores
    post_details = {
        'Link': clean_url,
        'Title': post_title,
        'Content': post_content,
        'Opinion': evaluate_relevance(content),
        'Author': author,
        'Comments': comments,
        'Authenticity Metrics': l[session_id],
    }


    print(f'Session {session_id}: Finished parsing')


    with open(f'output_{session_id}.json', 'w') as file:
        json.dump(post_details, file)


# Parsing logic for gathering authenticity metrics
def parse_user(user, driver, l, id):
    # Get URL string
    user_url = "https://reddit.com/user/"+user+"/"
    print("Getting authenticity from user URL: "+user_url) # ? - This is printing multiple times for a single user
   
    # Driver actions
    driver.implicitly_wait(0.1)
    html = driver.page_source


    # Scrape and return
    soup = BeautifulSoup(html, 'html.parser')
    if soup.find('shreddit-forbidden', {'reason': '"BANNED"'}): return None
    l[id][user] = {
        "Total Karma": sum([int(tag.get_text().strip().replace(",", "")) for tag in soup.find_all('span', {'data-testid': 'karma-number'})]),
        "Cake Day": soup.find('time', {'data-testid': 'cake-day'})['datetime'],
        "Bio": True if soup.find('p', {'data-testid': 'profile-description'}) else False,
        #"Communities Moderating": len(soup.find('ul', {'class': 'pl-0 my-0'}).contents), TODO: Fix this
        "Trophy Count": len(soup.find('ul', {'slot': 'initial-trophies'}).contents),
    }


def session(id, url_queue, assist_queue, l):
    # Configure a remote WebDriver
    options = webdriver.ChromeOptions()
    user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.150 Safari/537.36" #TODO: fake user agent string
    options.add_argument(f'user-agent={user_agent}')
    options.add_argument("--headless")
    options.add_argument("--disable-gpu")
    driver = webdriver.Remote(
        command_executor='http://localhost:4444/wd/hub',
        options=options
    )


    # Logic for prioritizing queues.
    while True:
        try:
            user, id = assist_queue.get(block=False)
            parse_user(user, driver, l, id)
        except multiprocessing.queues.Empty:
            url = url_queue.get()
            if url is None:
                driver.quit()
                break
            parse(id, driver, url, assist_queue, l)
       
       
def run_parallel_parsing(urls, processes):
    url_queue = multiprocessing.Queue()
    assist_queue = multiprocessing.Queue()
    manager = multiprocessing.Manager()


    # Initializing process queue, assist list, and session processes
    l = manager.list([{} for _ in range(10)])
    for url in urls:
        url_queue.put(url)
    sessions = []
    for id in range(processes):
        # Start driver process
        process = multiprocessing.Process(target=session, args=(id, url_queue, assist_queue, l))
        process.start()
        sessions.append(process)


    # Signals for the sessions to stop
    for _ in range(processes):
        url_queue.put(None)


    # Wait for all processes to finish
    for s in sessions:
        s.join()


def merge_output_files(num_files):
    # Collect individual JSON files
    output_files = ['output_'+str(i)+'.json' for i in range(num_files)]


    # Merge JSON objects
    merged_output = []
    for file_name in output_files:
        with open(file_name, 'r') as file:
            output_data = json.load(file)
            merged_output.append(output_data)


    # Write the merged JSON to a single output file
    with open('merged_output.json', 'w') as file:
        json.dump(merged_output, file, indent=2)


if __name__ == '__main__':
    start = time.time()


    # TODO: Interface the product name with an LLM for a shortened search term for Google
    # product_name = get_product_data()
    # print(f"Product Name: {product_name}")


    shortened = '"nike reax"'
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


    # Multiprocessing
    processes = 3
    run_parallel_parsing(reddit_urls, processes)


    # Final touches
    merge_output_files(processes)
    end = time.time()
    print(f"Execution time: {end - start} seconds")


   

