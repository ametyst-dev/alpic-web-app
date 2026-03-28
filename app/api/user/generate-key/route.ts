import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  const { user_id } = await request.json()

  if (!user_id) {
    return NextResponse.json(
      { error: 'user_id is required' },
      { status: 400 }
    )
  }

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', user_id)
    .maybeSingle()

  if (!user) {
    return NextResponse.json({ error: 'user not found' }, { status: 404 })
  }

  const api_key = crypto.randomUUID()

  const { data: updated, error } = await supabase
    .from('users')
    .update({ api_key })
    .eq('id', user_id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ api_key: updated.api_key })
}
