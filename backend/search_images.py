import os
import json
import requests
import time
from dotenv import load_dotenv
import pandas as pd
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase: Client = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_KEY')
)

# Google Custom Search API configuration
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
GOOGLE_CSE_ID = os.getenv('GOOGLE_CSE_ID')
GOOGLE_API_URL = "https://www.googleapis.com/customsearch/v1"
OUTPUT_FILE = 'item_images.csv'

def load_progress():
    """Load previously processed items from CSV file"""
    try:
        if os.path.exists(OUTPUT_FILE):
            df = pd.read_csv(OUTPUT_FILE)
            return {str(row['id']): row['image_url'] for _, row in df.iterrows()}
        return {}
    except Exception as e:
        print(f"Error loading progress file: {str(e)}")
        return {}

def search_google_image(query):
    """Search for an image using Google Custom Search API with rate limiting"""
    params = {
        'key': GOOGLE_API_KEY,
        'cx': GOOGLE_CSE_ID,
        'q': f'{query} product',
        'searchType': 'image',
        'num': 1,
        'safe': 'active',
        'imgSize': 'large',
        'imgType': 'photo'
    }
    
    try:
        # Add delay to respect rate limits (100 queries per day for free tier)
        time.sleep(1)  # 1 second delay between requests
        
        response = requests.get(GOOGLE_API_URL, params=params)
        response.raise_for_status()  # Raise exception for bad status codes
        
        data = response.json()
        if 'items' in data and len(data['items']) > 0:
            return data['items'][0]['link']
        return None
    except requests.exceptions.RequestException as e:
        print(f"Error searching for image: {str(e)}")
        if '429' in str(e):
            print("Search limit reached. Stopping script...")
            return "LIMIT_REACHED"
        return None

def update_item_image(item_id, image_url):
    """Update the item's image_url in the database"""
    try:
        response = supabase.table('items').update({
            'image_url': image_url
        }).eq('id', item_id).execute()
        
        if hasattr(response, 'error') and response.error:
            print(f"Error updating item {item_id}: {response.error}")
            return False
        return True
    except Exception as e:
        print(f"Error updating item {item_id}: {str(e)}")
        return False

def save_progress(results, output_file=OUTPUT_FILE):
    """Save current progress to CSV file"""
    df = pd.DataFrame(results)
    df.to_csv(output_file, index=False)
    print(f"\nProgress saved to {output_file}")
    
    # Print current summary
    total_with_images = len([r for r in results if r['image_url'] and r['image_url'] != 'LIMIT_REACHED'])
    print(f"\nCurrent Progress:")
    print(f"Total items processed: {len(results)}")
    print(f"Items with images found: {total_with_images}")
    print(f"Items without images: {len(results) - total_with_images}")

def main():
    try:
        # Load previously processed items
        processed_items = load_progress()
        print(f"Loaded {len(processed_items)} previously processed items")
        
        # Fetch items from Supabase
        response = supabase.table('items').select('*').execute()
        items = response.data
        
        if not items:
            print("No items found in the database")
            return
        
        # Print the first item to debug the structure
        if items:
            print("First item structure:", json.dumps(items[0], indent=2))
        
        # Create a list to store the results, including previously processed items
        results = [
            {'id': item_id, 'image_url': image_url}
            for item_id, image_url in processed_items.items()
        ]
        
        # Get set of processed item IDs for faster lookup
        processed_ids = set(processed_items.keys())
        
        # Process each item
        total_items = len(items)
        for index, item in enumerate(items, 1):
            # Skip if already processed
            if str(item['id']) in processed_ids:
                print(f"\nSkipping already processed item {index}/{total_items}: {item.get('name')}")
                continue
            
            # Get the name field (it might be 'name' instead of 'item_name')
            item_name = item.get('name') or item.get('item_name')
            
            print(f"\nProcessing item {index}/{total_items}: {item_name}")
            
            # Skip items with empty names
            if not item_name or item_name.strip() == '':
                print("Skipping item with empty name")
                continue
            
            # Search for image
            image_url = search_google_image(item_name)
            
            # Check if we hit the search limit
            if image_url == "LIMIT_REACHED":
                print("\nSearch limit reached. Saving progress and stopping...")
                break
            
            # Update the item in the database
            if image_url:
                success = update_item_image(item['id'], image_url)
                if success:
                    print(f"Updated item with image URL: {image_url}")
                else:
                    print("Failed to update item with image URL")
            
            # Add to results - only ID and image_url
            results.append({
                'id': item['id'],
                'image_url': image_url if image_url else ''
            })
            
            # Print status
            if image_url:
                print(f"Found image URL: {image_url}")
            else:
                print("No image found")
            
            # Save progress after each successful search
            save_progress(results)
        
        # Final save
        save_progress(results)
        
    except Exception as e:
        print(f"An error occurred: {str(e)}")
        # Print the full error traceback for debugging
        import traceback
        print(traceback.format_exc())
        
        # Save progress even if there's an error
        if results:
            save_progress(results)

if __name__ == "__main__":
    if not GOOGLE_API_KEY:
        print("Error: Google API Key not found!")
        print("Please set GOOGLE_API_KEY in your .env file")
    elif not GOOGLE_CSE_ID:
        print("Error: Google Custom Search Engine ID not found!")
        print("Please set GOOGLE_CSE_ID in your .env file")
    elif not os.getenv('SUPABASE_URL') or not os.getenv('SUPABASE_KEY'):
        print("Error: Supabase credentials not found!")
        print("Please set SUPABASE_URL and SUPABASE_KEY in your .env file")
    else:
        main() 