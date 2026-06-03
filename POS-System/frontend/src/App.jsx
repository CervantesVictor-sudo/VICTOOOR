/**
 * TAREA 4.1 — App.jsx MODIFICADO
 * Cambios: Se agregó la ruta /auditoria y el link en NavBar
 */

import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import POSPage from './pages/POSPage';
import CatalogoPage from './pages/CatalogoPage';
import AuditoriaPage from './pages/AuditoriaPage'; // ← NUEVO T-4.1

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<LoginPage />} />
        <Route path='/pos' element={<POSPage />} />
        <Route path='/catalogo' element={<CatalogoPage />} />
        <Route path='/auditoria' element={<AuditoriaPage />} /> {/* ← NUEVO T-4.1 */}
        <Route path='*' element={<Navigate to='/catalogo' />} />
      </Routes>
    </BrowserRouter>
  );
}

export function NavBar() {
  return (
    <nav className='navbar'>
      <Link to='/catalogo'>Catálogo Devani</Link>
      <Link to='/pos'>POS</Link>
      <Link to='/auditoria'>Auditoría</Link> {/* ← NUEVO T-4.1 */}
      <Link to='/'>Login</Link>
    </nav>
  );
}
