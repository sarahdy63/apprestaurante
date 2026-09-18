# GASTRO Frontend integrado

Frontend HTML/CSS/JavaScript ajustado para consumir la API Node.js incluida en la entrega.

## Importante
No abras `index.html` con doble clic para las pruebas integradas. Ejecuta el frontend con Live Server en el puerto 5500 para que CORS y las llamadas `fetch` funcionen de forma consistente.

## Integraciones realizadas
- Menú cargado desde `GET /api/products`.
- Creación real de pedidos en MySQL mediante `POST /api/orders`.
- Seguimiento por código mediante `GET /api/orders/code/:code`.
- Login administrativo JWT.
- Gestión de productos contra MySQL.
- Dashboard de pedidos y ventas reales.
- Cambio de estado del pedido desde el panel administrativo.

La URL de la API se encuentra al inicio de `js/app.js` y `js/admin.js` y por defecto es `http://localhost:3000/api`.
