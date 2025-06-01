import pandas as pd
import json

def xlsx_to_ecg_json(xlsx_path: str, json_path: str) -> None:
    """
    Reads an Excel file with columns 'Sample' and 'Lead_I', renames them to
    'Time' and 'ECG_Lead1', ensures numeric conversion, then writes to JSON.

    - xlsx_path: path to the input .xlsx file
    - json_path: path where the output .json should be saved
    """
    # 1) Read the Excel sheet into a DataFrame
    df = pd.read_excel(xlsx_path, dtype={'Sample': int, 'Lead_I': object})

    # 2) If Lead_I uses comma as decimal separator (e.g., "4,06E+07"), replace comma → dot
    #    and convert to float. Otherwise, pandas will already parse proper floats.
    df['Lead_I'] = (
        df['Lead_I']
        .astype(str)
        .str.replace(',', '.', regex=False)       # "4,06E+07" → "4.06E+07"
        .astype(float)                             # parse scientific notation
    )

    # 3) Rename columns ('Sample' → 'Time', 'Lead_I' → 'ECG_Lead1')
    df = df.rename(columns={'Sample': 'Time', 'Lead_I': 'ECG_Lead1'})

    # 4) Convert each row to a dict and dump to a JSON array
    records = df.to_dict(orient='records')
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(records, f, indent=2)

if __name__ == "__main__":
    # Example usage:
    xlsx_file = "./input2.xlsx"   # replace with your actual .xlsx filename
    json_file = "./output.json"  # desired output .json filename
    xlsx_to_ecg_json(xlsx_file, json_file)
