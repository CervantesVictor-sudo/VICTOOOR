import { useEffect, useMemo, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { NavBar } from '../App';

const API = 'http://localhost:3000/api';
const emptyProduct = {
  id_producto: null,
  codigo_barras: '',
  nombre: '',
  descripcion: '',
  precio_venta: '',
  precio_compra: '',
  stock: 0,
  stock_minimo: 5,
  unidad_medida: 'pieza',
  fecha_caducidad: '',
  categorias: []
};

export default function CatalogPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [productForm, setProductForm] = useState(emptyProduct);
  const [categoryForm, setCategoryForm] = useState({ id_categoria: null, nombre_categoria: '', descripcion: '' });
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);
  const controlsRef = useRef(null);

  const selectedCategoryIds = useMemo(() => productForm.categorias.map(Number), [productForm.categorias]);

  const notify = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(''), 3000);
  };

  const loadProducts = async () => {
    const res = await fetch(`${API}/products?search=${encodeURIComponent(search)}`);
    setProducts(await res.json());
  };

  const loadCategories = async () => {
    const res = await fetch(`${API}/categories`);
    setCategories(await res.json());
  };

  useEffect(() => { loadProducts(); }, [search]);
  useEffect(() => { loadCategories(); }, []);

  const saveProduct = async (e) => {
    e.preventDefault();
    const method = productForm.id_producto ? 'PUT' : 'POST';
    const url = productForm.id_producto ? `${API}/products/${productForm.id_producto}` : `${API}/products`;
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(productForm) });
    const data = await res.json();
    if (!res.ok) return notify(data.error || 'No se pudo guardar el producto');
    setProductForm(emptyProduct);
    await loadProducts();
    notify(data.message);
  };

  const editProduct = (product) => {
    setProductForm({
      ...emptyProduct,
      ...product,
      fecha_caducidad: product.fecha_caducidad || '',
      categorias: product.categoria_ids ? product.categoria_ids.split(',').map(Number) : []
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteProduct = async (id) => {
    if (!confirm('¿Eliminar este producto?')) return;
    const res = await fetch(`${API}/products/${id}`, { method: 'DELETE' });
    const data = await res.json();
    await loadProducts();
    notify(data.message || 'Producto eliminado');
  };

  const saveCategory = async (e) => {
    e.preventDefault();
    const method = categoryForm.id_categoria ? 'PUT' : 'POST';
    const url = categoryForm.id_categoria ? `${API}/categories/${categoryForm.id_categoria}` : `${API}/categories`;
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(categoryForm) });
    const data = await res.json();
    if (!res.ok) return notify(data.error || 'No se pudo guardar la categoría');
    setCategoryForm({ id_categoria: null, nombre_categoria: '', descripcion: '' });
    await loadCategories();
    await loadProducts();
    notify(data.message);
  };

  const deleteCategory = async (id) => {
    if (!confirm('¿Eliminar esta categoría?')) return;
    const res = await fetch(`${API}/categories/${id}`, { method: 'DELETE' });
    const data = await res.json();
    await loadCategories();
    await loadProducts();
    notify(data.message || 'Categoría eliminada');
  };

  const toggleCategory = (id) => {
    const exists = selectedCategoryIds.includes(id);
    setProductForm((prev) => ({ ...prev, categorias: exists ? prev.categorias.filter((x) => Number(x) !== id) : [...prev.categorias, id] }));
  };

  const findByBarcode = async (code) => {
    if (!code) return;
    setManualCode(code);
    setSearch(code);
    try {
      const res = await fetch(`${API}/products/barcode/${encodeURIComponent(code)}`);
      const data = await res.json();
      if (res.ok) {
        editProduct(data);
        notify(`Producto encontrado: ${data.nombre}`);
      } else notify('Código capturado. No existe en catálogo; puedes registrarlo.');
      setProductForm((prev) => ({ ...prev, codigo_barras: code }));
    } catch {
      notify('No fue posible consultar el código de barras');
    }
  };

  const startScanner = async () => {
    setScannerOpen(true);
    setTimeout(async () => {
      try {
        codeReaderRef.current = new BrowserMultiFormatReader();
        controlsRef.current = await codeReaderRef.current.decodeFromVideoDevice(undefined, videoRef.current, (result) => {
          if (result) {
            const code = result.getText();
            stopScanner();
            findByBarcode(code);
          }
        });
      } catch (err) {
        notify('La cámara no está disponible. Usa captura manual.');
      }
    }, 100);
  };

  const stopScanner = () => {
    if (controlsRef.current) controlsRef.current.stop();
    setScannerOpen(false);
  };

  return (
    <>
      <NavBar />
      <main className='page-shell'>
        {message && <div className='toast'>{message}</div>}
        <section className='hero-card'>
          <p className='eyebrow'>Responsable: Devani</p>
          <h1>Catálogo de productos, categorías y escáner</h1>
          <p>Alta, baja, modificación y consulta de productos; administración de categorías y búsqueda por código de barras.</p>
        </section>

        <section className='grid-layout'>
          <form className='panel-card' onSubmit={saveProduct}>
            <div className='section-heading'>
              <h2>{productForm.id_producto ? 'Editar producto' : 'Agregar producto'}</h2>
              <button type='button' className='secondary-btn' onClick={() => setProductForm(emptyProduct)}>Limpiar</button>
            </div>
            <label>Código de barras<input value={productForm.codigo_barras || ''} onChange={(e) => setProductForm({ ...productForm, codigo_barras: e.target.value })} placeholder='7500000000000' /></label>
            <label>Nombre<input required value={productForm.nombre} onChange={(e) => setProductForm({ ...productForm, nombre: e.target.value })} /></label>
            <label>Descripción<textarea value={productForm.descripcion || ''} onChange={(e) => setProductForm({ ...productForm, descripcion: e.target.value })} /></label>
            <div className='two-cols'>
              <label>Precio venta<input required type='number' min='0' step='0.01' value={productForm.precio_venta} onChange={(e) => setProductForm({ ...productForm, precio_venta: e.target.value })} /></label>
              <label>Precio compra<input required type='number' min='0' step='0.01' value={productForm.precio_compra} onChange={(e) => setProductForm({ ...productForm, precio_compra: e.target.value })} /></label>
            </div>
            <div className='two-cols'>
              <label>Stock<input type='number' min='0' value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} /></label>
              <label>Stock mínimo<input type='number' min='0' value={productForm.stock_minimo} onChange={(e) => setProductForm({ ...productForm, stock_minimo: e.target.value })} /></label>
            </div>
            <div className='two-cols'>
              <label>Unidad<input required value={productForm.unidad_medida} onChange={(e) => setProductForm({ ...productForm, unidad_medida: e.target.value })} /></label>
              <label>Caducidad<input type='date' value={productForm.fecha_caducidad || ''} onChange={(e) => setProductForm({ ...productForm, fecha_caducidad: e.target.value })} /></label>
            </div>
            <div className='category-checks'>
              <strong>Categorías</strong>
              {categories.map((cat) => (
                <label className='check-pill' key={cat.id_categoria}>
                  <input type='checkbox' checked={selectedCategoryIds.includes(cat.id_categoria)} onChange={() => toggleCategory(cat.id_categoria)} />
                  {cat.nombre_categoria}
                </label>
              ))}
            </div>
            <button className='primary-btn' type='submit'>Guardar producto</button>
          </form>

          <aside className='panel-card'>
            <h2>Escáner de barras</h2>
            <p className='muted'>Usa la cámara o captura el código manualmente como respaldo.</p>
            <button className='primary-btn' type='button' onClick={startScanner}>Abrir cámara</button>
            {scannerOpen && (
              <div className='scanner-box'>
                <video ref={videoRef} />
                <button className='danger-btn' type='button' onClick={stopScanner}>Cerrar cámara</button>
              </div>
            )}
            <div className='manual-code'>
              <input value={manualCode} onChange={(e) => setManualCode(e.target.value)} placeholder='Código manual' />
              <button className='secondary-btn' type='button' onClick={() => findByBarcode(manualCode)}>Buscar</button>
            </div>
          </aside>

          <form className='panel-card' onSubmit={saveCategory}>
            <div className='section-heading'>
              <h2>{categoryForm.id_categoria ? 'Editar categoría' : 'Agregar categoría'}</h2>
              <button type='button' className='secondary-btn' onClick={() => setCategoryForm({ id_categoria: null, nombre_categoria: '', descripcion: '' })}>Limpiar</button>
            </div>
            <label>Nombre<input required value={categoryForm.nombre_categoria} onChange={(e) => setCategoryForm({ ...categoryForm, nombre_categoria: e.target.value })} /></label>
            <label>Descripción<textarea value={categoryForm.descripcion || ''} onChange={(e) => setCategoryForm({ ...categoryForm, descripcion: e.target.value })} /></label>
            <button className='primary-btn' type='submit'>Guardar categoría</button>
            <div className='category-list'>
              {categories.map((cat) => (
                <article key={cat.id_categoria}>
                  <div><strong>{cat.nombre_categoria}</strong><small>{cat.descripcion}</small></div>
                  <div>
                    <button type='button' onClick={() => setCategoryForm(cat)}>Editar</button>
                    <button type='button' onClick={() => deleteCategory(cat.id_categoria)}>Eliminar</button>
                  </div>
                </article>
              ))}
            </div>
          </form>
        </section>

        <section className='panel-card full'>
          <div className='section-heading'>
            <h2>Productos registrados</h2>
            <input className='search-input' value={search} onChange={(e) => setSearch(e.target.value)} placeholder='Buscar por nombre, descripción o código' />
          </div>
          <div className='product-table'>
            <table>
              <thead><tr><th>Código</th><th>Producto</th><th>Categorías</th><th>Venta</th><th>Stock</th><th>Acciones</th></tr></thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id_producto}>
                    <td>{product.codigo_barras || '—'}</td>
                    <td><strong>{product.nombre}</strong><small>{product.descripcion}</small></td>
                    <td>{product.categorias || 'Sin categoría'}</td>
                    <td>${Number(product.precio_venta).toFixed(2)}</td>
                    <td><span className={product.stock <= product.stock_minimo ? 'low-stock' : ''}>{product.stock}</span></td>
                    <td className='actions'><button onClick={() => editProduct(product)}>Editar</button><button onClick={() => deleteProduct(product.id_producto)}>Eliminar</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  );
}
