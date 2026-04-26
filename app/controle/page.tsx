'use client'

import React, { useState, useEffect } from 'react'
import Sidebar from '../../components/Sidebar'
import { getAppData, traceStudents } from '../actions'
import { 
  FileUp, Search, Calendar, Building2, 
  Loader2, CheckCircle2, AlertCircle, ExternalLink,
  Plus, Trash2, GraduationCap, X, ChevronDown, CheckSquare, Square
} from 'lucide-react'

export default function ControlePage() {
  const [faculties, setFaculties] = useState<any[]>([])
  const [allYears, setAllYears] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  // Selection states
  const [file, setFile] = useState<File | null>(null)
  const [selectedPromos, setSelectedPromos] = useState<{id: string, name: string, dept: string, faculty: string}[]>([])
  const [startYear, setStartYear] = useState('')
  const [endYear, setEndYear] = useState('')
  
  // UI States
  const [tempDeptId, setTempDeptId] = useState('')
  const [availablePromos, setAvailablePromos] = useState<any[]>([])

  // Results
  const [results, setResults] = useState<{checkpoints: any[], grid: any[]} | null>(null)

  useEffect(() => {
    getAppData().then(data => {
      setFaculties(data.faculties)
      const years = new Set<string>()
      data.recentArchives.forEach((a: any) => years.add(a.academicYear))
      const sortedYears = Array.from(years).sort()
      setAllYears(sortedYears)
      if (sortedYears.length > 0) {
        setStartYear(sortedYears[0])
        setEndYear(sortedYears[sortedYears.length - 1])
      }
      setLoading(false)
    })
  }, [])

  // Quand on change de département, on met à jour les promos dispos
  useEffect(() => {
    if (!tempDeptId) {
      setAvailablePromos([])
      return
    }
    for (const f of faculties) {
      const d = f.departments.find((d: any) => d.id === tempDeptId)
      if (d) {
        setAvailablePromos(d.promotions)
        break
      }
    }
  }, [tempDeptId, faculties])

  const togglePromo = (promo: any) => {
    const isSelected = selectedPromos.find(p => p.id === promo.id)
    if (isSelected) {
      setSelectedPromos(selectedPromos.filter(p => p.id !== promo.id))
    } else {
      // Trouver les infos du dept et fac
      let deptName = '', facName = ''
      for (const f of faculties) {
        const d = f.departments.find((d: any) => d.id === tempDeptId)
        if (d) { deptName = d.name; facName = f.name; break }
      }
      setSelectedPromos([...selectedPromos, { id: promo.id, name: promo.name, dept: deptName, faculty: facName }])
    }
  }

  const removePromo = (id: string) => {
    setSelectedPromos(selectedPromos.filter(p => p.id !== id))
  }

  const handleProcess = async () => {
    if (!file || selectedPromos.length === 0) return
    setProcessing(true)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('promoIds', JSON.stringify(selectedPromos.map(p => p.id)))
      formData.append('startYear', startYear)
      formData.append('endYear', endYear)
      
      const res = await traceStudents(formData)
      setResults(res)
    } catch (err) {
      alert("Erreur lors du traitement")
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="dashboard-wrapper" suppressHydrationWarning>
      <Sidebar />
      <main className="main-content" style={{ padding: '30px 40px' }}>
        <header style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontFamily: 'Outfit', fontSize: '2.2rem', fontWeight: 800, color: 'var(--primary-blue)', margin: 0 }}>
              Contrôle de Scolarité
            </h1>
            <p style={{ color: '#64748b', margin: '6px 0 0 0' }}>
              Sélectionnez les promotions et la plage d'années pour générer la grille de résultats.
            </p>
          </div>
          {results && (
            <button onClick={() => setResults(null)} style={{ background: '#f1f5f9', border: 'none', padding: '10px 20px', borderRadius: '12px', color: '#64748b', fontWeight: 600, cursor: 'pointer' }}>
              Nouveau contrôle
            </button>
          )}
        </header>

        {!results ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            
            {/* PANEL GAUCHE : FICHIER & ANNÉES */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <section style={{ background: 'white', borderRadius: '24px', padding: '28px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', color: 'var(--primary-blue)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FileUp size={20} color="var(--accent-cyan)" /> 1. Charger la liste
                </h3>
                <div 
                  onClick={() => document.getElementById('file-input')?.click()}
                  style={{
                    border: '2px dashed #e2e8f0', borderRadius: '16px', padding: '40px 20px',
                    textAlign: 'center', cursor: 'pointer', background: file ? '#f0f9fb' : '#f8fafc',
                    transition: 'all 0.2s'
                  }}
                >
                  <input id="file-input" type="file" accept=".xlsx,.xls" hidden onChange={e => setFile(e.target.files?.[0] || null)} />
                  {file ? (
                    <div style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>
                      <CheckCircle2 size={32} style={{ marginBottom: '8px' }} />
                      <p style={{ margin: 0 }}>{file.name}</p>
                    </div>
                  ) : (
                    <div style={{ color: '#94a3b8' }}>
                      <FileUp size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                      <p style={{ margin: 0 }}>Cliquez pour uploader le fichier Excel</p>
                    </div>
                  )}
                </div>
              </section>

              <section style={{ background: 'white', borderRadius: '24px', padding: '28px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', color: 'var(--primary-blue)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Calendar size={20} color="var(--accent-cyan)" /> 2. Plage d'années
                </h3>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '8px' }}>ANNÉE DE DÉBUT</label>
                    <select value={startYear} onChange={e => setStartYear(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none' }}>
                      {allYears.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '8px' }}>ANNÉE DE FIN</label>
                    <select value={endYear} onChange={e => setEndYear(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none' }}>
                      {allYears.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
              </section>
            </div>

            {/* PANEL DROITE : PROMOTIONS */}
            <section style={{ background: 'white', borderRadius: '24px', padding: '28px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', color: 'var(--primary-blue)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <GraduationCap size={20} color="var(--accent-cyan)" /> 3. Sélectionner les promotions
              </h3>
              
              <div style={{ position: 'relative', marginBottom: '20px' }}>
                <select 
                  value={tempDeptId}
                  onChange={e => setTempDeptId(e.target.value)}
                  style={{ width: '100%', padding: '14px 40px 14px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', appearance: 'none', background: '#f8fafc', outline: 'none' }}
                >
                  <option value="">Sélectionnez un département...</option>
                  {faculties.map(f => (
                    <optgroup key={f.id} label={f.name}>
                      {f.departments.map((d: any) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <ChevronDown size={18} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
              </div>

              {tempDeptId && (
                <div style={{ background: '#f0f9fb', borderRadius: '16px', padding: '16px', marginBottom: '20px' }}>
                  <p style={{ margin: '0 0 12px 0', fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>Promotions disponibles</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {availablePromos.map(p => {
                      const isSelected = selectedPromos.find(sp => sp.id === p.id)
                      return (
                        <div key={p.id} onClick={() => togglePromo(p)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: 'white', borderRadius: '10px', cursor: 'pointer', border: '1px solid', borderColor: isSelected ? 'var(--accent-cyan)' : 'transparent', transition: 'all 0.2s' }}>
                          {isSelected ? <CheckSquare size={16} color="var(--accent-cyan)" /> : <Square size={16} color="#cbd5e1" />}
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1e293b' }}>{p.name}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div style={{ flex: 1, overflowY: 'auto' }}>
                <p style={{ margin: '0 0 10px 0', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Panier de recherche ({selectedPromos.length})</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedPromos.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px 0', color: '#cbd5e1' }}>
                      <AlertCircle size={30} style={{ marginBottom: '8px', opacity: 0.5 }} />
                      <p style={{ margin: 0, fontSize: '0.8rem' }}>Aucune promotion ajoutée</p>
                    </div>
                  ) : selectedPromos.map(p => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</p>
                        <p style={{ margin: 0, fontSize: '0.65rem', color: '#94a3b8' }}>{p.dept} · {p.faculty}</p>
                      </div>
                      <button onClick={() => removePromo(p.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}>
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleProcess}
                disabled={processing || !file || selectedPromos.length === 0}
                style={{
                  background: 'linear-gradient(135deg, var(--primary-blue), #1ba9c1)',
                  color: 'white', padding: '18px', borderRadius: '16px', border: 'none',
                  fontWeight: 800, fontSize: '1rem', cursor: 'pointer', marginTop: '20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  boxShadow: '0 10px 25px rgba(27,169,193,0.3)', opacity: (processing || !file || selectedPromos.length === 0) ? 0.6 : 1
                }}
              >
                {processing ? <Loader2 size={22} className="animate-spin" /> : <Search size={22} />}
                {processing ? 'Analyse en cours...' : 'Lancer le contrôle'}
              </button>
            </section>
          </div>
        ) : (
          /* TABLEAU DE RÉSULTATS (GRILLE) */
          <div style={{ background: 'white', borderRadius: '24px', padding: '30px', boxShadow: '0 10px 40px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ background: '#f0f9fb', color: 'var(--accent-cyan)', padding: '10px', borderRadius: '12px' }}><CheckCircle2 size={24} /></div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--primary-blue)' }}>Grille de progression</h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>{results.grid.length} étudiants · {results.checkpoints.length} sessions scannées</p>
                </div>
              </div>
            </div>

            <div style={{ overflowX: 'auto', paddingBottom: '20px' }}>
              <table style={{ borderCollapse: 'separate', borderSpacing: '0', width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ position: 'sticky', left: 0, background: 'white', zIndex: 10, padding: '15px 20px', textAlign: 'left', borderBottom: '2px solid #f1f5f9', minWidth: '220px', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>Identité</th>
                    {results.checkpoints.map((cp, idx) => (
                      <th key={idx} style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #f1f5f9', minWidth: '140px', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', background: '#f8fafc' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', marginBottom: '4px' }}>{cp.year}</div>
                        <div style={{ fontWeight: 800, color: '#1e293b' }}>{cp.promo}</div>
                        <div style={{ fontSize: '0.65rem', fontWeight: 500 }}>{cp.session}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.grid.map((row, i) => (
                    <tr key={i} style={{ transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ position: 'sticky', left: 0, background: 'white', zIndex: 9, padding: '15px 20px', fontWeight: 700, color: 'var(--primary-blue)', fontSize: '0.85rem', borderBottom: '1px solid #f1f5f9', boxShadow: '5px 0 10px rgba(0,0,0,0.02)' }}>
                        {row.name}
                      </td>
                      {results.checkpoints.map((cp, idx) => {
                        const key = `${cp.year}|${cp.promo}|${cp.session}`
                        const res = row[key]
                        return (
                          <td key={idx} style={{ padding: '15px', textAlign: 'center', borderBottom: '1px solid #f1f5f9' }}>
                            {res ? (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                                <span style={{ 
                                  padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800,
                                  background: res.decision.includes('ADM') ? '#dcfce7' : '#fef9c3',
                                  color: res.decision.includes('ADM') ? '#166534' : '#854d0e'
                                }}>
                                  {res.decision}
                                </span>
                                {res.link && (
                                  <a href={`/api/download?url=${encodeURIComponent(res.link)}&name=${encodeURIComponent(cp.promo + '_' + cp.session)}`} style={{ color: 'var(--accent-cyan)', textDecoration: 'none', fontSize: '0.65rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                                    Fiche <ExternalLink size={10} />
                                  </a>
                                )}
                              </div>
                            ) : (
                              <span style={{ color: '#e2e8f0' }}>—</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
        ::-webkit-scrollbar { height: 8px; width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  )
}
