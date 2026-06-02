import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import POSPage from './pages/POSPage';
import CatalogoPage from './pages/CatalogoPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<LoginPage />} />
        <Route path='/pos' element={<POSPage />} />
        <Route path='/catalogo' element={<CatalogoPage />} />
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
      <Link to='/'>Login</Link>
    </nav>
  );
}
