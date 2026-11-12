// A small text-only PDF writer (A4, Helvetica), enough for the member's
// dossier. No dependency: the standard PDF fonts need no embedding, and
// French text fits in WinAnsiEncoding.

export type PdfBlock =
  | { kind: 'title'; text: string }
  | { kind: 'subtitle'; text: string }
  | { kind: 'heading'; text: string }
  | { kind: 'label'; text: string }
  | { kind: 'text'; text: string }
  | { kind: 'space'; size?: number };

// Helvetica widths (1/1000 em) for ASCII 32-126, from the standard AFM.
const W = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556,
  556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778,
  722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222,
  500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584
];

// Unicode -> WinAnsiEncoding byte for the characters outside Latin-1.
const WIN: Record<string, number> = {
  '€': 0x80, '‚': 0x82, '„': 0x84, '…': 0x85, '‘': 0x91, '’': 0x92, '“': 0x93, '”': 0x94, '•': 0x95, '–': 0x96, '—': 0x97,
  'œ': 0x9c, 'Œ': 0x8c, 'Ÿ': 0x9f, '→': 0x3e
};

function byteOf(ch: string): number {
  if (ch === ' ' || ch === ' ' || ch === ' ') return 0x20;
  if (WIN[ch] !== undefined) return WIN[ch];
  const c = ch.codePointAt(0) ?? 63;
  return c < 256 ? c : 63; // '?'
}

function widthOf(text: string, size: number, bold: boolean) {
  let w = 0;
  for (const ch of text) {
    const base = ch.normalize('NFD')[0] || ch;
    const c = base.charCodeAt(0);
    w += c >= 32 && c <= 126 ? W[c - 32] : 556;
  }
  return (w * size * (bold ? 1.06 : 1)) / 1000;
}

function wrap(text: string, size: number, bold: boolean, max: number): string[] {
  const out: string[] = [];
  for (const para of text.replace(/\r/g, '').split('\n')) {
    let line = '';
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (widthOf(next, size, bold) <= max) line = next;
      else {
        if (line) out.push(line);
        // A word longer than the line is cut.
        let w = word;
        while (widthOf(w, size, bold) > max && w.length > 1) {
          let i = w.length;
          while (i > 1 && widthOf(w.slice(0, i), size, bold) > max) i--;
          out.push(w.slice(0, i));
          w = w.slice(i);
        }
        line = w;
      }
    }
    out.push(line);
  }
  return out;
}

function pdfString(text: string) {
  let s = '(';
  for (const ch of text) {
    const b = byteOf(ch);
    if (b === 0x28 || b === 0x29 || b === 0x5c) s += `\\${String.fromCharCode(b)}`;
    else if (b < 32 || b > 126) s += `\\${b.toString(8).padStart(3, '0')}`;
    else s += String.fromCharCode(b);
  }
  return `${s})`;
}

const STYLE: Record<Exclude<PdfBlock['kind'], 'space'>, { size: number; bold: boolean; gray?: number; before: number }> = {
  title: { size: 20, bold: true, before: 0 },
  subtitle: { size: 10, bold: false, gray: 0.4, before: 4 },
  heading: { size: 13, bold: true, before: 16 },
  label: { size: 9.5, bold: true, gray: 0.25, before: 7 },
  text: { size: 10.5, bold: false, before: 2 }
};

/** Builds the PDF bytes. */
export function buildPdf(blocks: PdfBlock[], meta: { title: string; footer?: string }): Uint8Array {
  const PW = 595.28;
  const PH = 841.89;
  const M = 48;
  const maxW = PW - 2 * M;
  const pages: string[] = [];
  let ops: string[] = [];
  let y = PH - M;
  const newPage = () => {
    if (ops.length) pages.push(ops.join('\n'));
    ops = [];
    y = PH - M;
  };
  for (const b of blocks) {
    if (b.kind === 'space') {
      y -= b.size ?? 8;
      continue;
    }
    const st = STYLE[b.kind];
    const lines = wrap(b.text, st.size, st.bold, maxW);
    const lh = st.size * 1.35;
    y -= st.before;
    for (const line of lines) {
      if (y - lh < M + 20) newPage();
      y -= lh;
      const g = st.gray ?? 0;
      ops.push(`BT /${st.bold ? 'F2' : 'F1'} ${st.size} Tf ${g} g ${M} ${y.toFixed(2)} Td ${pdfString(line)} Tj ET`);
    }
  }
  newPage();

  const objects: string[] = [];
  const add = (body: string) => {
    objects.push(body);
    return objects.length;
  };
  const catalog = add('');
  const pagesObj = add('');
  const f1 = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  const f2 = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
  const kids: number[] = [];
  pages.forEach((content, i) => {
    const footer = `BT /F1 8 Tf 0.5 g ${M} 28 Td ${pdfString(`${meta.footer ? `${meta.footer} · ` : ''}${i + 1}/${pages.length}`)} Tj ET`;
    const stream = `${content}\n${footer}`;
    const c = add(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    kids.push(
      add(
        `<< /Type /Page /Parent ${pagesObj} 0 R /MediaBox [0 0 ${PW} ${PH}] /Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R >> >> /Contents ${c} 0 R >>`
      )
    );
  });
  objects[catalog - 1] = `<< /Type /Catalog /Pages ${pagesObj} 0 R >>`;
  objects[pagesObj - 1] = `<< /Type /Pages /Kids [${kids.map((k) => `${k} 0 R`).join(' ')}] /Count ${kids.length} >>`;
  const info = add(`<< /Title ${pdfString(meta.title)} /Producer (Black Pater) >>`);

  // Every character above is one byte (latin1), so string length = byte offset.
  let out = '%PDF-1.4\n%âãÏÓ\n';
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const o of offsets) out += `${String(o).padStart(10, '0')} 00000 n \n`;
  out += `trailer\n<< /Size ${objects.length + 1} /Root ${catalog} 0 R /Info ${info} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  const bytes = new Uint8Array(out.length);
  for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 0xff;
  return bytes;
}

export function downloadPdf(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
