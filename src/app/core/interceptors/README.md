# 🌐 Interceptors

Interceptores HTTP que modifican o enriquecen las peticiones/respuestas globalmente.

## 🗂️ Archivos

| Archivo | Descripción |
|---------|-------------|
| `auth.interceptor.ts` | Agrega el token de sesión a las peticiones HTTP salientes. |

## ✅ Regla
Los interceptores se registran en `app.config.ts` dentro de `provideHttpClient(withInterceptors([...]))`.
