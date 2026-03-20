import pandas as pd
import json

file_path = "GRILLE_BAC1_G.C_ 2023_ PREMIERE SESSION (1).xlsx"

try:
    # Load the excel file
    xl = pd.ExcelFile(file_path)
    print(f"Sheets: {xl.sheet_names}")
    
    # Let's read the first sheet
    df = xl.parse(xl.sheet_names[0])
    
    # Show first 10 rows to understand the structure
    print(df.head(20))
    
except Exception as e:
    print(f"Error: {e}")
