'use client'

import React, { useState, useEffect } from 'react'
import Sidebar from '../../components/Sidebar'
import { getArchivesTree } from '../actions'
import { FileText, ExternalLink, Calendar, Building2, Loader2, ChevronDown, FolderOpen, Search, BookOpen, GraduationCap, Folder, Layers, X, Download } from 'lucide-react'

type StudentEntry = { id: string; studentName: string; decision: string; referenceLink: string | null }
type SessionData = { id: string; name: string; students: StudentEntry[] }
type PromotionData = { id: string; name: string; sessions: SessionData[] }
type DeptData = { id: string; name: string; promotions: PromotionData[] }
type YearData = { year: string; departments: DeptData[] }
type FacultyNode = { id: string; name: string; years: YearData[] }

export default function ArchivesPage() {
  const [tree, setTree] = useState<FacultyNode[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFaculty, setSelectedFaculty] = useState<FacultyNode | null>(null)
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set())
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set())
  const [expandedPromos, setExpandedPromos] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [previewData, setPreviewData] = useState<{
    faculty: string, promo: string, dept: string, year: string, session: string, students: StudentEntry[]
  } | null>(null)

  useEffect(() => {
    getArchivesTree().then(data => {
      const d = data as FacultyNode[]
      setTree(d)
      if (d.length > 0) setSelectedFaculty(d[0])
      setLoading(false)
    })
  }, [])

  const toggle = (set: Set<string>, setFn: (s: Set<string>) => void, key: string) => {
    const n = new Set(set); n.has(key) ? n.delete(key) : n.add(key); setFn(n)
  }

  const countFiles = (f: FacultyNode) =>
    f.years.reduce((a, y) => a + y.departments.reduce((b, d) => b + d.promotions.reduce((c, p) => c + p.sessions.length, 0), 0), 0)

  const totalFiles = selectedFaculty ? countFiles(selectedFaculty) : 0
  const totalDepts = selectedFaculty?.years.reduce((a, y) => a + y.departments.length, 0) ?? 0

  const openPreview = (session: SessionData, promoName: string, deptName: string, year: string) => {
    setPreviewData({
      faculty: selectedFaculty?.name || '',
      promo: promoName,
      dept: deptName,
      year: year,
      session: session.name,
      students: session.students
    })
    setShowModal(true)
  }

  const exportToCSV = () => {
    if (!previewData) return
    const headers = ['Nom de l\'etudiant', 'Decision Final']
    const rows = previewData.students.map(s => [s.studentName, s.decision])
    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `Archives_${previewData.promo}_${previewData.session}.csv`
    link.click()
  }

  const filteredFaculties = tree.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="dashboard-wrapper">
      <Sidebar />
      <main className="main-content" style={{ padding: '30px 40px' }}>
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontFamily: 'Outfit', fontSize: '2rem', fontWeight: 800, color: 'var(--primary-blue)', margin: 0 }}>Archives Académiques</h1>
          <p style={{ color: '#64748b', margin: '6px 0 0 0' }}>Consultez et téléchargez les fichiers archivés par faculté, département et promotion.</p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', flexDirection: 'column', gap: '16px' }}>
            <Loader2 size={40} color="var(--accent-cyan)" style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ color: '#94a3b8', fontWeight: 500 }}>Chargement des archives...</p>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '24px', height: 'calc(100vh - 220px)' }}>

            {/* LEFT PANEL */}
            <div style={{ width: '280px', flexShrink: 0, background: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '16px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', borderRadius: '10px', padding: '8px 14px' }}>
                  <Search size={14} color="#94a3b8" />
                  <input type="text" placeholder="Filtrer les facultés..." value={search} onChange={e => setSearch(e.target.value)}
                    style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.85rem', color: '#475569', width: '100%' }} />
                </div>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
                {filteredFaculties.map(faculty => {
                  const isSelected = selectedFaculty?.id === faculty.id
                  const fc = countFiles(faculty)
                  return (
                    <div key={faculty.id} onClick={() => { setSelectedFaculty(faculty); setExpandedYears(new Set()); setExpandedDepts(new Set()); setExpandedPromos(new Set()) }}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '12px', cursor: 'pointer', marginBottom: '4px', transition: 'all 0.2s', background: isSelected ? 'linear-gradient(135deg, var(--primary-blue), #1ba9c1)' : 'transparent', color: isSelected ? 'white' : '#374151' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0, background: isSelected ? 'rgba(255,255,255,0.2)' : '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Building2 size={18} color={isSelected ? 'white' : '#f97316'} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: '0.8rem', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{faculty.name}</p>
                        <p style={{ margin: '2px 0 0 0', fontSize: '0.72rem', opacity: isSelected ? 0.8 : 0.6 }}>{faculty.years.length} an{faculty.years.length !== 1 ? 's' : ''} · {fc} sessions</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* RIGHT PANEL */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {!selectedFaculty ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                  <FolderOpen size={60} color="#e2e8f0" style={{ marginBottom: '16px' }} /><p style={{ fontWeight: 600 }}>Sélectionnez une faculté</p>
                </div>
              ) : (
                <>
                  <div style={{ background: 'linear-gradient(135deg, var(--primary-blue) 0%, #1a7a8f 100%)', borderRadius: '20px', padding: '24px 28px', color: 'white', display: 'flex', alignItems: 'center', gap: '20px', flexShrink: 0 }}>
                    <div style={{ width: '56px', height: '56px', background: 'rgba(255,255,255,0.15)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <BookOpen size={26} color="white" />
                    </div>
                    <div>
                      <h2 style={{ margin: 0, fontFamily: 'Outfit', fontSize: '1.3rem', fontWeight: 800 }}>{selectedFaculty.name}</h2>
                      <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
                        <span style={{ fontSize: '0.82rem', opacity: 0.85, display: 'flex', alignItems: 'center', gap: '5px' }}><Calendar size={12} /> {selectedFaculty.years.length} année{selectedFaculty.years.length !== 1 ? 's' : ''}</span>
                        <span style={{ fontSize: '0.82rem', opacity: 0.85, display: 'flex', alignItems: 'center', gap: '5px' }}><Layers size={12} /> {totalDepts} dept.</span>
                        <span style={{ fontSize: '0.82rem', opacity: 0.85, display: 'flex', alignItems: 'center', gap: '5px' }}><FileText size={12} /> {totalFiles} sessions</span>
                      </div>
                    </div>
                  </div>

                  {selectedFaculty.years.map(yearData => {
                    const isYearOpen = expandedYears.has(yearData.year)
                    return (
                      <div key={yearData.year} style={{ background: 'white', borderRadius: '18px', overflow: 'hidden', border: '1px solid #f1f5f9', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', flexShrink: 0 }}>
                        <div onClick={() => toggle(expandedYears, setExpandedYears, yearData.year)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 22px', cursor: 'pointer', background: isYearOpen ? '#f0f9fb' : 'white', borderBottom: isYearOpen ? '1px solid #e2f4f8' : 'none' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{ width: '40px', height: '40px', background: '#eff6ff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Calendar size={18} color="#3b82f6" /></div>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: 'var(--primary-blue)' }}>Année {yearData.year}</p>
                          </div>
                          <ChevronDown size={18} color="#94a3b8" style={{ transition: 'transform 0.25s', transform: isYearOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }} />
                        </div>

                        {isYearOpen && (
                          <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {yearData.departments.map(dept => {
                              const deptKey = `${yearData.year}-${dept.id}`
                              const isDeptOpen = expandedDepts.has(deptKey)
                              return (
                                <div key={dept.id} style={{ border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
                                  <div onClick={() => toggle(expandedDepts, setExpandedDepts, deptKey)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', cursor: 'pointer', background: isDeptOpen ? '#f0f4ff' : '#f8fafc', borderBottom: isDeptOpen ? '1px solid #dbeafe' : 'none' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Layers size={18} color="#6366f1" /><p style={{ margin: 0, fontWeight: 700, fontSize: '0.85rem', color: '#1e293b' }}>{dept.name}</p></div>
                                    <ChevronDown size={16} color="#6366f1" style={{ transition: 'transform 0.2s', transform: isDeptOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }} />
                                  </div>

                                  {isDeptOpen && (
                                    <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '6px', background: '#f8f9ff' }}>
                                      {dept.promotions.map(promo => {
                                        const promoKey = `${deptKey}-${promo.id}`
                                        const isPromoOpen = expandedPromos.has(promoKey)
                                        return (
                                          <div key={promo.id} style={{ border: '1px solid #f1f5f9', borderRadius: '12px', overflow: 'hidden' }}>
                                            <div onClick={() => toggle(expandedPromos, setExpandedPromos, promoKey)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', cursor: 'pointer', background: isPromoOpen ? '#fff7ed' : '#fafbfc', borderBottom: isPromoOpen ? '1px solid #fed7aa' : 'none' }}>
                                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Folder size={18} color="#f97316" /><p style={{ margin: 0, fontWeight: 700, fontSize: '0.83rem', color: '#1e293b' }}>{promo.name}</p></div>
                                              <ChevronDown size={14} color="#f97316" style={{ transition: 'transform 0.2s', transform: isPromoOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }} />
                                            </div>

                                            {isPromoOpen && (
                                              <div style={{ padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: '5px', background: '#fffaf7' }}>
                                                {promo.sessions.map((session, i) => (
                                                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', background: 'white', border: '1px solid #f1f5f9' }}>
                                                    <FileText size={15} color="#0891b2" />
                                                    <span style={{ flex: 1, fontWeight: 600, fontSize: '0.83rem', color: '#1e293b' }}>{session.name}</span>
                                                    <button onClick={() => openPreview(session, promo.name, dept.name, yearData.year)}
                                                      style={{ padding: '5px 12px', borderRadius: '7px', background: 'var(--primary-blue)', color: 'white', border: 'none', fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer' }}>
                                                      Ouvrir
                                                    </button>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        )
                                      })}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </>
              )}
            </div>
          </div>
        )}

        {showModal && previewData && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
            <div className="animate-fade-in" style={{ background: 'white', width: '100%', maxWidth: '900px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
              
              <div style={{ background: '#0a4a5c', padding: '24px 32px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '48px', height: '48px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Database size={24} color="white" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontFamily: 'Outfit', fontSize: '1.2rem', fontWeight: 800 }}>{previewData.faculty}</h3>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', opacity: 0.9 }}>
                      {previewData.promo} — <strong style={{ fontWeight: 800 }}>DÉPARTEMENT DE {previewData.dept.toUpperCase()}</strong> — {previewData.session.toUpperCase()} — Année {previewData.year}
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ padding: '20px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Calendar size={18} color="#64748b" />
                  <span style={{ color: '#64748b', fontWeight: 500 }}>Fiche des résultats - Session: <strong style={{ color: '#0a4a5c' }}>{previewData.session}</strong></span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {previewData.students[0]?.referenceLink && (
                    <a 
                      href={`/api/download?url=${encodeURIComponent(previewData.students[0].referenceLink)}&name=${encodeURIComponent(previewData.promo + '_' + previewData.session)}`}
                      style={{ 
                        display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 18px', 
                        background: 'white', color: '#0a4a5c', border: '1px solid #0a4a5c', 
                        borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600, 
                        cursor: 'pointer', textDecoration: 'none' 
                      }}
                    >
                      <ExternalLink size={16} /> Fichier Original (Excel)
                    </a>
                  )}
                  <button onClick={exportToCSV} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 18px', background: '#0a4a5c', color: 'white', border: 'none', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                    <Download size={16} /> Exporter en CSV
                  </button>
                </div>
              </div>

              <div style={{ maxHeight: '500px', overflowY: 'auto', padding: '0 32px 32px 32px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '20px 0', fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Identité de l'étudiant</th>
                      <th style={{ textAlign: 'right', padding: '20px 0', fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Décision Finale</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.students.map((student, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f8fafc' }}>
                        <td style={{ padding: '14px 0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '32px', height: '32px', background: '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>
                              {student.studentName.charAt(0)}
                            </div>
                            <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem' }}>{student.studentName}</span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 0', textAlign: 'right' }}>
                          <span style={{ 
                            padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800,
                            background: student.decision.includes('ADM') ? '#dcfce7' : '#fef9c3',
                            color: student.decision.includes('ADM') ? '#166534' : '#854d0e'
                          }}>
                            {student.decision}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-fade-in { animation: fadeIn 0.2s ease-out forwards; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

function Database({ size, color }: { size: number, color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
    </svg>
  )
}
