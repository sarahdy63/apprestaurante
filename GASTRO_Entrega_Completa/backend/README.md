# GASTRO Backend

API REST desarrollada con Node.js, Express y MySQL para el frontend GASTRO.

## Funcionalidades

- Autenticación de administrador con JWT.
- Productos: consultar, crear, editar y eliminación lógica.
- Pedidos: crear, consultar por código, listar y cambiar estado.
- Dashboard: cantidad de pedidos, pendientes, rutas y ventas del día.
- Información del restaurante: consulta pública y actualización administrativa.
- Contraseñas protegidas con bcrypt.
- Consultas SQL parametrizadas mediante mysql2.
- Transacciones al crear pedidos.

## Ejecución rápida

1. Ejecuta `database/database.sql` en MySQL.
2. Copia `.env.example` como `.env` y configura la clave de MySQL.
3. Ejecuta `npm install`.
4. Ejecuta `npm run dev` o `npm start`.
5. Comprueba `http://localhost:3000/api/health`.

El administrador inicial se crea automáticamente al iniciar la API con las credenciales definidas en `.env`.
