'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Liste des utilisateurs techniques demandés
  const technicalUsers = ['Anthony', 'David', 'Myong', 'Tadashi']

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Simulation de connexion
    setTimeout(() => {
      const isValidUser = technicalUsers.some(u => u.toLowerCase() === username.toLowerCase())
      
      if (isValidUser) {
        // Redirection vers le tableau de bord après succès
        router.push('/dashboard')
      } else {
        setError('Utilisateur non reconnu. (Essaye: Anthony, David, Myong ou Tadashi)')
        setLoading(false)
      }
    }, 1200)
  }

  // --- Animation de particules ---
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let canvasWidth: number, canvasHeight: number
    let particles: any[] = []
    const formingCount = 400
    const colors = ['#0a4a5c', '#1ba9c1', '#f0f9fb', '#e2e8f0']

    const resize = () => {
      if (!canvas.parentElement) return
      canvasWidth = canvas.parentElement.clientWidth
      canvasHeight = canvas.parentElement.clientHeight
      canvas.width = canvasWidth
      canvas.height = canvasHeight
    }

    class Particle {
      x: number; y: number; size: number; color: string; dx: number; dy: number; alpha: number;
      constructor() {
        this.x = Math.random() * canvasWidth
        this.y = Math.random() * canvasHeight
        this.size = Math.random() * 2 + 0.5
        this.color = colors[Math.floor(Math.random() * colors.length)]
        this.dx = (Math.random() - 0.5) * 0.8
        this.dy = (Math.random() - 0.5) * 0.8
        this.alpha = Math.random() * 0.5 + 0.1
      }
      update() {
        this.x += this.dx
        this.y += this.dy
        if (this.x < 0 || this.x > canvasWidth) this.dx *= -1
        if (this.y < 0 || this.y > canvasHeight) this.dy *= -1
      }
      draw() {
        if (!ctx) return
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fillStyle = this.color
        ctx.globalAlpha = this.alpha
        ctx.fill()
      }
    }

    const init = () => {
      resize()
      particles = []
      for (let i = 0; i < formingCount; i++) {
        particles.push(new Particle())
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight)
      particles.forEach(p => {
        p.update()
        p.draw()
      })
      requestAnimationFrame(animate)
    }

    window.addEventListener('resize', resize)
    init()
    animate()

    return () => window.removeEventListener('resize', resize)
  }, [])

  return (
    <div className="login-container">
      {/* Animation Panel */}
      <div className="animation-side">
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }}></canvas>
      </div>

      {/* Login Section */}
      <div className="login-side animate-fade-in">
        <div className="login-header">
          <img src="/Logo-unilu.webp" alt="Logo UNILU" className="brand-logo" />
          <span className="staff-portal-tag">Portail Personnel</span>
          <h1>Bienvenue sur le<br />portail UNILU.</h1>
          <p>Accédez à vos outils de gestion académique, archives et profils étudiants en toute sécurité.</p>
        </div>

        <form className="login-form-custom" onSubmit={handleLogin}>
          <div className="input-group-custom">
            <input 
              type="text" 
              className="input-custom" 
              placeholder="Nom d'utilisateur" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required 
            />
          </div>
          <div className="input-group-custom">
            <input 
              type="password" 
              className="input-custom" 
              placeholder="Mot de passe" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>

          {error && (
            <div style={{ background: '#fff5f5', color: '#c53030', padding: '12px', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '20px', borderLeft: '4px solid #c53030' }}>
              {error}
            </div>
          )}
          
          <button type="submit" className="submit-btn-custom" disabled={loading}>
            {loading ? 'Authentification...' : 'Se connecter'}
          </button>
        </form>

        <div className="footer-links">
          <p>Problème d'accès ? <a href="#">Contacter le support IT.</a></p>
        </div>
      </div>
    </div>
  )
}
