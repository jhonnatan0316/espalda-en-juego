// Temporizador guiado: recorre los pasos de uno o varios ejercicios.
import { EJERCICIOS } from './data.js';
import { store } from './store.js';
import { FIGURAS, svgFigura } from './figuras.js';

const LADOS = ['Lado izquierdo', 'Lado derecho'];
const CIRC = 2 * Math.PI * 130;

/** Pasos de un ejercicio: intro, aguantes, pausas y series. */
export function pasosDe(id) {
  const e = EJERCICIOS[id];
  const out = [{ tipo: 'intro', id }];
  if (e.modo === 'series') {
    for (let s = 1; s <= e.series; s++) {
      out.push({ tipo: 'serie', id, n: s, de: e.series });
      if (s < e.series) out.push({ tipo: 'pausa', id, seg: 30, texto: 'Descanso' });
    }
    return out;
  }
  const lados = e.lados ? LADOS : [null];
  e.bloques.forEach((n, b) => {
    if (e.alterna) {
      for (let r = 1; r <= n; r++) {
        lados.forEach((lado, l) => {
          out.push({ tipo: 'aguanta', id, seg: e.seg, rep: r, de: n, lado });
          if (!(r === n && l === lados.length - 1)) out.push({ tipo: 'pausa', id, seg: 5, texto: 'Cambia de lado' });
        });
      }
    } else {
      lados.forEach((lado, l) => {
        for (let r = 1; r <= n; r++) {
          out.push({ tipo: 'aguanta', id, seg: e.seg, rep: r, de: n, lado });
          if (r < n) out.push({ tipo: 'pausa', id, seg: 3, texto: 'Suelta' });
        }
        if (l < lados.length - 1) out.push({ tipo: 'pausa', id, seg: 5, texto: 'Cambia de lado' });
      });
    }
    if (b < e.bloques.length - 1) out.push({ tipo: 'pausa', id, seg: 15, texto: 'Pausa breve' });
  });
  return out;
}

/** Duración aproximada en minutos de una lista de ejercicios. */
export function minutosDe(ids) {
  let seg = 0;
  for (const id of ids) {
    for (const p of pasosDe(id)) seg += p.seg || (p.tipo === 'serie' ? 40 : 0);
  }
  return Math.round(seg / 60);
}

let audio;
function pitido(frecuencia, ms) {
  if (!store.ajustes().sonido) return;
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    const o = audio.createOscillator(); const g = audio.createGain();
    o.frequency.value = frecuencia; o.connect(g); g.connect(audio.destination);
    g.gain.setValueAtTime(0.25, audio.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + ms / 1000);
    o.start(); o.stop(audio.currentTime + ms / 1000);
  } catch { /* sin audio */ }
}
const vibrar = (p) => { try { navigator.vibrate && navigator.vibrate(p); } catch { /* sin vibración */ } };

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/**
 * Abre el temporizador a pantalla completa.
 * @param {{titulo: string, ids: string[], finTexto?: string, alTerminar: () => void, alSalir: () => void}} op
 */
