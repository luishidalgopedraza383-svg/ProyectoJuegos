-- Proyecto Juegos - Politicas RLS de ejemplo para Supabase/PostgreSQL
-- La autorizacion real se hace en el backend; RLS es una capa adicional.

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_self_read ON users;
CREATE POLICY users_self_read ON users
  FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid());

DROP POLICY IF EXISTS users_admin_all ON users;
CREATE POLICY users_admin_all ON users
  FOR ALL TO authenticated
  USING (exists (
    SELECT 1 FROM roles r
    WHERE r.id = users.role_id AND r.name = 'admin'
  ))
  WITH CHECK (exists (
    SELECT 1 FROM roles r
    WHERE r.id = users.role_id AND r.name = 'admin'
  ));

DROP POLICY IF EXISTS sales_staff_read ON sales;
CREATE POLICY sales_staff_read ON sales
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS sales_staff_write ON sales;
CREATE POLICY sales_staff_write ON sales
  FOR INSERT TO authenticated
  WITH CHECK (seller_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS customers_staff_read ON customers;
CREATE POLICY customers_staff_read ON customers
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS audit_admin_read ON audit_logs;
CREATE POLICY audit_admin_read ON audit_logs
  FOR SELECT TO authenticated
  USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
      OR exists (SELECT 1 FROM users u JOIN roles r ON r.id = u.role_id
                 WHERE u.auth_user_id = auth.uid() AND r.name = 'admin'));
