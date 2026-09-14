const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Inicializar SQLite DB
const db = new sqlite3.Database('./pasteleria.db', (err) => {
  if (err) console.error("Error al conectar SQLite:", err.message);
  else console.log("Base de datos SQLite lista.");
});

// Crear tablas con stock_inicial
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS ingredientes (
    id TEXT PRIMARY KEY,
    nombre TEXT,
    stock_inicial REAL,
    stock_actual REAL,
    unidad_medida TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS recetas (
    producto_id TEXT,
    ingrediente_id TEXT,
    cantidad_requerida REAL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS pedidos (
    id TEXT PRIMARY KEY,
    usuario_id TEXT,
    tipo TEXT,
    num_invitados INTEGER,
    fecha_evento TEXT,
    total REAL,
    estado TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS detalle_pedidos (
    pedido_id TEXT,
    producto_id TEXT,
    cantidad INTEGER,
    precio_unitario REAL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS movimientos_contables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    referencia TEXT,
    tipo TEXT,
    monto REAL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Sembrar datos iniciales si la tabla está vacía
  db.get("SELECT COUNT(*) as count FROM ingredientes", (err, row) => {
    if (row && row.count === 0) {
      db.run("INSERT INTO ingredientes VALUES ('ing-1', 'Harina de Trigo', 10000, 10000, 'g')");
      db.run("INSERT INTO ingredientes VALUES ('ing-2', 'Azúcar Manuelita', 5000, 5000, 'g')");
      db.run("INSERT INTO ingredientes VALUES ('ing-3', 'Cacao en Polvo', 2000, 2000, 'g')");
      db.run("INSERT INTO ingredientes VALUES ('ing-4', 'Huevos de Canto', 100, 100, 'unidades')");

      // Receta para Torta Personalizada (prod-2)
      db.run("INSERT INTO recetas VALUES ('prod-2', 'ing-1', 500)"); // 500g Harina
      db.run("INSERT INTO recetas VALUES ('prod-2', 'ing-2', 300)"); // 300g Azúcar
      db.run("INSERT INTO recetas VALUES ('prod-2', 'ing-3', 150)"); // 150g Cacao
      db.run("INSERT INTO recetas VALUES ('prod-2', 'ing-4', 6)");   // 6 Huevos
    }
  });
});

// Ruta Raíz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Endpoint: Crear Pedido
app.post('/api/v1/pedidos', (req, res) => {
  const { usuario_id, tipo, num_invitados, fecha_evento, productos } = req.body;
  const pedido_id = 'PED-' + Date.now();
  let total = 0;

  productos.forEach(p => total += (p.cantidad * p.precio_unitario));

  db.run(`INSERT INTO pedidos VALUES (?, ?, ?, ?, ?, ?, 'PENDIENTE')`,
    [pedido_id, usuario_id, tipo, num_invitados, fecha_evento, total],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });

      productos.forEach(p => {
        db.run(`INSERT INTO detalle_pedidos VALUES (?, ?, ?, ?)`,
          [pedido_id, p.producto_id, p.cantidad, p.precio_unitario]);
      });

      res.status(201).json({ pedido_id, total, estado: 'PENDIENTE' });
    }
  );
});

// Endpoint: Webhook de Pago (DESCUENTA INVENTARIO)
app.post('/api/v1/payments/webhook', (req, res) => {
  const { pedido_id, estado_transaccion, referencia_pasarela, monto } = req.body;

  if (estado_transaccion === 'APPROVED') {
    db.run(`UPDATE pedidos SET estado = 'PAGADO' WHERE id = ?`, [pedido_id]);

    // Registrar en contabilidad
    db.run(`INSERT INTO movimientos_contables (referencia, tipo, monto) VALUES (?, 'INGRESO_VENTA', ?)`,
      [referencia_pasarela, monto]);

    // Descontar inventario según la receta y cantidad del pedido
    db.all(`SELECT producto_id, cantidad FROM detalle_pedidos WHERE pedido_id = ?`, [pedido_id], (err, items) => {
      if (!err && items) {
        items.forEach(item => {
          db.all(`SELECT ingrediente_id, cantidad_requerida FROM recetas WHERE producto_id = ?`, [item.producto_id], (err, insumos) => {
            if (!err && insumos) {
              insumos.forEach(insumo => {
                const consumoTotal = insumo.cantidad_requerida * item.cantidad;
                db.run(`UPDATE ingredientes SET stock_actual = stock_actual - ? WHERE id = ?`, [consumoTotal, insumo.ingrediente_id]);
              });
            }
          });
        });
      }
    });

    return res.json({ mensaje: "¡Pago aprobado! Inventario descontado según la receta." });
  }

  res.status(400).json({ error: "Transacción no aprobada" });
});

// Endpoint: Consultar Inventario
app.get('/api/v1/ingredientes', (req, res) => {
  db.all(`SELECT * FROM ingredientes`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ingredientes: rows });
  });
});

// Endpoint: Ajustar/Modificar Stock Inicial o Actual (Nuevo)
app.put('/api/v1/ingredientes/:id', (req, res) => {
  const { id } = req.params;
  const { stock_inicial, stock_actual } = req.body;

  db.run(
    `UPDATE ingredientes SET stock_inicial = ?, stock_actual = ? WHERE id = ?`,
    [stock_inicial, stock_actual, id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: "Stock actualizado correctamente" });
    }
  );
});

// Endpoint: Consultar Contabilidad
app.get('/api/v1/admin/resumen', (req, res) => {
  db.all(`SELECT * FROM movimientos_contables ORDER BY fecha DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ movimientos_contables: rows });
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servidor escuchando en http://localhost:${PORT}`));