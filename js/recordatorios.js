// Recordatorios semanales para el calendario del móvil: enlaces a Google Calendar y archivo .ics.
import { DIAS, diaSemana, sumarDias, recordatoriosDelDia } from './schedule.js';

const BYDAY = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
const pad = (n) => String(n).padStart(2, '0');

/** Agrupa los recordatorios de una semana: [{ clave, titulo, cuerpo, hora, min, url, dias: [0-6], primera }]. */
export function recordatoriosSemanales(config, desde) {
  const inicio = desde > config.inicio ? desde : config.inicio;
  const mapa = new Map();
  for (let i = 0; i < 7; i++) {
    const fecha = sumarDias(inicio, i);
    for (const r of recordatoriosDelDia(config, fecha)) {
      if (!mapa.has(r.clave)) mapa.set(r.clave, { ...r, dias: [], primera: fecha });
      mapa.get(r.clave).dias.push(diaSemana(fecha));
    }
  }
  const orden = (d) => (d + 6) % 7; // lunes primero
  return [...mapa.values()]
    .map((r) => ({ ...r, dias: r.dias.sort((a, b) => orden(a) - orden(b)) }))
    .sort((a, b) => a.hora.localeCompare(b.hora) || orden(a.dias[0]) - orden(b.dias[0]));
}

/** «lunes, viernes y domingo», o «de lunes a viernes». */
export function textoDias(dias) {
  if (dias.length === 7) return 'todos los días';
  if (dias.length === 5 && [1, 2, 3, 4, 5].every((d) => dias.includes(d))) return 'de lunes a viernes';
  const n = dias.map((d) => DIAS[d]);
  return n.length === 1 ? n[0] : `${n.slice(0, -1).join(', ')} y ${n.at(-1)}`;
}

/** Inicio y fin en hora local, sin zona: «20261012T083000». */
function tramo(r) {
  const [h, m] = r.hora.split(':').map(Number);
  const fin = h * 60 + m + r.min;
  const dia = r.primera.replaceAll('-', '');
  const diaFin = fin >= 1440 ? sumarDias(r.primera, 1).replaceAll('-', '') : dia;
  return [`${dia}T${pad(h)}${pad(m)}00`, `${diaFin}T${pad(Math.floor(fin / 60) % 24)}${pad(fin % 60)}00`];
}

const regla = (r) => `RRULE:FREQ=WEEKLY;BYDAY=${r.dias.map((d) => BYDAY[d]).join(',')}`;

/** Enlace que abre Google Calendar con el evento repetido ya relleno. */
export function enlaceGoogle(r, urlApp) {
  const [ini, fin] = tramo(r);
  const q = new URLSearchParams({
    action: 'TEMPLATE', text: r.titulo, dates: `${ini}/${fin}`, recur: regla(r),
    details: `${r.cuerpo}\n\n${urlApp}${r.url}`,
  });
  return `https://calendar.google.com/calendar/render?${q}`;
}

const escapar = (t) => String(t).replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
// Las líneas de un .ics no pasan de 75 octetos: se parten y continúan con un espacio.
function plegar(linea) {
  const trozos = [];
  let actual = ''; let octetos = 0;
  for (const c of linea) {
    const n = new TextEncoder().encode(c).length;
    if (octetos + n > 73) { trozos.push(actual); actual = ' '; octetos = 1; }
    actual += c; octetos += n;
  }
  trozos.push(actual);
  return trozos.join('\r\n');
}

/** Archivo .ics con todos los recordatorios, cada uno con su aviso a la hora. */
export function ics(lista, urlApp, ahora = new Date()) {
  const sello = `${ahora.toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`;
  const lineas = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Espalda en juego//Recordatorios//ES', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:Espalda en juego'];
  for (const r of lista) {
    const [ini, fin] = tramo(r);
    lineas.push(
      'BEGIN:VEVENT', `UID:${r.clave.replace(/[^\w-]/g, '')}@espalda-en-juego`, `DTSTAMP:${sello}`,
      `DTSTART:${ini}`, `DTEND:${fin}`, regla(r), `SUMMARY:${escapar(r.titulo)}`,
      `DESCRIPTION:${escapar(`${r.cuerpo}\n\n${urlApp}${r.url}`)}`,
      'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${escapar(r.titulo)}`, 'TRIGGER:PT0M', 'END:VALARM', 'END:VEVENT',
    );
  }
  lineas.push('END:VCALENDAR');
  return `${lineas.map(plegar).join('\r\n')}\r\n`;
}
