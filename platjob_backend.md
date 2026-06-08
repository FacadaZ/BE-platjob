# PlatJob Backend API Routes

Este documento detalla todas las rutas de la API del backend de PlatJob. Está diseñado para facilitar la integración con el frontend (o a través de un agente de IA). 

**Base URL:** `http://localhost:3000/api`
**Autenticación:** Las rutas protegidas requieren un encabezado de autorización HTTP de tipo Bearer (JWT): `Authorization: Bearer <token>`

---

## 1. Autenticación (`/auth`)

### Registrar Usuario
- **Ruta:** `POST /auth/register`
- **Descripción:** Registra un nuevo Cliente o Técnico.
- **Body (JSON):**
  - `name` (string, requerido): Nombre del usuario.
  - `email` (string, requerido): Correo electrónico válido.
  - `password` (string, requerido): Contraseña (min. 6 caracteres).
  - `role` (string, requerido): Puede ser `"CLIENT"` o `"TECHNICIAN"`.
  - `phone` (string, opcional): Teléfono de contacto.
  - `location` (string, opcional): Ubicación.
  - **Para Rol `TECHNICIAN` (Opcional/Requerido según caso):**
    - `category` (string, requerido para técnicos): Categoría de servicio (ej. "Gasfitería").
    - `specialties` (array de strings, opcional): Especialidades.
    - `bio` (string, opcional): Biografía del técnico.
    - `hourlyRate` (number, opcional): Tarifa por hora.

### Iniciar Sesión
- **Ruta:** `POST /auth/login`
- **Descripción:** Inicia sesión y retorna el token JWT.
- **Body (JSON):**
  - `email` (string, requerido)
  - `password` (string, requerido)

### Obtener Perfil Actual
- **Ruta:** `GET /auth/me`
- **Descripción:** Obtiene los datos del perfil del usuario autenticado.
- **Seguridad:** Requiere Token Bearer.

---

## 2. Técnicos (`/technicians`)

### Buscar y Filtrar Técnicos
- **Ruta:** `GET /technicians`
- **Descripción:** Obtiene un listado de técnicos disponibles en la plataforma.
- **Query Params:**
  - `category` (string, opcional): Filtrar por categoría.
  - `isAvailable` (boolean, opcional): Filtrar por disponibilidad.
  - `query` (string, opcional): Búsqueda por texto (nombre, bio, locación).

### Obtener Mi Perfil Técnico
- **Ruta:** `GET /technicians/profile/me`
- **Descripción:** Obtiene el perfil propio del técnico autenticado.
- **Seguridad:** Requiere Token Bearer.

### Actualizar Mi Perfil Técnico
- **Ruta:** `PUT /technicians/profile/me`
- **Descripción:** Actualiza los datos del perfil técnico autenticado.
- **Seguridad:** Requiere Token Bearer.
- **Body (JSON) [Opcionales]:**
  - `category` (string)
  - `specialties` (array de strings)
  - `bio` (string)
  - `hourlyRate` (number)
  - `isAvailable` (boolean)

### Obtener Perfil de un Técnico
- **Ruta:** `GET /technicians/{id}`
- **Descripción:** Obtiene el perfil detallado de un técnico usando su ID.
- **Parámetros de Ruta:** `id` (UUID del perfil técnico).

### Agregar Elemento al Portafolio
- **Ruta:** `POST /technicians/portfolio`
- **Descripción:** Agrega una nueva obra o proyecto al portafolio del técnico.
- **Seguridad:** Requiere Token Bearer.
- **Body (JSON):**
  - `imageUrl` (string, requerido): URL de la imagen.
  - `title` (string, requerido): Título del proyecto.
  - `description` (string, opcional): Descripción del trabajo.

### Eliminar Elemento del Portafolio
- **Ruta:** `DELETE /technicians/portfolio/{id}`
- **Descripción:** Elimina un elemento del portafolio del técnico por ID.
- **Seguridad:** Requiere Token Bearer.
- **Parámetros de Ruta:** `id` (UUID del elemento de portafolio).

---

## 3. Solicitudes de Servicio (`/service-requests`)

### Crear Solicitud de Servicio
- **Ruta:** `POST /service-requests`
- **Descripción:** Crea una nueva solicitud dirigida a un técnico específico (Solo Cliente).
- **Seguridad:** Requiere Token Bearer.
- **Body (JSON):**
  - `technicianId` (UUID, requerido): ID del técnico.
  - `category` (string, requerido): Categoría del servicio.
  - `title` (string, requerido): Título del trabajo a realizar.
  - `description` (string, requerido): Descripción del problema.
  - `address` (string, requerido): Dirección del servicio.
  - `budget` (number, opcional): Presupuesto estimado.
  - `scheduledDate` (datetime, opcional): Fecha programada.

