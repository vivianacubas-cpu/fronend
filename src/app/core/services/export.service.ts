import { Injectable } from '@angular/core';

export type ExportValue = string | number | boolean | Date | null | undefined;

export interface ExportColumn<T> {
    header: string;
    value: (row: T, index: number) => ExportValue;
    width?: number;
}

export interface ExportOptions<T> {
    title: string;
    fileName: string;
    columns: ExportColumn<T>[];
    rows: T[];
}

const INSTITUCION = 'I. E. N.° 20191 "Alfonso Ugarte" – San Vicente';
const COLOR_PRIMARIO: [number, number, number] = [118, 0, 24];
const COLOR_PRIMARIO_ARGB = 'FF760018';

/** Exportación de listados a PDF (jsPDF + autotable) y Excel (ExcelJS). Las librerías se cargan bajo demanda. */
@Injectable({ providedIn: 'root' })
export class ExportService {

    async exportPdf<T>({ title, fileName, columns, rows }: ExportOptions<T>): Promise<void> {
        const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
        const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        doc.setFillColor(...COLOR_PRIMARIO);
        doc.rect(0, 0, pageWidth, 70, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(255, 242, 191);
        doc.text(INSTITUCION, 40, 28);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(255, 255, 255);
        doc.text(title, 40, 52);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(110);
        doc.text(`Generado: ${this.formatDateTime(new Date())}   ·   Total de registros: ${rows.length}`, 40, 90);

        autoTable(doc, {
            startY: 100,
            head: [columns.map(c => c.header)],
            body: rows.map((row, i) => columns.map(c => this.toText(c.value(row, i)))),
            styles: { fontSize: 7.5, cellPadding: 4, overflow: 'linebreak', valign: 'middle' },
            headStyles: { fillColor: COLOR_PRIMARIO, textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [250, 245, 240] },
            margin: { left: 30, right: 30, bottom: 36 },
            didDrawPage: () => {
                doc.setFontSize(8);
                doc.setTextColor(120);
                doc.text(`Página ${doc.getCurrentPageInfo().pageNumber}`, pageWidth - 80, pageHeight - 18);
            },
        });

        doc.save(`${fileName}_${this.fileStamp()}.pdf`);
    }

    async exportExcel<T>({ title, fileName, columns, rows }: ExportOptions<T>): Promise<void> {
        const excel = await import('exceljs');
        const Workbook = excel.Workbook ?? (excel as unknown as { default: typeof excel }).default.Workbook;
        const wb = new Workbook();
        wb.creator = INSTITUCION;
        wb.created = new Date();
        const ws = wb.addWorksheet(title.substring(0, 31));
        const lastCol = columns.length;

        // ── Fila 1: banda de color institucional ──────────────────────────────
        ws.getRow(1).height = 36;
        ws.mergeCells(1, 1, 1, lastCol);
        const celdaTitulo = ws.getCell(1, 1);
        celdaTitulo.value = INSTITUCION;
        celdaTitulo.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' }, name: 'Calibri' };
        celdaTitulo.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_PRIMARIO_ARGB } };
        celdaTitulo.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

        // ── Fila 2: nombre del reporte ────────────────────────────────────────
        ws.getRow(2).height = 24;
        ws.mergeCells(2, 1, 2, lastCol);
        const celdaReporte = ws.getCell(2, 1);
        celdaReporte.value = title;
        celdaReporte.font = { bold: true, size: 12, color: { argb: COLOR_PRIMARIO_ARGB }, name: 'Calibri' };
        celdaReporte.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5E6E8' } };
        celdaReporte.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
        celdaReporte.border = {
            bottom: { style: 'medium', color: { argb: COLOR_PRIMARIO_ARGB } },
        };

        // ── Fila 3: metadatos ─────────────────────────────────────────────────
        ws.getRow(3).height = 16;
        ws.mergeCells(3, 1, 3, lastCol);
        const celdaMeta = ws.getCell(3, 1);
        celdaMeta.value = `Generado: ${this.formatDateTime(new Date())}     ·     Total de registros: ${rows.length}`;
        celdaMeta.font = { italic: true, size: 9, color: { argb: 'FF555555' }, name: 'Calibri' };
        celdaMeta.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
        celdaMeta.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

        // ── Fila 4: separador vacío ───────────────────────────────────────────
        ws.getRow(4).height = 6;

