import pandas as pd
import json
import os

file_path = "GRILLE_BAC1_G.C_ 2023_ PREMIERE SESSION (1).xlsx"
output_file = "students_results.json"
# ON CHANGE L'ONGLET POUR CELUI QUE VOUS VOYEZ : "EN ORDRE PREMIERE SESSION"
sheet_name = "EN ORDRE PREMIERE SESSION"

try:
    print(f"Chargement de l'onglet : {sheet_name}...")
    raw_df = pd.read_excel(file_path, sheet_name=sheet_name)
    
    # En-têtes à la ligne index 1
    courses_headers = raw_df.iloc[1]
    
    results = []
    
    # Les données d'étudiants commencent à la ligne index 3
    data_df = raw_df.iloc[3:]
    
    for index, row in data_df.iterrows():
        name = str(row.iloc[1])
        if name == "nan" or name == "None" or "NOMS" in name or len(name) < 3:
            continue
            
        student_grades = []
        
        # On parcourt les colonnes de cours (index 2 à 31)
        for col_idx in range(2, 32):
            course_name = str(courses_headers.iloc[col_idx])
            score = row.iloc[col_idx]
            
            if course_name != "nan" and isinstance(score, (int, float)):
                student_grades.append({
                    "course": course_name,
                    "code": f"UE{col_idx}",
                    "score": float(score) if pd.notnull(score) else 0.0,
                    "result": "Réussi" if score >= 10 else "Ajourné",
                    "session": "1ère",
                    "date": "2023"
                })
        
        # On ajoute aussi le résumé final
        credits = row.iloc[32]
        decision = str(row.iloc[33])
        
        student_data = {
            "name": name.strip(),
            "matricule": f"2023-{1000 + index}",
            "faculty": "Informatique (BAC 1)",
            "level": "L1 Bachelier",
            "source": os.path.basename(file_path),
            "grades": student_grades
        }
        results.append(student_data)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=4, ensure_ascii=False)
        
    print(f"Succès ! {len(results)} étudiants exportés depuis '{sheet_name}'.")

except Exception as e:
    print(f"Erreur lors de l'exportation : {e}")
