# Backend Fondo Escudo - Google Cloud SQL

## Configuración Completa

### 1. Instalar Node.js
Descarga e instala Node.js desde: https://nodejs.org/

### 2. Instalar Dependencias
Abre una terminal (cmd o PowerShell) y ejecuta:

```bash
cd c:\Users\Valen\Desktop\LEO\server
npm install
```

### 3. Configurar Base de Datos
Las credenciales ya están configuradas en el archivo `.env`:

```env
DB_HOST=34.176.159.188
DB_USER=developer
DB_PASSWORD=p4$$w0rd
DB_NAME=fondo_escudo
DB_PORT=3306
```

### 4. Crear Base de Datos
Conéctate a tu Google Cloud SQL y ejecuta el script `database/schema.sql`:

```sql
-- En Google Cloud Console o MySQL Workbench:
-- Ejecutar el contenido del archivo database/schema.sql
```

### 5. Iniciar Servidor

#### Desarrollo:
```bash
npm run dev
```

#### Producción:
```bash
npm start
```

El servidor iniciará en: `http://localhost:3001`

### 6. Verificar Conexión
Abre en tu navegador: `http://localhost:3001/api/health`

Deberías ver:
```json
{
  "status": "ok",
  "timestamp": "2024-01-26T19:00:00.000Z",
  "database": "connected"
}
```

## Estructura de Carpetas

```
server/
├── config/
│   └── database.js          # Conexión a Cloud SQL
├── database/
│   └── schema.sql           # Estructura de tablas MySQL
├── middleware/
│   └── auth.js              # Middleware de autenticación JWT
├── routes/
│   ├── auth.js              # Rutas de login/registro
│   ├── users.js             # Rutas de gestión de usuarios
│   └── payments.js          # Rutas de pagos
├── uploads/                 # Carpeta para comprobantes
├── .env                     # Variables de entorno
├── .env.example             # Ejemplo de configuración
├── package.json             # Dependencias del proyecto
├── server.js                # Servidor principal
└── README.md               # Este archivo
```

## API Endpoints

### Autenticación
- `POST /api/auth/register` - Registro con email
- `POST /api/auth/login` - Login con email y contraseña
- `POST /api/auth/google` - Login con Google OAuth
- `GET /api/auth/verify` - Verificar token JWT

### Usuarios
- `GET /api/users/profile` - Obtener perfil
- `PUT /api/users/profile` - Actualizar perfil
- `PUT /api/users/plan` - Cambiar plan
- `GET /api/users/activity` - Historial de actividad

### Pagos
- `POST /api/payments/mercadopago` - Pagar con Mercado Pago
- `POST /api/payments/transfer` - Subir comprobante
- `GET /api/payments/history` - Historial de pagos
- `GET /api/payments/next` - Próximo pago
- `GET /api/payments/plans` - Planes disponibles

## Base de Datos

### Tablas Principales

#### users
```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uid VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    dni VARCHAR(20) UNIQUE NOT NULL,
    phone VARCHAR(20),
    gender ENUM('masculino', 'femenino', 'otro') NOT NULL,
    photo_url TEXT,
    registered_with ENUM('email', 'google') NOT NULL DEFAULT 'email',
    plan ENUM('Plan Normal', 'Plan Plus', 'Plan Pro') NOT NULL DEFAULT 'Plan Normal',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL
);
```

#### payments
```sql
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    plan VARCHAR(50) NOT NULL,
    payment_method ENUM('mercado_pago', 'transferencia') NOT NULL,
    status ENUM('pending', 'approved', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending',
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### payment_receipts
```sql
CREATE TABLE payment_receipts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    payment_id INT NOT NULL,
    user_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## Seguridad

### JWT Authentication
- Token válido por 7 días
- Verificación automática en cada request
- Logout automático al expirar

### Rate Limiting
- 100 requests cada 15 minutos por IP
- Protección contra ataques de fuerza bruta

### CORS
- Solo permite requests desde el frontend configurado
- Headers de seguridad configurados

## Archivos y Uploads

### Comprobantes de Pago
- Formatos permitidos: JPG, PNG, PDF
- Tamaño máximo: 5MB
- Guardados en: `uploads/receipts/`
- Nomenclatura: `receipt-{userId}-{timestamp}.{ext}`

## Logs y Auditoría

### Activity Logs
- Registro de todas las acciones importantes
- IP address y User Agent
- Timestamp automático

## Testing

### Test de Conexión
```bash
curl http://localhost:3001/api/health
```

### Test de Registro
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.com",
    "password": "123456",
    "firstName": "Juan",
    "lastName": "Pérez",
    "dni": "12345678",
    "gender": "masculino"
  }'
```

### Test de Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.com",
    "password": "123456"
  }'
```

## Solución de Problemas

### Error: Cannot connect to MySQL
1. Verifica que las credenciales en `.env` sean correctas
2. Verifica que tu IP esté autorizada en Google Cloud SQL
3. Verifica que la instancia esté corriendo

### Error: Database not found
1. Ejecuta el script `database/schema.sql`
2. Verifica que el nombre de la base de datos sea `fondo_escudo`

### Error: Module not found
1. Ejecuta `npm install` en la carpeta `server`
2. Verifica que Node.js esté instalado correctamente

## Producción

### Variables de Entorno
- Nunca commitear el archivo `.env`
- Usar variables de entorno reales en producción
- Cambiar `JWT_SECRET` por una clave segura

### Seguridad Adicional
- Configurar HTTPS
- Usar Cloud SQL Proxy
- Implementar logging más robusto
- Configurar backups automáticos

## Costos Estimados

### Google Cloud SQL
- db-f1-micro: ~$7.5/mes
- db-g1-small: ~$24/mes
- Almacenamiento: ~$0.26/GB/mes

### Otros servicios
- Compute Engine (si se necesita): Variable
- Storage (para archivos): ~$0.02/GB/mes

## Soporte

Para más información:
- Google Cloud SQL: https://cloud.google.com/sql
- Node.js: https://nodejs.org/docs/
- Express.js: https://expressjs.com/
- JWT: https://jwt.io/
