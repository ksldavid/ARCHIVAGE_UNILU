
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function reset() {
  console.log('--- DÉBUT DU NETTOYAGE COMPLET (ESM) ---')
  
  try {
    const archives = await prisma.archive.deleteMany({})
    console.log(`✅ ${archives.count} archives supprimées.`)
    
    const students = await prisma.student.deleteMany({})
    console.log(`✅ ${students.count} étudiants supprimés.`)
    
    const promotions = await prisma.promotion.deleteMany({})
    console.log(`✅ ${promotions.count} promotions supprimées.`)
    
    console.log('--- NETTOYAGE RÉUSSI ---')
  } catch (e) {
    console.error('❌ Erreur lors du nettoyage:', e)
  } finally {
    await prisma.$disconnect()
  }
}

reset()
