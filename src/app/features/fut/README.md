# FUT (Formulario Único de Trámite)

Módulo principal del sistema. Gestiona el registro, listado y detalle de solicitudes FUT.

Las páginas se encuentran en `pages/`, el acceso a la API en `services/` y
los DTO de la feature en `interfaces/fut.model.ts`. El formulario compartido
de solicitante se mantiene en `shared/components/`; FUT controla su propia
persistencia mediante el servicio de Solicitantes.

## Rutas

| Ruta | Componente | Acceso |
|------|-----------|--------|
| `/fut/nuevo` | `FutCreateComponent` | Público |
| `/admin/tramites` | `FutListComponent` | 🔒 Admin |
| `/admin/tramites/:id` | `FutDetailComponent` | 🔒 Admin |
