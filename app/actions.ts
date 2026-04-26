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

export async function deleteArchiveGroup(referenceLink: string) {
  return await prisma.archive.deleteMany({
    where: { referenceLink }
  })
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
  const [faculties, promotions, sessions, recentArchives, totalStudents, totalArchives] = await Promise.all([
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
      take: 2000, 
      orderBy: { createdAt: 'desc' },
      include: { student: true, department: true, faculty: true, promotion: true, session: true }
    }),
    prisma.student.count(),
    prisma.archive.groupBy({
      by: ['academicYear', 'promotionId', 'sessionId'],
      _count: true
    })
  ])
  return { 
    faculties, 
    promotions, 
    sessions, 
    recentArchives, 
    totalStudents, 
    totalArchivesCount: totalArchives.length 
  }
}

export async function getArchivesTree() {
  const faculties = await prisma.faculty.findMany({
    orderBy: { name: 'asc' },
    include: {
      archives: {
        select: { academicYear: true },
        distinct: ['academicYear'],
        orderBy: { academicYear: 'desc' }
      }
    }
  })

  const tree = await Promise.all(faculties.map(async (faculty: any) => {
    const years = [...new Set(faculty.archives.map((a: any) => a.academicYear))].sort().reverse()

    const yearData = await Promise.all(years.map(async (year: any) => {
      const allArchives = await prisma.archive.findMany({
        where: { facultyId: faculty.id, academicYear: year },
        include: { promotion: true, session: true, department: true, student: true },
        orderBy: [{ department: { name: 'asc' } }, { promotion: { name: 'asc' } }, { session: { name: 'asc' } }]
      })

      // Grouper par département
      const deptMap = new Map<string, { deptName: string; promotions: Map<string, { promoName: string; sessions: typeof allArchives }> }>()

      for (const archive of allArchives) {
        const deptKey = archive.departmentId ?? 'none'
        const deptName = archive.department?.name ?? 'Général'

        if (!deptMap.has(deptKey)) {
          deptMap.set(deptKey, { deptName, promotions: new Map() })
        }

        const dept = deptMap.get(deptKey)!
        const pid = archive.promotionId
        if (!dept.promotions.has(pid)) {
          dept.promotions.set(pid, { promoName: archive.promotion.name, sessions: [] })
        }
        dept.promotions.get(pid)!.sessions.push(archive)
      }

      const departments = Array.from(deptMap.entries()).map(([deptId, deptData]) => ({
        id: deptId,
        name: deptData.deptName,
        promotions: Array.from(deptData.promotions.entries()).map(([promoId, promoData]) => {
          // Grouper les sessions à l'intérieur de la promotion
          const sessionMap = new Map<string, { sessionName: string; archives: any[] }>()
          for (const arc of promoData.sessions) {
            const sid = arc.sessionId
            if (!sessionMap.has(sid)) {
              sessionMap.set(sid, { sessionName: arc.session.name, archives: [] })
            }
            sessionMap.get(sid)!.archives.push({
              id: arc.id,
              studentName: arc.student.name,
              decision: arc.decision,
              referenceLink: arc.referenceLink
            })
          }

          return {
            id: promoId,
            name: promoData.promoName,
            sessions: Array.from(sessionMap.entries()).map(([sid, sdata]) => ({
              id: sid,
              name: sdata.sessionName,
              students: sdata.archives
            }))
          }
        })
      }))

      return { year, departments }
    }))

    return { id: faculty.id, name: faculty.name, years: yearData }
  }))

  return tree
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
  
  const fileName = file.name.split('.')[0] + '_' + Date.now()
  const extension = file.name.split('.').pop()

  const uploadResult = await new Promise<any>((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { 
        resource_type: 'raw', 
        folder: 'unilu_archives',
        public_id: `${fileName}.${extension}` 
      },
      (error, result) => {
        if (error) reject(error)
        else resolve(result)
      }
    ).end(buffer)
  })

  const workbook = XLSX.read(buffer, { type: 'buffer' })
  
  const archiveDataToPrepare: { name: string, decision: string }[] = []
  const studentsToProcess = new Set<string>()
  const normalize = (v: any) => String(v || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/\s+/g, '').trim();

  // On boucle sur TOUTES les feuilles du classeur
  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName]
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]
    
    let nameColIndex = -1
    let decisionColIndex = -1
    let headerIndex = -1

    // 1. Détection du header pour CETTE feuille
    for (let i = 0; i < Math.min(rawData.length, 100); i++) {
      const row = rawData[i]
      if (!row) continue
      
      for (let j = 0; j < row.length; j++) {
        const cell = normalize(row[j])
        // Détection souple : "NOM", "NOMS", "IDENTITE", etc.
        if (cell === 'NOM' || cell === 'NOMS' || cell === 'IDENTITE' || (cell.includes('NOM') && (cell.includes('PRENOM') || cell.includes('POST') || cell.includes('COMPLET') || cell.includes('&')))) {
          nameColIndex = j
          headerIndex = i
        }
        // Détection de la décision (Décision, Jury, Résultat, Mention, Statut)
        if (cell.includes('DECISION') || cell.includes('JURY') || cell === 'RESULTAT' || cell === 'MENTION' || cell === 'STATUT' || cell === 'DEC') {
          decisionColIndex = j
          if (headerIndex === -1) headerIndex = i
        }
      }
      if (nameColIndex !== -1 && decisionColIndex !== -1) break
    }

    if (nameColIndex === -1) {
      for (let i = 0; i < Math.min(rawData.length, 60); i++) {
         const j = rawData[i]?.findIndex((c: any) => {
           const val = normalize(c);
           return val === 'NOM' || val === 'NOMS' || val.includes('NOM');
         })
         if (j !== -1) { nameColIndex = j; headerIndex = i; break; }
      }
    }

    if (nameColIndex === -1) continue // On passe à la feuille suivante si pas de noms trouvés

    // 2. Extraction des données
    for (let i = headerIndex + 1; i < rawData.length; i++) {
      const row = rawData[i]
      if (!row || !row[nameColIndex]) continue
      
      const rawName = String(row[nameColIndex])
      const name = rawName.toUpperCase().trim()
      
      // Sécurité pour les en-têtes répétés (pages multiples) :
      // Si la cellule contient "NOM" ou ressemble à l'en-tête, on l'ignore
      const normName = normalize(rawName)
      // On ignore si c'est trop court, si pas de lettres, ou si c'est l'en-tête
      if (name.length < 3 || !/[A-Z]/.test(name) || normName === 'NOM' || normName === 'NOMS' || normName.includes('NOMSETPRENOM') || normName.includes('POSTNOM') || normName.includes('IDENTITE')) continue
      
      const decision = decisionColIndex !== -1 ? String(row[decisionColIndex] || '-').toUpperCase().trim() : '-'
      
      if (!studentsToProcess.has(name)) {
        studentsToProcess.add(name)
        archiveDataToPrepare.push({ name, decision })
      }
    }
  }

  if (archiveDataToPrepare.length === 0) throw new Error("Aucun étudiant valide trouvé dans le fichier (vérifiez toutes les feuilles).")

  // 1. Gérer les étudiants en masse
  const studentNames = Array.from(studentsToProcess)
  await prisma.student.createMany({
    data: studentNames.map((name: any) => ({ name })),
    skipDuplicates: true
  })

  // Récupérer les IDs des étudiants
  const allStudents = await prisma.student.findMany({
    where: { name: { in: studentNames } }
  })
  const studentMap = new Map(allStudents.map((s: any) => [s.name, s.id]))

  // 2. Créer les archives en masse
  const archivesToCreate = archiveDataToPrepare.map((item: any) => ({
    studentId: studentMap.get(item.name)!,
    facultyId: facultyId,
    departmentId: deptId === 'null' || !deptId ? null : deptId,
    promotionId,
    academicYear: year,
    sessionId,
    decision: item.decision,
    referenceLink: (uploadResult as any).secure_url
  }))

  await prisma.archive.createMany({
    data: archivesToCreate
  })

  return { count: archivesToCreate.length, url: (uploadResult as any).secure_url }
}

