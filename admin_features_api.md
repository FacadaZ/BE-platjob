# Documentacion de API: Panel de Administracion (Super Admin)

Esta documentacion describe los nuevos endpoints de administracion para la gestion dinamica de categorias y el bloqueo de usuarios (clientes y tecnicos).

---

## 1. Gestion Dinamica de Categorias

### Obtener Categorias (Publico)
Retorna la lista de todas las categorias registradas en la base de datos.

* URL: /api/technicians/categories
* Metodo HTTP: GET
* Autenticacion: Ninguna
* Headers:
  * Accept: application/json

#### Request Body
Vacio (GET).

#### Response Body (200 OK)
```json
{
  "success": true,
  "message": "Categorias obtenidas con exito",
  "data": [
    {
      "id": 1,
      "key": "electricista",
      "label": "Electricista"
    },
    {
      "id": 2,
      "key": "plomero",
      "label": "Plomero"
    }
  ]
}
```

---

### Crear Nueva Categoria (Solo Admin)
Registra una nueva categoria en el sistema.

* URL: /api/admin/categories
* Metodo HTTP: POST
* Autenticacion: Requerida (Bearer Token de Usuario con Rol ADMIN)
* Headers:
  * Content-Type: application/json
  * Authorization: Bearer <token>

#### Request Body
```json
{
  "key": "jardinero",
  "label": "Jardinero"
}
```

#### Response Body (201 Created)
```json
{
  "success": true,
  "message": "Categoria creada con exito",
  "data": {
    "id": 3,
    "key": "jardinero",
    "label": "Jardinero",
    "createdAt": "2026-06-01T21:20:00.000Z"
  }
}
```

---

### Eliminar Categoria (Solo Admin)
Elimina una categoria existente por su ID.

* URL: /api/admin/categories/:id
* Metodo HTTP: DELETE
* Autenticacion: Requerida (Bearer Token de Usuario con Rol ADMIN)
* Headers:
  * Authorization: Bearer <token>

#### Request Body
Vacio.

#### Response Body (200 OK)
```json
{
  "success": true,
  "message": "Categoria eliminada con exito"
}
```

---

## 2. Bloqueo y Suspension de Usuarios (Clientes y Tecnicos)

### Bloquear o Desbloquear Usuario (Solo Admin)
Permite suspender o reactivar la cuenta de un usuario (Cliente o Tecnico) mediante su ID.

* URL: /api/admin/users/:id/block
* Metodo HTTP: PATCH
* Autenticacion: Requerida (Bearer Token de Usuario con Rol ADMIN)
* Headers:
  * Content-Type: application/json
  * Authorization: Bearer <token>

#### Request Body
```json
{
  "status": "BLOCKED"
}
```
Nota: Los valores permitidos para `status` son: `"ACTIVE"` (activo) o `"BLOCKED"` (bloqueado).

#### Response Body (200 OK)
```json
{
  "success": true,
  "message": "Estado del usuario actualizado con exito",
  "data": {
    "id": 45,
    "name": "Juan Perez",
    "email": "juan.perez@example.com",
    "role": "TECHNICIAN",
    "status": "BLOCKED",
    "updatedAt": "2026-06-01T21:21:00.000Z"
  }
}
```

---

### Respuesta del Servidor al Iniciar Sesion si la Cuenta esta Bloqueada

Si un usuario con estado `"BLOCKED"` intenta hacer login en `/api/auth/login`, el servidor rechazara la solicitud de inmediato.

* URL: /api/auth/login
* Metodo HTTP: POST
* Response Status: 403 Forbidden

#### Response Body
```json
{
  "success": false,
  "message": "Tu cuenta ha sido suspendida. Por favor, ponte en contacto con soporte."
}
```

---

### Revocacion de Acceso en Tiempo Real (Cualquier Endpoint Protegido)

Si un usuario ya ha iniciado sesion y tiene un token activo, pero es bloqueado por un Administrador, cualquier peticion posterior que intente hacer a una ruta protegida sera rechazada de inmediato.

* URL: Cualquier ruta protegida (ej: /api/technicians/profile/me)
* Metodo HTTP: Cualquiera (GET, POST, PUT, DELETE)
* Response Status: 401 Unauthorized

#### Response Body
```json
{
  "success": false,
  "message": "Tu cuenta ha sido suspendida. Por favor, ponte en contacto con soporte."
}
```
