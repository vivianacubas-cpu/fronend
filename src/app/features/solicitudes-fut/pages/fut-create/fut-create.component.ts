import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FutService } from '../../services/fut.service';
import { DEPARTAMENTOS, PROVINCIAS, DISTRITOS } from '../../../../shared/utils/ubigeo';
import { MailService } from '../../services/mail.service';
import { AttachmentStore } from '../../services/attachment.store';
import { SolicitanteFormComponent } from '../../../../shared/components/solicitante-form/solicitante-form.component';
import {
    SolicitanteService,
    type Solicitante,
    type SolicitanteEntrada,
    type TipoDocumento,
    type Ubigeo,
} from '../../../solicitantes';
const MAX_PDF_BYTES = 4 * 1024 * 1024;
@Component({ standalone: true, imports: [CommonModule, ReactiveFormsModule, RouterLink, SolicitanteFormComponent], templateUrl: './fut-create.component.html', styleUrl: './fut-create.component.css' })
export class FutCreateComponent {
    loading = false;
    error = '';
    result: any = null;
    reviewing = false;
    attemptedReview = false;
    fileError = '';
    file: File | null = null;
    attachmentWarning = '';
    receiptPdf: Uint8Array | null = null;
    readonly OTROS = 'OTROS';
    private idempotencyKey = this.newIdempotencyKey();
    readonly tramites = ['SOLICITUD DE VACANTES', 'TRASLADO DE MATRÍCULA', 'CONSTANCIA DE ESTUDIOS O DE MATRÍCULA', 'CERTIFICADO DE ESTUDIOS', 'RECTIFICACIÓN DE DATOS', 'JUSTIFICACIÓN DE INASISTENCIAS PROLONGADAS', 'LICENCIAS Y PERMISOS', 'CONSTANCIA DE PAGO O DE TRABAJO', 'ENTREGA DE LEGAJOS Y DOCUMENTOS', 'RECLAMOS O ABSOLUCIÓN DE CONSULTAS ADMINISTRATIVAS'];
    readonly solicitantes = ['PADRES DE FAMILIA', 'DOCENTES', 'ADMINISTRATIVOS', 'DIRECTORA'];
    readonly tiposDocumento = ['DNI', 'CNE'];
    readonly departamentos = DEPARTAMENTOS;

    // ── Integración con el Maestro Solicitante ────────────────────────────────
    // La búsqueda por documento pre-llena los campos personales del FUT.
    // El flujo de envío del FUT NO se modifica: el backend sigue relacionando
    // la solicitud con el solicitante (SolicitudServiceImpl.create()).
    buscandoSolicitante = false;
    solicitanteMensaje = '';
    solicitanteError = false;
    solicitanteNoEncontrado = false;
    solicitanteInactivo = false;
    mostrarRegistroSolicitante = false;
    presetSolicitante: { numeroDocumento?: string; tipoDocumentoCodigo?: string } | null = null;
    solicitanteSaving = false;
    solicitanteSaveError = '';
    tiposDocumentoCatalogo: TipoDocumento[] = [];
    private ubigeosCatalogo: Ubigeo[] = [];

