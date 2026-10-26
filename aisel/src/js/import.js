/* ============================================================ importing her own books: .txt .md .epub .pdf -> {title, author, text, cover}
   pdf.js and JSZip ship with the app (lib/) and load only when a file of that kind is picked */
A.importer = (() => {
  const loaded = {};
  const need = (src) => loaded[src] || (loaded[src] = new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => { delete loaded[src]; rej(new Error('lib')); }; document.head.appendChild(s); }));
  const tick = () => new Promise(r => setTimeout(r, 0));
  const clean = t => t.replace(/\r/g, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  const thumb = (src, max = 360) => new Promise(res => { const im = new Image(); im.onload = () => { const k = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', .8)); }; im.onerror = () => res(null); im.src = src; });
  const nameOf = f => f.name.replace(/\.[^.]+$/, '').replace(/[_]+/g, ' ').trim();

  async function plain(file) {
    const buf = await file.arrayBuffer(); let t = new TextDecoder('utf-8').decode(buf);
    if ((t.match(/\uFFFD/g) || []).length > t.length * .002) t = new TextDecoder('windows-1251').decode(buf);
    return { title: nameOf(file), author: '', text: clean(t) };
  }

  async function epub(file, prog) {
    await need('lib/jszip.min.js'); const zip = await JSZip.loadAsync(file), rd = async p => { const f = zip.file(p) || zip.file(decodeURIComponent(p)); return f ? f.async('string') : ''; };
    const cont = await rd('META-INF/container.xml'), opfPath = (/full-path="([^"]+)"/.exec(cont) || [])[1]; if (!opfPath) throw new Error('epub');
    const opf = new DOMParser().parseFromString(await rd(opfPath), 'application/xml'), base = opfPath.includes('/') ? opfPath.replace(/[^/]+$/, '') : '';
    const g = (n) => { const e = opf.getElementsByTagNameNS('*', n)[0]; return e ? e.textContent.trim() : ''; };
    const items = {}; [...opf.getElementsByTagName('item')].forEach(i => items[i.getAttribute('id')] = i);
    const spine = [...opf.getElementsByTagName('itemref')].map(r => items[r.getAttribute('idref')]).filter(Boolean);
    const out = []; let n = 0;
    for (const it of spine) {
      const href = it.getAttribute('href'), type = it.getAttribute('media-type') || ''; if (!/html|xml/.test(type)) continue;
      const doc = new DOMParser().parseFromString(await rd(base + href), 'text/html'); doc.querySelectorAll('script,style,nav').forEach(x => x.remove());
      let buf = ''; const BLOCK = /^(P|DIV|H[1-6]|LI|BLOCKQUOTE|SECTION|ARTICLE|TR|PRE)$/;
      const walk = (nd) => { if (nd.nodeType === 3) { buf += nd.nodeValue.replace(/\s+/g, ' '); return; } if (nd.nodeType !== 1) return; const tg = nd.tagName; if (tg === 'BR') { buf += '\n'; return; } if (/^H[1-6]$/.test(tg)) buf += '\n\n# '; nd.childNodes.forEach(walk); if (BLOCK.test(tg)) buf += '\n\n'; };
      if (doc.body) walk(doc.body); out.push(buf.replace(/[ \t]*\n[ \t]*/g, '\n').replace(/\n{3,}/g, '\n\n').trim()); prog && prog(++n, spine.length); if (n % 4 === 0) await tick();
    }
    let cover = null; try {
      const meta = [...opf.getElementsByTagName('meta')].find(m => m.getAttribute('name') === 'cover'); let ci = meta ? items[meta.getAttribute('content')] : null; ci = ci || [...Object.values(items)].find(i => /cover-image/.test(i.getAttribute('properties') || ''));
      if (ci) { const f = zip.file(base + ci.getAttribute('href')) || zip.file(decodeURIComponent(base + ci.getAttribute('href'))); if (f) { const b64 = await f.async('base64'); cover = await thumb(`data:${ci.getAttribute('media-type') || 'image/jpeg'};base64,${b64}`); } }
    } catch (e) {}
    return { title: g('title') || nameOf(file), author: g('creator'), text: clean(out.filter(Boolean).join('\n\n')), cover };
  }

  async function pdf(file, prog) {
    await need('lib/pdf.min.js'); const lib = window.pdfjsLib; lib.GlobalWorkerOptions.workerSrc = 'lib/pdf.worker.min.js';
    const doc = await lib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise; let info = {}; try { info = (await doc.getMetadata()).info || {}; } catch (e) {}
    const paras = []; let cur = '';
    const flush = () => { if (cur.trim()) paras.push(cur.trim()); cur = ''; };
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p), tc = await page.getTextContent(), lines = []; let ly = null, line = '', lh = 12, first = true;
      for (const it of tc.items) { if (!('str' in it)) continue; const y = it.transform[5], h = it.height || 10; if (ly !== null && Math.abs(y - ly) > h * .55) { lines.push({ s: line, y: ly, h: lh }); line = ''; } line += it.str; if (it.hasEOL) line += ' '; ly = y; lh = h || lh; }
      if (line) lines.push({ s: line, y: ly, h: lh });
      let prevY = null; for (const L of lines) { const s = L.s.replace(/\s+/g, ' ').trim(); if (!s || /^\d{1,4}$/.test(s) || /^-?\s*\d+\s*-?$/.test(s)) { continue; }
        const gap = prevY !== null ? Math.abs(prevY - L.y) : 0; if (prevY !== null && gap > L.h * 1.85) flush();
        if (cur && /[-­]$/.test(cur) && /^[a-zа-яё]/.test(s)) cur = cur.replace(/[-­]$/, '') + s; else cur += (cur ? ' ' : '') + s; prevY = L.y; first = false; }
      if (/[.!?…»”"]$/.test(cur.trim())) flush();
      prog && prog(p, doc.numPages); if (p % 3 === 0) await tick();
    }
    flush(); let cover = null;
    try { const page = await doc.getPage(1), vp0 = page.getViewport({ scale: 1 }), vp = page.getViewport({ scale: 360 / vp0.width }), c = document.createElement('canvas'); c.width = vp.width; c.height = vp.height; await page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise; cover = c.toDataURL('image/jpeg', .78); } catch (e) {}
    return { title: (info.Title || '').trim() || nameOf(file), author: (info.Author || '').trim(), text: clean(paras.join('\n\n')), cover, pdf: true, pageCount: doc.numPages };
  }

  return {
    ACCEPT: '.txt,.md,.text,.epub,.pdf,text/plain,text/markdown,application/pdf,application/epub+zip',
    async read(file, prog) {
      if (file.size > 60e6) throw new Error('big'); const n = file.name.toLowerCase(); let r;
      if (n.endsWith('.pdf') || file.type === 'application/pdf') r = await pdf(file, prog); else if (n.endsWith('.epub')) r = await epub(file, prog); else r = await plain(file);
      if (!r.text || r.text.length < 20) throw new Error(r.pdf ? 'scan' : 'empty'); return r;
    }
  };
})();
