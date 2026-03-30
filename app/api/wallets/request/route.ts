import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const DEMO_API_KEYS = (process.env.DEMO_API_KEYS ?? '').split(',').filter(Boolean)

export async function POST(request: Request) {
  const { api_key, spending_limit } = await request.json()

  if (!api_key || spending_limit == null) {
    return NextResponse.json(
      { error: 'api_key and spending_limit are required' },
      { status: 400 }
    )
  }

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('api_key', api_key)
    .maybeSingle()

  if (!user) {
    return NextResponse.json({ error: 'invalid api_key' }, { status: 401 })
  }

  if (!user.joined) {
    return NextResponse.json({ error: 'user has not joined yet' }, { status: 403 })
  }

  const status = DEMO_API_KEYS.includes(api_key) ? 'approved' : 'pending'

  const { data: wallet, error } = await supabase
    .from('virtual_wallets')
    .insert({ user_id: user.id, spending_limit, status })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(wallet, { status: 201 })
}
