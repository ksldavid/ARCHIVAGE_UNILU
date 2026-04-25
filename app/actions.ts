'use server'

import prisma from '@/lib/prisma'
import { v2 as cloudinary } from 'cloudinary'
import * as XLSX from 'xlsx'

// Configuration de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// --- CREATION ---

export async function createFaculty(name: string) {
  const fac = await prisma.faculty.create({
    data: { name: name.toUpperCase().trim() }
  })
  // CREATION AUTOMATIQUE DU DEPARTEMENT "NON APPLICABLE"
  await prisma.department.create({
    data: { name: 'NON APPLICABLE', facultyId: fac.id }
  })
  return fac
}

export async function createDepartment(name: string, facultyId: string) {
  return await prisma.department.create({
    data: { name: name.toUpperCase().trim(), facultyId }
  })
}

export async function createPromotion(name: string, departmentId: string) {
  return await prisma.promotion.create({
    data: { name: name.toUpperCase().trim(), departmentId }
  })
}

export async function createSession(name: string) {
  return await prisma.session.create({
    data: { name: name.toUpperCase().trim() }
  })
}

// --- SUPPRESSION ---

export async function deleteFaculty(id: string) {
  return await prisma.faculty.delete({ where: { id } })
}

export async function deleteDepartment(id: string) {
  return await prisma.department.delete({ where: { id } })
}

export async function deletePromotion(id: string) {
  return await prisma.promotion.delete({ where: { id } })
}

export async function deleteSession(id: string) {
  return await prisma.session.delete({ where: { id } })
}

export async function deleteArchive(id: string) {
  return await prisma.archive.delete({ where: { id } })
}

export async function clearArchivesAndStudents() {
  // 1. Supprimer toutes les archives
  await prisma.archive.deleteMany({})
  // 2. Supprimer tous les étudiants
  await prisma.student.deleteMany({})
  // 3. Supprimer toutes les promotions (pour repartir à zéro sur le nouveau système)
  await prisma.promotion.deleteMany({})
  return { success: true }
}

// --- RECUPERATION ---

export async function getAppData() {
  const [faculties, promotions, sessions, recentArchives] = await Promise.all([
    prisma.faculty.findMany({ 
      include: { 
        departments: {
          include: { promotions: true },
          orderBy: { name: 'asc' }
        }
      }, 
      orderBy: { name: 'asc' } 
    }),
    prisma.promotion.findMany({ orderBy: { name: 'asc' } }),
    prisma.session.findMany({ orderBy: { name: 'asc' } }),
    prisma.archive.findMany({ 
      take: 50, 
      orderBy: { createdAt: 'desc' },
      include: { student: true, department: true, faculty: true, promotion: true, session: true }
    })
  ])
  return { faculties, promotions, sessions, recentArchives }
}

// --- IMPORTATION ---

export async function importArchives(formData: FormData) {
  const file = formData.get('file') as File
  const facultyId = formData.get('facultyId') as string
  const deptId = formData.get('deptId') as string // Peut être vide
  const promotionId = formData.get('promotionId') as string
  const sessionId = formData.get('sessionId') as string
  const year = formData.get('year') as string

  if (!file) throw new Error('Aucun fichier reçu')

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  
  const uploadResult = await new Promise<any>((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { resource_type: 'raw', folder: 'unilu_archives' },
      (error, result) => {
        if (error) reject(error)
        else resolve(result)
      }
    ).end(buffer)
  })

  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  
  // --- DÉTECTION INTELLIGENTE DU HEADER (COMME SUR LE FRONTEND) ---
  const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]
  let headerRowIndex = 0
  for (let i = 0; i < Math.min(rawRows.length, 25); i++) {
    const row = rawRows[i]
    if (row && row.some(cell => {
      const c = String(cell).toUpperCase()
      return c.includes('NOMS ET PRÉNOM') || c.includes('NOMS ET PRENOM') || (c.includes('NOM') && c.includes('PRENOM'))
    })) {
      headerRowIndex = i
      break
    }
  }

  const data = XLSX.utils.sheet_to_json(worksheet, { range: headerRowIndex }) as any[]

  let createdCount = 0

  for (const row of data) {
    // Détection des colonnes
    const cols = Object.keys(row)
    const nomKey = cols.find(k => 
      k.toUpperCase().includes('NOMS ET PRÉNOM') || 
      k.toUpperCase().includes('NOMS ET PRENOM') ||
      k.toUpperCase().includes('NOM COMPLET')
    ) || cols.find(k => k.toUpperCase().includes('NOM'))

    const decisionKey = [...cols].reverse().find(k => {
      const c = k.toUpperCase().trim()
      return c === 'DECISION' || c === 'DÉCISION' || c === 'ADM' || c === 'JURY'
    }) || cols.find(k => k.toUpperCase().includes('DECISION'))

    if (nomKey && row[nomKey]) {
      const studentName = String(row[nomKey]).toUpperCase().trim()
      const decision = decisionKey ? String(row[decisionKey]).toUpperCase().trim() : '-'

      // 1. Gérer l'étudiant
      let student = await prisma.student.findUnique({ where: { name: studentName } })
      if (!student) {
        student = await prisma.student.create({ data: { name: studentName } })
      }

      // 2. Créer l'archive
      await prisma.archive.create({
        data: {
          studentId: student.id,
          facultyId: facultyId,
          departmentId: deptId === 'null' || !deptId ? null : deptId,
          promotionId,
          academicYear: year,
          sessionId,
          decision,
          referenceLink: uploadResult.secure_url
        }
      })
      createdCount++
    }
  }

  return { count: createdCount, url: uploadResult.secure_url }
}
