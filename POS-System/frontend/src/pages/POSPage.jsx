import { NavBar } from '../App';

export default function POSPage() {
  return (
    <>
      <NavBar />
      <main className='page-shell'>
        <section className='hero-card'>
          <p className='eyebrow'>Punto de venta</p>
          <h1>POS</h1>
          <p>Esta vista queda preparada para conectarse con el catálogo, precios vigentes y búsqueda por código de barras.</p>
        </section>
      </main>
    </>
  );
}
