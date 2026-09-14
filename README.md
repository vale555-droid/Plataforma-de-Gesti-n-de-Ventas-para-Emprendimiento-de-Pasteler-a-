Dulce Encanto - Plataforma de Gestión para Pastelería Artesanal
Plataforma web Full Stack diseñada para la gestión integral de pedidos, control de inventario por recetas en tiempo real y libro diario contable para establecimientos de repostería y pastelería artesanal.

Características Principales
- Módulo de Tienda & Pedidos: Gestión de solicitudes individuales (entrega inmediata) y cotizaciones avanzadas para eventos especiales o mesas dulces.
- Pasarela de Pago (Webhook Sandbox): Simulación de confirmación de pagos en tiempo real que desencadena eventos automáticos en el sistema.
- Inventario de Insumos Inteligente: Control dinámico de Stock Inicial y Stock Actual. Descuento automático de ingredientes (gramos, unidades) basado en la receta de cada producto vendido al aprobarse el pago.
- Libro Diario Contable: Registro automatizado de asientos contables por ventas confirmadas.
- Interfaz Single Page Application (SPA): Navegación fluida y responsiva construida con Tailwind CSS, tipografías editoriales (Playfair Display & Plus Jakarta Sans) y paleta de colores pastel.

Tecnologías Utilizadas
- Frontend: HTML5, JavaScript (ES6+), Tailwind CSS (CDN), Google Fonts.
- Backend: Node.js, Express.js.
- Base de Datos: SQLite3 (Persistencia relacional local).
- Herramientas & Middleware: CORS, Dotenv, Fetch API.

Estructura del Proyecto

Proyecto/
    public/
         index.html          # Interfaz de usuario SPA (HTML + JS + Tailwind)
    .env                    # Variables de entorno (Puerto)
    app.js                  # Servidor Express, API REST y conexión SQLite
    package.json            # Dependencias del proyecto
    pasteleria.db           # Base de datos SQLite
