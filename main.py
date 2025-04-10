from flask import Flask, render_template, request, redirect, url_for
import pandas as pd
import os
import re
from werkzeug.utils import secure_filename

app = Flask(__name__)
UPLOAD_FOLDER = 'sources/uploads'
SOURCE_FOLDER = 'sources'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ── Pandas display option ─────────────────────────────────────────────────────
pd.set_option('display.max_colwidth', None)

# ── Load reference data once ─────────────────────────────────────────────────

def _load_inventory():
    path = os.path.join(SOURCE_FOLDER, 'Enterprise_Inventory.csv')
    df = pd.read_csv(path, dtype=str).fillna('')
    df.columns = [c.strip() for c in df.columns]
    return df[['INV No.', 'UPC', 'ASIN', 'LPN', 'Title', 'Image Link']]

def _load_images():
    path = os.path.join(SOURCE_FOLDER, 'IMAGES.csv')
    df = pd.read_csv(path, dtype=str)[['SKU', 'ASIN']].fillna('')
    df['SKU'] = df['SKU'].str.upper().str.strip()
    return df

inventory_df = _load_inventory()
images_df    = _load_images()

# ── Helper functions ─────────────────────────────────────────────────────────-

def _clean_sku(raw: str) -> str:
    if pd.isna(raw):
        return ''
    value = str(raw).strip()
    parts = value.split('-')
    if len(parts) >= 3:
        key = '-'.join(parts[2:])
    elif len(parts) == 2:
        key = parts[1]
    else:
        key = value.replace('-', '')
    return key.upper().strip()


def _match_exact(cleaned_no_dash: str):
    return inventory_df[
        (inventory_df['UPC'].str.replace('-', '', regex=False).str.upper() == cleaned_no_dash) |
        (inventory_df['ASIN'].str.replace('-', '', regex=False).str.upper() == cleaned_no_dash) |
        (inventory_df['LPN'].str.replace('-', '', regex=False).str.upper() == cleaned_no_dash)
    ]


def _match_partial(cleaned_no_dash: str):
    return inventory_df[
        inventory_df['UPC'].str.replace('-', '', regex=False).str.upper().str.contains(cleaned_no_dash, na=False) |
        inventory_df['LPN'].str.replace('-', '', regex=False).str.upper().str.contains(cleaned_no_dash, na=False)
    ]


def find_asin(cleaned: str, original: str) -> str:
    cleaned_no_dash = cleaned.replace('-', '')
    exact = _match_exact(cleaned_no_dash)
    if not exact.empty:
        asin = exact.iloc[0]['ASIN']
        print(f"[Inventory‑Exact] Original: {original} → Cleaned: {cleaned} → ASIN: {asin}")
        return asin if asin else 'N/A'
    partial = _match_partial(cleaned_no_dash)
    if not partial.empty:
        asin = partial.iloc[0]['ASIN']
        print(f"[Inventory‑Partial] Original: {original} → Cleaned: {cleaned} → ASIN: {asin}")
        return asin if asin else 'N/A'
    img = images_df[images_df['SKU'] == cleaned.upper()]
    if not img.empty:
        asin = img.iloc[0]['ASIN']
        print(f"[Images] Original: {original} → Cleaned: {cleaned} → ASIN: {asin}")
        return asin if asin else 'N/A'
    print(f"[No Match] Original: {original} → Cleaned: {cleaned}")
    return 'N/A'

# ── Global state ─────────────────────────────────────────────────────────────
boxes = {}
input_df = None            # DataFrame of uploaded CSV
upload_error = None

# ── Routes ────────────────────────────────────────────────────────────────────

@app.route('/', methods=['GET', 'POST'])
def index():
    global input_df, upload_error
    input_records = input_df.to_dict(orient='records') if input_df is not None else None
    return render_template(
        'index.html',
        input_df=input_df,            # still available if template needs it
        input_records=input_records,  # preferred for iteration in Jinja
        boxes=boxes,
        inventory_df=inventory_df,
        upload_error=upload_error
    )


@app.route('/inventory')
def inventory():
    # fresh copy for UI display only
    df = _load_inventory()
    inventory_records = df.to_dict(orient='records')
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
        df = pd.read_csv(filepath, dtype=str).fillna('')
        col_map = {c.lower().strip().replace('\u00a0', ' '): c for c in df.columns}
        if 'merchant sku' not in col_map or 'quantity' not in col_map:
            upload_error = "CSV must contain 'Merchant SKU' and 'Quantity' columns (case‑insensitive)."
            input_df = None
        else:
            df.rename(columns={
                col_map['merchant sku']: 'Product Barcode',
                col_map['quantity']: 'Quantity'
            }, inplace=True)
            sticker_skus = []
            for value in df['Product Barcode']:
                cleaned = _clean_sku(value)
                asin = find_asin(cleaned, value)
                sticker_skus.append(str(asin) if asin else 'N/A')
            df['Sticker SKU'] = sticker_skus
            input_df = df[['Sticker SKU', 'Product Barcode', 'Quantity']]
            print("[DEBUG] Uploaded CSV after ASIN match:\n", input_df.head())
    except Exception as e:
        upload_error = f"File upload failed: {str(e)}"
        input_df = None
    return redirect(url_for('index'))


@app.route('/add_box', methods=['POST'])
def add_box():
    box_number = len(boxes) + 1
    boxes[f"Box No. {box_number}"] = {}
    return redirect(url_for('index'))


@app.route('/scan', methods=['POST'])
def scan():
    box = request.form['box']
    sku = request.form['sku'].strip()
    if box in boxes:
        boxes[box][sku] = boxes[box].get(sku, 0) + 1
    return redirect(url_for('index'))


if __name__ == '__main__':
    app.run(debug=True)