/**
 * Generador mínimo de PDF (texto, A4, Helvetica) sin dependencias externas.
 * Soporta acentos y ñ (codificación WinAnsi).
 */
export interface PdfRow {
    label: string;
    value: string;
}
export interface PdfSection {
    title?: string;
    rows?: PdfRow[];
    paragraphs?: string[];
}
export interface PdfDoc {
    title: string;
    subtitle?: string;
    sections: PdfSection[];
    footer?: string;
}
const W = 595, H = 842, M = 48;
const CP1252: Record<string, number> = { '€': 128, '‚': 130, '„': 132, '…': 133, '‘': 145, '’': 146, '“': 147, '”': 148, '•': 149, '–': 150, '—': 151 };
function enc(s: string): string {
    let out = '';
    for (const ch of s.normalize('NFC').replace(/→/g, '->')) {
        const c = ch.charCodeAt(0);
        let b: number;
        if (c === 40 || c === 41 || c === 92) {
            out += '\\' + ch;
            continue;
        }
        if (c >= 32 && c <= 126)
            b = c;
        else if (c >= 160 && c <= 255)
            b = c;
        else if (CP1252[ch])
            b = CP1252[ch];
        else if (c === 9 || c === 10 || c === 13)
            b = 32;
        else
            b = 63;
        out += String.fromCharCode(b);
    }
    return out;
}
function wrap(text: string, size: number, width: number): string[] {
    const maxChars = Math.max(10, Math.floor(width / (size * 0.52)));
    const lines: string[] = [];
    for (const para of String(text ?? '').split(/\r?\n/)) {
        let line = '';
        for (const word of para.split(/\s+/).filter(Boolean)) {
            let w = word;
            while (w.length > maxChars) {
                if (line) {
                    lines.push(line);
                    line = '';
                }
                lines.push(w.slice(0, maxChars));
                w = w.slice(maxChars);
            }
            if (!line)
                line = w;
            else if ((line + ' ' + w).length <= maxChars)
                line += ' ' + w;
            else {
                lines.push(line);
                line = w;
            }
        }
        lines.push(line);
    }
    return lines.length ? lines : [''];
}
export function buildPdf(doc: PdfDoc): Uint8Array {
    const pages: string[][] = [[]];
    let y = H - M;
    const cur = () => pages[pages.length - 1];
    const newPage = () => { pages.push([]); y = H - M; };
    const ensure = (need: number) => { if (y - need < M + 24)
        newPage(); };
    const text = (s: string, x: number, size: number, bold = false, rgb = '0.2 0.15 0.16') => {
        cur().push(`BT /${bold ? 'F2' : 'F1'} ${size} Tf ${rgb} rg ${x} ${y} Td (${enc(s)}) Tj ET`);
    };
    // Franja de encabezado
    cur().push(`0.46 0 0.09 rg 0 ${H - 92} ${W} 92 re f`);
    cur().push(`0.9 0.74 0.27 rg 0 ${H - 96} ${W} 4 re f`);
    y = H - 40;
    text('I. E. N.° 20191 “Alfonso Ugarte” - San Vicente', M, 11, false, '1 0.95 0.75');
    y = H - 66;
    text(doc.title, M, 18, true, '1 1 1');
    y = H - 92 - 34;
    if (doc.subtitle) {
        for (const l of wrap(doc.subtitle, 10, W - 2 * M)) {
            text(l, M, 10, false, '0.47 0.42 0.44');
            y -= 14;
        }
        y -= 6;
    }
    for (const sec of doc.sections) {
        if (sec.title) {
            ensure(40);
            text(sec.title.toUpperCase(), M, 11, true, '0.46 0 0.09');
            y -= 5;
            cur().push(`0.92 0.87 0.88 RG 0.8 w ${M} ${y} m ${W - M} ${y} l S`);
            y -= 16;
        }
        for (const r of sec.rows ?? []) {
            const lines = wrap(r.value || '—', 10, W - 2 * M - 150);
            ensure(lines.length * 14 + 4);
            text(r.label, M, 9, true, '0.47 0.42 0.44');
            lines.forEach((l, i) => { text(l, M + 150, 10); if (i < lines.length - 1)
                y -= 14; });
            y -= 18;
        }
        for (const p of sec.paragraphs ?? []) {
            for (const l of wrap(p, 10, W - 2 * M)) {
                ensure(16);
                text(l, M, 10);
                y -= 14;
            }
            y -= 6;
        }
        y -= 8;
    }
    if (doc.footer) {
        ensure(30);
        cur().push(`0.92 0.87 0.88 RG 0.8 w ${M} ${y} m ${W - M} ${y} l S`);
        y -= 16;
        for (const l of wrap(doc.footer, 9, W - 2 * M)) {
            ensure(14);
            text(l, M, 9, false, '0.47 0.42 0.44');
            y -= 12;
        }
    }
    // Ensamblado de objetos PDF
    const objs: string[] = [];
    const add = (s: string) => { objs.push(s); return objs.length; };
    add('<< /Type /Catalog /Pages 2 0 R >>');
    add(''); // Pages (se completa luego)
    add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
    add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
    const kids: number[] = [];
    pages.forEach((ops, i) => {
        const footer = `BT /F1 8 Tf 0.47 0.42 0.44 rg ${M} 28 Td (${enc(`Página ${i + 1} de ${pages.length}`)}) Tj ET`;
        const stream = ops.join('\n') + '\n' + footer;
        const contentId = objs.length + 2;
        const pageId = add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`);
        kids.push(pageId);
        add(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    });
    objs[1] = `<< /Type /Pages /Kids [${kids.map(k => k + ' 0 R').join(' ')}] /Count ${kids.length} >>`;
    let out = '%PDF-1.4\n';
    const offsets: number[] = [];
    objs.forEach((o, i) => { offsets.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
    const xref = out.length;
    out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offsets.map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('');
    out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
    const bytes = new Uint8Array(out.length);
    for (let i = 0; i < out.length; i++)
        bytes[i] = out.charCodeAt(i) & 255;
    return bytes;
}

