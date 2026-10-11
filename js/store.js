// Datos del usuario: se guardan solo en este dispositivo (localStorage).
import { diasEntre, sumarDias, lunesDe } from './schedule.js';

const CLAVE = 'espalda-en-juego:v1';

const VACIO = () => ({
  dias: {},            // 'YYYY-MM-DD' → { rutina, sesion, sintoma: 'no'|'local'|'irradiado', pausas, calentamiento: [] }
  crisis: null,        // { inicio, desencadenante, pasos: [bool × 6] }
  historial: [],       // [{ inicio, fin, desencadenante }]
  ajustes: { visto: false, sonido: true, telefono: '', recordatorios: {}, horas: {} },
});

let estado = cargar();

function cargar() {
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (!crudo) return VACIO();
    const d = JSON.parse(crudo);
    const v = VACIO();
    return { ...v, ...d, ajustes: { ...v.ajustes, ...(d.ajustes || {}) } };
  } catch { return VACIO(); }
}

function guardar() {
  try { localStorage.setItem(CLAVE, JSON.stringify(estado)); } catch { /* sin almacenamiento: la sesión sigue en memoria */ }
}

export const store = {
  get todo() { return estado; },
  dia(fecha) { return estado.dias[fecha] || {}; },
  marcar(fecha, cambios) { estado.dias[fecha] = { ...estado.dias[fecha], ...cambios }; guardar(); },
  ajustes(cambios) { if (cambios) { estado.ajustes = { ...estado.ajustes, ...cambios }; guardar(); } return estado.ajustes; },

  iniciarCrisis(fecha, desencadenante) {
    estado.crisis = { inicio: fecha, desencadenante: desencadenante || '', pasos: [false, false, false, false, false, false] };
    guardar();
  },
  pasoCrisis(i, valor) { if (estado.crisis) { estado.crisis.pasos[i] = valor; guardar(); } },
  terminarCrisis(fecha) {
    if (!estado.crisis) return;
    estado.historial.push({ inicio: estado.crisis.inicio, fin: fecha, desencadenante: estado.crisis.desencadenante });
    estado.crisis = null; guardar();
  },

  exportar() { return JSON.stringify(estado, null, 2); },
  importar(texto) {
    const d = JSON.parse(texto);
    if (!d || typeof d !== 'object' || typeof d.dias !== 'object') throw new Error('formato');
    const v = VACIO();
    estado = { ...v, ...d, ajustes: { ...v.ajustes, ...(d.ajustes || {}) } };
    guardar();
  },
  borrar() { estado = VACIO(); guardar(); },
};

/** Días con rutina hecha en la semana (lunes a domingo) de una fecha. */
export function rutinasSemana(fecha) {
  const lunes = lunesDe(fecha);
  let n = 0;
  for (let i = 0; i < 7; i++) if (store.dia(sumarDias(lunes, i)).rutina) n++;
  return n;
}

/** Semanas completas seguidas sin síntomas irradiados ni crisis, según lo registrado. */
export function semanasSinSintomas(config, hoy) {
  if (estado.crisis) return 0;
  let ultimo = config.inicio;
  for (const [f, d] of Object.entries(estado.dias)) if (d.sintoma === 'irradiado' && f > ultimo) ultimo = sumarDias(f, 1);
  for (const c of estado.historial) if (c.fin >= ultimo) ultimo = sumarDias(c.fin, 1);
  const dias = diasEntre(ultimo, hoy);
  return dias < 0 ? 0 : Math.floor(dias / 7);
}

/** De las últimas 4 semanas completas, cuántas tienen la rutina hecha 5 días o más. */
export function semanasCumplidas(hoy) {
  const lunes = lunesDe(hoy);
  let n = 0;
  for (let s = 1; s <= 4; s++) if (rutinasSemana(sumarDias(lunes, -7 * s)) >= 5) n++;
  return n;
}
