import { CommonModule, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TipoTramiteService } from '../../services/tipo-tramite.service';
import { TipoTramite, TipoTramiteEntrada } from '../../interfaces/tipo-tramite.model';
import { AuthService } from '../../../../core/services/auth.service';
import { ExportColumn, ExportService } from '../../../../core/services/export.service';

type Vista = 'listado' | 'formulario';

@Component({
    selector: 'app-tipo-tramite',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, DatePipe],
    templateUrl: './tipo-tramite.component.html',
    styleUrl: './tipo-tramite.component.css',
})
export class TipoTramiteComponent {

    // ── Vista activa ──────────────────────────────────────────────────────────
    vista: Vista = 'listado';

    // ── Listado ───────────────────────────────────────────────────────────────
    registros: TipoTramite[] = [];
    filtered: TipoTramite[] = [];
    query = '';
    mostrarInactivos = false;
    editandoId: number | null = null;
    mensaje = '';
    error = '';
    cargando = false;

    // ── Formulario reactivo ───────────────────────────────────────────────────
    readonly form = this.fb.nonNullable.group({
        nombre:             ['', [Validators.required, Validators.maxLength(100)]],
        codigo:             ['', [Validators.maxLength(20)]],
        categoria:          ['', [Validators.maxLength(60)]],
        descripcion:        ['', [Validators.maxLength(250)]],
        requisitos:         ['', [Validators.maxLength(500)]],
        plazoEstimadoDias:  [0, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]],
        requiereDocumentos: [false as boolean, [Validators.required]],
        vigentDesde:        ['' as string],
        estado:             [true as boolean, [Validators.required]],
    });

    constructor(
        private fb: FormBuilder,
        private servicio: TipoTramiteService,
        private auth: AuthService,
        private router: Router,
        private exportService: ExportService,
    ) {
        this.cargar();
    }

    // ── Carga y filtro ────────────────────────────────────────────────────────
    cargar(): void {
        this.cargando = true;
        this.error = '';
        this.servicio.listar().subscribe({
            next: datos => {
                // Filtrar según la vista activa
                this.registros = datos.filter(r => r.estado !== this.mostrarInactivos);
                this.cargando = false;
                this.aplicarFiltro();
            },
            error: e => {
                this.error = e?.error?.error ?? e?.message ?? 'No se pudo cargar la lista de tipos de trámite.';
                this.cargando = false;
                this.registros = [];
                this.filtered = [];
            }
        });
    }

    aplicarFiltro(): void {
        const q = this.query.trim().toLocaleLowerCase();
        this.filtered = this.registros.filter(r => {
            const texto = [r.nombre, r.categoria, r.descripcion]
                .map(v => String(v || '').toLocaleLowerCase());
            return !q || texto.some(v => v.includes(q));
        });
    }

    toggleInactivos(): void {
        this.mostrarInactivos = !this.mostrarInactivos;
        this.cargar();
    }

    // ── Navegación al formulario ──────────────────────────────────────────────
    nuevo(): void {
        this.editandoId = null;
        this.form.reset({
            nombre: '', codigo: '', categoria: '', descripcion: '', requisitos: '',
            plazoEstimadoDias: 0, requiereDocumentos: false,
            vigentDesde: '', estado: true
        });
        this.mensaje = '';
        this.error = '';
        this.vista = 'formulario';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    editar(registro: TipoTramite): void {
        this.editandoId = registro.idTipoTramite;
        this.form.reset({
            nombre:             registro.nombre,
            codigo:             registro.codigo            ?? '',
            categoria:          registro.categoria          ?? '',
            descripcion:        registro.descripcion        ?? '',
            requisitos:         registro.requisitos         ?? '',
            plazoEstimadoDias:  registro.plazoEstimadoDias  ?? 0,
            requiereDocumentos: registro.requiereDocumentos ?? false,
            vigentDesde:        registro.vigentDesde
                                    ? registro.vigentDesde.toString().substring(0, 10)
                                    : '',
            estado:             registro.estado,
        });
        this.mensaje = '';
        this.error = '';
        this.vista = 'formulario';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    volverAlListado(): void {
        this.vista = 'listado';
        this.editandoId = null;
        this.error = '';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    cancelar(): void {
        this.volverAlListado();
    }

    // ── Guardar ───────────────────────────────────────────────────────────────
    guardar(): void {
        this.form.markAllAsTouched();
        if (this.form.invalid) return;

        const valor = this.form.getRawValue();
        const entrada: TipoTramiteEntrada = {
            nombre:             valor.nombre.trim(),
            codigo:             valor.codigo.trim().toUpperCase() || undefined,
            categoria:          valor.categoria.trim() || undefined,
            descripcion:        valor.descripcion.trim(),
            requisitos:         valor.requisitos.trim(),
            plazoEstimadoDias:  Number(valor.plazoEstimadoDias),
            requiereDocumentos: valor.requiereDocumentos,
            vigentDesde:        valor.vigentDesde || undefined,
            estado:             valor.estado,
        };

        this.cargando = true;
        this.error = '';
        this.mensaje = '';

        if (this.editandoId === null) {
            this.servicio.crear(entrada).subscribe({
                next: (r) => {
                    this.mensaje = `Tipo de trámite «${r.nombre}» registrado correctamente.`;
                    this.vista = 'listado';
                    this.editandoId = null;
                    this.cargar();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                },
                error: e => {
                    this.error = e?.error?.error ?? e?.message ?? 'No se pudo crear el tipo de trámite.';
                    this.cargando = false;
                }
            });
        } else {
            this.servicio.actualizar(this.editandoId, entrada).subscribe({
                next: (r) => {
                    this.mensaje = `Tipo de trámite «${r.nombre}» actualizado correctamente.`;
                    this.vista = 'listado';
                    this.editandoId = null;
                    this.cargar();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                },
                error: e => {
                    this.error = e?.error?.error ?? e?.message ?? 'No se pudo actualizar el tipo de trámite.';
                    this.cargando = false;
                }
            });
        }
    }

    // ── Activar / Desactivar ──────────────────────────────────────────────────
    cambiarEstado(registro: TipoTramite): void {
        const accion = registro.estado ? 'desactivar' : 'activar';
        if (!confirm(`¿Deseas ${accion} el tipo de trámite «${registro.nombre}»?`)) return;
        const solicitud = registro.estado
            ? this.servicio.eliminar(registro.idTipoTramite)
            : this.servicio.restaurar(registro.idTipoTramite);
        solicitud.subscribe({
            next: () => {
                this.mensaje = `Tipo de trámite «${registro.nombre}» ${accion === 'desactivar' ? 'desactivado' : 'activado'} correctamente.`;
                this.cargar();
            },
            error: e => {
                this.error = e?.error?.error ?? e?.message ?? 'No se pudo cambiar el estado.';
            }
        });
    }

    // ── Eliminar (eliminación lógica: estado=false + fechaEliminacion) ────────
    eliminar(registro: TipoTramite): void {
        if (!confirm(`¿Eliminar el tipo de trámite «${registro.nombre}»?\n\nEl registro pasará a la sección de eliminados y podrá restaurarse desde ahí.`)) return;
        this.error = '';
        this.servicio.eliminar(registro.idTipoTramite).subscribe({
            next: () => {
                this.mensaje = `Tipo de trámite «${registro.nombre}» eliminado. Puedes restaurarlo desde «Ver eliminados».`;
                this.cargar();
            },
            error: e => {
                this.error = e?.error?.error ?? e?.message ?? 'No se pudo eliminar el tipo de trámite.';
            }
        });
    }
    // ── Exportación PDF / Excel ───────────────────────────────────────────────
    exportando = false;

    async exportar(formato: 'pdf' | 'excel'): Promise<void> {
        if (!this.filtered.length) return;
        this.exportando = true;
        this.error = '';
        const opciones = {
            title: this.mostrarInactivos ? 'Tipos de trámite eliminados' : 'Tipos de trámite activos',
            fileName: this.mostrarInactivos ? 'tipos_tramite_eliminados' : 'tipos_tramite',
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

    private readonly columnasExport: ExportColumn<TipoTramite>[] = [
        { header: 'Código', value: r => r.codigo, width: 10 },
        { header: 'Nombre', value: r => r.nombre, width: 28 },
        { header: 'Categoría', value: r => r.categoria, width: 16 },
        { header: 'Descripción', value: r => r.descripcion, width: 40 },
        { header: 'Requisitos', value: r => r.requisitos, width: 40 },
        { header: 'Días', value: r => r.plazoEstimadoDias, width: 7 },
        { header: 'Docs.', value: r => !!r.requiereDocumentos, width: 7 },
        { header: 'Vigente', value: r => ExportService.fecha(r.vigentDesde), width: 12 },
        { header: 'Estado', value: r => r.estado ? 'ACTIVO' : 'INACTIVO', width: 10 },
        { header: 'F. registro', value: r => ExportService.fecha(r.fechaRegistro), width: 12 },
        { header: 'F. actualiz.', value: r => ExportService.fecha(r.fechaActualizacion), width: 12 },
        { header: 'F. eliminac.', value: r => ExportService.fecha(r.fechaEliminacion), width: 12 },
        { header: 'F. restauración', value: r => ExportService.fecha(r.fechaRestauracion), width: 14 },
    ];


    // ── Validación de campo ───────────────────────────────────────────────────
    invalido(campo: string): boolean {
        const control = this.form.get(campo);
        return !!control && control.invalid && (control.touched || control.dirty);
    }

    logout(): void { this.auth.logout(); this.router.navigateByUrl('/admin/login'); }
}
