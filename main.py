from flask import Flask, render_template, request, redirect, url_for
import pandas as pd
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)
UPLOAD_FOLDER = 'sources/uploads'
SOURCE_FOLDER = 'sources'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Load and sanitize inventory data
inventory_path = os.path.join(SOURCE_FOLDER, 'Enterprise_Inventory.csv')
images_path = os.path.join(SOURCE_FOLDER, 'IMAGES.csv')

# Set display option to show full column width
pd.set_option('display.max_colwidth', None)

inventory_df_raw = pd.read_csv(inventory_path)
inventory_df_raw.columns = [col.strip() for col in inventory_df_raw.columns]
inventory_df = inventory_df_raw[['INV No.','UPC', 'ASIN', 'LPN', 'Title', 'Image Link']]

images_df = pd.read_csv(images_path)[['SKU', 'ASIN']]

# Global storage for boxes and scanned items
boxes = {}
input_df = None
upload_error = None

@app.route('/', methods=['GET', 'POST'])
def index():
    global input_df, upload_error
    return render_template('index.html', 
                           input_df=input_df, 
                           boxes=boxes,
                           inventory_df=inventory_df,
                           upload_error=upload_error)

@app.route('/inventory')
def inventory():
    inventory_path = os.path.join(SOURCE_FOLDER, 'Enterprise_Inventory.csv')
    df = pd.read_csv(inventory_path)
    df.columns = [col.strip() for col in df.columns]
    df['Image Link'] = df['Image Link'].fillna('').astype(str).str.strip()
    
    # Convert DataFrame to a list of dictionaries
    inventory_records = df.to_dict(orient='records')
    print(inventory_records[:3])  # Debugging output
    return render_template('inventory.html', inventory_records=inventory_records)


@app.route('/upload', methods=['POST'])
def upload():
    global input_df, upload_error
    upload_error = None
    file = request.files.get('input_csv')
    if not file or file.filename == '':
        upload_error = 'No file selected.'
        input_df = None
        return redirect(url_for('index'))

    filename = secure_filename(file.filename)
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)

    try:
        df = pd.read_csv(filepath)
        df.columns = [col.strip() for col in df.columns]  # Normalize column headers

        if 'Merchant SKU' not in df.columns or 'Quantity' not in df.columns:
            upload_error = "CSV must contain 'Merchant SKU' and 'Quantity' columns."
            input_df = None
        else:
            # Rename Merchant SKU to Product Barcode
            df.rename(columns={'Merchant SKU': 'Product Barcode'}, inplace=True)

            # Clean and match to inventory or images
            def extract_key(value):
                if pd.isna(value):
                    return ''
                parts = str(value).split('-')
                if len(parts) >= 3:
                    return '-'.join(parts[2:])
                elif len(parts) == 2:
                    return parts[1]
                else:
                    return value.replace('-', '')

            def find_asin(cleaned, original):
                match_inventory = inventory_df[(inventory_df['UPC'] == cleaned) |
                                               (inventory_df['ASIN'] == cleaned) |
                                               (inventory_df['LPN'] == cleaned)]
                if not match_inventory.empty:
                    asin = match_inventory.iloc[0]['ASIN']
                    print(f"[Inventory] Original: {original} → Cleaned: {cleaned} → Matched ASIN: {asin}")
                    return asin

                match_images = images_df[images_df['SKU'] == cleaned]
                if not match_images.empty:
                    asin = match_images.iloc[0]['ASIN']
                    print(f"[Images] Original: {original} → Cleaned: {cleaned} → Matched ASIN: {asin}")
                    return asin

                print(f"[No Match] Original: {original} → Cleaned: {cleaned}")
                return 'N/A'

            sticker_skus = []
            for value in df['Product Barcode']:
                cleaned = extract_key(value)
                asin = find_asin(cleaned, value)
                sticker_skus.append(asin)

            df['Sticker SKU'] = sticker_skus
            df = df[['Sticker SKU', 'Product Barcode', 'Quantity']]
            input_df = df

    except Exception as e:
        upload_error = f"File upload failed: {str(e)}"
        input_df = None

    return redirect(url_for('index'))

@app.route('/add_box', methods=['POST'])
def add_box():
    box_number = len(boxes) + 1
    box_key = f"Box No. {box_number}"
    boxes[box_key] = {}
    return redirect(url_for('index'))

@app.route('/scan', methods=['POST'])
def scan():
    box = request.form['box']
    sku = request.form['sku'].strip()

    if box in boxes:
        box_items = boxes[box]
        if sku in box_items:
            box_items[sku] += 1
        else:
            box_items[sku] = 1
    return redirect(url_for('index'))

if __name__ == '__main__':
    app.run(debug=True)
