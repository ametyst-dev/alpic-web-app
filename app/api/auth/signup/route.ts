import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  const { email, role, invite_code } = await request.json()

  if (!email || !role) {
    return NextResponse.json(
      { error: 'email and role are required' },
      { status: 400 }
    )
  }

  if (role === 'admin') {
    const { data: existing } = await supabase
      .from('admins')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'admin already exists' }, { status: 409 })
    }

    const { data: admin, error } = await supabase
      .from('admins')
      .insert({ email })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ role: 'admin', id: admin.id, data: admin }, { status: 201 })
  }

  if (role === 'user') {
    if (!invite_code) {
      return NextResponse.json(
        { error: 'invite_code is required for user signup' },
        { status: 400 }
      )
    }

    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('invite_code', invite_code)
      .maybeSingle()

    if (!user) {
      return NextResponse.json(
        { error: 'invalid email or invite code' },
        { status: 404 }
      )
    }

    if (user.joined) {
      return NextResponse.json(
        { error: 'user has already joined' },
        { status: 400 }
      )
    }

    const { data: updated, error } = await supabase
      .from('users')
      .update({ joined: true })
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ role: 'user', id: updated.id, data: updated }, { status: 201 })
  }

  return NextResponse.json({ error: 'role must be "admin" or "user"' }, { status: 400 })
}
