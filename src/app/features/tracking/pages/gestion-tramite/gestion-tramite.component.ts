import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import {
    AbstractControl,
    FormBuilder,
    FormsModule,
    ReactiveFormsModule,
    ValidationErrors,
    Validators,
} from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { GestionTramiteService, AreaCatalogo } from '../../services/gestion-tramite.service';
import { SolicitanteService } from '../../../solicitante/services/solicitante.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Solicitante } from '../../../../shared/interfaces/solicitante.model';
import {
    GestionTramite,
    GestionTramiteRequest,
    TIPOS_GESTION,
    PRIORIDADES,
    ESTADOS_GESTION,
} from '../../interfaces/gestion-tramite.model';

type Vista = 'listado' | 'formulario' | 'detalle' | 'eliminados';

@Component({
    selector: 'app-gestion-tramite',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink, DatePipe],
    templateUrl: './gestion-tramite.component.html',
    styleUrl: './gestion-tramite.component.css',
})
export class GestionTramiteComponent implements OnInit {

    get fechaMaxima(): string {
        return this.formatoFecha(new Date());
    }

    get fechaMaximaMes(): string {
        const now = new Date();
        return this.formatoFecha(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    }

    private formatoFecha(date: Date): string {
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day   = String(date.getDate()).padStart(2, '0');
        return `${date.getFullYear()}-${month}-${day}`;
    }

    private readonly notPastDate = (control: AbstractControl): ValidationErrors | null => {
        const value = control.value as string | null;
        if (!value) return null;
        if (value < this.fechaMaxima)    return { pastDate: true };
        if (value > this.fechaMaximaMes) return { outsideCurrentMonth: true };
        return null;
    };

    // ── Catálogos estáticos ──────────────────────────────────────────────────
    readonly tiposGestion   = TIPOS_GESTION;
    readonly prioridades    = PRIORIDADES;
    readonly estadosGestion = ESTADOS_GESTION;

    // ── Catálogo áreas (dinámico) ────────────────────────────────────────────
    areas: AreaCatalogo[] = [];
    cargandoAreas = false;

    // ── Catálogo solicitantes (para el selector del formulario) ──────────────
    solicitantes: Solicitante[] = [];
    cargandoSolicitudes = false;
    solicitudMenuAbierto = false;

    // ── Vista activa ─────────────────────────────────────────────────────────
    vista: Vista = 'listado';

    // ── Datos ────────────────────────────────────────────────────────────────
    registros:  GestionTramite[] = [];
    filtered:   GestionTramite[] = [];
    eliminados: GestionTramite[] = [];
    detalle: GestionTramite | null = null;
    private vistaAnterior: Vista = 'listado';

    // ── Filtros ──────────────────────────────────────────────────────────────
    query        = '';
    filtroEstado = '';

    // ── Estado UI ────────────────────────────────────────────────────────────
    cargando   = false;
    mensaje    = '';
    error      = '';
    editandoId: number | null = null;

    // ── Formulario reactivo ──────────────────────────────────────────────────
    readonly form = this.fb.nonNullable.group({
        idSolicitante: [null as number | null, [Validators.required, Validators.min(1)]],
        nombresResponsable: [
            '' as string,
            [Validators.required, Validators.maxLength(100),
             Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñ]+(?: [A-Za-zÁÉÍÓÚáéíóúÑñ]+)*$/)],
        ],
        apellidoPaternoResponsable: [
            '' as string,
            [Validators.required, Validators.maxLength(100),
             Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñ]+(?: [A-Za-zÁÉÍÓÚáéíóúÑñ]+)*$/)],
        ],
        apellidoMaternoResponsable: [
            '' as string,
            [Validators.required, Validators.maxLength(100),
             Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñ]+(?: [A-Za-zÁÉÍÓÚáéíóúÑñ]+)*$/)],
        ],
        idAreaResponsable:  [null as number | null, [Validators.required]],
        fechaRecepcion:     ['' as string, [Validators.required, this.notPastDate]],
        tipoGestion:        ['' as string, [Validators.required]],
        prioridad:          ['NORMAL'     as string, [Validators.required]],
        fechaLimite:        ['' as string, [Validators.required, this.notPastDate]],
        estadoGestion:      ['PENDIENTE'  as string, [Validators.required]],
        decision:           ['' as string, [Validators.required, Validators.maxLength(500), Validators.pattern(/\S/)]],
        fundamentoDecision: ['' as string, [Validators.required, Validators.maxLength(2000), Validators.pattern(/\S/)]],
        fechaResolucion:    ['' as string, [Validators.required, this.notPastDate]],
        observaciones:      ['' as string, [Validators.required, Validators.maxLength(2000), Validators.pattern(/\S/)]],
    });

    constructor(
        private readonly fb: FormBuilder,
        private readonly service: GestionTramiteService,
        private readonly solicitanteService: SolicitanteService,
        private readonly elementRef: ElementRef<HTMLElement>,
        private readonly auth: AuthService,
        private readonly router: Router,
    ) {}

    ngOnInit(): void {
        this.cargar();
        this.cargarAreas();
    }

    // ── Catálogo áreas ────────────────────────────────────────────────────────
    cargarAreas(): void {
        this.cargandoAreas = true;
        this.service.catalogoAreas().subscribe({
            next: data => { this.areas = data; this.cargandoAreas = false; },
            error: e   => {
                this.error = e?.error?.error ?? e?.message ?? 'No se pudo cargar el catálogo de áreas.';
                this.cargandoAreas = false;
            },
        });
    }

    // ── Helpers de presentación ───────────────────────────────────────────────

    /** Nombre del área a partir de su ID — para usar en el formulario. */
    nombreArea(id: number | null | undefined): string {
        if (id == null) return '—';
        return this.areas.find(a => a.idArea === id)?.nombre ?? `Área #${id}`;
    }

    /** Nombre completo del responsable concatenando los tres campos separados. */
    nombreResponsable(g: GestionTramite): string {
        const partes = [
            g.nombresResponsable,
            g.apellidoPaternoResponsable,
            g.apellidoMaternoResponsable,
        ].filter(Boolean);
        return partes.length ? partes.join(' ') : '—';
    }

    /** Nombre completo de un solicitante — usado en el selector del formulario. */
    solicitanteNombre(s: Solicitante): string {
        return [s.nombres, s.apellidoPaterno, s.apellidoMaterno].filter(Boolean).join(' ');
    }

    get solicitantesActivos(): Solicitante[] {
        return this.solicitantes.filter(s => s.estado === 'A');
    }

    get solicitanteSeleccionado(): Solicitante | undefined {
        const id = this.form.controls.idSolicitante.value;
        return this.solicitantes.find(s => s.idSolicitante === id);
    }

    alternarMenuSolicitantes(): void {
        if (this.solicitantesActivos.length > 0 && !this.cargandoSolicitudes) {
            this.solicitudMenuAbierto = !this.solicitudMenuAbierto;
        }
    }

    seleccionarSolicitante(id: number): void {
        this.form.controls.idSolicitante.setValue(id);
        this.form.controls.idSolicitante.markAsTouched();
        this.solicitudMenuAbierto = false;
    }

    cerrarMenuSolicitudes(): void {
        this.solicitudMenuAbierto = false;
    }

    @HostListener('document:click', ['$event'])
    cerrarMenuFuera(event: MouseEvent): void {
        if (!this.elementRef.nativeElement.contains(event.target as Node)) {
            this.cerrarMenuSolicitudes();
        }
    }

    private cargarSolicitantes(): void {
        this.cargandoSolicitudes = true;
        this.solicitanteService.findByEstado('T').subscribe({
            next: lista => {
                this.solicitantes = [...lista].sort((a, b) =>
                    this.solicitanteNombre(a).localeCompare(this.solicitanteNombre(b), 'es'));
                this.cargandoSolicitudes = false;
            },
            error: e => {
                this.error = e?.error?.error ?? e?.message ?? 'No se pudieron cargar los solicitantes.';
                this.cargandoSolicitudes = false;
            },
        });
    }

    // ── Carga de datos ────────────────────────────────────────────────────────
    cargar(): void {
        this.cargando = true;
        this.error = '';
        this.service.listar().subscribe({
            next: data => {
                this.registros = [...data].sort((a, b) => (a.idGestion ?? 0) - (b.idGestion ?? 0));
                this.cargando = false;
                this.aplicarFiltro();
            },
            error: e => {
                this.error = e?.error?.error ?? e?.message ?? 'No se pudo cargar la lista.';
                this.cargando = false;
            },
        });
        this.service.eliminados().subscribe({
            next: data => {
                this.eliminados = [...data].sort((a, b) => (a.idGestion ?? 0) - (b.idGestion ?? 0));
            },
            error: e => {
                this.error = e?.error?.error ?? e?.message ?? 'No se pudieron cargar las gestiones eliminadas.';
            },
        });
        this.cargarSolicitantes();
    }

    aplicarFiltro(): void {
        const q = this.query.trim().toLowerCase();
        this.filtered = this.registros.filter(r => {
            const matchTexto = !q ||
                String(r.idGestion ?? '').includes(q) ||
                (r.numeroDocumento    ?? '').toLowerCase().includes(q) ||
                (r.apellidoPaterno    ?? '').toLowerCase().includes(q) ||
                (r.nombresResponsable ?? '').toLowerCase().includes(q) ||
                (r.tipoGestion        ?? '').toLowerCase().includes(q) ||
                (r.estadoGestion      ?? '').toLowerCase().includes(q) ||
                this.nombreResponsable(r).toLowerCase().includes(q) ||
                (r.areaResponsable    ?? '').toLowerCase().includes(q);
            return matchTexto && (!this.filtroEstado || r.estadoGestion === this.filtroEstado);
        });
    }

    // ── Navegación ────────────────────────────────────────────────────────────
    nuevo(): void {
        this.editandoId = null;
        this.resetForm();
        this.mensaje = '';
        this.error   = '';
        this.vista   = 'formulario';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    editar(g: GestionTramite): void {
        this.editandoId = g.idGestion ?? null;
        this.form.reset({
            idSolicitante:             g.idSolicitante,
            nombresResponsable:        g.nombresResponsable        ?? '',
            apellidoPaternoResponsable:g.apellidoPaternoResponsable ?? '',
            apellidoMaternoResponsable:g.apellidoMaternoResponsable ?? '',
            idAreaResponsable:         g.idAreaResponsable         ?? null,
            fechaRecepcion:            g.fechaRecepcion ? g.fechaRecepcion.substring(0, 10) : '',
            tipoGestion:               g.tipoGestion,
            prioridad:                 g.prioridad     ?? 'NORMAL',
            fechaLimite:               g.fechaLimite   ? g.fechaLimite.substring(0, 10) : '',
            estadoGestion:             g.estadoGestion ?? 'PENDIENTE',
            decision:                  g.decision           ?? '',
            fundamentoDecision:        g.fundamentoDecision ?? '',
            fechaResolucion:           g.fechaResolucion ? g.fechaResolucion.substring(0, 10) : '',
            observaciones:             g.observaciones      ?? '',
        });
        this.mensaje = '';
        this.error   = '';
        this.vista   = 'formulario';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    ver(g: GestionTramite): void {
        this.vistaAnterior = this.vista;
        this.detalle = g;
        this.vista   = 'detalle';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    volverAlListado(): void {
        this.vista = this.vistaAnterior === 'eliminados' ? 'eliminados' : 'listado';
        this.vistaAnterior = 'listado';
        this.editandoId = null;
        this.detalle    = null;
        this.error      = '';
    }

    verEliminados(): void {
        this.mensaje = '';
        this.error   = '';
        this.service.eliminados().subscribe({
            next: data => {
                this.eliminados = [...data].sort((a, b) => (a.idGestion ?? 0) - (b.idGestion ?? 0));
            },
            error: e => {
                this.error = e?.error?.error ?? e?.message ?? 'No se pudieron cargar las gestiones eliminadas.';
            },
        });
        this.vista = 'eliminados';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ── Guardar ───────────────────────────────────────────────────────────────
    guardar(): void {
        this.form.markAllAsTouched();
        if (this.form.invalid) { this.error = 'Revisa los campos obligatorios antes de guardar.'; return; }

        const v = this.form.getRawValue();
        const req: GestionTramiteRequest = {
            idSolicitante:             Number(v.idSolicitante),
            nombresResponsable:        v.nombresResponsable.trim()        || null,
            apellidoPaternoResponsable:v.apellidoPaternoResponsable.trim() || null,
            apellidoMaternoResponsable:v.apellidoMaternoResponsable.trim() || null,
            idAreaResponsable:         v.idAreaResponsable ? Number(v.idAreaResponsable) : null,
            fechaRecepcion:            v.fechaRecepcion || undefined,
            tipoGestion:               v.tipoGestion,
            prioridad:                 v.prioridad      || undefined,
            fechaLimite:               v.fechaLimite,
            estadoGestion:             v.estadoGestion  || undefined,
            decision:                  v.decision.trim(),
            fundamentoDecision:        v.fundamentoDecision.trim(),
            fechaResolucion:           v.fechaResolucion,
            observaciones:             v.observaciones.trim(),
        };

        this.cargando = true;
        this.error    = '';
        this.mensaje  = '';

        const op$ = this.editandoId !== null
            ? this.service.actualizar(this.editandoId, req)
            : this.service.crear(req);

        op$.subscribe({
            next: (r: GestionTramite) => {
                this.cargando = false;
                this.mensaje  = this.editandoId !== null
                    ? `Gestión #${r.idGestion} actualizada correctamente.`
                    : `Gestión #${r.idGestion} registrada correctamente.`;
                this.vista     = 'listado';
                this.editandoId = null;
                this.cargar();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            },
            error: (e: any) => {
                this.cargando = false;
                this.error = e?.error?.error ?? e?.error?.message ?? e?.message ?? 'No se pudo guardar la gestión.';
            },
        });
    }

    cancelar(): void { this.volverAlListado(); }

    eliminar(g: GestionTramite): void {
        if (!confirm(`¿Eliminar la gestión #${g.idGestion}?\nPodrás restaurarla después.`)) return;
        this.service.eliminar(g.idGestion!).subscribe({
            next: () => { this.mensaje = `Gestión #${g.idGestion} eliminada.`; this.cargar(); },
            error: (e: any) => { this.error = e?.error?.error ?? e?.message ?? 'No se pudo eliminar.'; },
        });
    }

    restaurar(g: GestionTramite): void {
        if (!confirm(`¿Restaurar la gestión #${g.idGestion}?`)) return;
        this.service.restaurar(g.idGestion!).subscribe({
            next: () => { this.mensaje = `Gestión #${g.idGestion} restaurada correctamente.`; this.cargar(); },
            error: (e: any) => { this.error = e?.error?.error ?? e?.message ?? 'No se pudo restaurar.'; },
        });
    }

    // ── Helpers de validación ─────────────────────────────────────────────────
    invalido(campo: string): boolean {
        const c = this.form.get(campo);
        return !!c && c.invalid && (c.touched || c.dirty);
    }

    labelTipo(v: string): string      { return this.tiposGestion.find(t => t.value === v)?.label ?? v; }
    labelPrioridad(v: string): string { return this.prioridades.find(p => p.value === v)?.label ?? v; }
    labelEstado(v: string): string    { return this.estadosGestion.find(e => e.value === v)?.label ?? v; }

    cssEstado(v?: string): string {
        const m: Record<string, string> = {
            PENDIENTE:  'st-received',
            EN_PROCESO: 'st-review',
            OBSERVADO:  'st-observed',
            APROBADO:   'st-done',
            RECHAZADO:  'st-rejected',
        };
        return m[v ?? ''] ?? '';
    }

    private resetForm(): void {
        this.form.reset({
            idSolicitante: null,
            nombresResponsable: '', apellidoPaternoResponsable: '', apellidoMaternoResponsable: '',
            idAreaResponsable: null,
            fechaRecepcion: '', tipoGestion: '', prioridad: 'NORMAL',
            fechaLimite: '', estadoGestion: 'PENDIENTE',
            decision: '', fundamentoDecision: '', fechaResolucion: '', observaciones: '',
        });
    }

    // ── Compat legado (evita errores en el HTML si todavía se llama) ──────────
    toggleEliminados(): void { /* no-op */ }

    logout(): void { this.auth.logout(); this.router.navigateByUrl('/admin/login'); }
}
