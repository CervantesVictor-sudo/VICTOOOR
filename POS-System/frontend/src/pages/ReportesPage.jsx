import { useState, useEffect } from 'react';
import { NavBar } from '../App';

const API = 'http://localhost:3000/api';

export default function ReportesPage() {
  const [kpis, setKpis] = useState(null);
  const [ventasDia, setVentasDia] = useState([]);
  const [ventasMetodo, setVentasMetodo] = useState([]);
  const [topProductos, setTopProductos] = useState([]);
  const [ventasEmpleado, setVentasEmpleado] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('resumen');

  // Filtro de fechas (últimos 30 días por defecto)
  const hoy = new Date().toISOString().split('T')[0];
  const hace30 = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
  const [from, setFrom] = useState(hace30);
  const [to, setTo] = useState(hoy);

  const getToken = () => localStorage.getItem('pos_token');
  const headers = () => ({ Authorization: `Bearer ${getToken()}` });

  const fetchAll = async () => {
    setLoading(true);
    const qs = `from=${from}&to=${to}`;
    try {
      const [kRes, dRes, mRes, tRes, eRes] = await Promise.all([
        fetch(`${API}/reportes/kpis?${qs}`, { headers: headers() }),
        fetch(`${API}/reportes/ventas-por-dia?${qs}`, { headers: headers() }),
        fetch(`${API}/reportes/ventas-por-metodo?${qs}`, { headers: headers() }),
        fetch(`${API}/reportes/top-productos?${qs}&limit=15`, { headers: headers() }),
        fetch(`${API}/reportes/ventas-por-empleado?${qs}`, { headers: headers() }),
      ]);
      if (kRes.ok) setKpis(await kRes.json());
      if (dRes.ok) setVentasDia(await dRes.json());
      if (mRes.ok) setVentasMetodo(await mRes.json());
      if (tRes.ok) setTopProductos(await tRes.json());
      if (eRes.ok) setVentasEmpleado(await eRes.json());
    } catch (err) {
      console.error('Error cargando reportes:', err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const fmt = (n) => parseFloat(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Colores para métodos de pago
  const methodColors = { EFECTIVO: '#22c55e', TARJETA: '#3b82f6', TRANSFERENCIA: '#a855f7', OTRO: '#6b7280' };

  return (
    <>
      <NavBar />
      <main className='page-shell'>
        <section className='hero-card'>
          <p className='eyebrow'>Responsable: Martin — Tarea 4.2</p>
          <h1>Dashboard Gerencial</h1>
          <p>Inteligencia de negocios: KPIs, analítica de ventas, métodos de pago y ranking de productos con estimación de margen bruto.</p>
        </section>

        {/* Filtro de fechas */}
        <section className='panel-card'>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <label style={{ minWidth: 140 }}>Desde<input type='date' value={from} onChange={e => setFrom(e.target.value)} /></label>
            <label style={{ minWidth: 140 }}>Hasta<input type='date' value={to} onChange={e => setTo(e.target.value)} /></label>
            <button className='primary-btn' onClick={fetchAll}>Actualizar</button>
          </div>
        </section>

        {loading ? (
          <section className='panel-card'><p style={{ textAlign: 'center', padding: '2rem', opacity: 0.6 }}>Cargando dashboard...</p></section>
        ) : (
          <>
            {/* KPI Cards */}
            {kpis && (
              <div style={styles.kpiGrid}>
                <KPICard label='Ventas totales' value={kpis.total_ventas} color='#3b82f6' />
                <KPICard label='Ingresos' value={`$${fmt(kpis.ingresos_totales)}`} color='#22c55e' />
                <KPICard label='Ticket promedio' value={`$${fmt(kpis.ticket_promedio)}`} color='#8b5cf6' />
                <KPICard label='Unidades vendidas' value={kpis.unidades_vendidas} color='#f59e0b' />
                <KPICard label='Margen bruto' value={`$${fmt(kpis.margen_bruto)}`} sub={`${kpis.porcentaje_margen}%`} color='#10b981' />
                <KPICard label='Stock crítico' value={kpis.stock_critico} color={kpis.stock_critico > 0 ? '#ef4444' : '#22c55e'} />
                <KPICard label='Ventas hoy' value={kpis.ventas_hoy} sub={`$${fmt(kpis.ingresos_hoy)}`} color='#06b6d4' />
                <KPICard label='Descuentos' value={`$${fmt(kpis.descuentos_totales)}`} color='#f97316' />
              </div>
            )}

            {/* Tabs */}
            <div style={styles.tabs}>
              {['resumen', 'productos', 'empleados'].map(t => (
                <button key={t} onClick={() => setTab(t)}
                  style={{ ...styles.tab, ...(tab === t ? styles.tabActive : {}) }}>
                  {t === 'resumen' ? '📊 Ventas' : t === 'productos' ? '🏆 Top Productos' : '👥 Empleados'}
                </button>
              ))}
            </div>

            {/* Tab: Resumen de Ventas */}
            {tab === 'resumen' && (
              <div style={styles.twoCol}>
                {/* Ventas por día */}
                <section className='panel-card'>
                  <h2>Ventas por día</h2>
                  {ventasDia.length === 0 ? (
                    <p style={{ opacity: 0.5, textAlign: 'center', padding: 16 }}>Sin datos en este periodo</p>
                  ) : (
                    <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                      {(() => {
                        const maxIngreso = Math.max(...ventasDia.map(d => d.ingresos), 1);
                        return ventasDia.map(d => (
                          <div key={d.dia} style={styles.barRow}>
                            <span style={styles.barLabel}>{d.dia}</span>
                            <div style={styles.barTrack}>
                              <div style={{ ...styles.barFill, width: `${(d.ingresos / maxIngreso) * 100}%`, background: '#3b82f6' }} />
                            </div>
                            <span style={styles.barValue}>${fmt(d.ingresos)} <small>({d.num_ventas})</small></span>
                          </div>
                        ));
                      })()}
                    </div>
                  )}
                </section>

                {/* Métodos de pago */}
                <section className='panel-card'>
                  <h2>Métodos de pago</h2>
                  {ventasMetodo.length === 0 ? (
                    <p style={{ opacity: 0.5, textAlign: 'center', padding: 16 }}>Sin datos</p>
                  ) : (
                    <>
                      {(() => {
                        const totalIngresos = ventasMetodo.reduce((s, m) => s + m.ingresos, 0) || 1;
                        return ventasMetodo.map(m => {
                          const pct = ((m.ingresos / totalIngresos) * 100).toFixed(1);
                          const color = methodColors[m.metodo_pago] || '#6b7280';
                          return (
                            <div key={m.metodo_pago} style={{ marginBottom: 16 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ fontWeight: 600 }}>{m.metodo_pago}</span>
                                <span style={{ fontSize: '0.85rem' }}>{pct}% — ${fmt(m.ingresos)} ({m.num_ventas} ventas)</span>
                              </div>
                              <div style={styles.barTrack}>
                                <div style={{ ...styles.barFill, width: `${pct}%`, background: color, borderRadius: 6 }} />
                              </div>
                            </div>
                          );
                        });
                      })()}
                      {/* Resumen visual tipo "donut simplificado" con segmentos */}
                      <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
                        {ventasMetodo.map(m => (
                          <span key={m.metodo_pago} style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '4px 12px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600,
                            background: (methodColors[m.metodo_pago] || '#6b7280') + '18',
                            color: methodColors[m.metodo_pago] || '#6b7280'
                          }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: methodColors[m.metodo_pago] || '#6b7280' }} />
                            {m.metodo_pago}: {m.num_ventas}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </section>
              </div>
            )}

            {/* Tab: Top Productos */}
            {tab === 'productos' && (
              <section className='panel-card full'>
                <h2>Ranking de Productos Más Vendidos</h2>
                {topProductos.length === 0 ? (
                  <p style={{ opacity: 0.5, textAlign: 'center', padding: 16 }}>Sin datos de ventas en este periodo</p>
                ) : (
                  <div className='product-table'>
                    <table>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Producto</th>
                          <th>Código</th>
                          <th style={{ textAlign: 'right' }}>Unidades</th>
                          <th style={{ textAlign: 'right' }}>Ingresos</th>
                          <th style={{ textAlign: 'right' }}>Costo est.</th>
                          <th style={{ textAlign: 'right' }}>Margen</th>
                          <th style={{ textAlign: 'right' }}>% Margen</th>
                          <th style={{ textAlign: 'right' }}>Stock</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topProductos.map((p, i) => (
                          <tr key={p.id_producto}>
                            <td style={{ fontWeight: 700, color: i < 3 ? '#f59e0b' : 'inherit' }}>{i + 1}</td>
                            <td><strong>{p.nombre}</strong></td>
                            <td style={{ fontSize: '0.85rem', opacity: 0.7 }}>{p.codigo_barras || '—'}</td>
                            <td style={{ textAlign: 'right', fontWeight: 600 }}>{p.unidades_vendidas}</td>
                            <td style={{ textAlign: 'right' }}>${fmt(p.ingreso_total)}</td>
                            <td style={{ textAlign: 'right', opacity: 0.7 }}>${fmt(p.costo_total)}</td>
                            <td style={{ textAlign: 'right', fontWeight: 600, color: p.margen_bruto >= 0 ? '#22c55e' : '#ef4444' }}>
                              ${fmt(p.margen_bruto)}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <span style={{
                                padding: '2px 8px', borderRadius: 4, fontSize: '0.8rem', fontWeight: 600,
                                background: p.porcentaje_margen >= 20 ? '#dcfce7' : p.porcentaje_margen >= 0 ? '#fef3c7' : '#fecaca',
                                color: p.porcentaje_margen >= 20 ? '#166534' : p.porcentaje_margen >= 0 ? '#92400e' : '#991b1b'
                              }}>
                                {p.porcentaje_margen}%
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <span className={p.stock <= 5 ? 'low-stock' : ''}>{p.stock}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: 8 }}>
                      * El margen usa el precio de compra actual del producto, no el costo histórico por transacción.
                    </p>
                  </div>
                )}
              </section>
            )}

            {/* Tab: Empleados */}
            {tab === 'empleados' && (
              <section className='panel-card full'>
                <h2>Rendimiento por Empleado</h2>
                {ventasEmpleado.length === 0 ? (
                  <p style={{ opacity: 0.5, textAlign: 'center', padding: 16 }}>Sin datos</p>
                ) : (
                  <>
                    {(() => {
                      const maxIngresos = Math.max(...ventasEmpleado.map(e => e.ingresos), 1);
                      return ventasEmpleado.map((e, i) => (
                        <div key={e.id_empleado} style={{ marginBottom: 16, padding: 12, background: i % 2 === 0 ? '#f9fafb' : 'white', borderRadius: 8 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <div>
                              <strong style={{ fontSize: '1.05rem' }}>{e.empleado}</strong>
                              <span style={{ marginLeft: 8, fontSize: '0.8rem', opacity: 0.6 }}>{e.puesto}</span>
                            </div>
                            <div style={{ textAlign: 'right', fontSize: '0.9rem' }}>
                              <strong>${fmt(e.ingresos)}</strong>
                              <span style={{ marginLeft: 8, opacity: 0.6 }}>{e.num_ventas} ventas · Ticket: ${fmt(e.ticket_promedio)}</span>
                            </div>
                          </div>
                          <div style={styles.barTrack}>
                            <div style={{ ...styles.barFill, width: `${(e.ingresos / maxIngresos) * 100}%`, background: '#8b5cf6' }} />
                          </div>
                        </div>
                      ));
                    })()}
                  </>
                )}
              </section>
            )}
          </>
        )}
      </main>
    </>
  );
}

// ─── Componente KPI Card ───
function KPICard({ label, value, sub, color }) {
  return (
    <div style={{ ...styles.kpiCard, borderLeft: `4px solid ${color}` }}>
      <div style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 700, color }}>{value}</div>
      {sub && <div style={{ fontSize: '0.85rem', opacity: 0.7, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ─── Estilos inline (sin necesidad de modificar dev.css) ───
const styles = {
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 12,
    marginBottom: 20,
  },
  kpiCard: {
    background: 'white',
    borderRadius: 10,
    padding: '16px 20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  tabs: {
    display: 'flex',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  tab: {
    padding: '8px 20px',
    borderRadius: 8,
    border: '1px solid #e5e7eb',
    background: 'white',
    cursor: 'pointer',
    fontWeight: 500,
    fontSize: '0.9rem',
    transition: 'all 0.2s',
  },
  tabActive: {
    background: '#3b82f6',
    color: 'white',
    borderColor: '#3b82f6',
  },
  twoCol: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: 16,
  },
  barRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
    fontSize: '0.85rem',
  },
  barLabel: {
    width: 90,
    flexShrink: 0,
    fontSize: '0.78rem',
    opacity: 0.7,
  },
  barTrack: {
    flex: 1,
    height: 10,
    background: '#f3f4f6',
    borderRadius: 6,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 6,
    transition: 'width 0.5s ease',
    minWidth: 2,
  },
  barValue: {
    width: 140,
    textAlign: 'right',
    flexShrink: 0,
    fontSize: '0.82rem',
    fontWeight: 500,
  },
};
