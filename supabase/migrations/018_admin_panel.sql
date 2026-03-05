-- ============================================
-- 018: Admin panel support
-- - orders.updated_at column + auto-trigger
-- - admin_dashboard_kpis() RPC
-- - admin_list_users() SECURITY DEFINER RPC
-- ============================================

-- 1. Add updated_at to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Backfill existing rows
UPDATE orders SET updated_at = created_at WHERE updated_at IS NULL;

-- Auto-update trigger (reuses existing update_updated_at() from migration 011)
DROP TRIGGER IF EXISTS orders_updated_at ON orders;
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();


-- 2. KPI dashboard function
CREATE OR REPLACE FUNCTION admin_dashboard_kpis()
RETURNS jsonb
LANGUAGE plpgsql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_orders   bigint;
  v_total_revenue  numeric(12,2);
  v_total_customers bigint;
  v_total_products bigint;
  v_pending_orders bigint;
BEGIN
  -- Admin-only guard
  IF (select (auth.jwt() -> 'app_metadata' ->> 'role')) <> 'admin' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT COUNT(*), COALESCE(SUM(total), 0)
  INTO v_total_orders, v_total_revenue
  FROM orders;

  SELECT COUNT(*) INTO v_total_customers FROM customers;
  SELECT COUNT(*) INTO v_total_products  FROM products;

  SELECT COUNT(*) INTO v_pending_orders
  FROM orders WHERE status = 'pending';

  RETURN jsonb_build_object(
    'total_orders',    v_total_orders,
    'total_revenue',   v_total_revenue,
    'total_customers', v_total_customers,
    'total_products',  v_total_products,
    'pending_orders',  v_pending_orders
  );
END;
$$;


-- 3. admin_list_users — joins customers + auth.users for email + last_sign_in
CREATE OR REPLACE FUNCTION admin_list_users()
RETURNS TABLE(
  id              uuid,
  auth_user_id    uuid,
  email           text,
  company_name    text,
  vat_number      text,
  hotel_name      text,
  hotel_address   text,
  contact_person  text,
  contact_role    text,
  phone           text,
  created_at      timestamptz,
  updated_at      timestamptz,
  last_sign_in_at timestamptz
)
LANGUAGE plpgsql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (select (auth.jwt() -> 'app_metadata' ->> 'role')) <> 'admin' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    c.id,
    c.auth_user_id,
    u.email::text,
    c.company_name,
    c.vat_number,
    c.hotel_name,
    c.hotel_address,
    c.contact_person,
    c.contact_role,
    c.phone,
    c.created_at,
    c.updated_at,
    u.last_sign_in_at
  FROM public.customers c
  JOIN auth.users u ON u.id = c.auth_user_id
  ORDER BY c.created_at DESC;
END;
$$;
