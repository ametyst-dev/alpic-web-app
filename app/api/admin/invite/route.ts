import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  const { admin_id, email } = await request.json()

  if (!admin_id || !email) {
    return NextResponse.json(
      { error: 'admin_id and email are required' },
      { status: 400 }
    )
  }

  const { data: admin } = await supabase
    .from('admins')
    .select('*')
    .eq('id', admin_id)
    .maybeSingle()

  if (!admin) {
    return NextResponse.json({ error: 'admin not found' }, { status: 404 })
  }

  const invite_code = crypto.randomUUID()

  const { data: user, error } = await supabase
    .from('users')
    .insert({ email, admin_id, invite_code, joined: false })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ invite_code }, { status: 201 })
}
