import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const wallet_id = searchParams.get('wallet_id')

  if (!wallet_id) {
    return NextResponse.json(
      { error: 'wallet_id query param is required' },
      { status: 400 }
    )
  }

  const { data: wallet, error } = await supabase
    .from('virtual_wallets')
    .select('*')
    .eq('id', wallet_id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!wallet) {
    return NextResponse.json({ error: 'wallet not found' }, { status: 404 })
  }

  return NextResponse.json(wallet)
}