        // ── Fila 5: encabezados de columna ────────────────────────────────────
        const BORDE_ENCABEZADO = {
            top:    { style: 'medium' as const, color: { argb: COLOR_PRIMARIO_ARGB } },
            bottom: { style: 'medium' as const, color: { argb: COLOR_PRIMARIO_ARGB } },
            left:   { style: 'thin'   as const, color: { argb: 'FFFFFFFF' } },
            right:  { style: 'thin'   as const, color: { argb: 'FFFFFFFF' } },
        };
        const header = ws.getRow(5);
        header.height = 26;
        columns.forEach((c, i) => {
            const cell = header.getCell(i + 1);
            cell.value = c.header;
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10, name: 'Calibri' };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_PRIMARIO_ARGB } };
            cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            cell.border = BORDE_ENCABEZADO;
            ws.getColumn(i + 1).width = c.width ?? Math.max(12, c.header.length + 4);
        });

        // ── Filas de datos ────────────────────────────────────────────────────
        const COLOR_FILA_PAR   = 'FFFAFAFA';
        const COLOR_FILA_IMPAR = 'FFFFFFFF';

        rows.forEach((row, r) => {
            const excelRow = ws.getRow(6 + r);
            excelRow.height = 18;
            const bgColor = r % 2 === 0 ? COLOR_FILA_PAR : COLOR_FILA_IMPAR;

            columns.forEach((c, i) => {
                const v = c.value(row, r);
                const cell = excelRow.getCell(i + 1);

                // Fechas como valor nativo para que Excel las reconozca
                if (v instanceof Date) {
                    cell.value = v;
                    cell.numFmt = 'dd/mm/yyyy';
                } else if (typeof v === 'number') {
                    cell.value = v;
                } else if (typeof v === 'boolean') {
                    cell.value = v ? 'Sí' : 'No';
                } else {
                    cell.value = (v === null || v === undefined || v === '') ? '—' : String(v);
                }

                cell.font = { size: 9, name: 'Calibri' };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
                cell.alignment = { vertical: 'middle', wrapText: true };
                cell.border = {
                    top:    { style: 'hair', color: { argb: 'FFD9D9D9' } },
                    bottom: { style: 'hair', color: { argb: 'FFD9D9D9' } },
                    left:   { style: 'hair', color: { argb: 'FFD9D9D9' } },
                    right:  { style: 'hair', color: { argb: 'FFD9D9D9' } },
                };
            });
        });

        // ── Fila de totales ───────────────────────────────────────────────────
        const filaTotal = ws.getRow(6 + rows.length);
        filaTotal.height = 20;
        ws.mergeCells(6 + rows.length, 1, 6 + rows.length, lastCol);
        const celdaTotal = filaTotal.getCell(1);
        celdaTotal.value = `Total de registros: ${rows.length}`;
        celdaTotal.font = { bold: true, size: 10, color: { argb: COLOR_PRIMARIO_ARGB }, name: 'Calibri' };
        celdaTotal.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5E6E8' } };
        celdaTotal.alignment = { vertical: 'middle', horizontal: 'right', indent: 1 };
        celdaTotal.border = {
            top: { style: 'medium', color: { argb: COLOR_PRIMARIO_ARGB } },
        };

        // ── Congelar encabezados y filtros automáticos ────────────────────────
        ws.views = [{ state: 'frozen', ySplit: 5 }];
        ws.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5, column: lastCol } };

        const buffer = await wb.xlsx.writeBuffer();
        this.download(
            new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
            `${fileName}_${this.fileStamp()}.xlsx`,
        );
    }

    /** Convierte una fecha ISO del backend a Date (o null si no existe). */
    static fecha(v?: string | null): Date | null {
        if (!v) return null;
        const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v}T00:00:00` : v);
        return isNaN(d.getTime()) ? null : d;
    }

    private toText(v: ExportValue): string {
        if (v === null || v === undefined || v === '') return '—';
        if (typeof v === 'boolean') return v ? 'Sí' : 'No';
        if (v instanceof Date) return v.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
        return String(v);
    }

    private formatDateTime(d: Date): string {
        return d.toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });
    }

    private fileStamp(): string {
        const d = new Date();
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }

    private download(blob: Blob, name: string): void {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url));
    }
}
