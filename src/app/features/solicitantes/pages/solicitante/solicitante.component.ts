import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Subscription } from 'rxjs';
import { SolicitanteFormComponent } from '../../../../shared/components/solicitante-form/solicitante-form.component';
import {
    Solicitante,
    SolicitanteEntrada,
    TipoDocumento,
    Ubigeo,
} from '../../../../shared/interfaces/solicitante.model';
import { SolicitanteService } from '../../services/solicitante.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ExportColumn, ExportService } from '../../../../core/services/export.service';

type Vista = 'listado' | 'formulario' | 'detalle';

@Component({
    selector: 'app-solicitante',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, DatePipe, SolicitanteFormComponent],
    templateUrl: './solicitante.component.html',
    styleUrl: './solicitante.component.css',
})
export class SolicitanteComponent implements OnInit, OnDestroy {

    // ── Vista activa ──────────────────────────────────────────────────────────
    vista: Vista = 'listado';

    // ── Listado ───────────────────────────────────────────────────────────────
    registros: Solicitante[] = [];
    filtered: Solicitante[] = [];
    query = '';
    mostrarInactivos = false;
    cargando = false;
    mensaje = '';
    error = '';
    errorFormulario = '';
    guardandoFormulario = false;

    // ── Formulario / Detalle ──────────────────────────────────────────────────
    editandoId: number | null = null;
    registroEditar: Solicitante | null = null;
    registroDetalle: Solicitante | null = null;

    // ── Catálogos ─────────────────────────────────────────────────────────────
    tiposDocumento: TipoDocumento[] = [];
    ubigeos: Ubigeo[] = [];

    private subs = new Subscription();

    constructor(
        private service: SolicitanteService,
        private auth: AuthService,
        private router: Router,
        private exportService: ExportService,
    ) {}

    ngOnInit(): void {
        this.subs.add(this.service.tiposDocumento().subscribe({ next: t => this.tiposDocumento = t }));
        this.subs.add(this.service.ubigeos().subscribe({ next: u => this.ubigeos = u }));
        this.cargar();
    }

    ngOnDestroy(): void { this.subs.unsubscribe(); }

    // ── Carga y filtro ────────────────────────────────────────────────────────
    cargar(): void {
        this.cargando = true;
        this.error = '';
        this.service.findAll().subscribe({
            next: data => {
                this.registros = data.filter(r => this.mostrarInactivos ? r.estado === 'I' : r.estado === 'A');
                this.cargando = false;
                this.aplicarFiltro();
            },
            error: e => {
                this.error = e?.error?.error ?? e?.message ?? 'No se pudo cargar la lista de solicitantes.';
                this.cargando = false;
                this.registros = [];
                this.filtered = [];
            },
        });
    }

    aplicarFiltro(): void {
        const q = this.query.trim().toLocaleLowerCase();
        this.filtered = this.registros.filter(r => {
            const texto = [r.numeroDocumento, r.nombres, r.apellidoPaterno, r.apellidoMaterno, r.correo]
                .map(v => String(v || '').toLocaleLowerCase());
            return !q || texto.some(v => v.includes(q));
        });
    }

    toggleInactivos(): void {
        this.mostrarInactivos = !this.mostrarInactivos;
        this.cargar();
    }

