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
        const response = await fetch('students_results.json');
        if (response.ok) {
            const realData = await response.json();
            // On ajoute les vrais étudiants à notre liste existante
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
    searchInput.value = student.name;
    suggestions.style.display = 'none';
    quickTips.style.display = 'none';
    
    // Fill result data
    nameDisplay.innerText = student.name.toUpperCase();
    detailsDisplay.innerText = `${student.faculty} • Matricule: ${student.matricule} • ${student.level}`;
    sourceDisplay.innerText = student.source;

    gradeTableBody.innerHTML = '';
    student.grades.forEach(grade => {
        const tr = document.createElement('tr');
        
        // On détecte si c'est une ligne de moyenne
        const isMoyenne = grade.course.toLowerCase().includes('moyenne');
        if (isMoyenne) {
            tr.classList.add('highlight-row');
        }

        const badgeClass = grade.score >= 15 ? 'grade-a' : (grade.score >= 12 ? 'grade-b' : 'grade-c');
        
        tr.innerHTML = `
            <td style="${isMoyenne ? 'font-weight: bold; color: #63b3ed;' : ''}">${grade.course}</td>
            <td style="color: #a0aec0; font-family: monospace;">${grade.code}</td>
            <td><span class="grade-badge ${badgeClass}">${grade.score.toFixed(1)}</span></td>
            <td>${grade.result}</td>
            <td>${grade.session}</td>
            <td>${grade.date}</td>
        `;
        gradeTableBody.appendChild(tr);
    });

    resultsArea.style.display = 'block';
    setTimeout(() => {
        resultsArea.classList.add('visible');
    }, 10);
}

// Mock Download PDF
document.getElementById('downloadBtn').onclick = () => {
    // Génère un numéro de référence aléatoire pour l'aspect officiel
    const randomId = Math.floor(Math.random() * 9000000000 + 1000000000);
    document.getElementById('idNumber').innerText = randomId;
    
    // Met à jour la date du jour
    const today = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').innerText = today.toLocaleDateString('fr-FR', options);

    // Lance l'impression (qui utilisera notre style officiel)
    window.print();
};

// Handle clicks outside suggestons
document.addEventListener('click', (e) => {
    if (e.target !== searchInput) {
        suggestions.style.display = 'none';
    }
});
