import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  const { email } = await request.json()

  if (!email) {
    return NextResponse.json({ error: 'email is required' }, { status: 400 })
  }

  const { data: admin } = await supabase
    .from('admins')
    .select('*')
    .eq('email', email)
    .maybeSingle()

  if (admin) {
    return NextResponse.json({ role: 'admin', id: admin.id, data: admin })
  }

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle()

  if (user) {
    return NextResponse.json({ role: 'user', id: user.id, data: user })
  }

  return NextResponse.json({ error: 'no account found' }, { status: 404 })
}
