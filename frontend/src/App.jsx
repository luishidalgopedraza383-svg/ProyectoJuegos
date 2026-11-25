import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import ProtectedRoute from './components/ProtectedRoute';
import PublicLayout from './components/PublicLayout';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import StorefrontPage from './pages/StorefrontPage';
import DashboardPage from './pages/DashboardPage';
import CatalogPage from './pages/CatalogPage';
import CartPage from './pages/CartPage';
import PosPage from './pages/PosPage';
import SalesPage from './pages/SalesPage';
import InventoryPage from './pages/InventoryPage';
import CustomersPage from './pages/CustomersPage';
import ReportsPage from './pages/ReportsPage';
import AdminPage from './pages/AdminPage';
import NotFoundPage from './pages/NotFoundPage';

// Cada pantalla tiene su propia dirección. Las rutas de gestión verifican
// permisos en el cliente; el backend vuelve a validarlos siempre.
const guarded = (permissions, element) => (
  <Route element={<ProtectedRoute permissions={permissions} />}>{element}</Route>
);

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        {/* El carrito vive fuera de las rutas: se conserva al navegar y al
            iniciar sesión (se guarda en el navegador). */}
        <CartProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            {/* Vitrina pública: se puede ver sin cuenta, pero no se puede comprar. */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<StorefrontPage />} />
              <Route path="/catalogo" element={<CatalogPage />} />
              <Route path="/carrito" element={<CartPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>

            {/* Área privada: cada rol ve solo lo que su permiso permite. */}
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/panel" element={<DashboardPage />} />
              {guarded(['sales.write'], <Route path="/ventas" element={<PosPage />} />)}
              {guarded(['sales.read'], <Route path="/historial" element={<SalesPage />} />)}
              {guarded(['inventory.read'], <Route path="/inventario" element={<InventoryPage />} />)}
              {guarded(['customers.read'], <Route path="/clientes" element={<CustomersPage />} />)}
              {guarded(['reports.read'], <Route path="/reportes" element={<ReportsPage />} />)}

              {guarded(['catalog.write', 'inventory.write'], <Route path="/admin" element={<Navigate to="/admin/juegos" replace />} />)}
              {guarded(['catalog.write', 'inventory.write'], <Route path="/admin/juegos" element={<AdminPage section="juegos" />} />)}
              {guarded(['catalog.write', 'inventory.write'], <Route path="/admin/stock" element={<AdminPage section="stock" />} />)}
            </Route>
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
