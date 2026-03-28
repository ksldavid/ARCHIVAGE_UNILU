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
    
    # En-têtes à la ligne index 1 (noms des cours)
    courses_headers = raw_df.iloc[1]
    # Codes UE à la ligne index 0 (propagé sur le groupe)
    codes_row = raw_df.iloc[0]
    # Propager les codes : si une cellule est vide, elle hérite du dernier code connu
    propagated_codes = []
    last_code = ""
    for val in codes_row:
        if str(val) != "nan":
            last_code = str(val).strip()
        propagated_codes.append(last_code)

    
    results = []
    
    # Les données d'étudiants commencent à la ligne index 3
    data_df = raw_df.iloc[3:]
    
    for index, row in data_df.iterrows():
        name = str(row.iloc[1])
        if name == "nan" or name == "None" or "NOMS" in name or len(name) < 3:
            continue
            
        student_grades = []
        
        # On parcourt les colonnes de cours (index 2 à 31)
        # Et on ajoute maintenant les colonnes de résumé (index 32 à 40)
        for col_idx in range(2, 41):
            course_name = str(courses_headers.iloc[col_idx])
            score = row.iloc[col_idx]
            
            if course_name != "nan":
                # On formate les noms pour qu'ils soient propres
                clean_name = course_name.replace('\n', ' ').strip()
                
                # On filtre : soit c'est un score numérique, soit une décision texte
                if isinstance(score, (int, float)) or (col_idx == 40): # 40 = DECISION
                    student_grades.append({
                        "course": clean_name,
                        "code": propagated_codes[col_idx] if col_idx < len(propagated_codes) else "",
                        "score": float(score) if isinstance(score, (int, float)) and pd.notnull(score) else (score if col_idx == 40 else 0.0),
                        "result": "Information" if col_idx >= 36 else ("Réussi" if score >= 10 else "Ajourné"), # AK=36
                        "session": "1ère",
                        "date": "2023"
                    })
        
        # On ajoute aussi le résumé final dans des propriétés dédiées pour faciliter l'accès UI
        student_data = {
            "name": name.strip(),
            "matricule": f"2023-{1000 + index}",
            "faculty": "Informatique (BAC 1)",
            "level": "L1 Bachelier",
            "source": os.path.basename(file_path),
            "stats": {
                "echecs": int(row.iloc[36]) if pd.notnull(row.iloc[36]) else 0, # AK
                "total": float(row.iloc[37]) if pd.notnull(row.iloc[37]) else 0.0, # AL
                "moyenne": float(row.iloc[38]) if pd.notnull(row.iloc[38]) else 0.0, # AM
                "credits": int(row.iloc[39]) if pd.notnull(row.iloc[39]) else 0, # AN
                "decision": str(row.iloc[40]) # AO
            },
            "grades": student_grades
        }
        results.append(student_data)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=4, ensure_ascii=False)
        
    print(f"Succès ! {len(results)} étudiants exportés avec statistiques complètes.")

except Exception as e:
    print(f"Erreur lors de l'exportation : {e}")
