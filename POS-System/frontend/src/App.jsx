/**
 * TAREA 4.2 — App.jsx MODIFICADO
 * Cambios: Se agregó la ruta /reportes y el link en NavBar
 * NOTA: Si ya aplicaste T-4.1, este archivo ya tiene /auditoria.
 *       Este archivo incluye AMBAS rutas (T-4.1 + T-4.2).
 */

import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import POSPage from './pages/POSPage';
import CatalogoPage from './pages/CatalogoPage';
import AuditoriaPage from './pages/AuditoriaPage';   // T-4.1 (Víctor)
import ReportesPage from './pages/ReportesPage';     // ← NUEVO T-4.2 (Martin)

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<LoginPage />} />
        <Route path='/pos' element={<POSPage />} />
        <Route path='/catalogo' element={<CatalogoPage />} />
        <Route path='/auditoria' element={<AuditoriaPage />} />     {/* T-4.1 */}
        <Route path='/reportes' element={<ReportesPage />} />       {/* ← NUEVO T-4.2 */}
        <Route path='*' element={<Navigate to='/catalogo' />} />
      </Routes>
    </BrowserRouter>
  );
}

export function NavBar() {
  return (
    <nav className='navbar'>
      <Link to='/catalogo'>Catálogo</Link>
      <Link to='/pos'>POS</Link>
      <Link to='/reportes'>Reportes</Link>         {/* ← NUEVO T-4.2 */}
      <Link to='/auditoria'>Auditoría</Link>
      <Link to='/'>Login</Link>
    </nav>
  );
}
