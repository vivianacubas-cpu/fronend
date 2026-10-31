# Auth

Módulo de autenticación para el acceso al panel administrativo.

## Ruta

| Ruta | Componente | Acceso |
|------|-----------|--------|
| `/admin/login` | `LoginComponent` | Público |

La página está en `pages/login/`. La sesión se gestiona desde
`core/services/auth.service.ts`, compartido con el guard y la infraestructura
global.
