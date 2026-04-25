'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import * as XLSX from 'xlsx'
import {
  PlusCircle, Upload, FileText, Database, ShieldCheck,
  Loader2, Layers, Calendar, Trash2, ExternalLink,
  Search, Settings, Filter, AlertCircle, CheckCircle,
  XCircle, Download, ArrowRight
} from 'lucide-react'
import {
  createFaculty, createDepartment, createPromotion, createSession,
  getAppData, importArchives, deleteArchive, clearArchivesAndStudents,
  deleteFaculty, deleteDepartment, deletePromotion, deleteSession
} from '../actions'
import Sidebar from '../../components/Sidebar'

export default function DatabasePage() {
  // --- États ---
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState('import')
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragCounter, setDragCounter] = useState(0)
  const [showSuccess, setShowSuccess] = useState(false)

  const [faculties, setFaculties] = useState<any[]>([])
  const [promotions, setPromotions] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [recentArchives, setRecentArchives] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGroup, setSelectedGroup] = useState<any | null>(null)

  const [selectedFaculty, setSelectedFaculty] = useState('')
  const [selectedDept, setSelectedDept] = useState('')
  const [selectedPromo, setSelectedPromo] = useState('')
  const [selectedSession, setSelectedSession] = useState('')
  const [academicYear, setAcademicYear] = useState('2023-2024')

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<any[] | null>(null)
  const [availableColumns, setAvailableColumns] = useState<string[]>([])
  const [nomColumn, setNomColumn] = useState('')
  const [decisionColumn, setDecisionColumn] = useState('')
  const [rawRows, setRawRows] = useState<any[]>([])
  const [showMapping, setShowMapping] = useState(false)

  const [selectedFacultyManage, setSelectedFacultyManage] = useState('')
  const [selectedDeptManage, setSelectedDeptManage] = useState('')

  // --- Chargement ---
  const loadData = async () => {
    try {
      const data = await getAppData()
      setFaculties(data.faculties)
      setPromotions(data.promotions)
      setSessions(data.sessions)
      setRecentArchives(data.recentArchives)
    } catch (e) {
      console.error("Erreur de chargement", e)
    }
  }

  useEffect(() => {
    setMounted(true)
    loadData()
  }, [])

  // --- Logique Excel ---
  const buildPreview = (rows: any[], nomCol: string, decisionCol: string) => {
    const cleaned = rows.map((row: any) => ({
      nom: row[nomCol] ? String(row[nomCol]).toUpperCase().trim() : '—',
      decision: row[decisionCol] ? String(row[decisionCol]).toUpperCase().trim() : 'N/A'
    }))
    setPreviewData(cleaned)
    setShowMapping(false)
  }

  const processFile = (file: File) => {
    if (!selectedFaculty || !selectedPromo || !selectedSession) {
      alert("⚠️ Veuillez d'abord sélectionner la Faculté, la Promotion et la Session.")
      return
    }

    setSelectedFile(file)
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const rawJson = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][]

        let headerRowIndex = 0
        for (let i = 0; i < Math.min(rawJson.length, 25); i++) {
          const row = rawJson[i]
          if (row && row.some(cell => {
            const c = String(cell).toUpperCase()
            return c.includes('NOMS ET PRÉNOM') || c.includes('NOMS ET PRENOM') || (c.includes('NOM') && c.includes('PRENOM'))
          })) {
            headerRowIndex = i
            break
          }
        }

        const data = XLSX.utils.sheet_to_json(ws, { range: headerRowIndex }) as any[]
        if (data.length === 0) return alert('Le fichier est vide.')

        const cols = Object.keys(data[0])
        setAvailableColumns(cols)
        setRawRows(data)

        const autoNom = cols.find(k => k.toUpperCase().includes('NOM')) || ''
        const autoDecision = [...cols].reverse().find(k => {
          const c = k.toUpperCase().trim()
          return c === 'DECISION' || c === 'DÉCISION' || c === 'ADM' || c === 'JURY'
        }) || ''

        setNomColumn(autoNom)
        setDecisionColumn(autoDecision)

        if (!autoNom || !autoDecision) setShowMapping(true)
        else buildPreview(data, autoNom, autoDecision)
      } catch (err) { alert("Erreur Excel.") }
    }
    reader.readAsBinaryString(file)
  }

  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragCounter(prev => prev + 1)
    setIsDragging(true)
  }

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const newCounter = dragCounter - 1
    setDragCounter(newCounter)
    if (newCounter === 0) setIsDragging(false)
  }

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    setDragCounter(0)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const handleFinalUpload = async () => {
    if (!selectedFile) return
    setLoading(true)
    const formData = new FormData()
    formData.append('file', selectedFile)
    formData.append('facultyId', selectedFaculty)
    formData.append('deptId', selectedDept || 'null')
    formData.append('promotionId', selectedPromo)
    formData.append('sessionId', selectedSession)
    formData.append('year', academicYear)

    try {
      await importArchives(formData)
      setShowSuccess(true)
      setLoading(false)
      setPreviewData(null)
      setSelectedFile(null)
      loadData()
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (error) {
      alert("Erreur serveur.")
      setLoading(false)
    }
  }

  const handleDeleteItem = async (type: string, id: string, name: string) => {
    if (!confirm(`Supprimer "${name}" ?`)) return
    try {
      if (type === 'archive') await deleteArchive(id)
      else if (type === 'faculty') await deleteFaculty(id)
      else if (type === 'dept') await deleteDepartment(id)
      else if (type === 'promo') await deletePromotion(id)
      else if (type === 'session') await deleteSession(id)
      await loadData()
    } catch(e) {}
  }

  if (!mounted) return null
  
  const currentFacImport = faculties.find(f => f.id === selectedFaculty)
  const deptsForImport = currentFacImport?.departments || []
  const promosForImport = deptsForImport.find((d: any) => d.id === selectedDept)?.promotions || []

  const currentFacManage = faculties.find(f => f.id === selectedFacultyManage)
  const deptsForManage = currentFacManage?.departments || []
  const promosForManage = deptsForManage.find((d: any) => d.id === selectedDeptManage)?.promotions || []

  return (
    <div className="dashboard-wrapper">
      <Sidebar />

      <main className="main-content">
        {loading && (
          <div className="loading-overlay">
            <div className="loading-card animate-pop shadow-card">
              <Loader2 className="animate-spin mx-auto" size={48} color="var(--primary-blue)" />
              <h3 className="mt-4 font-bold" style={{ color: 'var(--primary-blue)' }}>Archivage en cours...</h3>
              <p className="text-sm text-muted mt-2">Veuillez patienter pendant le traitement des données.</p>
            </div>
          </div>
        )}

        <div className="animate-fade-in">
          
          <div className="page-header">
            <h1 className="page-title">Base de Données</h1>
            <p className="page-subtitle">Gérez et archivez les résultats académiques de manière sécurisée.</p>
          </div>

          <section className="stats-grid">
            <div className="stat-card">
              <Database size={24} /> 
              <div>
                <h4>Facultés Gérées</h4>
                <p>{faculties.length}</p>
              </div>
            </div>
            <div className="stat-card">
              <Layers size={24} /> 
              <div>
                <h4>Niveaux d'Études</h4>
                <p>{promotions.length}</p>
              </div>
            </div>
            <div className="stat-card">
              <Calendar size={24} /> 
              <div>
                <h4>Types de Sessions</h4>
                <p>{sessions.length}</p>
              </div>
            </div>
          </section>

          <div className="import-card">
            <nav className="tab-nav-premium">
              <button className={`tab-item-premium ${activeTab === 'import' ? 'active' : ''}`} onClick={() => setActiveTab('import')}><Upload size={18} /> Importation</button>
              <button className={`tab-item-premium ${activeTab === 'view' ? 'active' : ''}`} onClick={() => setActiveTab('view')}><FileText size={18} /> Historique</button>
              <button className={`tab-item-premium ${activeTab === 'manage' ? 'active' : ''}`} onClick={() => setActiveTab('manage')}><Settings size={18} /> Structure</button>
            </nav>

            {activeTab === 'import' && (
              <div className="p-0">
                {!previewData && !showMapping ? (
                  <div className="config-grid">
                    <div className="config-section">
                      <div className="config-section-title"><Filter size={20} /> Configuration du fichier</div>
                      
                      <div className="form-group">
                        <label className="form-label">Faculté cible</label>
                        <select value={selectedFaculty} onChange={(e) => { setSelectedFaculty(e.target.value); setSelectedDept(''); }} className="form-select-premium">
                          <option value="">Sélectionner une faculté...</option>
                          {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                      </div>
                      
                      <div className="flex gap-5">
                        <div className="form-group flex-1">
                          <label className="form-label">Département</label>
                          <select value={selectedDept} onChange={(e) => { setSelectedDept(e.target.value); setSelectedPromo(''); }} className="form-select-premium" disabled={!selectedFaculty}>
                            <option value="">Choisir...</option>
                            {deptsForImport.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                          </select>
                        </div>
                        <div className="form-group flex-1">
                          <label className="form-label">Promotion</label>
                          <select value={selectedPromo} onChange={(e) => setSelectedPromo(e.target.value)} className="form-select-premium" disabled={!selectedDept}>
                            <option value="">Choisir...</option>
                            {promosForImport.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="flex gap-5">
                        <div className="form-group flex-1">
                          <label className="form-label">Session</label>
                          <select value={selectedSession} onChange={(e) => setSelectedSession(e.target.value)} className="form-select-premium">
                            <option value="">Choisir...</option>
                            {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                        </div>
                        <div className="form-group flex-1">
                          <label className="form-label">Année Acad.</label>
                          <input type="text" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} className="form-select-premium" placeholder="Ex: 2023-2024" />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <div 
                        className={`drop-zone-premium ${isDragging ? 'active' : ''}`}
                        onDragEnter={onDragEnter} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
                      >
                        <div className="drop-zone-icon">
                          <Upload size={32} />
                        </div>
                        <h3 className="drop-zone-title">Sélectionner un fichier Excel</h3>
                        <p className="drop-zone-text mb-4">Glissez-déposez le fichier ici ou cliquez pour parcourir.</p>
                        <label htmlFor="file-upload" className="btn-premium" style={{ display: 'inline-flex', cursor: 'pointer' }}>
                          <Database size={18} /> Parcourir les fichiers
                        </label>
                        <input id="file-upload" type="file" accept=".xlsx,.xls" onChange={handleFileChange} style={{ display: 'none' }} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8">
                    <div className="flex justify-between items-center mb-6 pb-6" style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <div>
                        <h3 className="font-bold text-xl" style={{ color: 'var(--primary-blue)' }}>Aperçu des données avant importation</h3>
                        <p className="text-sm text-muted mt-2">Vérifiez que les noms et les décisions ont été correctement détectés.</p>
                      </div>
                      <div className="flex gap-3">
                        <button className="btn-premium" style={{ background: '#f8fafc', color: 'var(--text-main)', border: '1px solid #e2e8f0' }} onClick={() => { setPreviewData(null); setSelectedFile(null); }}>
                          <XCircle size={18} /> Annuler
                        </button>
                        <button className="btn-premium" onClick={handleFinalUpload}>
                          <CheckCircle size={18} /> Confirmer l'archivage
                        </button>
                      </div>
                    </div>
                    <div style={{ background: '#fcfdfd', borderRadius: '16px', border: '1px solid #f1f5f9', overflow: 'hidden' }}>
                      <table className="grade-table">
                        <thead><tr><th>Nom complet de l'étudiant</th><th>Décision du Jury</th></tr></thead>
                        <tbody>
                          {previewData?.slice(0, 10).map((r, i) => (
                            <tr key={i}>
                              <td className="font-bold">{r.nom}</td>
                              <td><span className={`grade-badge ${r.decision.toUpperCase().includes('ADM') || r.decision.toUpperCase() === 'V' ? 'grade-a' : 'grade-b'}`}>{r.decision}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'view' && (
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="font-bold text-xl" style={{ color: 'var(--primary-blue)' }}>Historique des sessions d'archivage</h3>
                    <p className="text-sm text-muted mt-2">Retrouvez toutes les données précédemment importées.</p>
                  </div>
                  <div className="search-bar-wrapper" style={{ maxWidth: '350px', margin: 0 }}>
                    <Search size={18} className="search-icon" />
                    <input 
                      type="text" 
                      placeholder="Rechercher par faculté ou année..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="groups-grid">
                  {Object.values(recentArchives.reduce((acc: any, cur: any) => {
                    const key = cur.referenceLink || 'no-link'
                    if (!acc[key]) acc[key] = { info: cur, students: [], id: cur.id }
                    acc[key].students.push(cur)
                    return acc
                  }, {}))
                    .filter((g: any) => 
                      g.info.faculty.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      g.info.academicYear.includes(searchTerm)
                    )
                    .map((group: any) => (
                      <div key={group.id} className="stat-card" style={{ cursor: 'pointer', transition: 'all 0.2s ease' }} onClick={() => setSelectedGroup(group)} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                        <FileText size={24} />
                        <div>
                          <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--primary-blue)' }}>{group.info.faculty.name}</h4>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 8px 0', fontWeight: '500' }}>{group.info.promotion.name} • {group.info.academicYear}</p>
                          <span className="grade-badge grade-a" style={{ background: '#f0f9fb', color: 'var(--accent-cyan)' }}>{group.students.length} étudiants archivés</span>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Modale de détails Premium */}
                {selectedGroup && createPortal(
                  <div className="loading-overlay" onClick={() => setSelectedGroup(null)} style={{ backdropFilter: 'blur(5px)' }}>
                    <div className="bg-white rounded-16 shadow-card animate-fade-in" style={{ maxWidth: '850px', width: '90%', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
                      <div className="p-6 flex justify-between items-center" style={{ background: 'var(--primary-blue)', color: 'white', borderRadius: '16px 16px 0 0' }}>
                        <div className="flex items-center gap-4">
                          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: '12px' }}>
                            <Database size={28} color="white" />
                          </div>
                          <div>
                            <h2 style={{ margin: 0, fontSize: '1.4rem' }}>{selectedGroup.info.faculty.name}</h2>
                            <p style={{ margin: '4px 0 0 0', opacity: 0.8, fontSize: '0.9rem' }}>{selectedGroup.info.promotion.name} — Année {selectedGroup.info.academicYear}</p>
                          </div>
                        </div>
                        <button onClick={() => setSelectedGroup(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.8, transition: '0.2s' }} onMouseEnter={(e) => e.currentTarget.style.opacity = '1'} onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}>
                          <XCircle size={28} />
                        </button>
                      </div>
                      
                      <div className="p-6 flex justify-between items-center" style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                        <div className="flex items-center gap-3">
                          <Calendar size={20} color="var(--text-muted)" />
                          <span className="font-bold text-muted">Session:</span>
                          <span className="font-bold" style={{ color: 'var(--primary-blue)' }}>{selectedGroup.info.session.name}</span>
                        </div>
                        <button className="btn-premium" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                          <Download size={16} /> Exporter en CSV
                        </button>
                      </div>

                      <div style={{ overflowY: 'auto', flex: 1, padding: '24px' }}>
                        <table className="grade-table">
                          <thead><tr><th>Identité de l'étudiant</th><th style={{ textAlign: 'right' }}>Décision Finale</th></tr></thead>
                          <tbody>
                            {selectedGroup.students.map((s: any) => {
                               const d = s.decision.trim().toUpperCase();
                               const isAdmis = d === 'V' || d === 'ADM' || d === 'ADMIS' || d === 'ADMIS(E)';
                               return (
                              <tr key={s.id}>
                                <td className="font-bold" style={{ color: '#1e293b' }}>
                                  <div className="flex items-center gap-3">
                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                      {s.student.name.charAt(0)}
                                    </div>
                                    {s.student.name}
                                  </div>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                  <span className={`grade-badge ${isAdmis ? 'grade-a' : 'grade-b'}`}>{s.decision}</span>
                                </td>
                              </tr>
                            )})}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>,
                  document.body
                )}
              </div>
            )}

            {activeTab === 'manage' && (
              <div className="p-8">
                <div className="mb-8">
                    <h3 className="font-bold text-xl" style={{ color: 'var(--primary-blue)' }}>Structure de l'Université</h3>
                    <p className="text-sm text-muted mt-2">Gérez la hiérarchie pour faciliter le classement des archives.</p>
                </div>
                
                <div className="manage-grid-4">
                   <div className="config-section" style={{ padding: '20px' }}>
                      <div className="flex justify-between items-center mb-4 pb-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <h5 className="m-0 font-bold" style={{ color: 'var(--primary-blue)' }}>Facultés</h5>
                        <button className="btn-premium" style={{ padding: '6px', borderRadius: '8px' }} onClick={async () => { const n = prompt('Nom de la Faculté:'); if (n) { await createFaculty(n); loadData(); } }}>
                          <PlusCircle size={16} />
                        </button>
                      </div>
                      {faculties.map(f => (
                        <div key={f.id} className={`m-item clickable ${selectedFacultyManage === f.id ? 'active' : ''}`} style={{ padding: '12px 16px', borderRadius: '10px', marginBottom: '8px', border: '1px solid transparent', transition: 'all 0.2s', background: selectedFacultyManage === f.id ? '#f0f9fb' : '#f8fafc', borderColor: selectedFacultyManage === f.id ? 'var(--accent-cyan)' : 'transparent', color: selectedFacultyManage === f.id ? 'var(--primary-blue)' : 'inherit', fontWeight: selectedFacultyManage === f.id ? 'bold' : 'normal' }} onClick={() => { setSelectedFacultyManage(f.id); setSelectedDeptManage(''); }}>
                          {f.name}
                        </div>
                      ))}
                   </div>

                   <div className="config-section" style={{ padding: '20px' }}>
                      <div className="flex justify-between items-center mb-4 pb-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <h5 className="m-0 font-bold" style={{ color: 'var(--primary-blue)' }}>Départements</h5>
                        {selectedFacultyManage && (
                          <button className="btn-premium" style={{ padding: '6px', borderRadius: '8px' }} onClick={async () => { const n = prompt('Nom du Département:'); if (n) { await createDepartment(n, selectedFacultyManage); loadData(); } }}>
                            <PlusCircle size={16} />
                          </button>
                        )}
                      </div>
                      {!selectedFacultyManage ? (
                        <p className="text-sm text-muted text-center py-4">Sélectionnez une faculté</p>
                      ) : (
                        deptsForManage.map((d: any) => (
                          <div key={d.id} className={`m-item clickable ${selectedDeptManage === d.id ? 'active' : ''}`} style={{ padding: '12px 16px', borderRadius: '10px', marginBottom: '8px', border: '1px solid transparent', transition: 'all 0.2s', background: selectedDeptManage === d.id ? '#f0f9fb' : '#f8fafc', borderColor: selectedDeptManage === d.id ? 'var(--accent-cyan)' : 'transparent', color: selectedDeptManage === d.id ? 'var(--primary-blue)' : 'inherit', fontWeight: selectedDeptManage === d.id ? 'bold' : 'normal' }} onClick={() => setSelectedDeptManage(d.id)}>
                            {d.name}
                          </div>
                        ))
                      )}
                   </div>

                   <div className="config-section" style={{ padding: '20px' }}>
                      <div className="flex justify-between items-center mb-4 pb-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <h5 className="m-0 font-bold" style={{ color: 'var(--primary-blue)' }}>Promotions</h5>
                        {selectedDeptManage && (
                          <button className="btn-premium" style={{ padding: '6px', borderRadius: '8px' }} onClick={async () => { const n = prompt('Nom de la Promotion:'); if (n) { await createPromotion(n, selectedDeptManage); loadData(); } }}>
                            <PlusCircle size={16} />
                          </button>
                        )}
                      </div>
                      {!selectedDeptManage ? (
                        <p className="text-sm text-muted text-center py-4">Sélectionnez un département</p>
                      ) : (
                        promosForManage.map((p: any) => (
                          <div key={p.id} className="m-item" style={{ padding: '12px 16px', borderRadius: '10px', marginBottom: '8px', background: '#f8fafc' }}>
                            {p.name}
                          </div>
                        ))
                      )}
                   </div>

                   <div className="config-section" style={{ padding: '20px' }}>
                      <div className="flex justify-between items-center mb-4 pb-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <h5 className="m-0 font-bold" style={{ color: 'var(--primary-blue)' }}>Sessions</h5>
                        <button className="btn-premium" style={{ padding: '6px', borderRadius: '8px' }} onClick={async () => { const n = prompt('Nom de la Session:'); if (n) { await createSession(n); loadData(); } }}>
                          <PlusCircle size={16} />
                        </button>
                      </div>
                      {sessions.map(s => (
                        <div key={s.id} className="m-item" style={{ padding: '12px 16px', borderRadius: '10px', marginBottom: '8px', background: '#f8fafc' }}>
                          {s.name}
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <style jsx>{`
        .loading-overlay { position: fixed; inset: 0; background: rgba(241, 245, 249, 0.8); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .loading-card { background: white; padding: 50px; border-radius: 24px; text-align: center; border: 1px solid #e2e8f0; }
        .m-item { cursor: pointer; }
        .clickable:hover { transform: translateX(4px); }
      `}</style>
    </div>
  )
}
