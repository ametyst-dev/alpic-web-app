create or replace function spend_from_wallet(
  p_wallet_id uuid,
  p_user_id uuid,
  p_admin_id uuid,
  p_amount integer
)
returns json
language plpgsql
as $$
declare
  v_wallet virtual_wallets%rowtype;
  v_admin admins%rowtype;
begin
  select * into v_wallet
    from virtual_wallets
    where id = p_wallet_id and user_id = p_user_id
    for update;

  if not found then
    return json_build_object('error', 'wallet not found or not owned by user');
  end if;

  if v_wallet.status <> 'approved' then
    return json_build_object('error', 'wallet not approved');
  end if;

  if v_wallet.spending_limit - v_wallet.spent < p_amount then
    return json_build_object('error', 'insufficient wallet balance');
  end if;

  select * into v_admin
    from admins
    where id = p_admin_id
    for update;

  if v_admin.balance < p_amount then
    return json_build_object('error', 'insufficient admin balance');
  end if;

  update virtual_wallets
    set spent = spent + p_amount
    where id = p_wallet_id;

  update admins
    set balance = balance - p_amount
    where id = p_admin_id;

  return json_build_object(
    'remaining', v_wallet.spending_limit - v_wallet.spent - p_amount,
    'admin_balance', v_admin.balance - p_amount
  );
end;
$$;
