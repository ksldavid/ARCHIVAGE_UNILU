import json
with open('students_results.json', encoding='utf-8') as f:
    d = json.load(f)

print("Premier étudiant:", d[0]['name'])
print("Stats:", d[0].get('stats'))
print("Premiers cours:")
for g in d[0]['grades'][:8]:
    print(f"  code={g['code']} | cours={g['course'][:45]}")
