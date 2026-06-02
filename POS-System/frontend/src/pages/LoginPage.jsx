import { Link } from 'react-router-dom';

export default function LoginPage() {
  return (
    <main className='login-screen'>
      <section className='login-card'>
        <p className='eyebrow'>POS Tienda de Abarrotes</p>
        <h1>Acceso al sistema</h1>
        <p>Proyecto TRUE Responsive. Módulo de catálogo y escáner desarrollado para Devani.</p>
        <Link className='primary-btn' to='/catalogo'>Entrar al catálogo</Link>
      </section>
    </main>
  );
}
