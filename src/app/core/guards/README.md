# 🛡️ Guards

Guards de ruta globales que controlan el acceso a secciones protegidas.

## 🗂️ Archivos

| Archivo | Descripción |
|---------|-------------|
| `auth.guard.ts` | Protege rutas del panel admin. Requiere sesión activa con rol DIRECTORA, SECRETARIA o ADMIN. |

## ✅ Regla
Los guards se registran en `canActivate` de las rutas protegidas en cada `*.routes.ts`.
