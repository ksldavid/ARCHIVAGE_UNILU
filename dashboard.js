let students = [
    {
        name: "Lukas Ngoy",
        matricule: "2023-0145",
        faculty: "Polytechnique",
        level: "L1 Bachelier",
        source: "relais_notes_polytech_2024.csv",
        grades: [
            { course: "Algèbre Linéaire", code: "MAT101", score: 16.5, result: "Réussi", session: "1ère", date: "Jan 2024" },
            { course: "Physique Générale", code: "PHY102", score: 14.0, result: "Réussi", session: "1ère", date: "Fév 2024" },
            { course: "Chimie Organique", code: "CHI103", score: 12.5, result: "Réussi", session: "2ème", date: "Sep 2023" },
            { course: "Algorithmique en C", code: "INF104", score: 18.0, result: "Réussi", session: "1ère", date: "Juin 2024" }
        ]
    }
];

// Fonction pour charger les données réelles (Excel converti en JSON)
async function loadStudentsData() {
    try {
        // Ajout d'un timestamp pour forcer le rechargement du JSON (anti-cache)
        const ts = new Date().getTime();
        const response = await fetch('students_results.json?t=' + ts);
        if (response.ok) {
            const realData = await response.json();
            students = [...students, ...realData];
            console.log(`${realData.length} étudiants chargés depuis l'Excel.`);
        }
    } catch (err) {
        console.warn("Impossible de charger les données réelles:", err);
    }
}

// Lancement automatique du chargement au démarrage du site
loadStudentsData();

const searchInput = document.getElementById('studentSearch');
const suggestions = document.getElementById('suggestions');
const resultsArea = document.getElementById('resultsArea');
const quickTips = document.getElementById('quickTips');
const gradeTableBody = document.getElementById('gradeTableBody');

const nameDisplay = document.getElementById('studentNameDisplay');
const detailsDisplay = document.getElementById('studentDetailsDisplay');
const sourceDisplay = document.getElementById('sourceFileName');

searchInput.addEventListener('input', (e) => {
    const val = e.target.value.toLowerCase();
    suggestions.innerHTML = '';
    
    if (val.length < 2) {
        suggestions.style.display = 'none';
        return;
    }

    const filtered = students.filter(s => 
        s.name.toLowerCase().includes(val) || s.matricule.toLowerCase().includes(val)
    );

    if (filtered.length > 0) {
        suggestions.style.display = 'block';
        filtered.forEach(student => {
            const li = document.createElement('li');
            li.className = 'suggestion-item';
            li.innerHTML = `<strong>${student.name}</strong> - ${student.matricule} (${student.faculty})`;
            li.onclick = () => selectStudent(student);
            suggestions.appendChild(li);
        });
    } else {
        suggestions.style.display = 'none';
    }
});

function selectStudent(student) {
    if (!student) return;
    
    // 1. Forcer la valeur dans la barre
    const input = document.getElementById('studentSearch');
    if (input) input.value = student.name;
    
    // 2. Cacher les suggestions
    const suggestionsList = document.getElementById('suggestions');
    if (suggestionsList) suggestionsList.style.display = 'none';

    try {
        // 3. Récupérer les zones d'affichage
        const area = document.getElementById('resultsArea');
        const tips = document.getElementById('quickTips');
        
        // 4. Inversion immédiate de la visibilité
        if (tips) tips.style.setProperty('display', 'none', 'important');
        if (area) {
            area.style.setProperty('display', 'block', 'important');
            area.style.opacity = '1';
            area.classList.add('visible');
        }

        // 5. Remplir les textes
        const nameEl = document.getElementById('studentNameDisplay');
        const detailEl = document.getElementById('studentDetailsDisplay');
        const sourceEl = document.getElementById('sourceFileName');

        if (nameEl) nameEl.innerText = (student.name || "N/A").toUpperCase();
        if (detailEl) detailEl.innerText = `${student.faculty || ''} • Matricule: ${student.matricule || ''} • ${student.level || ''}`;
        if (sourceEl) sourceEl.innerText = student.source || "";

        // 6. Remplir le tableau
        const table = document.getElementById('gradeTableBody');
        if (table && student.grades) {
            table.innerHTML = '';
            student.grades.forEach(grade => {
                const tr = document.createElement('tr');
                const isMoyenne = grade.course && grade.course.toLowerCase().includes('moyenne');
                if (isMoyenne) tr.classList.add('highlight-row');

                // La valeur peut être un nombre OU un texte (ex: DECISION = 'NV2')
                const isNumeric = typeof grade.score === 'number';
                const score = isNumeric ? grade.score : null;
                const scoreDisplay = isNumeric ? grade.score.toFixed(1) : grade.score;
                const badge = (score !== null && score >= 15) ? 'grade-a' : ((score !== null && score >= 12) ? 'grade-b' : 'grade-c');
                
                tr.innerHTML = `
                    <td>${grade.course || ''}</td>
                    <td style="color: #a0aec0;">${grade.code || ''}</td>
                    <td>${isNumeric ? `<span class="grade-badge ${badge}">${scoreDisplay}</span>` : `<strong style="color:#4a5568">${scoreDisplay}</strong>`}</td>
                    <td>${grade.result || ''}</td>
                    <td>${grade.session || ''}</td>
                    <td>${grade.date || ''}</td>
                `;
                table.appendChild(tr);
            });
        }

        // 7. Remplir les statistiques finales
        if (student.stats) {
            const s = student.stats;
            const echecs = document.getElementById('statEchecs');
            const total  = document.getElementById('statTotal');
            const moy    = document.getElementById('statMoyenne');
            const cred   = document.getElementById('statCredits');
            const dec    = document.getElementById('statDecision');
            if (echecs) echecs.innerText = s.echecs ?? '-';
            if (total)  total.innerText  = s.total  ?? '-';
            if (moy)    moy.innerText    = typeof s.moyenne === 'number' ? s.moyenne.toFixed(2) : '-';
            if (cred)   cred.innerText   = (s.credits ?? '-') + ' / 60';
            if (dec)    dec.innerText    = s.decision ?? '-';
            const summaryEl = document.getElementById('statsSummary');
            if (summaryEl) summaryEl.style.display = 'flex';
        } else {
            const summaryEl = document.getElementById('statsSummary');
            if (summaryEl) summaryEl.style.display = 'none';
        }

    } catch (e) {
        console.error("Erreur lors de l'affichage :", e);
    }
}

// Relai des boutons
document.addEventListener('DOMContentLoaded', () => {
    const downloadBtn = document.getElementById('downloadBtn');
    if (downloadBtn) {
        downloadBtn.onclick = () => {
            const randomId = Math.floor(Math.random() * 9000000000 + 1000000000);
            if (document.getElementById('idNumber')) document.getElementById('idNumber').innerText = randomId;
            const today = new Date();
            if (document.getElementById('currentDate')) document.getElementById('currentDate').innerText = today.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
            window.print();
        };
    }
});

document.addEventListener('click', (e) => {
    const sInput = document.getElementById('studentSearch');
    const sList = document.getElementById('suggestions');
    if (sInput && sList && e.target !== sInput) {
        sList.style.display = 'none';
    }
});
