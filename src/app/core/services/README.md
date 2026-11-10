# ⚙️ Core Services

Servicios globales reutilizables en toda la aplicación.

## 📌 Se usan en:
- Login y autenticación
- Guards de ruta
- Interceptores HTTP
- Dashboard y sesión

## 🗂️ Archivos

| Archivo | Descripción |
|---------|-------------|
| `auth.service.ts` | Gestión de sesión, login y roles |

## ✅ Regla
Solo colocar aquí servicios que sean consumidos por **más de un módulo** o por elementos del `core/` (guards, interceptors).
