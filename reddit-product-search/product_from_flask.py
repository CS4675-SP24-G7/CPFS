import requests
import time

FLASK_API_URL = "https://runner-fnlb5t2uiq-ue.a.run.app"
AMAZON_PRODUCT_URL = "https://www.amazon.com/Skytech-Gaming-Nebula-PC-Desktop/dp/B0C9PNZJCF/ref=cm_cr_arp_d_product_top?ie=UTF8"

# Gather ISBN for subsequent get request
def get_isbn_from_reviews():
    response = requests.get(f"{FLASK_API_URL}/get_reviews", params={'url': AMAZON_PRODUCT_URL})
    if response.status_code == 200:
        return response.json().get('ISBN')
    else:
        print(f"Error with gathering ISBN: {response.text}")
        return None

# Obtain the product name
def get_product_name(isbn):
    while True:
        response = requests.get(f"{FLASK_API_URL}/get_data", params={'isbn': isbn})
        if response.status_code == 200:
            data = response.json()
            if 'error' not in data:
                return data
            elif data['error'] == 'Data extraction in progress':
                print("Data extraction in progress.")
                time.sleep(10)  # Wait a bit before polling again
            else:
                print(f"Error: {data['error']}")
                return None
        else:
            print(f"Error fetching product data: {response.text}")
            return None

# Start the process
def get_product_data():
    isbn = get_isbn_from_reviews()
    if isbn:
        product_data = get_product_name(isbn)
        if product_data:
            product_name = product_data.get('product_name')
            return product_name
    return None