export async function traceStudents(formData: FormData) {
  const file = formData.get('file') as File
  const promoIds = JSON.parse(formData.get('promoIds') as string) as string[]
  const startYear = formData.get('startYear') as string
  const endYear = formData.get('endYear') as string

  if (!file) throw new Error('Liste d\'étudiants manquante')

  // 1. Lire les noms du fichier Excel uploadé
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const studentNamesSet = new Set<string>()
  const normalize = (v: any) => String(v || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/\s+/g, '').trim();

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName]
    const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]
    
    let headerIndex = -1
    for (let i = 0; i < Math.min(rawRows.length, 50); i++) {
      if (rawRows[i]?.some((c: any) => {
        const val = normalize(c);
        return val === 'NOM' || val === 'NOMS' || val.includes('NOM');
      })) { 
        headerIndex = i; 
        break; 
      }
    }

    if (headerIndex === -1) continue

    const data = XLSX.utils.sheet_to_json(worksheet, { range: headerIndex }) as any[]
    data.forEach((row: any) => {
      const k = Object.keys(row).find((key: any) => {
        const val = normalize(key);
        return val === 'NOM' || val === 'NOMS' || val.includes('NOM');
      })
      if (k) {
        const rawVal = String(row[k])
        const name = rawVal.toUpperCase().trim()
        const normVal = normalize(rawVal)
        if (name.length > 2 && /[A-Z]/.test(name) && normVal !== 'NOM' && normVal !== 'NOMS' && !normVal.includes('NOMSETPRENOM') && !normVal.includes('POSTNOM')) {
          studentNamesSet.add(name)
        }
      }
    })
  }

  const studentNames = Array.from(studentNamesSet)

  // 2. Définir la plage d'années
  const start = parseInt(startYear.split('-')[0])
  const end = parseInt(endYear.split('-')[0])

  // 3. Récupérer TOUTES les archives correspondantes aux promotions sélectionnées
  const allArchives = await prisma.archive.findMany({
    where: {
      promotionId: { in: promoIds }
    },
    include: { student: true, promotion: true, session: true, department: true }
  })

  // Filtrer par plage d'année
  const filteredArchives = allArchives.filter((a: any) => {
    const y = parseInt(a.academicYear.split('-')[0])
    return y >= Math.min(start, end) && y <= Math.max(start, end)
  })

  // 4. Identifier toutes les "colonnes" uniques
  const checkpointsMap = new Map<string, { year: string, promo: string, session: string }>()
  filteredArchives.forEach((a: any) => {
    const key = `${a.academicYear}|${a.promotion.name}|${a.session.name}`
    if (!checkpointsMap.has(key)) {
      checkpointsMap.set(key, { year: a.academicYear, promo: a.promotion.name, session: a.session.name })
    }
  })

  const checkpoints = Array.from(checkpointsMap.values()).sort((a, b) => {
    if (a.year !== b.year) return a.year.localeCompare(b.year)
    if (a.promo !== b.promo) return a.promo.localeCompare(b.promo)
    return a.session.localeCompare(b.session)
  })

  // 5. Construire le tableau final
  const grid = studentNames.map((name: any) => {
    const studentResults: any = { name }
    checkpoints.forEach((cp: any) => {
      const match = filteredArchives.find((a: any) => 
        a.student.name.includes(name) && 
        a.academicYear === cp.year && 
        a.promotion.name === cp.promo && 
        a.session.name === cp.session
      )
      studentResults[`${cp.year}|${cp.promo}|${cp.session}`] = match ? { decision: match.decision, link: match.referenceLink } : null
    })
    return studentResults
  })

  return { checkpoints, grid }
}

