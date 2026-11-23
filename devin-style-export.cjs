const fs = require('fs');
const path = require('path');
const root = __dirname;
const feat = p => path.join(root, 'src', 'app', 'features', p);

function edit(file, fn) {
    const src = fs.readFileSync(file, 'utf8');
    const out = fn(src);
    if (out === src) throw new Error('Sin cambios en ' + file);
    fs.writeFileSync(file, out, 'utf8');
    console.log('OK', path.relative(root, file));
}

const bloque = ind => `${ind}<div class="fut-export" role="group" aria-label="Exportar listado">
${ind}  <button class="fut-export-btn fut-export-btn--pdf" type="button" (click)="exportar('pdf')" [disabled]="!!exportando || !filtered.length" title="Descargar el listado en PDF">
${ind}    <span class="fut-export-btn__ico" aria-hidden="true">
${ind}      <span class="fut-export-btn__spinner" *ngIf="exportando === 'pdf'; else icoPdf"></span>
${ind}      <ng-template #icoPdf>
${ind}        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
${ind}          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M12 12v6"/><polyline points="9 15 12 18 15 15"/>
${ind}        </svg>
${ind}      </ng-template>
${ind}    </span>
${ind}    <span class="fut-export-btn__text">
${ind}      <span class="fut-export-btn__label">{{ exportando === 'pdf' ? 'Generando...' : 'Exportar PDF' }}</span>
${ind}      <span class="fut-export-btn__hint">Documento .pdf</span>
${ind}    </span>
${ind}  </button>
${ind}  <button class="fut-export-btn fut-export-btn--excel" type="button" (click)="exportar('excel')" [disabled]="!!exportando || !filtered.length" title="Descargar el listado en Excel">
${ind}    <span class="fut-export-btn__ico" aria-hidden="true">
${ind}      <span class="fut-export-btn__spinner" *ngIf="exportando === 'excel'; else icoExcel"></span>
${ind}      <ng-template #icoExcel>
${ind}        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
${ind}          <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/>
${ind}        </svg>
${ind}      </ng-template>
${ind}    </span>
${ind}    <span class="fut-export-btn__text">
${ind}      <span class="fut-export-btn__label">{{ exportando === 'excel' ? 'Generando...' : 'Exportar Excel' }}</span>
${ind}      <span class="fut-export-btn__hint">Hoja de cálculo .xlsx</span>
${ind}    </span>
${ind}  </button>
${ind}</div>`;

const reBotones = /^([ \t]*)<button class="(?:adm|tt)-btn (?:adm|tt)-btn--outline" type="button" \(click\)="exportar\('pdf'\)"[\s\S]*?exportar\('excel'\)[\s\S]*?<\/button>/m;

for (const html of ['solicitantes/pages/solicitante/solicitante.component.html', 'tipo-tramite/pages/tipo-tramite/tipo-tramite.component.html']) {
    edit(feat(html), s => {
        if (!reBotones.test(s)) throw new Error('No se encontraron los botones en ' + html);
        return s.replace(reBotones, (m, ind) => bloque(ind));
    });
}

for (const ts of ['solicitantes/pages/solicitante/solicitante.component.ts', 'tipo-tramite/pages/tipo-tramite/tipo-tramite.component.ts']) {
    edit(feat(ts), s => s
        .replace('    exportando = false;', "    exportando: 'pdf' | 'excel' | null = null;")
        .replace('        this.exportando = true;', '        this.exportando = formato;')
        .replace('            this.exportando = false;', '            this.exportando = null;'));
}

const css = `
/* ========================================
   BOTONES DE EXPORTACIÓN (PDF / EXCEL)
======================================== */
.fut-export {
  display: inline-flex;
  align-items: stretch;
  gap: 10px;
  margin-left: auto;
  padding: 4px;
  border-radius: 12px;
  background: linear-gradient(135deg, #fffaf3, #fff1f1);
  border: 1px solid var(--fut-border, #eadfe0);
  box-shadow: 0 2px 8px rgba(73, 0, 15, 0.06);
  animation: fut-export-in .45s cubic-bezier(.2, .8, .2, 1) both;
}

.fut-export-btn {
  --c1: #b3261e;
  --c2: #e5484d;
  --glow: rgba(229, 72, 77, .35);
  position: relative;
  overflow: hidden;
  isolation: isolate;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 40px;
  padding: 5px 16px 5px 6px;
  border: 0;
  border-radius: 9px;
  color: #fff;
  font: inherit;
  text-align: left;
  cursor: pointer;
  background: linear-gradient(135deg, var(--c1), var(--c2));
  box-shadow: 0 4px 12px var(--glow), inset 0 1px 0 rgba(255, 255, 255, .25);
  transition: transform .2s cubic-bezier(.2, .8, .2, 1), box-shadow .2s, filter .2s;
}
.fut-export-btn--excel {
  --c1: #146c43;
  --c2: #22a06b;
  --glow: rgba(34, 160, 107, .35);
}
.fut-export-btn::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  background: linear-gradient(120deg, transparent 20%, rgba(255, 255, 255, .45) 50%, transparent 80%);
  transform: translateX(-120%);
}
.fut-export-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  filter: saturate(1.1) brightness(1.04);
  box-shadow: 0 10px 22px var(--glow), inset 0 1px 0 rgba(255, 255, 255, .3);
}
.fut-export-btn:hover:not(:disabled)::before { animation: fut-export-shine .8s ease; }
.fut-export-btn:hover:not(:disabled) .fut-export-btn__ico svg { animation: fut-export-bounce .6s ease; }
.fut-export-btn:active:not(:disabled) { transform: translateY(0) scale(.97); box-shadow: 0 3px 8px var(--glow); }
.fut-export-btn:focus-visible { outline: 3px solid var(--fut-gold, #e5bd45); outline-offset: 2px; }
.fut-export-btn:disabled { cursor: not-allowed; filter: grayscale(.35); opacity: .6; box-shadow: none; }

.fut-export-btn__ico {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  border-radius: 7px;
  background: rgba(255, 255, 255, .2);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .25);
}
.fut-export-btn__text { display: flex; flex-direction: column; line-height: 1.15; }
.fut-export-btn__label { font-size: .86rem; font-weight: 700; letter-spacing: .01em; white-space: nowrap; }
.fut-export-btn__hint { font-size: .68rem; font-weight: 500; opacity: .85; white-space: nowrap; }

.fut-export-btn__spinner {
  width: 15px;
  height: 15px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, .35);
  border-top-color: #fff;
  animation: fut-export-spin .7s linear infinite;
}

@keyframes fut-export-in {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: none; }
}
@keyframes fut-export-shine { to { transform: translateX(120%); } }
@keyframes fut-export-bounce {
  0%, 100% { transform: translateY(0); }
  35% { transform: translateY(3px); }
  65% { transform: translateY(-2px); }
}
@keyframes fut-export-spin { to { transform: rotate(360deg); } }

@media (max-width: 600px) {
  .fut-export { width: 100%; margin-left: 0; }
  .fut-export-btn { flex: 1; justify-content: center; }
}
@media (prefers-reduced-motion: reduce) {
  .fut-export, .fut-export-btn, .fut-export-btn::before, .fut-export-btn__ico svg { animation: none !important; transition: none !important; }
}
`;
const stylesPath = path.join(root, 'src', 'styles.css');
edit(stylesPath, s => s.includes('BOTONES DE EXPORTACIÓN') ? s : s.replace(/\s*$/, '\n') + css);
