import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  const { admin_id, amount } = await request.json()

  if (!admin_id || amount == null) {
    return NextResponse.json(
      { error: 'admin_id and amount are required' },
      { status: 400 }
    )
  }

  if (amount <= 0) {
    return NextResponse.json({ error: 'amount must be positive' }, { status: 400 })
  }

  const { data: admin } = await supabase
    .from('admins')
    .select('*')
    .eq('id', admin_id)
    .maybeSingle()

  if (!admin) {
    return NextResponse.json({ error: 'admin not found' }, { status: 404 })
  }

  const { data: updated, error } = await supabase
    .from('admins')
    .update({ balance: admin.balance + amount })
    .eq('id', admin_id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ new_balance: updated.balance })
}
