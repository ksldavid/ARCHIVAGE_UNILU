'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { 
  Search, Lightbulb, FileOutput, Printer, Download 
} from 'lucide-react'
import Sidebar from '../components/Sidebar'

export default function MainDashboard() {
  const [searchTerm, setSearchTerm] = useState('')
  const [showResults, setShowResults] = useState(false)

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    if (e.target.value.length > 2) {
      setShowResults(true)
    } else {
      setShowResults(false)
    }
  }

  return (
    <div className="dashboard-wrapper">
      <Sidebar />

      {/* Main Workspace */}
      <main className="main-content">
        <header className="dashboard-header animate-fade-in">
          <h1>Bonjour, Personnel Académique</h1>
          <p style={{ color: '#718096' }}>Quelle recherche d'étudiant souhaitez-vous effectuer aujourd'hui ?</p>
        </header>

        {/* Search Experience */}
        <div className="search-container">
          <div className="search-bar-wrapper">
            <Search className="search-icon" size={24} />
            <input 
              type="text" 
              placeholder="Rechercher par nom d'étudiant..." 
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>

        {/* Result Area (Simulée pour le moment) */}
        {showResults ? (
          <section className="results-area visible">
            <div className="student-card">
              <div className="card-header">
                <div className="student-info">
                  <h3>NOM DE L'ÉTUDIANT</h3>
                  <p>Faculté Polytechnique • Matricule: 2023-XXXX • 2ème Graduat</p>
                </div>
                <div className="actions-btns">
                  <button className="btn btn-outline"><Printer size={18} /> Imprimer</button>
                  <button className="btn btn-primary"><Download size={18} /> Télécharger PDF</button>
                </div>
              </div>
              
              <div className="grid-content">
                <table className="grade-table">
                  <thead>
                    <tr>
                      <th>Cours</th>
                      <th>Code</th>
                      <th>Note /20</th>
                      <th>Résultat</th>
                      <th>Session</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Géologie Générale</td>
                      <td>GEOL101</td>
                      <td>15</td>
                      <td><span className="grade-badge grade-a">DISTINCTION</span></td>
                      <td>S1</td>
                    </tr>
                    <tr className="highlight-row">
                      <td>Mathématiques Appliquées</td>
                      <td>MATH202</td>
                      <td>12</td>
                      <td><span className="grade-badge grade-b">SATISFACTION</span></td>
                      <td>S1</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        ) : (
          /* Quick Tips Area */
          <div className="flex gap-5 justify-center max-w-900 mx-auto animate-fade-in">
            <div className="bg-white p-6 rounded-16 flex-1 shadow-card">
              <Lightbulb className="mb-15" style={{ color: '#ecc94b' }} size={24} />
              <h4 className="mb-2">Astuce de recherche</h4>
              <p className="text-sm text-muted leading-relaxed">
                Vous pouvez taper le nom complet ou le matricule de l'étudiant pour filtrer rapidement les résultats.
              </p>
            </div>
            <div className="bg-white p-6 rounded-16 flex-1 shadow-card">
              <FileOutput className="mb-15" style={{ color: '#3182ce' }} size={24} />
              <h4 className="mb-2">Exports Officiels</h4>
              <p className="text-sm text-muted leading-relaxed">
                Générez des rapports conformes aux standards administratifs de l'UNILU d'un seul clic.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