export function abrirPlayer(op) {
  const pasos = op.ids.flatMap(pasosDe);
  const raiz = document.getElementById('player');
  let i = 0; let restante = 0; let ultimo = 0; let enPausa = false; let raf = 0; let bloqueo = null;

  const pedirPantalla = async () => { try { bloqueo = await navigator.wakeLock?.request('screen'); } catch { /* sin bloqueo */ } };
  const soltarPantalla = () => { try { bloqueo?.release(); } catch { /* nada */ } bloqueo = null; };
  const alVolver = () => { if (document.visibilityState === 'visible' && !bloqueo) pedirPantalla(); };

  function cerrar(terminado) {
    cancelAnimationFrame(raf); soltarPantalla();
    document.removeEventListener('visibilitychange', alVolver);
    raiz.hidden = true; raiz.innerHTML = ''; document.body.classList.remove('con-player');
    (terminado ? op.alTerminar : op.alSalir)();
  }

  function avanzar() { i++; if (i >= pasos.length) return fin(); mostrar(); }

  function fin() {
    cancelAnimationFrame(raf); pitido(880, 500); vibrar([120, 80, 120]);
    raiz.innerHTML = `
      <div class="pl-centro">
        <p class="pl-ejercicio">${esc(op.titulo)}</p>
        <h2 class="pl-fase">Hecho</h2>
        <p class="pl-sub">${esc(op.finTexto || '')}</p>
        <button class="btn btn-claro" data-pl="cerrar">Volver</button>
      </div>`;
    raiz.querySelector('[data-pl="cerrar"]').focus();
  }

  function mostrar() {
    cancelAnimationFrame(raf);
    const p = pasos[i]; const e = EJERCICIOS[p.id];
    const orden = op.ids.indexOf(p.id) + 1;
    const cabecera = `<p class="pl-ejercicio">${esc(e.nombre)}${op.ids.length > 1 ? ` <span class="pl-orden">${orden} de ${op.ids.length}</span>` : ''}</p>`;
    const pie = `
      <div class="pl-pie">
        <button class="pl-btn" data-pl="salir">Salir</button>
        ${p.tipo === 'aguanta' || p.tipo === 'pausa' ? '<button class="pl-btn" data-pl="pausa">Pausa</button>' : ''}
        <button class="pl-btn" data-pl="saltar">Saltar</button>
      </div>`;

    if (p.tipo === 'intro') {
      raiz.innerHTML = `
        <div class="pl-centro pl-intro">
          ${cabecera}
          <p class="pl-dosis">${esc(e.dosis)}</p>
          <div class="pl-figuras">${(FIGURAS[p.id] || []).map((fr, k) => `<span>${svgFigura(fr, esc(`${e.nombre}, paso ${k + 1}`))}</span>`).join('')}</div>
          <p class="pl-como">${esc(e.como)}</p>
          <p class="pl-guias">${e.guias.map(([t, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(t)}</a>`).join('')}</p>
          <button class="btn btn-claro" data-pl="saltar">Empezar</button>
        </div>
        <div class="pl-pie"><button class="pl-btn" data-pl="salir">Salir</button><button class="pl-btn" data-pl="omitir">Omitir ejercicio</button></div>`;
      return;
    }
    if (p.tipo === 'serie') {
      raiz.innerHTML = `
        <div class="pl-centro">
          ${cabecera}
          <h2 class="pl-fase">Serie ${p.n} de ${p.de}</h2>
          <p class="pl-sub">${esc(e.reps)}</p>
          <button class="btn btn-claro" data-pl="saltar">Serie hecha</button>
        </div>${pie}`;
      return;
    }
    const aguanta = p.tipo === 'aguanta';
    raiz.innerHTML = `
      <div class="pl-centro">
        ${cabecera}
        <div class="pl-campo ${aguanta ? '' : 'pl-descanso'}">
          <svg viewBox="0 0 300 300" aria-hidden="true">
            <line x1="-400" y1="150" x2="700" y2="150" class="pl-raya"/>
            <circle cx="150" cy="150" r="130" class="pl-circulo"/>
            <circle cx="150" cy="150" r="130" class="pl-avance" stroke-dasharray="${CIRC}" stroke-dashoffset="0" transform="rotate(-90 150 150)"/>
          </svg>
          <div class="pl-numero" role="timer" aria-live="off">${p.seg}</div>
        </div>
        <h2 class="pl-fase">${aguanta ? 'Aguanta' : esc(p.texto)}</h2>
        <p class="pl-sub">${aguanta ? `Repetición ${p.rep} de ${p.de}${p.lado ? `, ${p.lado.toLowerCase()}` : ''}` : siguienteTexto()}</p>
      </div>${pie}`;
    restante = p.seg; ultimo = performance.now(); enPausa = false;
    if (aguanta) { pitido(660, 160); vibrar(80); }
    raf = requestAnimationFrame(tic);
  }

  function siguienteTexto() {
    const s = pasos.slice(i + 1).find((x) => x.tipo === 'aguanta' || x.tipo === 'serie');
    if (!s || s.id !== pasos[i].id) return 'Después, siguiente ejercicio';
    if (s.tipo === 'serie') return `Después, serie ${s.n} de ${s.de}`;
    return `Después, repetición ${s.rep} de ${s.de}${s.lado ? `, ${s.lado.toLowerCase()}` : ''}`;
  }

  function tic(ahora) {
    if (!enPausa) restante -= (ahora - ultimo) / 1000;
    ultimo = ahora;
    const p = pasos[i];
    const num = raiz.querySelector('.pl-numero'); const arco = raiz.querySelector('.pl-avance');
    if (!num) return;
    num.textContent = Math.max(0, Math.ceil(restante));
    arco.setAttribute('stroke-dashoffset', String(CIRC * (1 - Math.max(0, restante) / p.seg)));
    if (restante <= 0) {
      if (p.tipo === 'aguanta') { pitido(440, 260); vibrar([60, 60, 60]); }
      return avanzar();
    }
    raf = requestAnimationFrame(tic);
  }

  raiz.onclick = (ev) => {
    const b = ev.target.closest('[data-pl]'); if (!b) return;
    const a = b.dataset.pl;
    if (a === 'salir') return cerrar(false);
    if (a === 'cerrar') return cerrar(true);
    if (a === 'saltar') return avanzar();
    if (a === 'omitir') {
      const id = pasos[i].id;
      while (i < pasos.length && pasos[i].id === id) i++;
      return i >= pasos.length ? fin() : mostrar();
    }
    if (a === 'pausa') { enPausa = !enPausa; b.textContent = enPausa ? 'Continuar' : 'Pausa'; }
  };

  raiz.hidden = false; document.body.classList.add('con-player');
  pedirPantalla(); document.addEventListener('visibilitychange', alVolver);
  mostrar();
}
