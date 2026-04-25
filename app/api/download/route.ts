import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const fileUrl = searchParams.get('url')
  const fileName = searchParams.get('name') || 'archive'

  if (!fileUrl) {
    return new NextResponse('URL manquante', { status: 400 })
  }

  try {
    const response = await fetch(fileUrl)
    const blob = await response.blob()

    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}.xlsx"`,
      },
    })
  } catch (error) {
    return new NextResponse('Erreur lors du téléchargement', { status: 500 })
  }
}
