import { NextRequest, NextResponse } from 'next/server'

const ADMIN_PASS = process.env.ADMIN_PASS || 'change_me'

// GET method support
export async function GET(request: NextRequest) {
  try {
    const password = request.nextUrl.searchParams.get('pass')

    if (password === ADMIN_PASS) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: 'Нууц үг буруу' }, { status: 401 })
    }
  } catch (error) {
    return NextResponse.json({ error: 'Алдаа' }, { status: 400 })
  }
}

// POST method support
export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (password === ADMIN_PASS) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: 'Нууц үг буруу' }, { status: 401 })
    }
  } catch (error) {
    return NextResponse.json({ error: 'Алдаа' }, { status: 400 })
  }
}

