import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const admin_id = searchParams.get('admin_id')

  if (!admin_id) {
    return NextResponse.json(
      { error: 'admin_id query param is required' },
      { status: 400 }
    )
  }

  const { data: wallets, error } = await supabase
    .from('virtual_wallets')
    .select('*, users!inner(email, admin_id)')
    .eq('users.admin_id', admin_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(wallets)
}
