'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import * as XLSX from 'xlsx'
import {
  PlusCircle, Upload, FileText, Database, ShieldCheck,
  Loader2, Layers, Calendar, Trash2, ExternalLink,
  Search, Settings, Filter, AlertCircle, CheckCircle,
  XCircle, Download, ArrowRight, UploadCloud
} from 'lucide-react'
import {
  createFaculty, createDepartment, createPromotion, createSession,
  getAppData, importArchives, deleteArchive, clearArchivesAndStudents,
  deleteFaculty, deleteDepartment, deletePromotion, deleteSession,
  deleteArchiveGroup
} from '../actions'
import Sidebar from '../../components/Sidebar'

export default function DatabasePage() {
  // --- États ---
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState('import')
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStep, setUploadStep] = useState('')
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

  // Double confirmation suppression
  const [deleteRequest, setDeleteRequest] = useState<{ type: string, id: string, name: string } | null>(null)
  const [confirmInput, setConfirmInput] = useState('')

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
        const ws = wb.Sheets[wb.SheetNames[0]]
        
        // On récupère TOUT en brut (tableau de tableaux)
        const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][]
        
        // 1. Trouver la ligne d'en-tête et les indices des colonnes
        let nameColIndex = -1
        let decisionColIndex = -1
        let headerIndex = -1

        const cleanStr = (v: any) => String(v || '').toUpperCase().replace(/\s+/g, '').trim()

        for (let i = 0; i < Math.min(rawData.length, 60); i++) {
          const row = rawData[i]
          if (!row) continue
          
          for (let j = 0; j < row.length; j++) {
            const cell = cleanStr(row[j])
            if (cell.includes('NOM') && (cell.includes('PRENOM') || cell.includes('POST') || cell.includes('COMPLET'))) {
              nameColIndex = j
              headerIndex = i
            }
            if (cell.includes('DECISION') || cell.includes('JURY')) {
              decisionColIndex = j
              if (headerIndex === -1) headerIndex = i
            }
          }
          if (nameColIndex !== -1 && decisionColIndex !== -1) break
        }

        if (nameColIndex === -1) {
          // Si on n'a pas trouvé de header explicite, on cherche juste une colonne qui a "NOM"
          for (let i = 0; i < Math.min(rawData.length, 40); i++) {
             const j = rawData[i]?.findIndex(c => cleanStr(c).includes('NOM'))
             if (j !== -1) { nameColIndex = j; headerIndex = i; break; }
          }
        }

        if (nameColIndex === -1) return alert("Désolé, je ne trouve pas la colonne des noms dans ce fichier.")

        // 2. Extraire les données à partir de la ligne après le header
        const finalRows: any[] = []
        for (let i = headerIndex + 1; i < rawData.length; i++) {
          const row = rawData[i]
          if (!row || !row[nameColIndex]) continue
          
          const name = String(row[nameColIndex]).trim()
          // Ignorer les lignes qui ne sont pas des noms (chiffres, titres, etc.)
          if (name.length < 3 || !/[a-zA-Z]/.test(name) || name.toUpperCase() === 'NOM') continue
          
          const decision = decisionColIndex !== -1 ? String(row[decisionColIndex] || '—').trim() : '—'
          
          finalRows.push({ nom: name.toUpperCase(), decision: decision.toUpperCase() })
        }

        if (finalRows.length === 0) return alert("Aucune donnée d'étudiant trouvée.")
        
        setPreviewData(finalRows)
        setShowMapping(false)
      } catch (err) { alert("Erreur lors de la lecture du fichier.") }
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



  // --- Chargement ---
  // ... (inchangé)

  const handleFinalUpload = async () => {
    if (!selectedFile) return
    setLoading(true)
    setUploadProgress(10)
    setUploadStep('Téléchargement du fichier sur le serveur...')
    
    const formData = new FormData()
    formData.append('file', selectedFile)
    formData.append('facultyId', selectedFaculty)
    formData.append('deptId', selectedDept || 'null')
    formData.append('promotionId', selectedPromo)
    formData.append('sessionId', selectedSession)
    formData.append('year', academicYear)

    // Simulation de progression pendant que le serveur travaille
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev < 40) { setUploadStep('Envoi sécurisé sur le Cloud...'); return prev + 2; }
        if (prev < 70) { setUploadStep('Analyse intelligente des colonnes...'); return prev + 1; }
        if (prev < 95) { setUploadStep('Archivage groupé des étudiants...'); return prev + 0.5; }
        return prev
      })
    }, 150)

    try {
      await importArchives(formData)
      clearInterval(interval)
      setUploadProgress(100)
      setUploadStep('Archivage terminé avec succès !')
      
      setTimeout(() => {
        setShowSuccess(true)
        setLoading(false)
        setPreviewData(null)
        setSelectedFile(null)
        setUploadProgress(0)
        loadData()
        setTimeout(() => setShowSuccess(false), 3000)
      }, 500)
    } catch (error) {
      clearInterval(interval)
      alert("Erreur serveur.")
      setLoading(false)
      setUploadProgress(0)
    }
  }

  const handleDeleteItem = async () => {
    if (!deleteRequest || confirmInput !== 'SUPPRIMER') return
    
    setLoading(true)
    try {
      if (deleteRequest.type === 'archive') await deleteArchive(deleteRequest.id)
      else if (deleteRequest.type === 'archiveGroup') await deleteArchiveGroup(deleteRequest.id)
      else if (deleteRequest.type === 'faculty') await deleteFaculty(deleteRequest.id)
      else if (deleteRequest.type === 'dept') await deleteDepartment(deleteRequest.id)
      else if (deleteRequest.type === 'promo') await deletePromotion(deleteRequest.id)
      else if (deleteRequest.type === 'session') await deleteSession(deleteRequest.id)
      
      setDeleteRequest(null)
      setConfirmInput('')
      await loadData()
    } catch(e) {
      alert("Erreur lors de la suppression. Vérifiez si des éléments dépendants existent.")
    } finally {
      setLoading(false)
    }
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
        {(loading && !deleteRequest) && (
          <div className="loading-overlay">
            <div className="loading-card animate-pop shadow-card" style={{ maxWidth: '500px', width: '90%' }}>
              <div className="flex items-center justify-between mb-6">
                <div style={{ background: 'var(--primary-blue)', padding: '12px', borderRadius: '12px', color: 'white' }}>
                  <UploadCloud className={uploadProgress < 100 ? "animate-bounce" : ""} size={28} />
                </div>
                <span style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--primary-blue)' }}>{Math.round(uploadProgress)}%</span>
              </div>
              
              <h3 className="font-black text-xl mb-2" style={{ color: 'var(--primary-blue)', textAlign: 'left' }}>
                {uploadProgress < 100 ? 'Traitement de vos archives...' : 'Traitement terminé !'}
              </h3>
              <p className="text-sm text-muted mb-6" style={{ textAlign: 'left', fontWeight: 500 }}>{uploadStep}</p>
              
              {/* BARRE DE PROGRESSION PREMIUM */}
              <div style={{ 
                width: '100%', height: '12px', background: '#f1f5f9', 
                borderRadius: '100px', overflow: 'hidden', marginBottom: '10px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ 
                  width: `${uploadProgress}%`, height: '100%', 
                  background: 'linear-gradient(90deg, var(--accent-cyan), var(--primary-blue))',
                  borderRadius: '100px', transition: 'width 0.3s ease-out',
                  boxShadow: '0 0 15px rgba(6, 182, 212, 0.4)'
                }}></div>
              </div>
              
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>DÉBUT</span>
                <span>ARCHIVAGE FINAL</span>
              </div>
            </div>
          </div>
        )}

        {/* MODALE DE SUPPRESSION SECURISÉE PREMIUM */}
        {deleteRequest && createPortal(
          <div className="loading-overlay" style={{ background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(12px)', zIndex: 1100 }}>
            <div className="animate-pop shadow-card" style={{ 
              background: 'white', borderRadius: '30px', padding: '40px', 
              maxWidth: '500px', width: '90%', border: '1px solid #f1f5f9',
              textAlign: 'center'
            }}>
              <div style={{ 
                background: '#fff1f2', width: '80px', height: '80px', 
                borderRadius: '24px', display: 'flex', alignItems: 'center', 
                justifyContent: 'center', margin: '0 auto 24px', color: '#e11d48'
              }}>
                <Trash2 size={40} />
              </div>
              
              <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--primary-blue)', margin: '0 0 12px 0' }}>Confirmation Requise</h3>
              
              <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: '1.6', margin: '0 0 30px 0' }}>
                Vous allez supprimer définitivement <br/>
                <strong style={{ color: '#1e293b', fontSize: '1.1rem' }}>{deleteRequest.name}</strong>.
              </p>
              
              <div style={{ 
                background: '#f8fafc', padding: '24px', borderRadius: '20px', 
                border: '2px dashed #e2e8f0', marginBottom: '30px'
              }}>
                <p style={{ 
                  fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', 
                  textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px'
                }}>Tapez le mot ci-dessous pour confirmer :</p>
                
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#cbd5e1', marginBottom: '15px', letterSpacing: '2px' }}>SUPPRIMER</div>
                
                <input 
                  type="text" 
                  style={{ 
                    width: '100%', padding: '16px', borderRadius: '14px', 
                    border: `2px solid ${confirmInput === 'SUPPRIMER' ? '#10b981' : '#e2e8f0'}`,
                    outline: 'none', background: 'white', fontWeight: 900, 
                    fontSize: '1.2rem', textAlign: 'center', color: 'var(--primary-blue)',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.02)', transition: 'all 0.2s'
                  }}
                  placeholder="Tapez ici..."
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value.toUpperCase())}
                  autoFocus
                />
              </div>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  className="btn-premium" 
                  style={{ flex: 1, background: '#f1f5f9', color: '#64748b', border: 'none', padding: '18px' }}
                  onClick={() => { setDeleteRequest(null); setConfirmInput(''); }}
                >
                  Annuler
                </button>
                <button 
                  className="btn-premium" 
                  style={{ 
                    flex: 2, padding: '18px',
                    background: confirmInput === 'SUPPRIMER' ? '#e11d48' : '#e2e8f0',
                    color: 'white', border: 'none',
                    opacity: confirmInput === 'SUPPRIMER' ? 1 : 0.5,
                    cursor: confirmInput === 'SUPPRIMER' ? 'pointer' : 'not-allowed',
                    boxShadow: confirmInput === 'SUPPRIMER' ? '0 10px 20px rgba(225, 29, 72, 0.2)' : 'none'
                  }}
                  disabled={confirmInput !== 'SUPPRIMER' || loading}
                  onClick={handleDeleteItem}
                >
                  {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Confirmer la suppression'}
                </button>
              </div>
            </div>
          </div>,
          document.body
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
                {/* 1. SELECTION INITIALE DU FICHIER */}
                {!previewData && !showMapping && (
                  <div className="config-grid">
                    <div className="config-section">
                      <div className="config-section-title"><Filter size={20} /> Configuration du fichier</div>
                      {/* ... (formulaire inchangé) */}
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
                        <div className="drop-zone-icon"><Upload size={32} /></div>
                        <h3 className="drop-zone-title">Sélectionner un fichier Excel</h3>
                        <p className="drop-zone-text mb-4">Glissez-déposez le fichier ici ou cliquez pour parcourir.</p>
                        <label htmlFor="file-upload" className="btn-premium" style={{ display: 'inline-flex', cursor: 'pointer' }}>
                          <Database size={18} /> Parcourir les fichiers
                        </label>
                        <input id="file-upload" type="file" accept=".xlsx,.xls" onChange={handleFileChange} style={{ display: 'none' }} />
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. MAPPING MANUEL (SI AUTO-DETECTION ECHOUE) */}
                {showMapping && !previewData && (
                  <div className="p-12 animate-pop">
                    <div style={{ maxWidth: '600px', margin: '0 auto', background: 'white', padding: '40px', borderRadius: '24px', border: '1px solid #f1f5f9', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}>
                      <div style={{ background: '#f0f9fb', width: '60px', height: '60px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'var(--accent-cyan)' }}>
                        <Settings size={30} />
                      </div>
                      <h3 className="text-center font-black text-xl mb-2" style={{ color: 'var(--primary-blue)' }}>Configuration manuelle</h3>
                      <p className="text-center text-muted text-sm mb-8">Nous n'avons pas pu identifier automatiquement les colonnes. Veuillez les sélectionner ci-dessous.</p>
                      
                      <div className="form-group mb-6">
                        <label className="form-label font-bold">Colonne contenant les NOMS</label>
                        <select value={nomColumn} onChange={e => setNomColumn(e.target.value)} className="form-select-premium">
                          <option value="">Sélectionner une colonne...</option>
                          {availableColumns.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>

                      <div className="form-group mb-8">
                        <label className="form-label font-bold">Colonne contenant la DÉCISION</label>
                        <select value={decisionColumn} onChange={e => setDecisionColumn(e.target.value)} className="form-select-premium">
                          <option value="">Sélectionner une colonne...</option>
                          {availableColumns.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>

                      <div className="flex gap-4">
                        <button className="btn-premium flex-1" style={{ background: '#f8fafc', color: '#64748b', border: 'none' }} onClick={() => setShowMapping(false)}>
                          Annuler
                        </button>
                        <button 
                          className="btn-premium flex-1" 
                          disabled={!nomColumn || !decisionColumn}
                          onClick={() => buildPreview(rawRows, nomColumn, decisionColumn)}
                        >
                          Générer l'aperçu <ArrowRight size={18} className="ml-2" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. APERÇU FINAL AVANT IMPORTATION */}
                {previewData && (
                  <div className="p-8 animate-fade-in">
                    <div className="flex justify-between items-center mb-6 pb-6" style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-bold text-xl" style={{ color: 'var(--primary-blue)', margin: 0 }}>Aperçu des données détectées</h3>
                          <span style={{ 
                            background: 'var(--accent-cyan)', color: 'white', 
                            padding: '4px 12px', borderRadius: '100px', 
                            fontSize: '0.85rem', fontWeight: 'bold',
                            boxShadow: '0 4px 10px rgba(6, 182, 212, 0.2)'
                          }}>
                            {previewData.length} étudiants trouvés
                          </span>
                        </div>
                        <p className="text-sm text-muted mt-2">Ci-dessous les 10 premiers pour vérification. L'intégralité des <strong>{previewData.length}</strong> lignes sera archivée.</p>
                      </div>
                      <div className="flex gap-3">
                        <button 
                          className="btn-premium" 
                          style={{ background: '#f8fafc', color: 'var(--text-main)', border: '1px solid #e2e8f0' }} 
                          onClick={() => { 
                            setPreviewData(null); 
                            setSelectedFile(null); 
                            setShowMapping(false);
                            setRawRows([]);
                          }}
                        >
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
                              <td className="font-bold" style={{ color: '#1e293b' }}>{r.nom}</td>
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
                      <div key={group.id} className="stat-card" style={{ cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative' }} onClick={() => setSelectedGroup(group)} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                        <FileText size={24} />
                        <div>
                          <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--primary-blue)' }}>{group.info.faculty.name}</h4>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 8px 0', fontWeight: '500' }}>
                            {group.info.promotion.name} • {group.info.academicYear} • <span style={{ color: 'var(--accent-cyan)' }}>{group.info.session.name}</span>
                          </p>
                          <span className="grade-badge grade-a" style={{ background: '#f0f9fb', color: 'var(--accent-cyan)' }}>{group.students.length} étudiants archivés</span>
                        </div>
                        <button 
                          className="delete-icon-archive"
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            if (!group.info.referenceLink) return alert("Impossible de supprimer cette archive groupée (lien manquant).");
                            setDeleteRequest({ 
                              type: 'archiveGroup', 
                              id: group.info.referenceLink, 
                              name: `l'intégralité de cette session d'importation (${group.info.faculty.name})` 
                            }); 
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
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
                            <p style={{ margin: '4px 0 0 0', opacity: 0.7, fontSize: '0.85rem', fontWeight: 500 }}>
                              {selectedGroup.info.promotion.name} • {selectedGroup.info.academicYear} • <span style={{ color: 'var(--accent-cyan)' }}>{selectedGroup.info.session.name}</span>
                            </p>
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
                            {[...selectedGroup.students]
                              .sort((a, b) => a.student.name.localeCompare(b.student.name))
                              .map((s: any) => {
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
                        <div key={f.id} className={`m-item clickable ${selectedFacultyManage === f.id ? 'active' : ''}`} style={{ padding: '12px 16px', borderRadius: '10px', marginBottom: '8px', border: '1px solid transparent', transition: 'all 0.2s', background: selectedFacultyManage === f.id ? '#f0f9fb' : '#f8fafc', borderColor: selectedFacultyManage === f.id ? 'var(--accent-cyan)' : 'transparent', color: selectedFacultyManage === f.id ? 'var(--primary-blue)' : 'inherit', fontWeight: selectedFacultyManage === f.id ? 'bold' : 'normal', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={() => { setSelectedFacultyManage(f.id); setSelectedDeptManage(''); }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                          <button 
                            className="delete-small-icon"
                            onClick={(e) => { e.stopPropagation(); setDeleteRequest({ type: 'faculty', id: f.id, name: f.name }); }}
                          >
                            <Trash2 size={14} />
                          </button>
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
                          <div key={d.id} className={`m-item clickable ${selectedDeptManage === d.id ? 'active' : ''}`} style={{ padding: '12px 16px', borderRadius: '10px', marginBottom: '8px', border: '1px solid transparent', transition: 'all 0.2s', background: selectedDeptManage === d.id ? '#f0f9fb' : '#f8fafc', borderColor: selectedDeptManage === d.id ? 'var(--accent-cyan)' : 'transparent', color: selectedDeptManage === d.id ? 'var(--primary-blue)' : 'inherit', fontWeight: selectedDeptManage === d.id ? 'bold' : 'normal', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={() => setSelectedDeptManage(d.id)}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
                            <button 
                              className="delete-small-icon"
                              onClick={(e) => { e.stopPropagation(); setDeleteRequest({ type: 'dept', id: d.id, name: d.name }); }}
                            >
                              <Trash2 size={14} />
                            </button>
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
                          <div key={p.id} className="m-item" style={{ padding: '12px 16px', borderRadius: '10px', marginBottom: '8px', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                            <button 
                              className="delete-small-icon"
                              onClick={(e) => { e.stopPropagation(); setDeleteRequest({ type: 'promo', id: p.id, name: p.name }); }}
                            >
                              <Trash2 size={14} />
                            </button>
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
                        <div key={s.id} className="m-item" style={{ padding: '12px 16px', borderRadius: '10px', marginBottom: '8px', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                          <button 
                            className="delete-small-icon"
                            onClick={(e) => { e.stopPropagation(); setDeleteRequest({ type: 'session', id: s.id, name: s.name }); }}
                          >
                            <Trash2 size={14} />
                          </button>
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
        .delete-small-icon { background: none; border: none; color: #cbd5e1; cursor: pointer; transition: all 0.2s; padding: 4px; border-radius: 6px; }
        .delete-small-icon:hover { color: #ef4444; background: #fee2e2; }
        .delete-icon-archive { position: absolute; top: 12px; right: 12px; background: white; border: 1px solid #f1f5f9; color: #cbd5e1; padding: 6px; border-radius: 8px; cursor: pointer; transition: all 0.2s; opacity: 0; }
        .stat-card:hover .delete-icon-archive { opacity: 1; color: #ef4444; }
      `}</style>
    </div>
  )
}