export async function searchArchives(filters: { 
  query: string, 
  facultyId?: string, 
  deptId?: string, 
  promoId?: string,
  sessionId?: string,
  year?: string 
}) {
  const { query, facultyId, deptId, promoId, sessionId, year } = filters

  return await prisma.archive.findMany({
    where: {
      student: { name: { contains: query, mode: 'insensitive' } },
      facultyId: facultyId || undefined,
      departmentId: deptId || undefined,
      promotionId: promoId || undefined,
      sessionId: sessionId || undefined,
      academicYear: year || undefined
    },
    include: {
      student: true,
      faculty: true,
      department: true,
      promotion: true,
      session: true
    },
    orderBy: { academicYear: 'desc' },
    take: 100
  })
}

export async function getPromotionStats(filters: {
  year: string,
  promoId: string,
  sessionId: string
}) {
  const archives = await prisma.archive.findMany({
    where: {
      academicYear: filters.year,
      promotionId: filters.promoId,
      sessionId: filters.sessionId
    },
    include: { student: true }
  })

  const total = archives.length
  const stats = {
    total,
    admis: archives.filter((a: any) => {
      const d = a.decision.toUpperCase();
      return d.includes('ADM') || d === 'V' || d.includes('COMP') || d.startsWith('R');
    }).length,
    ajournes: archives.filter((a: any) => {
      const d = a.decision.toUpperCase();
      return d.includes('AJ') || d.includes('DEF') || d.includes('NV');
    }).length,
    autres: 0
  }
  stats.autres = total - (stats.admis + stats.ajournes)

  return { archives, stats }
}
