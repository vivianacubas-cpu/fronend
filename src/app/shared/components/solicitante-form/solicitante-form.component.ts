import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Solicitante, SolicitanteEntrada, TipoDocumento } from '../../interfaces/solicitante.model';

/**
 * Formulario de presentación compartido entre las features Solicitantes y FUT.
 *
 * Emite los datos validados; la feature anfitriona es responsable de persistirlos.
 */
@Component({
    selector: 'app-solicitante-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './solicitante-form.component.html',
    styleUrl: './solicitante-form.component.css',
})
export class SolicitanteFormComponent implements OnChanges {
    @Input() solicitante: Solicitante | null = null;
    /** Pre-llenado opcional (desde el FUT): documento y código de tipo de documento. */
    @Input() preset: { numeroDocumento?: string; tipoDocumentoCodigo?: string } | null = null;
    @Input() submitLabel = 'Guardar solicitante';
    @Input() tiposDocumento: TipoDocumento[] = [];
    @Input() saving = false;
    @Input() saveError = '';
    @Output() submitted = new EventEmitter<SolicitanteEntrada>();
    @Output() cancel = new EventEmitter<void>();

    error = '';
    esEdicion = false;

    readonly form = this.fb.nonNullable.group({
        idTipoDocumento: [0, [Validators.required, Validators.min(1)]],
        numeroDocumento: ['', [Validators.required, Validators.maxLength(20)]],
        nombres: ['', [Validators.required, Validators.maxLength(100),
            Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü]+([ ][A-Za-zÁÉÍÓÚáéíóúÑñÜü]+)*$/)]],
        apellidoPaterno: ['', [Validators.required, Validators.maxLength(100),
            Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü]+([ ][A-Za-zÁÉÍÓÚáéíóúÑñÜü]+)*$/)]],
        apellidoMaterno: ['', [Validators.required, Validators.maxLength(100),
            Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü]+([ ][A-Za-zÁÉÍÓÚáéíóúÑñÜü]+)*$/)]],
        departamento: ['', [Validators.required]],
        provincia: ['', [Validators.required]],
        distrito: ['', [Validators.required]],
        direccion: ['', [Validators.maxLength(250)]],
        telefono: ['', [Validators.required, Validators.maxLength(9),
            Validators.pattern(/^\d{9}$/)]],
        correo: ['', [Validators.maxLength(150), Validators.email]],
    });

    constructor(private fb: FormBuilder) {
        this.form.controls.idTipoDocumento.valueChanges
            .pipe(takeUntilDestroyed())
            .subscribe(id => this.actualizarValidadorDocumento(id));
    }

    get tiposDocumentoDisponibles(): TipoDocumento[] {
        return this.tiposDocumento.filter(t => {
            const codigo = t.codigo.toUpperCase();
            return codigo === 'DNI' || codigo === 'CNE';
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        // Reaccionar cuando la página cambia el registro a editar (o lo limpia para "Nuevo").
        if (changes['solicitante']) {
            this.esEdicion = !!this.solicitante;
            if (this.solicitante) {
                // Aplicar de inmediato — los campos son texto libre, no depende del catálogo
                this.aplicarSolicitante(this.solicitante);
            } else {
                this.form.reset({
                    idTipoDocumento: 0, numeroDocumento: '', nombres: '', apellidoPaterno: '', apellidoMaterno: '',
                    departamento: '', provincia: '', distrito: '', direccion: '', telefono: '', correo: '',
                });
                this.aplicarPreset();
            }
        } else if ((changes['tiposDocumento'] || changes['preset']) && !this.solicitante) {
            this.aplicarPreset();
        }
    }

    // Los campos departamento, provincia y distrito son texto libre.
    // El usuario puede escribir cualquier lugar sin restricción de catálogo.

    codigoTipo(id: number): string {
        return this.tiposDocumento.find(t => t.id === id)?.codigo ?? '';
    }

    private actualizarValidadorDocumento(idTipo: number): void {
        const c = this.form.controls.numeroDocumento;
        const codigo = this.codigoTipo(idTipo);
        const pattern = codigo === 'CNE' ? /^[A-Za-z0-9]{9,12}$/ : /^\d{8}$/;
        c.setValidators([Validators.required, Validators.maxLength(20), Validators.pattern(pattern)]);
        c.updateValueAndValidity({ emitEvent: false });
    }

    private aplicarPreset(): void {
        if (this.solicitante) return; // en edición no se aplica preset
        const codigo = this.preset?.tipoDocumentoCodigo;
        if (codigo) {
            const t = this.tiposDocumento.find(x => x.codigo.toUpperCase() === codigo.toUpperCase());
            if (t) {
                this.form.patchValue({ idTipoDocumento: t.id });
                this.actualizarValidadorDocumento(t.id);
            }
        }
        if (this.preset?.numeroDocumento) {
            this.form.patchValue({ numeroDocumento: this.preset.numeroDocumento });
        }
    }

    private aplicarSolicitante(s: Solicitante): void {
        // Usar directamente los campos de texto libre guardados en el registro.
        // Si están vacíos, el campo queda vacío para que el usuario escriba libremente.
        this.form.reset({
            idTipoDocumento: s.idTipoDocumento || 0,
            numeroDocumento: s.numeroDocumento || '',
            nombres: s.nombres || '',
            apellidoPaterno: s.apellidoPaterno || '',
            apellidoMaterno: s.apellidoMaterno || '',
            departamento: s.departamento ?? '',
            provincia:    s.provincia    ?? '',
            distrito:     s.distrito     ?? '',
            direccion: s.direccion || '',
            telefono: s.telefono || '',
            correo: s.correo || '',
        });
        this.actualizarValidadorDocumento(s.idTipoDocumento || 0);
    }

    invalido(campo: string): boolean {
        const c = this.form.get(campo);
        return !!c && c.invalid && (c.touched || c.dirty);
    }

    guardar(): void {
        this.form.markAllAsTouched();
        if (this.form.invalid) {
            this.error = 'Revisa los campos señalados antes de guardar.';
            return;
        }

        const v = this.form.getRawValue();

        // Usar idUbigeo=1 (ubigeo genérico de respaldo) — la ubicación real
        // se guarda en los campos de texto departamento, provincia y distrito.
        const entrada: SolicitanteEntrada = {
            idTipoDocumento: Number(v.idTipoDocumento),
            idUbigeo: 1,
            departamento: v.departamento.trim() || undefined,
            provincia:    v.provincia.trim()    || undefined,
            distrito:     v.distrito.trim()     || undefined,
            numeroDocumento: v.numeroDocumento.trim(),
            nombres: v.nombres.trim(),
            apellidoPaterno: v.apellidoPaterno.trim(),
            apellidoMaterno: v.apellidoMaterno.trim(),
            telefono: v.telefono.trim(),
            correo: v.correo.trim() || undefined,
            direccion: v.direccion.trim() || undefined,
        };

        this.error = '';
        this.submitted.emit(entrada);
    }

    /** Limpia y limita el valor en cada pulsación de tecla (evento input).
     * DNI: solo dígitos, máximo 8. CNE: alfanumérico, máximo 12.
     */
    limitarDocumento(event: Event): void {
        const input = event.target as HTMLInputElement;
        const esCNE = this.codigoTipo(this.form.controls.idTipoDocumento.value) === 'CNE';
        const maxLen = esCNE ? 12 : 8;
        let valor = input.value;
        if (!esCNE) {
            valor = valor.replace(/\D/g, '');
        } else {
            valor = valor.replace(/[^A-Za-z0-9]/g, '');
        }
        if (valor.length > maxLen) {
            valor = valor.substring(0, maxLen);
        }
        if (valor !== input.value) {
            input.value = valor;
            const control = this.form.controls.numeroDocumento;
            control.setValue(valor, { emitEvent: false });
            control.markAsTouched();
            control.markAsDirty();
        }
    }

    /** Bloquea teclas inválidas antes de que se escriban en el campo.
     * DNI: solo dígitos, Backspace, Delete, Tab, flechas y Ctrl/Meta.
     */
    bloquearTecla(event: KeyboardEvent): void {
        const esCNE = this.codigoTipo(this.form.controls.idTipoDocumento.value) === 'CNE';
        if (esCNE) return; // CNE: sin restricción de tipo de carácter

        const teclaPermitida = [
            'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
            'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
            'Home', 'End',
        ].includes(event.key);

        const esCombinacion = event.ctrlKey || event.metaKey; // Ctrl+C, Ctrl+V, etc.
        const esDigito = /^\d$/.test(event.key);

        if (!teclaPermitida && !esCombinacion && !esDigito) {
            event.preventDefault();
        }

        // Bloquear si ya tiene 8 dígitos y no es borrar ni combinación
        const input = event.target as HTMLInputElement;
        const maxLen = 8;
        if (
            input.value.length >= maxLen &&
            !teclaPermitida &&
            !esCombinacion &&
            input.selectionStart === input.selectionEnd
        ) {
            event.preventDefault();
        }
    }

    /** Controla el pegado de texto: extrae solo dígitos y limita a 8 para DNI. */
    controlarPegado(event: ClipboardEvent): void {
        event.preventDefault();
        const esCNE = this.codigoTipo(this.form.controls.idTipoDocumento.value) === 'CNE';
        const maxLen = esCNE ? 12 : 8;

        const textoPegado = event.clipboardData?.getData('text') ?? '';
        let valorLimpio: string;

        if (!esCNE) {
            valorLimpio = textoPegado.replace(/\D/g, '');
        } else {
            valorLimpio = textoPegado.replace(/[^A-Za-z0-9]/g, '');
        }

        // Obtener el valor actual del campo y la posición del cursor
        const input = event.target as HTMLInputElement;
        const inicio = input.selectionStart ?? 0;
        const fin = input.selectionEnd ?? 0;
        const valorActual = input.value;

        // Calcular el nuevo valor combinando actual + pegado, truncado al máximo
        const nuevoValor = (valorActual.substring(0, inicio) + valorLimpio + valorActual.substring(fin))
            .substring(0, maxLen);

        // Actualizar el FormControl primero para que Angular no sobreescriba el DOM
        const control = this.form.controls.numeroDocumento;
        control.setValue(nuevoValor, { emitEvent: false });
        control.markAsTouched();
        control.markAsDirty();

        // Actualizar el DOM y posicionar el cursor al final del texto insertado
        input.value = nuevoValor;
        const nuevaPosicion = Math.min(inicio + valorLimpio.length, maxLen);
        input.setSelectionRange(nuevaPosicion, nuevaPosicion);
    }

    cancelar(): void { this.cancel.emit(); }

    /** Bloquea teclas no numéricas en el campo teléfono. */
    bloquearTelefono(event: KeyboardEvent): void {
        const teclaPermitida = [
            'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
            'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
            'Home', 'End',
        ].includes(event.key);
        const esCombinacion = event.ctrlKey || event.metaKey;
        const esDigito = /^\d$/.test(event.key);

        if (!teclaPermitida && !esCombinacion && !esDigito) {
            event.preventDefault();
            return;
        }

        // Bloquear al llegar a 9 dígitos (solo si no es borrar, navegar ni combinación)
        const input = event.target as HTMLInputElement;
        if (
            input.value.length >= 9 &&
            !teclaPermitida &&
            !esCombinacion &&
            input.selectionStart === input.selectionEnd
        ) {
            event.preventDefault();
        }
    }

    /** Elimina caracteres no numéricos y limita a 9 dígitos en el evento input. */
    limitarTelefono(event: Event): void {
        const input = event.target as HTMLInputElement;
        let valor = input.value.replace(/\D/g, '').substring(0, 9);
        if (valor !== input.value) {
            input.value = valor;
            const c = this.form.controls.telefono;
            c.setValue(valor, { emitEvent: false });
            c.markAsTouched();
            c.markAsDirty();
        }
    }

    /** Limita el pegado a 9 dígitos numéricos en el campo teléfono. */
    controlarPegadoTelefono(event: ClipboardEvent): void {
        event.preventDefault();
        const textoPegado = event.clipboardData?.getData('text') ?? '';
        const soloDigitos = textoPegado.replace(/\D/g, '');

        const input = event.target as HTMLInputElement;
        const inicio = input.selectionStart ?? 0;
        const fin = input.selectionEnd ?? 0;
        const actual = input.value;

        const nuevo = (actual.substring(0, inicio) + soloDigitos + actual.substring(fin))
            .replace(/\D/g, '')
            .substring(0, 9);

        const c = this.form.controls.telefono;
        c.setValue(nuevo, { emitEvent: false });
        c.markAsTouched();
        c.markAsDirty();

        input.value = nuevo;
        const pos = Math.min(inicio + soloDigitos.length, 9);
        input.setSelectionRange(pos, pos);
    }

}
