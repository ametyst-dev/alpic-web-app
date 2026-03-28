import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { status } = await request.json()

  if (!status || !['approved', 'rejected'].includes(status)) {
    return NextResponse.json(
      { error: 'status must be "approved" or "rejected"' },
      { status: 400 }
    )
  }

  const { data: wallet, error } = await supabase
    .from('virtual_wallets')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!wallet) {
    return NextResponse.json({ error: 'wallet not found' }, { status: 404 })
  }

  return NextResponse.json(wallet)
}
