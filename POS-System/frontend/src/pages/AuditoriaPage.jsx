import { useState, useEffect } from 'react';
import { NavBar } from '../App';

const API = 'http://localhost:3000/api';

export default function AuditoriaPage() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filters, setFilters] = useState({ accion: '', entidad: '', usuario: '', from: '', to: '' });
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  const getToken = () => localStorage.getItem('pos_token');

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 30 });
      if (filters.accion) params.set('accion', filters.accion);
      if (filters.entidad) params.set('entidad', filters.entidad);
      if (filters.usuario) params.set('usuario', filters.usuario);
      if (filters.from) params.set('from', filters.from);
      if (filters.to) params.set('to', filters.to);

      const res = await fetch(`${API}/auditoria?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();

      if (res.ok) {
        setLogs(data.data || []);
        setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
      } else {
        console.error('Error:', data.error);
      }
    } catch (err) {
      console.error('Error al consultar auditoría:', err);
    }
    setLoading(false);
  };

  const fetchDetail = async (id) => {
    try {
      const res = await fetch(`${API}/auditoria/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (res.ok) setDetail(await res.json());
    } catch (err) {
      console.error('Error al cargar detalle:', err);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    fetchLogs(1);
  };

  const actionColors = {
    LOGIN: '#22c55e', LOGIN_FALLIDO: '#ef4444', REGISTRO_USUARIO: '#3b82f6',
    CREAR: '#22c55e', EDITAR: '#f59e0b', ELIMINAR: '#ef4444',
    VENTA: '#22c55e', VENTA_SALIDA_STOCK: '#f59e0b', REGISTRO_VENTA: '#22c55e',
    CANCELAR: '#ef4444', AJUSTE: '#f59e0b', MERMA: '#ef4444',
    RECIBIR_COMPRA: '#22c55e', ABRIR_CAJA: '#3b82f6', CERRAR_CAJA: '#f59e0b'
  };

  const formatDate = (d) => d ? new Date(d).toLocaleString('es-MX') : '';

  return (
    <>
      <NavBar />
      <main className='page-shell'>
        <section className='hero-card'>
          <p className='eyebrow'>Responsable: Víctor — Tarea 4.1</p>
          <h1>Bitácora de Auditoría</h1>
          <p>Registro inmutable de todas las acciones críticas del sistema. Los registros no pueden ser modificados ni eliminados.</p>
        </section>

        {/* Filtros */}
        <section className='panel-card'>
          <h2>Filtros</h2>
          <form onSubmit={handleFilter} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <label style={{ flex: 1, minWidth: 120 }}>
              Usuario
              <input value={filters.usuario} onChange={e => setFilters({ ...filters, usuario: e.target.value })} placeholder='Buscar...' />
            </label>
            <label style={{ flex: 1, minWidth: 140 }}>
              Acción
              <select value={filters.accion} onChange={e => setFilters({ ...filters, accion: e.target.value })}>
                <option value=''>Todas</option>
                {['LOGIN', 'LOGIN_FALLIDO', 'REGISTRO_USUARIO', 'CREAR', 'EDITAR', 'ELIMINAR', 'VENTA', 'CANCELAR', 'AJUSTE', 'MERMA', 'RECIBIR_COMPRA'].map(a =>
                  <option key={a} value={a}>{a}</option>
                )}
              </select>
            </label>
            <label style={{ flex: 1, minWidth: 140 }}>
              Entidad
              <select value={filters.entidad} onChange={e => setFilters({ ...filters, entidad: e.target.value })}>
                <option value=''>Todas</option>
                {['Usuario', 'Producto', 'Venta', 'Compra', 'Inventario', 'Categoria'].map(e =>
                  <option key={e} value={e}>{e}</option>
                )}
              </select>
            </label>
            <label style={{ minWidth: 130 }}>
              Desde
              <input type='date' value={filters.from} onChange={e => setFilters({ ...filters, from: e.target.value })} />
            </label>
            <label style={{ minWidth: 130 }}>
              Hasta
              <input type='date' value={filters.to} onChange={e => setFilters({ ...filters, to: e.target.value })} />
            </label>
            <button className='primary-btn' type='submit'>Filtrar</button>
          </form>
        </section>

        {/* Tabla de resultados */}
        <section className='panel-card full'>
          <div className='section-heading'>
            <h2>Registros ({pagination.total})</h2>
          </div>

          {loading ? (
            <p style={{ textAlign: 'center', padding: '2rem', opacity: 0.6 }}>Cargando...</p>
          ) : logs.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '2rem', opacity: 0.6 }}>Sin registros de auditoría</p>
          ) : (
            <div className='product-table'>
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Usuario</th>
                    <th>Acción</th>
                    <th>Entidad</th>
                    <th>ID</th>
                    <th>Observaciones</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id_auditoria}>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>{formatDate(log.fecha_hora)}</td>
                      <td>{log.username || 'Sistema'}</td>
                      <td>
                        <span style={{
                          background: (actionColors[log.accion] || '#6b7280') + '20',
                          color: actionColors[log.accion] || '#6b7280',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontWeight: 600,
                          fontSize: '0.8rem'
                        }}>
                          {log.accion}
                        </span>
                      </td>
                      <td>{log.tabla_afectada}</td>
                      <td>{log.registro_id || ''}</td>
                      <td style={{ fontSize: '0.85rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.observaciones || ''}
                      </td>
                      <td>
                        <button className='secondary-btn' onClick={() => fetchDetail(log.id_auditoria)} style={{ fontSize: '0.8rem', padding: '4px 8px' }}>
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginación */}
          {pagination.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '16px 0' }}>
              {pagination.page > 1 && (
                <button className='secondary-btn' onClick={() => fetchLogs(pagination.page - 1)}>← Anterior</button>
              )}
              <span style={{ padding: '6px 12px', fontSize: '0.9rem' }}>
                Página {pagination.page} de {pagination.totalPages}
              </span>
              {pagination.page < pagination.totalPages && (
                <button className='secondary-btn' onClick={() => fetchLogs(pagination.page + 1)}>Siguiente →</button>
              )}
            </div>
          )}
        </section>

        {/* Modal de detalle */}
        {detail && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
          }} onClick={() => setDetail(null)}>
            <div style={{
              background: 'white', padding: 24, borderRadius: 12, maxWidth: 600,
              maxHeight: '85vh', overflow: 'auto', width: '90%'
            }} onClick={e => e.stopPropagation()}>
              <h3 style={{ marginBottom: 16 }}>Detalle de Auditoría #{detail.id_auditoria}</h3>
              <p><strong>Fecha:</strong> {formatDate(detail.fecha_hora)}</p>
              <p><strong>Usuario:</strong> {detail.username || 'Sistema'}</p>
              <p><strong>Acción:</strong> <span style={{ color: actionColors[detail.accion], fontWeight: 700 }}>{detail.accion}</span></p>
              <p><strong>Entidad:</strong> {detail.tabla_afectada} {detail.registro_id ? `#${detail.registro_id}` : ''}</p>
              {detail.observaciones && <p><strong>Observaciones:</strong> {detail.observaciones}</p>}

              {detail.datos_previos && (
                <div style={{ marginTop: 12 }}>
                  <strong>Datos previos:</strong>
                  <pre style={{ background: '#f3f4f6', padding: 12, borderRadius: 8, fontSize: '0.78rem', overflow: 'auto', maxHeight: 200 }}>
                    {JSON.stringify(JSON.parse(detail.datos_previos), null, 2)}
                  </pre>
                </div>
              )}

              {detail.datos_nuevos && (
                <div style={{ marginTop: 12 }}>
                  <strong>Datos nuevos:</strong>
                  <pre style={{ background: '#f0fdf4', padding: 12, borderRadius: 8, fontSize: '0.78rem', overflow: 'auto', maxHeight: 200 }}>
                    {JSON.stringify(JSON.parse(detail.datos_nuevos), null, 2)}
                  </pre>
                </div>
              )}

              <button className='primary-btn' onClick={() => setDetail(null)} style={{ marginTop: 16 }}>Cerrar</button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