### Listar Mis Solicitudes
- **Ruta:** `GET /service-requests`
- **Descripción:** Lista todas las solicitudes asociadas al usuario autenticado (sean solicitudes enviadas como cliente o recibidas como técnico).
- **Seguridad:** Requiere Token Bearer.
- **Query Params:**
  - `status` (string, opcional): Filtrar por estado (`"PENDING"`, `"ACCEPTED"`, `"IN_PROGRESS"`, `"COMPLETED"`, `"CANCELLED"`).

### Obtener Detalle de Solicitud
- **Ruta:** `GET /service-requests/{id}`
- **Descripción:** Obtiene el detalle individual de una solicitud por ID.
- **Seguridad:** Requiere Token Bearer.
- **Parámetros de Ruta:** `id` (UUID de la solicitud).

### Actualizar Estado de la Solicitud
- **Ruta:** `PATCH /service-requests/{id}/status`
- **Descripción:** Actualiza el estado de una solicitud de servicio.
- **Parámetros de Ruta:** `id` (UUID de la solicitud).
- **Seguridad:** Requiere Token Bearer.
- **Body (JSON):**
  - `status` (string, requerido): Nuevo estado (`"ACCEPTED"`, `"IN_PROGRESS"`, `"COMPLETED"`, `"CANCELLED"`).
  - `agreedRate` (number, opcional): Tarifa final acordada.

---

## 4. Reseñas (`/reviews`)

### Publicar Reseña
- **Ruta:** `POST /reviews`
- **Descripción:** Deja una reseña sobre un servicio completado (Solo Cliente). Automáticamente recalcula la reputación del técnico.
- **Seguridad:** Requiere Token Bearer.
- **Body (JSON):**
  - `requestId` (UUID, requerido): ID de la solicitud completada.
  - `rating` (integer, requerido): Puntuación de 1 a 5.
  - `comment` (string, requerido): Comentario detallando la experiencia.

### Obtener Reseñas de un Técnico
- **Ruta:** `GET /reviews/technician/{technicianId}`
- **Descripción:** Obtiene todas las reseñas públicas dirigidas a un técnico específico.
- **Parámetros de Ruta:** `technicianId` (UUID del perfil del técnico).

---

## 5. Chats & Mensajes (`/conversations`)

### Iniciar o Recuperar Chat
- **Ruta:** `POST /conversations`
- **Descripción:** Inicia una nueva conversación con un usuario o devuelve la existente.
- **Seguridad:** Requiere Token Bearer.
- **Body (JSON):**
  - `recipientId` (UUID, requerido): ID del usuario con el que se desea chatear.

### Listar Mis Chats
- **Ruta:** `GET /conversations`
- **Descripción:** Lista todas las conversaciones y chats activos de la bandeja de entrada del usuario autenticado.
- **Seguridad:** Requiere Token Bearer.

### Obtener Historial de Chat
- **Ruta:** `GET /conversations/{id}`
- **Descripción:** Obtiene todo el historial de mensajes de un chat específico.
- **Seguridad:** Requiere Token Bearer.
- **Parámetros de Ruta:** `id` (UUID de la conversación).

### Marcar Mensajes como Leídos
- **Ruta:** `PATCH /conversations/{id}/read`
- **Descripción:** Marca todos los mensajes recibidos en esta conversación como leídos.
- **Seguridad:** Requiere Token Bearer.
- **Parámetros de Ruta:** `id` (UUID de la conversación).

---

## 6. Integración en Tiempo Real (Socket.io)

El servidor de Websockets funciona bajo el mismo puerto y requiere autenticación mediante el token JWT.

### Conexión Inicial (Handshake)
```javascript
const socket = io("http://localhost:3000", {
  auth: { token: "Bearer <token>" }
});
```

### Eventos del Cliente al Servidor (Emit)
- **`join_room`:** Unirse a una sala (Payload: `{ "conversationId": "uuid" }`).
- **`send_message`:** Enviar un mensaje (Payload: `{ "conversationId": "uuid", "content": "Texto" }`).
- **`typing`:** Indicador de escritura (Payload: `{ "conversationId": "uuid", "isTyping": true|false }`).
- **`read_receipt`:** Marcar chat como leído (Payload: `{ "conversationId": "uuid" }`).

### Eventos del Servidor al Cliente (Listen)
- **`message_received`:** Nuevo mensaje recibido en el chat.
- **`user_typing`:** El otro usuario está escribiendo.
- **`messages_read`:** Confirmación de lectura por el otro usuario.
- **`user_online` / `user_offline`:** Notificaciones de presencia global.
