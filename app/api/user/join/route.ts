import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  const { email, invite_code } = await request.json()

  if (!email || !invite_code) {
    return NextResponse.json(
      { error: 'email and invite_code are required' },
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
    return NextResponse.json({ error: 'invalid email or invite code' }, { status: 404 })
  }

  if (user.joined) {
    return NextResponse.json({ error: 'user has already joined' }, { status: 400 })
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

  return NextResponse.json(updated)
}
