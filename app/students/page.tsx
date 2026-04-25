'use client'

import React, { useState, useEffect } from 'react'
import Sidebar from '../../components/Sidebar'
import { getAppData, getPromotionStats } from '../actions'
import { 
  Search, Calendar, Building2, GraduationCap, Loader2, 
  BarChart3, Users, CheckCircle2, AlertCircle, X, ChevronRight, PieChart
} from 'lucide-react'

export default function StudentsPage() {
  const [faculties, setFaculties] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [allYears, setAllYears] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedFacId, setSelectedFacId] = useState('')
  const [selectedDeptId, setSelectedDeptId] = useState('')
  const [selectedPromoId, setSelectedPromoId] = useState('')
  const [selectedSessionId, setSelectedSessionId] = useState('')

  // Results
  const [results, setResults] = useState<{ archives: any[], stats: any } | null>(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    getAppData().then(data => {
      setFaculties(data.faculties)
      setSessions(data.sessions)
      const years = new Set<string>()
      data.recentArchives.forEach((a: any) => years.add(a.academicYear))
      const sortedYears = Array.from(years).sort().reverse()
      setAllYears(sortedYears)
      if (sortedYears.length > 0) setSelectedYear(sortedYears[0])
      setLoading(false)
    })
  }, [])

  const departments = faculties.find(f => f.id === selectedFacId)?.departments || []
  const promotions = departments.find((d: any) => d.id === selectedDeptId)?.promotions || []

  const handleSearch = async () => {
    if (!selectedYear || !selectedPromoId || !selectedSessionId) return
    setProcessing(true)
    try {
      const res = await getPromotionStats({
        year: selectedYear,
        promoId: selectedPromoId,
        sessionId: selectedSessionId
      })
      setResults(res)
    } catch (err) {
      console.error(err)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="dashboard-wrapper">
      <Sidebar />
      <main className="main-content" style={{ padding: '30px 40px' }}>
        <header style={{ marginBottom: '30px' }}>
          <h1 style={{ fontFamily: 'Outfit', fontSize: '2.2rem', fontWeight: 800, color: 'var(--primary-blue)', margin: 0 }}>
            Statistiques par Promotion
          </h1>
          <p style={{ color: '#64748b', margin: '6px 0 0 0' }}>
            Analysez les résultats globaux d'une promotion pour une session donnée.
          </p>
        </header>

        {/* FILTERS PANEL */}
        <div style={{ background: 'white', borderRadius: '24px', padding: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', marginBottom: '30px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            
            {/* Year */}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', display: 'block', marginBottom: '8px' }}>ANNÉE ACADÉMIQUE</label>
              <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', background: '#f8fafc', fontWeight: 600 }}>
                {allYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            {/* Faculty */}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', display: 'block', marginBottom: '8px' }}>FACULTÉ</label>
              <select value={selectedFacId} onChange={e => { setSelectedFacId(e.target.value); setSelectedDeptId(''); setSelectedPromoId('') }} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', background: '#f8fafc', fontWeight: 600 }}>
                <option value="">Sélectionnez...</option>
                {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>

            {/* Department */}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', display: 'block', marginBottom: '8px' }}>DÉPARTEMENT</label>
              <select value={selectedDeptId} onChange={e => { setSelectedDeptId(e.target.value); setSelectedPromoId('') }} disabled={!selectedFacId} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', background: !selectedFacId ? '#f1f5f9' : '#f8fafc', fontWeight: 600 }}>
                <option value="">Sélectionnez...</option>
                {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>

            {/* Promotion */}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', display: 'block', marginBottom: '8px' }}>PROMOTION</label>
              <select value={selectedPromoId} onChange={e => setSelectedPromoId(e.target.value)} disabled={!selectedDeptId} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', background: !selectedDeptId ? '#f1f5f9' : '#f8fafc', fontWeight: 600 }}>
                <option value="">Sélectionnez...</option>
                {promotions.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            {/* Session */}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', display: 'block', marginBottom: '8px' }}>SESSION</label>
              <select value={selectedSessionId} onChange={e => setSelectedSessionId(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', background: '#f8fafc', fontWeight: 600 }}>
                <option value="">Sélectionnez...</option>
                {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <button 
            onClick={handleSearch}
            disabled={processing || !selectedPromoId || !selectedSessionId}
            style={{ width: '100%', marginTop: '24px', padding: '16px', background: 'var(--primary-blue)', color: 'white', border: 'none', borderRadius: '16px', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 10px 25px rgba(10,74,92,0.2)', opacity: (processing || !selectedPromoId || !selectedSessionId) ? 0.6 : 1 }}
          >
            {processing ? <Loader2 className="animate-spin" /> : <BarChart3 size={20} />}
            {processing ? 'Chargement...' : 'Afficher les Statistiques'}
          </button>
        </div>

        {/* RESULTS AREA */}
        {results ? (
          <div className="animate-fade-in">
            {/* Stats Dashboard */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
              <StatCard label="Total Étudiants" value={results.stats.total} color="#eff6ff" textColor="#1e40af" icon={<Users size={20}/>} />
              <StatCard label="Admis" value={results.stats.admis} color="#ecfdf5" textColor="#065f46" icon={<CheckCircle2 size={20}/>} percentage={Math.round((results.stats.admis/results.stats.total)*100)} />
              <StatCard label="Ajournés / Déf." value={results.stats.ajournes} color="#fef2f2" textColor="#991b1b" icon={<X size={20}/>} percentage={Math.round((results.stats.ajournes/results.stats.total)*100)} />
              <StatCard label="Autres / Recours" value={results.stats.autres} color="#fffbeb" textColor="#92400e" icon={<PieChart size={20}/>} percentage={Math.round((results.stats.autres/results.stats.total)*100)} />
            </div>

            {/* List Table */}
            <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.05)' }}>
              <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--primary-blue)', fontWeight: 800 }}>Liste Nominative des Résultats</h3>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'white', textAlign: 'left', borderBottom: '2px solid #f1f5f9' }}>
                    <th style={{ padding: '20px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Nom de l'étudiant</th>
                    <th style={{ padding: '20px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Décision</th>
                    <th style={{ padding: '20px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {results.archives.map((a, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '15px 20px', fontWeight: 700, color: '#1e293b', fontSize: '0.9rem' }}>{a.student.name}</td>
                      <td style={{ padding: '15px 20px' }}>
                        <span style={{ 
                          padding: '5px 12px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800,
                          background: a.decision.includes('ADM') ? '#dcfce7' : '#fef2f2',
                          color: a.decision.includes('ADM') ? '#166534' : '#991b1b'
                        }}>
                          {a.decision}
                        </span>
                      </td>
                      <td style={{ padding: '15px 20px', textAlign: 'right' }}>
                        <button onClick={() => window.open(`/api/download?url=${encodeURIComponent(a.referenceLink)}&name=${encodeURIComponent(a.student.name)}`)} style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          Fiche <ChevronRight size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '100px 0', opacity: 0.5 }}>
            <BarChart3 size={80} color="#e2e8f0" style={{ marginBottom: '20px' }} />
            <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>Sélectionnez une promotion pour voir les statistiques.</p>
          </div>
        )}
      </main>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  )
}

function StatCard({ label, value, color, textColor, icon, percentage }: any) {
  return (
    <div style={{ background: color, padding: '24px', borderRadius: '24px', border: '1px solid rgba(0,0,0,0.02)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ color: textColor, background: 'white', padding: '10px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>{icon}</div>
        {percentage !== undefined && (
          <span style={{ fontSize: '0.9rem', fontWeight: 900, color: textColor }}>{percentage}%</span>
        )}
      </div>
      <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: textColor, opacity: 0.7 }}>{label}</p>
      <p style={{ margin: '4px 0 0 0', fontSize: '1.8rem', fontWeight: 900, color: textColor }}>{value}</p>
    </div>
  )
}
