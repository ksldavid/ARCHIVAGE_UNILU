'use client'

import React, { useState, useEffect } from 'react'
import Sidebar from '../../components/Sidebar'
import { getAppData, searchArchives } from '../actions'
import { 
  Search, Calendar, Building2, Layers, Loader2, 
  ExternalLink, FileText, Download, X, AlertCircle,
  User, Database, GraduationCap, Printer, Clock, TrendingUp
} from 'lucide-react'

export default function MainDashboard() {
  const [faculties, setFaculties] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [recentArchives, setRecentArchives] = useState<any[]>([])
  const [allYears, setAllYears] = useState<string[]>([])
  const [stats, setStats] = useState({ students: 0, archives: 0 })
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [query, setQuery] = useState('')
  const [selectedFacId, setSelectedFacId] = useState('')
  const [selectedDeptId, setSelectedDeptId] = useState('')
  const [selectedPromoId, setSelectedPromoId] = useState('')
  const [selectedSessionId, setSelectedSessionId] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  
  // Results
  const [results, setResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Selected Student for Modal
  const [selectedArchive, setSelectedArchive] = useState<any | null>(null)

  useEffect(() => {
    getAppData().then(data => {
      setFaculties(data.faculties)
      setSessions(data.sessions)
      setRecentArchives(data.recentArchives.slice(0, 4))
      setStats({ students: data.totalStudents, archives: data.totalArchivesCount })
      const years = new Set<string>()
      data.recentArchives.forEach((a: any) => years.add(a.academicYear))
      const sortedYears = Array.from(years).sort().reverse()
      setAllYears(sortedYears)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.length > 1 || selectedFacId || selectedDeptId || selectedPromoId || selectedSessionId || selectedYear) {
        performSearch()
      } else {
        setResults([])
      }
    }, 400)
    return () => clearTimeout(delayDebounceFn)
  }, [query, selectedFacId, selectedDeptId, selectedPromoId, selectedSessionId, selectedYear])

  const performSearch = async () => {
    setIsSearching(true)
    try {
      const res = await searchArchives({
        query,
        facultyId: selectedFacId,
        deptId: selectedDeptId,
        promoId: selectedPromoId,
        sessionId: selectedSessionId,
        year: selectedYear
      })
      setResults(res)
    } catch (err) {
      console.error(err)
    } finally {
      setIsSearching(false)
    }
  }

  const selectedFaculty = faculties.find(f => f.id === selectedFacId)
  const departments = selectedFaculty ? selectedFaculty.departments : []
  const promotions = departments.find((d: any) => d.id === selectedDeptId)?.promotions || []

  return (
    <div className="dashboard-wrapper" suppressHydrationWarning>
      <Sidebar />

      <main className="main-content" style={{ padding: '30px 20px', maxWidth: '1600px', margin: '0 auto' }}>
        <header style={{ marginBottom: '30px', padding: '0 20px' }}>
          <h1 style={{ fontFamily: 'Outfit', fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary-blue)', margin: 0 }}>
            Recherche Intelligente
          </h1>
          <p style={{ color: '#64748b', margin: '6px 0 0 0', fontSize: '1.1rem' }}>
            Consultez les résultats officiels archivés dans la base de données de l'UNILU.
          </p>
        </header>

        {/* FILTERS CARD */}
        <div style={{ 
          background: 'white', borderRadius: '28px', padding: '28px', 
          boxShadow: '0 20px 60px rgba(0,0,0,0.06)', border: '1px solid #f0f4f8',
          marginBottom: '40px', margin: '0 0 40px 0'
        }}>
          {/* Search bar top */}
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <Search style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', zIndex: 1 }} size={22} />
            <input 
              type="text" 
              placeholder="Rechercher un étudiant par nom..." 
              value={query} 
              onChange={e => setQuery(e.target.value)}
              style={{ 
                width: '100%', padding: '20px 60px 20px 56px', 
                borderRadius: '18px', border: '2px solid #e2e8f0', 
                outline: 'none', background: '#f8fafc', fontWeight: 500, 
                fontSize: '1.05rem', transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent-cyan)'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
            {query && (
              <button onClick={() => setQuery('')} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                <X size={16} />
              </button>
            )}
          </div>

          {/* Filters row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
            <FilterSelect
              icon={<Building2 size={15} />}
              label="Faculté"
              value={selectedFacId}
              onChange={v => { setSelectedFacId(v); setSelectedDeptId(''); setSelectedPromoId('') }}
              disabled={false}
            >
              <option value="">Toutes</option>
              {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </FilterSelect>

            <FilterSelect
              icon={<Layers size={15} />}
              label="Département"
              value={selectedDeptId}
              onChange={v => { setSelectedDeptId(v); setSelectedPromoId('') }}
              disabled={!selectedFacId}
            >
              <option value="">Tous</option>
              {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </FilterSelect>

            <FilterSelect
              icon={<GraduationCap size={15} />}
              label="Promotion"
              value={selectedPromoId}
              onChange={v => setSelectedPromoId(v)}
              disabled={!selectedDeptId}
            >
              <option value="">Toutes</option>
              {promotions.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </FilterSelect>

            <FilterSelect
              icon={<FileText size={15} />}
              label="Session"
              value={selectedSessionId}
              onChange={v => setSelectedSessionId(v)}
              disabled={false}
            >
              <option value="">Toutes</option>
              {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </FilterSelect>

            <FilterSelect
              icon={<Calendar size={15} />}
              label="Année"
              value={selectedYear}
              onChange={v => setSelectedYear(v)}
              disabled={false}
            >
              <option value="">Toutes</option>
              {allYears.map(y => <option key={y} value={y}>{y}</option>)}
            </FilterSelect>
          </div>

          {/* Active filters tags */}
          {(selectedFacId || selectedDeptId || selectedPromoId || selectedSessionId || selectedYear) && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>FILTRES ACTIFS :</span>
              {selectedFacId && <FilterTag label={faculties.find(f => f.id === selectedFacId)?.name} onRemove={() => { setSelectedFacId(''); setSelectedDeptId(''); setSelectedPromoId('') }} />}
              {selectedDeptId && <FilterTag label={departments.find((d: any) => d.id === selectedDeptId)?.name} onRemove={() => { setSelectedDeptId(''); setSelectedPromoId('') }} />}
              {selectedPromoId && <FilterTag label={promotions.find((p: any) => p.id === selectedPromoId)?.name} onRemove={() => setSelectedPromoId('')} />}
              {selectedSessionId && <FilterTag label={sessions.find(s => s.id === selectedSessionId)?.name} onRemove={() => setSelectedSessionId('')} />}
              {selectedYear && <FilterTag label={selectedYear} onRemove={() => setSelectedYear('')} />}
              <button onClick={() => { setQuery(''); setSelectedFacId(''); setSelectedDeptId(''); setSelectedPromoId(''); setSelectedSessionId(''); setSelectedYear('') }} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <X size={14} /> Tout effacer
              </button>
            </div>
          )}
        </div>

        {/* RESULTS OR LANDING AREA */}
        <div>
          {isSearching && <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><Loader2 size={36} className="animate-spin" color="var(--accent-cyan)" /></div>}
          
          {(query.length > 1 || selectedFacId || selectedYear || selectedSessionId || selectedPromoId) ? (
            /* LISTE DES RÉSULTATS */
            <>
              {results.length === 0 && !isSearching ? (
                <div style={{ textAlign: 'center', padding: '60px 0', background: 'white', borderRadius: '24px', border: '1px dashed #e2e8f0' }}>
                  <AlertCircle size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
                  <p style={{ color: '#94a3b8', fontWeight: 600 }}>Aucun résultat trouvé pour ces critères.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '20px' }}>
                  {results.map((archive, i) => <ArchiveCard key={i} archive={archive} onClick={() => setSelectedArchive(archive)} />)}
                </div>
              )}
            </>
          ) : (
            /* PAGE D'ACCUEIL (STATS & RÉCENTS) */
            <div className="animate-fade-in">
              {/* Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '40px' }}>
                <QuickStat icon={<Users size={24} color="#3b82f6" />} label="Total Étudiants" value={stats.students.toLocaleString()} color="#eff6ff" />
                <QuickStat icon={<Building2 size={24} color="#f59e0b" />} label="Facultés" value={faculties.length.toString()} color="#fffbeb" />
                <QuickStat icon={<Database size={24} color="#10b981" />} label="Fichiers Archivés" value={stats.archives.toLocaleString()} color="#ecfdf5" />
              </div>

              {/* Recent Activity */}
              <div style={{ background: 'white', borderRadius: '24px', padding: '30px', border: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                  <Clock size={20} color="var(--accent-cyan)" />
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--primary-blue)', fontWeight: 800 }}>Dernières archives consultées</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                  {recentArchives.length === 0 ? (
                    <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>Aucune archive récente.</p>
                  ) : recentArchives.map((archive, i) => (
                    <div key={i} onClick={() => setSelectedArchive(archive)} style={{ display: 'flex', gap: '14px', padding: '16px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9', cursor: 'pointer', transition: 'all 0.2s' }} className="recent-item">
                      <div style={{ width: '40px', height: '40px', background: 'white', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--primary-blue)', fontSize: '0.9rem', flexShrink: 0 }}>{archive.student.name.charAt(0)}</div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: '0.85rem', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{archive.student.name}</p>
                        <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>{archive.promotion.name} · {archive.academicYear}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FICHE INDIVIDUELLE */}
        {selectedArchive && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
            <div className="animate-fade-in" style={{ background: 'white', width: '100%', maxWidth: '700px', borderRadius: '30px', overflow: 'hidden', boxShadow: '0 30px 60px -12px rgba(0,0,0,0.3)' }}>
              <div style={{ background: 'linear-gradient(135deg, #0a4a5c 0%, #166075 100%)', padding: '40px', color: 'white', position: 'relative' }}>
                <button onClick={() => setSelectedArchive(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.1)', border: 'none', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={24} /></button>
                <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                  <div style={{ width: '80px', height: '80px', background: 'white', borderRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 900, color: '#0a4a5c', boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}>{selectedArchive.student.name.charAt(0)}</div>
                  <div><h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, fontFamily: 'Outfit' }}>{selectedArchive.student.name}</h2><p style={{ margin: '5px 0 0 0', opacity: 0.8, fontSize: '1rem', fontWeight: 500 }}>{selectedArchive.faculty.name}</p></div>
                </div>
              </div>
              <div style={{ padding: '40px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '40px' }}>
                  <DetailItem icon={<Building2 size={18}/>} label="DÉPARTEMENT" value={selectedArchive.department.name} />
                  <DetailItem icon={<GraduationCap size={18}/>} label="PROMOTION" value={selectedArchive.promotion.name} />
                  <DetailItem icon={<Calendar size={18}/>} label="ANNÉE ACADÉMIQUE" value={selectedArchive.academicYear} />
                  <DetailItem icon={<Database size={18}/>} label="SESSION D'EXAMEN" value={selectedArchive.session.name} />
                </div>
                <div style={{ background: '#f8fafc', borderRadius: '20px', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px', border: '1px solid #f1f5f9' }}>
                  <div><p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 800, color: '#94a3b8' }}>DÉCISION FINALE DU JURY</p><p style={{ margin: '4px 0 0 0', fontSize: '1.4rem', fontWeight: 900, color: '#1e293b' }}>{selectedArchive.decision}</p></div>
                  <div style={{ padding: '12px 24px', borderRadius: '14px', fontWeight: 800, fontSize: '1.1rem', background: selectedArchive.decision.includes('ADM') ? '#dcfce7' : '#fef9c3', color: selectedArchive.decision.includes('ADM') ? '#166534' : '#854d0e' }}>{selectedArchive.decision.includes('ADM') ? 'ADMIS' : 'A JOURNER'}</div>
                </div>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <a href={`/api/download?url=${encodeURIComponent(selectedArchive.referenceLink)}&name=${encodeURIComponent(selectedArchive.student.name + '_' + selectedArchive.promotion.name)}`} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: '#0a4a5c', color: 'white', padding: '18px', borderRadius: '16px', fontWeight: 800, textDecoration: 'none', boxShadow: '0 10px 20px rgba(10,74,92,0.2)' }}><FileText size={20} /> Télécharger la Fiche</a>
                  <button onClick={() => window.print()} style={{ padding: '18px 24px', background: '#f1f5f9', border: 'none', borderRadius: '16px', cursor: 'pointer', color: '#475569' }}><Printer size={20} /></button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .student-card:hover { transform: translateY(-5px); box-shadow: 0 15px 35px rgba(0,0,0,0.1) !important; border-color: var(--accent-cyan) !important; }
        .recent-item:hover { background: #f0f9fb !important; border-color: var(--accent-cyan) !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  )
}

function ArchiveCard({ archive, onClick }: { archive: any, onClick: () => void }) {
  return (
    <div onClick={onClick} className="student-card" style={{ background: 'white', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9', transition: 'all 0.2s', cursor: 'pointer' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', background: '#f0f9fb', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>{archive.student.name.charAt(0)}</div>
          <div><h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--primary-blue)', fontWeight: 800 }}>{archive.student.name}</h3><p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{archive.faculty.name}</p></div>
        </div>
        <span style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 800, background: archive.decision.includes('ADM') ? '#dcfce7' : '#fef9c3', color: archive.decision.includes('ADM') ? '#166534' : '#854d0e' }}>{archive.decision}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px', background: '#f8fafc', padding: '12px', borderRadius: '12px', fontSize: '0.75rem' }}>
        <div><p style={{ margin: 0, color: '#94a3b8', fontWeight: 700 }}>DÉPT</p><p style={{ margin: 0, fontWeight: 700, color: '#475569' }}>{archive.department.name}</p></div>
        <div><p style={{ margin: 0, color: '#94a3b8', fontWeight: 700 }}>ANNÉE</p><p style={{ margin: 0, fontWeight: 700, color: '#475569' }}>{archive.academicYear}</p></div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{archive.promotion.name}</span>
        <ChevronRight size={16} color="#cbd5e1" />
      </div>
    </div>
  )
}

function QuickStat({ icon, label, value, color }: { icon: any, label: string, value: string, color: string }) {
  return (
    <div style={{ background: color, padding: '24px', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '20px', border: '1px solid rgba(0,0,0,0.03)' }}>
      <div style={{ background: 'white', width: '50px', height: '50px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>{icon}</div>
      <div>
        <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>{label}</p>
        <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: 'var(--primary-blue)' }}>{value}</p>
      </div>
    </div>
  )
}

function DetailItem({ icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
      <div style={{ color: '#94a3b8' }}>{icon}</div>
      <div>
        <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.05em' }}>{label}</p>
        <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>{value}</p>
      </div>
    </div>
  )
}

function ChevronRight({ size, color }: { size: number, color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6"/>
    </svg>
  )
}

function Users({ size, color }: { size: number, color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
}

function FilterSelect({ icon, label, value, onChange, disabled, children }: {
  icon: React.ReactNode, label: string, value: string,
  onChange: (v: string) => void, disabled: boolean, children: React.ReactNode
}) {
  const isActive = value !== ''
  return (
    <div style={{ 
      position: 'relative',
      background: disabled ? '#f8fafc' : (isActive ? '#f0f9fb' : 'white'),
      borderRadius: '16px',
      border: `1.5px solid ${isActive ? 'var(--accent-cyan)' : '#e8edf2'}`,
      overflow: 'hidden',
      opacity: disabled ? 0.5 : 1,
      transition: 'all 0.2s'
    }}>
      <div style={{ 
        position: 'absolute', left: '12px', top: '10px', 
        display: 'flex', alignItems: 'center', gap: '5px',
        color: isActive ? 'var(--accent-cyan)' : '#94a3b8',
        fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase',
        letterSpacing: '0.06em', pointerEvents: 'none', zIndex: 1
      }}>
        {icon}
        <span>{label}</span>
      </div>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        style={{ 
          width: '100%',
          padding: '32px 32px 10px 12px',
          border: 'none', outline: 'none',
          background: 'transparent',
          fontWeight: 700, fontSize: '0.85rem',
          color: isActive ? 'var(--primary-blue)' : '#64748b',
          cursor: disabled ? 'not-allowed' : 'pointer',
          appearance: 'none',
          WebkitAppearance: 'none'
        }}
      >
        {children}
      </select>
      <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6"/></svg>
      </div>
    </div>
  )
}

function FilterTag({ label, onRemove }: { label: string, onRemove: () => void }) {
  return (
    <span style={{ 
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      background: '#f0f9fb', color: 'var(--primary-blue)',
      border: '1px solid #bae6fd',
      padding: '4px 10px 4px 12px', borderRadius: '20px',
      fontSize: '0.78rem', fontWeight: 700
    }}>
      {label}
      <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', padding: 0 }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
    </span>
  )
}