    form = this.fb.group({
        tramite: ['', Validators.required],
        tramiteOtro: ['', [Validators.maxLength(150)]],
        tipoSolicitante: ['', Validators.required],
        tipoSolicitanteOtro: ['', [Validators.maxLength(100)]],
        tipoDocumento: ['', Validators.required],
        numeroDocumento: ['', Validators.required],
        apellidoPaterno: ['', [Validators.required, Validators.maxLength(80),
            Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü]+([ ][A-Za-zÁÉÍÓÚáéíóúÑñÜü]+)*$/)]],
        apellidoMaterno: ['', [Validators.required, Validators.maxLength(80),
            Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü]+([ ][A-Za-zÁÉÍÓÚáéíóúÑñÜü]+)*$/)]],
        nombres: ['', [Validators.required, Validators.maxLength(100),
            Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü]+([ ][A-Za-zÁÉÍÓÚáéíóúÑñÜü]+)*$/)]],
        departamento: ['Lima', Validators.required],
        provincia: ['Cañete', [Validators.required, Validators.maxLength(100)]],
        distrito: ['San Vicente de Cañete', [Validators.required, Validators.maxLength(100)]],
        direccion: ['', [Validators.required, Validators.maxLength(250)]],
        numeroDepto: ['', Validators.maxLength(50)],
        telefonoFijo: ['', Validators.pattern(/^\d{6,9}$/)],
        celular: ['', [Validators.required, Validators.pattern(/^9\d{8}$/)]],
        email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
        basis: ['', [Validators.required, Validators.maxLength(255)]],
        attachedDocuments: ['', Validators.maxLength(255)],
        folios: [0, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]]
    });
    constructor(private fb: FormBuilder, private fut: FutService, private mail: MailService, private files: AttachmentStore, private solicitanteService: SolicitanteService) {
        // Catálogos del Maestro Solicitante para mapear id->código y id->ubigeo al pre-llenar el FUT.
        this.solicitanteService.tiposDocumento().subscribe(t => this.tiposDocumentoCatalogo = t);
        this.solicitanteService.ubigeos().subscribe(u => this.ubigeosCatalogo = u);
        const f = this.form.controls;
        f.tramite.valueChanges.subscribe(v => this.toggleRequired('tramiteOtro', v === this.OTROS));
        f.tipoSolicitante.valueChanges.subscribe(v => this.toggleRequired('tipoSolicitanteOtro', v === this.OTROS));
        f.tipoDocumento.valueChanges.subscribe(t => {
            const c = f.numeroDocumento;
            c.setValidators(t === 'CNE' ? [Validators.required, Validators.pattern(/^[A-Za-z0-9]{9,12}$/)] : [Validators.required, Validators.pattern(/^\d{8}$/)]);
            c.updateValueAndValidity();
        });
        f.numeroDocumento.setValidators([Validators.required, Validators.pattern(/^\d{8}$/)]);
    }
    private toggleRequired(name: 'tramiteOtro' | 'tipoSolicitanteOtro', required: boolean) {
        const c = this.form.controls[name];
        const max = name === 'tramiteOtro' ? 150 : 100;
        c.setValidators(required ? [Validators.required, Validators.maxLength(max)] : [Validators.maxLength(max)]);
        if (!required)
            c.setValue('');
        c.updateValueAndValidity();
    }
    get provinciasList(): string[] | null { return PROVINCIAS[this.form.controls.departamento.value || ''] || null; }
    get distritosList(): string[] | null { return DISTRITOS[`${this.form.controls.departamento.value}|${this.form.controls.provincia.value}`] || null; }
    onDepartamento() {
        this.form.patchValue({ provincia: '', distrito: '' });
    }
    onProvincia() {
        this.form.patchValue({ distrito: '' });
    }
    onFile(ev: Event) {
        const input = ev.target as HTMLInputElement;
        const f = input.files?.[0] || null;
        this.fileError = '';
        this.file = null;
        if (!f)
            return;
        const okType = /^(application\/pdf|image\/(jpeg|png|webp))$/.test(f.type) || /\.(pdf|jpe?g|png|webp)$/i.test(f.name);
        if (!okType) {
            this.fileError = 'Seleccione un archivo PDF o una imagen (JPG, PNG o WEBP).';
            input.value = '';
            return;
        }
        if (f.size > MAX_PDF_BYTES) {
            this.fileError = 'El tamaño máximo del archivo es de 4MB.';
            input.value = '';
            return;
        }
        this.file = f;
    }
    invalid(n: string) { const c = this.form.get(n); return !!c && (c.touched || this.attemptedReview) && c.invalid; }
    get tramiteFinal() { const v = this.form.value; return v.tramite === this.OTROS ? (v.tramiteOtro || '').trim() : (v.tramite || ''); }
    get solicitanteFinal() { const v = this.form.value; return v.tipoSolicitante === this.OTROS ? (v.tipoSolicitanteOtro || '').trim() : (v.tipoSolicitante || ''); }
    get nombreCompleto() { const v = this.form.value; return [v.nombres, v.apellidoPaterno, v.apellidoMaterno].map(x => (x || '').trim()).filter(Boolean).join(' '); }
    review() {
        this.attemptedReview = true;
        this.form.markAllAsTouched();
        this.error = '';
        if (this.form.invalid) {
            this.error = 'Revisa los campos señalados antes de continuar.';
            return;
        }
        this.reviewing = true;
    }
    backToEdit() { this.reviewing = false; }
    submit() {
        if (this.form.invalid || this.loading)
            return;
        const v = this.form.getRawValue();
        const payload: any = {
            idempotencyKey: this.idempotencyKey,
            // Campos base de la solicitud local
            solicitante: this.tramiteFinal,
            fullName: this.nombreCompleto,
            dni: v.numeroDocumento,
            email: v.email,
            cellphone: v.celular || v.telefonoFijo || '',
            address: [v.direccion, v.numeroDepto].filter(x => !!x).join(' - '),
            district: v.distrito,
            province: v.provincia,
            basis: v.basis,
            attachedDocuments: v.attachedDocuments || '',
            declaredDate: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })(),
            signatureNote: '',
            // Campos nuevos
            tipoTramite: this.tramiteFinal,
            tipoSolicitante: this.solicitanteFinal,
            tipoDocumento: v.tipoDocumento,
            apellidoPaterno: v.apellidoPaterno,
            apellidoMaterno: v.apellidoMaterno,
            nombres: v.nombres,
            department: v.departamento,
            numeroDepto: v.numeroDepto || '',
            telefonoFijo: v.telefonoFijo || '',
            celular: v.celular || '',
            folios: Number(v.folios),
            archivoNombre: this.file?.name || '',
            archivoTipo: this.file?.type || '',
            archivoTamano: this.file?.size || 0
        };
        this.loading = true;
        this.error = '';
        this.fut.create(payload).subscribe({
            next: r => { if (!r?.trackingCode) {
                this.error = 'No se pudo generar el código de seguimiento.';
                this.loading = false;
                return;
            } this.result = r; this.reviewing = false; this.loading = false; this.afterCreate(r); },
            error: e => {
                this.error = this.getSaveErrorMessage(e);
                this.loading = false;
            }
        });
    }
    private getSaveErrorMessage(e: any): string {
        const status = Number(e?.status || 0);
        const body = e?.error;
        const serverMessage = typeof body === 'string'
            ? body
            : body?.message ?? body?.mensaje ?? body?.detail ?? body?.error;
        if (status === 0) {
            return 'No se pudo conectar con el backend. Comprueba que el servidor esté activo en http://localhost:8085 e inténtalo de nuevo.';
        }
        if (status >= 500) {
            return serverMessage
                ? `El backend no pudo guardar la solicitud (HTTP ${status}): ${serverMessage}`
                : `El backend no pudo guardar la solicitud (HTTP ${status}). El servidor debe revisarse; el frontend no marcará el trámite como registrado.`;
        }
        if (status === 400 || status === 422) {
            return serverMessage
                ? `El servidor rechazó los datos enviados. Revisa el formulario: ${serverMessage}`
                : 'El servidor rechazó los datos enviados. Revisa los campos del formulario.';
        }
        if (status === 401 || status === 403) {
            return 'El servidor rechazó la operación por falta de autorización. Verifica el acceso al sistema.';
        }
        return serverMessage
            ? `No se pudo guardar la solicitud (HTTP ${status}): ${serverMessage}`
            : `No se pudo guardar la solicitud (HTTP ${status}). Inténtalo de nuevo o revisa el registro del backend.`;
    }
    private async afterCreate(r: any) {
        this.attachmentWarning = '';
        if (this.file) {
            try {
                await this.files.save(r.id, this.file);
            }
            catch (e: any) {
                this.attachmentWarning = e?.message || 'No se pudo guardar el archivo adjunto.';
            }
        }
        // La constancia se genera localmente para descargarla; no se envía por correo.
        this.receiptPdf = this.mail.buildPdf(r, 'registro');
    }
    downloadPdf() { if (this.result && this.receiptPdf)
        this.mail.download(`constancia-${this.result.trackingCode}.pdf`, this.receiptPdf); }
    copyCode() { if (this.result?.trackingCode && navigator.clipboard)
        navigator.clipboard.writeText(this.result.trackingCode).catch(() => { }); }
    printReceipt() { window.print(); }
    private newIdempotencyKey(): string {
        return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : `fut-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }
    reset() {
        this.idempotencyKey = this.newIdempotencyKey();
        this.result = null;
        this.error = '';
        this.reviewing = false;
        this.attemptedReview = false;
        this.file = null;
        this.fileError = '';
        this.attachmentWarning = '';
        this.receiptPdf = null;
        this.form.reset({ departamento: 'Lima', provincia: 'Cañete', distrito: 'San Vicente de Cañete', folios: 0 });
        // Limpiar el estado de la integración con el Maestro Solicitante.
        this.buscandoSolicitante = false;
        this.solicitanteMensaje = '';
        this.solicitanteError = false;
        this.solicitanteNoEncontrado = false;
        this.solicitanteInactivo = false;
        this.mostrarRegistroSolicitante = false;
        this.presetSolicitante = null;
    }

    // ── Integración con el Maestro Solicitante ─────────────────────────────────
    /** Busca un solicitante por número de documento y, si está activo, completa los datos personales del FUT. */
    buscarSolicitante(): void {
        const numero = (this.form.value.numeroDocumento || '').trim();
        this.solicitanteMensaje = '';
        this.solicitanteError = false;
        this.solicitanteNoEncontrado = false;
        this.solicitanteInactivo = false;
        if (!numero) {
            this.solicitanteMensaje = 'Ingresa el número de documento para buscar al solicitante.';
            return;
        }
        this.buscandoSolicitante = true;
        this.solicitanteService.findByNumeroDocumento(numero).subscribe({
            next: (r) => {
                this.buscandoSolicitante = false;
                if (r.estado === 'I') {
                    this.solicitanteInactivo = true;
                    this.solicitanteError = true;
                    this.solicitanteMensaje = 'Existe un solicitante con este documento, pero está DESACTIVADO. Debes restaurarlo desde Gestión de Solicitantes antes de continuar.';
                    return;
                }
                this.aplicarSolicitanteEnFut(r);
                this.solicitanteMensaje = `Solicitante encontrado: ${this.nombreCompletoSolicitante(r)}. Se completaron los datos personales del FUT.`;
            },
            error: (e) => {
                this.buscandoSolicitante = false;
                if (e?.status === 404) {
                    this.solicitanteNoEncontrado = true;
                    this.solicitanteMensaje = 'No se encontró un solicitante registrado con este documento. Puedes registrarlo ahora.';
                } else {
                    this.solicitanteError = true;
                    this.solicitanteMensaje = e?.error?.error ?? e?.message ?? 'No se pudo consultar el solicitante. Verifica que el backend esté activo.';
                }
            },
        });
    }

    /** Abre el modal de registro de solicitante sin perder los datos ya ingresados en el FUT. */
    abrirRegistroSolicitante(): void {
        this.presetSolicitante = {
            numeroDocumento: (this.form.value.numeroDocumento || '').trim(),
            tipoDocumentoCodigo: (this.form.value.tipoDocumento || '').trim(),
        };
        this.mostrarRegistroSolicitante = true;
        this.solicitanteMensaje = '';
    }

    cerrarRegistroSolicitante(): void {
        this.mostrarRegistroSolicitante = false;
        this.presetSolicitante = null;
        this.solicitanteSaveError = '';
    }

    guardarSolicitante(entrada: SolicitanteEntrada): void {
        this.solicitanteSaving = true;
        this.solicitanteSaveError = '';
        this.solicitanteService.save(entrada).subscribe({
            next: solicitante => {
                this.solicitanteSaving = false;
                this.onSolicitanteRegistrado(solicitante);
            },
            error: e => {
                this.solicitanteSaveError = e?.status === 409
                    ? e?.error?.error ?? 'Ya existe un solicitante con ese número de documento.'
                    : e?.status === 0
                        ? 'No se pudo conectar con el backend. Verifica que el servidor esté activo.'
                        : e?.error?.error ?? e?.error?.message ?? e?.message ?? 'No se pudo guardar el solicitante.';
                this.solicitanteSaving = false;
            },
        });
    }

    /** Tras registrar al solicitante, completa los datos personales del FUT y permite continuar. */
    onSolicitanteRegistrado(r: Solicitante): void {
        this.mostrarRegistroSolicitante = false;
        this.presetSolicitante = null;
        this.aplicarSolicitanteEnFut(r);
        this.solicitanteNoEncontrado = false;
        this.solicitanteInactivo = false;
        this.solicitanteError = false;
        this.solicitanteMensaje = `Solicitante registrado correctamente: ${this.nombreCompletoSolicitante(r)}. Continúa con la solicitud.`;
    }

    private aplicarSolicitanteEnFut(r: Solicitante): void {
        const tipo = this.tiposDocumentoCatalogo.find(t =>
            t.id === r.idTipoDocumento || t.codigo === r.tipoDocumento || t.nombre === r.tipoDocumento);
        const codigo = tipo?.codigo ?? r.tipoDocumento ?? this.form.value.tipoDocumento ?? '';
        const ubi = this.ubigeosCatalogo.find(u => u.id === r.idUbigeo);
        const partesUbicacion = (r.ubicacion ?? '').split(',').map(parte => parte.trim());
        const ubicacion = partesUbicacion.length >= 3
            ? { distrito: partesUbicacion[0], provincia: partesUbicacion[1], departamento: partesUbicacion.slice(2).join(', ') }
            : {};
        this.form.patchValue({
            tipoDocumento: codigo,
            numeroDocumento: r.numeroDocumento,
            apellidoPaterno: r.apellidoPaterno || '',
            apellidoMaterno: r.apellidoMaterno || '',
            nombres: r.nombres || '',
            direccion: r.direccion || '',
            celular: r.telefono || '',
            email: r.correo || '',
            departamento: r.departamento ?? ubi?.departamento ?? ubicacion.departamento ?? this.form.value.departamento ?? '',
            provincia: r.provincia ?? ubi?.provincia ?? ubicacion.provincia ?? this.form.value.provincia ?? '',
            distrito: r.distrito ?? ubi?.distrito ?? ubicacion.distrito ?? this.form.value.distrito ?? '',
        });
    }

    private nombreCompletoSolicitante(r: Solicitante): string {
        return [r.apellidoPaterno, r.apellidoMaterno, r.nombres].filter(Boolean).join(' ');
    }
}
