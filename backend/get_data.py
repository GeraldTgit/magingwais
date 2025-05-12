import requests
from bs4 import BeautifulSoup
import pandas as pd
import urllib3
import re

# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# URL of the e-Presyo page
url = 'https://epresyo.dti.gov.ph/prevailingpricereport/'

def clean_price(price_str):
    """Clean price string and convert to float"""
    if pd.isna(price_str) or price_str == '':
        return None
    # Remove currency symbol, commas, and convert to float
    return float(re.sub(r'[^\d.]', '', str(price_str)))

def extract_specifications(product_name):
    """Extract specifications from product name"""
    # Common specifications to look for
    specs = []
    
    # Look for size/weight specifications
    size_pattern = r'\d+(?:\.\d+)?\s*(?:g|kg|ml|l|oz|lb)'
    size_match = re.search(size_pattern, product_name, re.IGNORECASE)
    if size_match:
        specs.append(size_match.group())
    
    # Look for pack size
    pack_pattern = r'\d+\s*(?:pcs|pieces|pack|packs|sachet|sachets)'
    pack_match = re.search(pack_pattern, product_name, re.IGNORECASE)
    if pack_match:
        specs.append(pack_match.group())
    
    return ' '.join(specs) if specs else ''

try:
    # Send a GET request to the URL with SSL verification disabled
    response = requests.get(url, verify=False)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, 'html.parser')

    # Find the table containing the data
    table = soup.find('table')
    
    if table:
        # Extract table headers
        headers = [header.text.strip() for header in table.find_all('th')]

        # Extract table rows
        rows = []
        for row in table.find_all('tr')[1:]:  # Skip header row
            cells = row.find_all('td')
            if len(cells) > 0:
                row_data = [cell.text.strip() for cell in cells]
                rows.append(row_data)

        # Create a DataFrame
        df = pd.DataFrame(rows, columns=headers)
        
        # Create new structured DataFrame
        structured_data = []
        
        for _, row in df.iterrows():
            product_name = row['Product Name'].strip()
            if not product_name:  # Skip empty product names
                continue
                
            srp = clean_price(row['SRP'])
            if srp == 0:  # Skip items with 0 SRP
                continue
            
            # Extract specifications from product name
            specifications = extract_specifications(product_name)
            
            # Create structured item
            item = {
                'name': product_name,
                'description': '',  # Left blank as requested
                'specification': specifications,
                'srp': srp,
                'added_by': 'Admin'  # Add default value
            }
            structured_data.append(item)
        
        # Create new DataFrame with structured data
        structured_df = pd.DataFrame(structured_data)
        
        # Print statistics
        print(f"\nTotal number of items processed: {len(structured_df)}")
        print("\n=== Sample of 10 Items from e-Presyo ===\n")
        
        # Get 10 diverse samples
        samples = structured_df.sample(n=10, random_state=42)
        
        # Format the samples for display
        for i, (_, item) in enumerate(samples.iterrows(), 1):
            print(f"Item #{i}")
            print(f"Name: {item['name']}")
            print(f"SRP: ₱{item['srp']:.2f}")
            if item['specification']:
                print(f"Specification: {item['specification']}")
            print(f"Added by: {item['added_by']}")
            print("-" * 50)
        
        # Save to CSV
        structured_df.to_csv('structured_items.csv', index=False)
        print("\nStructured data has been saved to 'structured_items.csv'")
        
        # Print some statistics about the data
        print("\nData Statistics:")
        print(f"Items with specifications: {structured_df['specification'].notna().sum()}")
        print(f"Items with SRP: {structured_df['srp'].notna().sum()}")
        
    else:
        print("No table found on the webpage")

except requests.exceptions.RequestException as e:
    print(f"Error fetching the webpage: {e}")
except Exception as e:
    print(f"An error occurred: {e}")
