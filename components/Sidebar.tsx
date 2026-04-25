'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Search, FolderOpen, ChartBar, Users, Settings, 
  LogOut, Database
} from 'lucide-react'

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="sidebar">
      <div className="brand-section">
        <img src="/Logo-unilu.webp" alt="Logo UNILU" className="brand-logo-small" />
        <h2>UNILU Archives</h2>
      </div>

      <nav className="nav-links">
        <Link href="/dashboard" className={`nav-item-link ${pathname === '/dashboard' ? 'active' : ''}`}>
          <Search size={20} /><span>Recherche</span>
        </Link>
        <Link href="#" className="nav-item-link">
          <FolderOpen size={20} /><span>Archives</span>
        </Link>
        <Link href="#" className="nav-item-link">
          <ChartBar size={20} /><span>Statistiques</span>
        </Link>
        <Link href="#" className="nav-item-link">
          <Users size={20} /><span>Étudiants</span>
        </Link>
        
        <div className="nav-divider"></div>
        
        <Link href="/database" className={`nav-item-link ${pathname === '/database' ? 'active' : ''} nav-item-special`}>
          <Database size={20} />
          <span>Base de donnée</span>
        </Link>
      </nav>

      <div className="sidebar-footer" style={{ paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
        <Link href="#" className="nav-item-link">
          <Settings size={20} /><span>Paramètres</span>
        </Link>
        <Link href="/" className="nav-item-link">
          <LogOut size={20} /><span>Déconnexion</span>
        </Link>
      </div>
    </aside>
  )
}
