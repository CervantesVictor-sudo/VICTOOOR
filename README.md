# POS TRUE RESPONSIVE — Tienda de Abarrotes

Sistema de Punto de Venta webapp responsivo con lector de códigos de barras por cámara, diseñado para tiendas de abarrotes.

Proyecto final de la materia del Laboratorio de Base de Datos.

## Equipo de desarrollo

| Integrante | Tareas principales |
|---|---|
| **Asaf** | Fase 0 (limpieza y preparación), Core transaccional de ventas (T-2.2) |
| **Devani** | CRUD catálogo y categorías (T-1.2), Escáner óptico de códigos (T-2.1) |
| **Víctor** | Bitácora de auditoría (T-4.1) Dashboard gerencial (T-4.2)|
| **Martin** | Inventario automático y alertas (T-3.1), Compras a proveedores (T-3.2), Dashboard gerencial (T-4.2) |

## Stack tecnológico

- **Backend:** Node.js + Express.js + SQLite (`sqlite3`)
- **Frontend:** React (Vite) + React Router
- **Autenticación:** JWT (`jsonwebtoken`) + bcrypt (`bcryptjs`)
- **Escaneo:** ZXing Browser (códigos de barras por cámara)

## Requisitos previos

- Node.js >= 18
- npm

## Instalación

```bash
git clone https://github.com/CervantesVictor-sudo/VICTOOOR.git
cd VICTOOOR/POS-System
```

### Backend

```bash
cd backend
npm install
```

### Frontend

```bash
cd frontend
npm install
```

## Levantar el proyecto

> **Se necesitan dos terminales abiertas simultáneamente.**

### Terminal 1 — Backend (puerto 3000)

```bash
cd POS-System/backend
npm start
```

Deberías ver:
```
✅ Servidor corriendo en http://localhost:3000
   CORS habilitado para todas las origenes
Conexión exitosa a la base de datos SQLite.
```

### Terminal 2 — Frontend (puerto 5173)

```bash
cd POS-System/frontend
npm run dev
```

Deberías ver:
```
  VITE vX.X.X  ready in XXX ms
  ➜  Local:   http://localhost:5173/
```

### Abrir en el navegador

Navegar a **http://localhost:5173**

## Usuarios de prueba

Para probar el login y las funciones protegidas, primero registra un usuario con Thunder Client o curl:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"id_empleado": 1, "username": "admin", "password": "admin123", "rol": "Administrador"}'
```

Roles disponibles: `Administrador`, `Cajero`, `Almacenista`.

## Estructura del proyecto

```
POS-System/
├── backend/
│   ├── config/
│   │   └── db.js                  # Conexión SQLite + wrappers transaccionales
│   ├── controllers/
│   │   ├── authController.js      # Login y registro (T-1.1, T-4.1)
│   │   ├── salesController.js     # Motor de ventas (T-2.2, T-4.1)
│   │   ├── compraController.js    # Recepción de compras (T-3.2, T-4.1)
│   │   ├── inventoryController.js # Alertas de inventario (T-3.1)
│   │   ├── auditController.js     # Consulta de bitácora (T-4.1)
│   │   └── reportController.js    # Dashboard gerencial (T-4.2)
│   ├── middlewares/
│   │   └── authMiddleware.js      # Verificación de token JWT
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── productRoutes.js       # Productos + categorías (T-1.2)
│   │   ├── salesRoutes.js
│   │   ├── inventoryRoutes.js
│   │   ├── compraRoutes.js
│   │   ├── auditRoutes.js         # T-4.1
│   │   └── reportRoutes.js        # T-4.2
│   ├── utils/
│   │   └── auditService.js        # Servicio centralizado de auditoría (T-4.1)
│   ├── database/
│   │   ├── TIENDA.db              # Base de datos SQLite
│   │   ├── 01_trigger_inventario.sql
│   │   └── 02_migracion_auditoria.sql  # T-4.1
│   ├── server.js                  # Entry point del backend
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx                # Rutas y navegación
│   │   ├── main.jsx               # Entry point
│   │   ├── styles/
│   │   │   └── dev.css
│   │   └── pages/
│   │       ├── LoginPage.jsx
│   │       ├── CatalogoPage.jsx   # Productos, categorías, escáner (T-1.2, T-2.1)
│   │       ├── POSPage.jsx        # Punto de venta (T-2.2)
│   │       ├── AuditoriaPage.jsx  # Bitácora de auditoría (T-4.1)
│   │       └── ReportesPage.jsx   # Dashboard gerencial (T-4.2)
│   ├── index.html
│   └── package.json
├── .gitignore
├── LICENSE
└── README.md
```

## Endpoints de la API REST

Todos los endpoints bajo `http://localhost:3000/api/`:

### Autenticación
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/register` | Registrar usuario |
| POST | `/api/auth/login` | Iniciar sesión (retorna JWT) |

### Catálogo (productos y categorías)
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/products` | Listar productos |
| GET | `/api/products/barcode/:codigo` | Buscar por código de barras |
| POST | `/api/products` | Crear producto |
| PUT | `/api/products/:id` | Editar producto |
| DELETE | `/api/products/:id` | Eliminar (soft delete) |
| GET | `/api/categories` | Listar categorías |
| POST | `/api/categories` | Crear categoría |
| PUT | `/api/categories/:id` | Editar categoría |
| DELETE | `/api/categories/:id` | Eliminar categoría |

### Ventas
| Método | Ruta | Protegido | Descripción |
|---|---|---|---|
| POST | `/api/sales/procesar` | JWT | Procesar venta completa |

### Inventario
| Método | Ruta | Protegido | Descripción |
|---|---|---|---|
| GET | `/api/inventory/alertas` | JWT | Stock crítico y caducidad próxima |

### Compras
| Método | Ruta | Protegido | Descripción |
|---|---|---|---|
| PUT | `/api/compras/:id/recibir` | JWT | Recibir compra y actualizar stock |

### Auditoría (T-4.1)
| Método | Ruta | Protegido | Descripción |
|---|---|---|---|
| GET | `/api/auditoria` | JWT | Bitácora paginada con filtros |
| GET | `/api/auditoria/:id` | JWT | Detalle de un registro |

### Reportes (T-4.2)
| Método | Ruta | Protegido | Descripción |
|---|---|---|---|
| GET | `/api/reportes/kpis` | JWT | KPIs generales del negocio |
| GET | `/api/reportes/ventas-por-dia` | JWT | Ventas agrupadas por fecha |
| GET | `/api/reportes/ventas-por-metodo` | JWT | Distribución por método de pago |
| GET | `/api/reportes/top-productos` | JWT | Ranking de productos + margen |
| GET | `/api/reportes/ventas-por-empleado` | JWT | Rendimiento por cajero |
| GET | `/api/reportes/movimientos-inventario` | JWT | Entradas y salidas de inventario |

## Base de datos

SQLite con archivo `TIENDA.db`. Tablas principales:

- `Empleado`, `Usuario`, `Producto`, `Categoria`, `Producto_Categoria`
- `Cliente`, `Venta`, `Detalle_Ventas`
- `Proveedor`, `Compra`, `Detalle_Compras`
- `Movimiento_Inventario`, `Auditoria`

La tabla `Auditoria` tiene triggers de inmutabilidad (no se pueden modificar ni eliminar registros).

## Convenciones Git

- Ramas por feature: `feature/T-X.X-descripcion-nombre`
- Commits semánticos: `feat(T-X.X): descripción del cambio`
- Pull Requests limpios sin conflictos heredados

## Licencia

GPL-3.0
