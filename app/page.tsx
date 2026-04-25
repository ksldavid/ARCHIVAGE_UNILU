'use client'
// Final deployment trigger with Next.js preset

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

    let animFrameId: number
    let canvasWidth: number
    let canvasHeight: number
    const words = ['UNILU', 'LA MEILLEURE', 'ARCHIVAGE']
    let wordIndex = 0
    // Particules qui forment le texte (foncées)
    let textParticles: any[] = []
    // Particules de fond qui flottent librement (claires)
    let bgParticles: any[] = []
    let formTimer: ReturnType<typeof setTimeout>

    const resize = () => {
      if (!canvas.parentElement) return
      canvasWidth = canvas.parentElement.clientWidth
      canvasHeight = canvas.parentElement.clientHeight
      canvas.width = canvasWidth
      canvas.height = canvasHeight
    }

    // Crée les particules de fond (claires, indépendantes)
    const initBgParticles = () => {
      bgParticles = []
      for (let i = 0; i < 600; i++) {
        bgParticles.push({
          x: Math.random() * canvasWidth,
          y: Math.random() * canvasHeight,
          size: Math.random() * 3 + 0.8,
          alpha: Math.random() * 0.45 + 0.15,
          dx: (Math.random() - 0.5) * 0.5,
          dy: (Math.random() - 0.5) * 0.5,
          color: ['#7dd3e8', '#a0d8e8', '#b2e0ef', '#5bb8d4', '#90cfe0', '#c8eaf4'][Math.floor(Math.random() * 6)],
        })
      }
    }

    // Récupère les positions des pixels du texte
    const getTextPoints = (word: string) => {
      const offscreen = document.createElement('canvas')
      offscreen.width = canvasWidth
      offscreen.height = canvasHeight
      const offCtx = offscreen.getContext('2d')
      if (!offCtx) return []

      const fontSize = Math.min(canvasWidth / word.length * 1.4, 120)
      offCtx.fillStyle = '#000000'
      offCtx.font = `900 ${fontSize}px 'Outfit', sans-serif`
      offCtx.textAlign = 'center'
      offCtx.textBaseline = 'middle'
      offCtx.fillText(word, canvasWidth / 2, canvasHeight / 2)

      const imageData = offCtx.getImageData(0, 0, canvasWidth, canvasHeight)
      const points: {x: number, y: number}[] = []
      const gap = 6

      for (let y = 0; y < canvasHeight; y += gap) {
        for (let x = 0; x < canvasWidth; x += gap) {
          const alpha = imageData.data[(y * canvasWidth + x) * 4 + 3]
          if (alpha > 128) points.push({ x, y })
        }
      }
      return points
    }

    const startForming = (word: string) => {
      const points = getTextPoints(word)
      const darkColors = ['#0a3a4a', '#083040', '#0d4d61', '#0a4a5c']

      // Ajuste le pool de particules de texte
      while (textParticles.length < points.length) {
        textParticles.push({
          x: Math.random() * canvasWidth,
          y: Math.random() * canvasHeight,
          tx: 0, ty: 0,
          size: Math.random() * 2.5 + 1.5,
          color: darkColors[Math.floor(Math.random() * darkColors.length)],
          alpha: 0,
          free: true,
          dx: (Math.random() - 0.5) * 1.2,
          dy: (Math.random() - 0.5) * 1.2,
        })
      }

      // Assigne les cibles
      for (let i = 0; i < points.length; i++) {
        textParticles[i].tx = points[i].x
        textParticles[i].ty = points[i].y
        textParticles[i].free = false
      }
      // Libère les surplus
      for (let i = points.length; i < textParticles.length; i++) {
        textParticles[i].free = true
      }

      // Après 3s → disperse pendant 2.5s → prochain mot
      formTimer = setTimeout(() => {
        textParticles.forEach(p => { p.free = true })
        formTimer = setTimeout(() => {
          wordIndex = (wordIndex + 1) % words.length
          startForming(words[wordIndex])
        }, 2500) // ← 2.5 secondes de dispersion entre les mots
      }, 3000)
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight)

      // Dessine les particules de fond (claires)
      bgParticles.forEach(p => {
        p.x += p.dx
        p.y += p.dy
        if (p.x < 0 || p.x > canvasWidth) p.dx *= -1
        if (p.y < 0 || p.y > canvasHeight) p.dy *= -1
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.alpha
        ctx.fill()
      })

      // Dessine les particules de texte (foncées)
      textParticles.forEach(p => {
        if (!p.free) {
          p.x += (p.tx - p.x) * 0.07
          p.y += (p.ty - p.y) * 0.07
          p.alpha = Math.min(0.95, p.alpha + 0.04)
        } else {
          p.x += p.dx
          p.y += p.dy
          if (p.x < 0 || p.x > canvasWidth) p.dx *= -1
          if (p.y < 0 || p.y > canvasHeight) p.dy *= -1
          p.alpha = Math.max(0, p.alpha - 0.03)
        }
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.alpha
        ctx.fill()
      })

      ctx.globalAlpha = 1
      animFrameId = requestAnimationFrame(animate)
    }

    resize()
    initBgParticles()
    animate()
    formTimer = setTimeout(() => startForming(words[wordIndex]), 800)

    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(animFrameId)
      clearTimeout(formTimer)
      window.removeEventListener('resize', resize)
    }
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
