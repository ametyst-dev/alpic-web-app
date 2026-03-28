import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  const { api_key, wallet_id, amount } = await request.json()

  if (!api_key || !wallet_id || amount == null) {
    return NextResponse.json(
      { error: 'api_key, wallet_id, and amount are required' },
      { status: 400 }
    )
  }

  if (amount <= 0) {
    return NextResponse.json({ error: 'amount must be positive' }, { status: 400 })
  }

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('api_key', api_key)
    .maybeSingle()

  if (!user) {
    return NextResponse.json({ error: 'invalid api_key' }, { status: 401 })
  }

  const { data, error } = await supabase.rpc('spend_from_wallet', {
    p_wallet_id: wallet_id,
    p_user_id: user.id,
    p_admin_id: user.admin_id,
    p_amount: amount,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (data.error) {
    return NextResponse.json({ error: data.error }, { status: 400 })
  }

  return NextResponse.json(data)
}