    // ── Navegación ────────────────────────────────────────────────────────────
    nuevo(): void {
        this.registroEditar = null;
        this.editandoId = null;
        this.mensaje = '';
        this.error = '';
        this.errorFormulario = '';
        this.vista = 'formulario';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    ver(r: Solicitante): void {
        this.registroDetalle = r;
        this.mensaje = '';
        this.error = '';
        this.vista = 'detalle';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    editar(r: Solicitante): void {
        this.resolverRegistro(r, registro => this.abrirEdicion(registro));
    }

    private abrirEdicion(r: Solicitante): void {
        this.registroEditar = r;
        this.editandoId = r.idSolicitante ?? null;
        this.mensaje = '';
        this.error = '';
        this.errorFormulario = '';
        this.vista = 'formulario';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    volverAlListado(): void {
        this.vista = 'listado';
        this.registroEditar = null;
        this.editandoId = null;
        this.registroDetalle = null;
        this.error = '';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ── Callbacks del formulario ──────────────────────────────────────────────
    guardar(entrada: SolicitanteEntrada): void {
        this.errorFormulario = '';
        this.guardandoFormulario = true;
        const request = this.registroEditar
            ? this.service.update(this.registroEditar.idSolicitante, entrada)
            : this.service.save(entrada);

        request.subscribe({
            next: r => {
                this.guardandoFormulario = false;
                this.onSaved(r);
            },
            error: e => {
                this.errorFormulario = e?.status === 409
                    ? e?.error?.error ?? 'Ya existe un solicitante con ese número de documento.'
                    : e?.status === 0
                        ? 'No se pudo conectar con el backend. Verifica que el servidor esté activo.'
                        : e?.error?.error ?? e?.error?.message ?? e?.message ?? 'No se pudo guardar el solicitante.';
                this.guardandoFormulario = false;
            },
        });
    }

    private onSaved(r: Solicitante): void {
        const nombre = this.nombreCompleto(r);
        this.mensaje = `Solicitante «${nombre}» guardado correctamente.`;
        this.vista = 'listado';
        this.registroEditar = null;
        this.editandoId = null;
        this.errorFormulario = '';
        this.cargar();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    onCancel(): void {
        this.errorFormulario = '';
        this.volverAlListado();
    }

    // ── Eliminar / Restaurar ──────────────────────────────────────────────────
    eliminar(r: Solicitante): void {
        const nombre = this.nombreCompleto(r);
        if (!confirm(`¿Deseas eliminar al solicitante «${nombre}»?\nEl registro se conservará y podrás restaurarlo después.`)) return;
        this.resolverRegistro(r, registro => {
            if (!registro.idSolicitante) return;
            this.service.delete(registro.idSolicitante).subscribe({
                next: () => {
                    this.mensaje = `Solicitante «${nombre}» eliminado correctamente.`;
                    this.cargar();
                },
                error: e => {
                    this.error = e?.error?.error ?? e?.message ?? 'No se pudo eliminar el solicitante.';
                },
            });
        });
    }

    restaurar(r: Solicitante): void {
        const nombre = this.nombreCompleto(r);
        if (!confirm(`¿Deseas restaurar al solicitante «${nombre}»?`)) return;
        this.resolverRegistro(r, registro => {
            if (!registro.idSolicitante) return;
            this.service.restore(registro.idSolicitante).subscribe({
                next: () => {
                    this.mensaje = `Solicitante «${nombre}» restaurado correctamente.`;
                    this.cargar();
                },
                error: e => {
                    this.error = e?.error?.error ?? e?.message ?? 'No se pudo restaurar el solicitante.';
                },
            });
        });
    }

    private resolverRegistro(r: Solicitante, accion: (registro: Solicitante) => void): void {
        if (r.idSolicitante) {
            accion(r);
            return;
        }
        this.service.findByNumeroDocumento(r.numeroDocumento).subscribe({
            next: registro => {
                if (!registro.idSolicitante) {
                    this.error = 'El backend no devolvió el identificador interno del solicitante.';
                    return;
                }
                accion(registro);
            },
            error: e => {
                this.error = e?.error?.error ?? e?.message ?? 'No se pudo consultar el identificador del solicitante.';
            },
        });
    }
    // ── Exportación PDF / Excel ───────────────────────────────────────────────
    exportando = false;

    async exportar(formato: 'pdf' | 'excel'): Promise<void> {
        if (!this.filtered.length) return;
        this.exportando = true;
        this.error = '';
        const opciones = {
            title: this.mostrarInactivos ? 'Solicitantes eliminados' : 'Lista de solicitantes',
            fileName: this.mostrarInactivos ? 'solicitantes_eliminados' : 'solicitantes',
            columns: this.columnasExport,
            rows: this.filtered,
        };
        try {
            if (formato === 'pdf') await this.exportService.exportPdf(opciones);
            else await this.exportService.exportExcel(opciones);
        } catch {
            this.error = 'No se pudo generar el archivo de exportación.';
        } finally {
            this.exportando = false;
        }
    }

    private readonly columnasExport: ExportColumn<Solicitante>[] = [
        { header: '#', value: (_, i) => i + 1, width: 5 },
        { header: 'Tipo doc.', value: r => this.tipoDocumentoLabel(r), width: 10 },
        { header: 'N° documento', value: r => r.numeroDocumento, width: 14 },
        { header: 'Ap. paterno', value: r => r.apellidoPaterno, width: 16 },
        { header: 'Ap. materno', value: r => r.apellidoMaterno, width: 16 },
        { header: 'Nombres', value: r => r.nombres, width: 20 },
        { header: 'Distrito', value: r => this.ubigeoDistrito(r), width: 18 },
        { header: 'Provincia', value: r => this.ubigeoProvincia(r), width: 14 },
        { header: 'Departamento', value: r => this.ubigeoDepartamento(r), width: 14 },
        { header: 'Dirección', value: r => r.direccion, width: 28 },
        { header: 'Teléfono', value: r => r.telefono, width: 12 },
        { header: 'Correo', value: r => r.correo, width: 28 },
        { header: 'Estado', value: () => this.mostrarInactivos ? 'INACTIVO' : 'ACTIVO', width: 10 },
        { header: 'F. registro', value: r => ExportService.fecha(r.fechaRegistro), width: 12 },
        { header: 'F. actualiz.', value: r => ExportService.fecha(r.fechaActualizacion), width: 12 },
        { header: 'F. eliminac.', value: r => ExportService.fecha(r.fechaEliminacion), width: 12 },
        { header: 'F. restaurac.', value: r => ExportService.fecha(r.fechaRestauracion), width: 13 },
    ];


    // ── Helpers de presentación ───────────────────────────────────────────────
    nombreCompleto(r: Solicitante): string {
        return [r.apellidoPaterno, r.apellidoMaterno, r.nombres].filter(Boolean).join(' ');
    }

    tipoDocumentoLabel(r: Solicitante): string {
        return r.tipoDocumento
            ?? this.tiposDocumento.find(t => t.id === r.idTipoDocumento)?.nombre
            ?? this.tiposDocumento.find(t => t.id === r.idTipoDocumento)?.codigo
            ?? '—';
    }

    ubigeoLabel(r: Solicitante): string {
        if (r.ubicacion?.trim()) return r.ubicacion;
        // Usar los campos de texto libre si existen (nuevos registros)
        const dep  = r.departamento?.trim();
        const prov = r.provincia?.trim();
        const dist = r.distrito?.trim();
        if (dep || prov || dist) {
            return [dist, prov, dep].filter(Boolean).join(', ');
        }
        // Respaldo para registros muy antiguos sin campos de texto
        const u = this.ubigeos.find(x => x.id === r.idUbigeo);
        return u ? `${u.distrito}, ${u.provincia}, ${u.departamento}` : '—';
    }

    logout(): void { this.auth.logout(); this.router.navigateByUrl('/admin/login'); }

    ubigeoDistrito(r: Solicitante): string {
        if (r.distrito?.trim()) return r.distrito.trim();
        const u = this.ubigeos.find(x => x.id === r.idUbigeo);
        return u?.distrito ?? '—';
    }

    ubigeoProvincia(r: Solicitante): string {
        if (r.provincia?.trim()) return r.provincia.trim();
        const u = this.ubigeos.find(x => x.id === r.idUbigeo);
        return u?.provincia ?? '—';
    }

    ubigeoDepartamento(r: Solicitante): string {
        if (r.departamento?.trim()) return r.departamento.trim();
        const u = this.ubigeos.find(x => x.id === r.idUbigeo);
        return u?.departamento ?? '—';
    }
}
