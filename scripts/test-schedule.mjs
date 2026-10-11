// Comprobaciones de la lógica del plan y de los recordatorios. Uso: npm test
import assert from 'node:assert/strict';
import { tipoDelDia, planDelDia, recordatoriosDelDia, faseDe, lunesDe, sumarDias, horasEntrePartidos } from '../js/schedule.js';
import { recordatoriosSemanales, semanaEditable, textoDias, enlaceGoogle, ics } from '../js/recordatorios.js';

const base = {
  url: 'https://ejemplo.test/app/', inicio: '2026-10-12',
  partido: { dia: 6, hora: null }, segundoPartido: { activo: false, hora: null },
  avisos: { rutina: '08:30', pausas: ['11:00', '13:00', '17:00'], sesion: '18:30', partido: '09:00', registro: '20:00' },
};
const semana = (c) => [0, 1, 2, 3, 4, 5, 6].map((i) => tipoDelDia(c, sumarDias('2026-10-12', i)));

// Semana tipo con un partido el sábado (lunes a domingo), como en el plan.
assert.deepEqual(semana(base), ['pilates', 'fuerzaA', 'natacion', 'fuerzaB', 'caminarSuave', 'partido', 'recuperar']);
// Con dos partidos sin indicar día: miércoles suave y sábado.
const dos = { ...base, segundoPartido: { activo: true, hora: null } };
assert.deepEqual(semana(dos), ['fuerzaA', 'natacion', 'partidoSuave', 'fuerzaB', 'pilatesSuave', 'partido', 'recuperar']);
// Martes a las 20:00 y jueves a las 19:00: 47 horas entre partidos.
const marJue = { ...base, partido: { dia: 2, hora: '20:00' }, segundoPartido: { activo: true, dia: 4, hora: '19:00' } };
assert.deepEqual(semana(marJue), ['pilatesSuave', 'partido', 'recuperar', 'partidoSuave', 'fuerzaA', 'natacion', 'fuerzaB']);
assert.equal(horasEntrePartidos(marJue), 47);
assert.equal(horasEntrePartidos(base), null);
assert.equal(horasEntrePartidos(dos), 72);

// Con cualquier día de partido y cualquier separación válida: la fuerza nunca cae el día antes
// de un partido, sus dos sesiones no son seguidas y hay dos sesiones por semana.
for (let dia = 0; dia < 7; dia++) {
  const casos = [{ ...base, partido: { dia, hora: null } }];
  for (const sep of [2, 3, 4, 5]) casos.push({ ...base, partido: { dia, hora: null }, segundoPartido: { activo: true, dia: (dia + sep) % 7, hora: null } });
  for (const c of casos) {
    const s = [...Array(15)].map((_, i) => tipoDelDia(c, sumarDias('2026-10-12', i)));
    s.slice(0, 14).forEach((t, i) => {
      if (!t.startsWith('fuerza')) return;
      assert.ok(!s[i + 1].startsWith('partido'), 'fuerza el día antes de un partido');
      assert.ok(!s[i + 1].startsWith('fuerza'), 'dos sesiones de fuerza seguidas');
    });
    assert.equal(s.slice(0, 7).filter((t) => t.startsWith('fuerza')).length, 2);
    const partidos = s.map((t, i) => (t.startsWith('partido') ? i : -1)).filter((i) => i >= 0);
    partidos.slice(1).forEach((p, i) => assert.ok(p - partidos[i] >= 2, 'partidos en días seguidos'));
  }
}

// Fases y semanas.
assert.equal(faseDe(base, '2026-10-11').semana, 0);
assert.equal(faseDe(base, '2026-10-12').semana, 1);
assert.equal(faseDe(base, '2026-11-09').fase.n, 2);
assert.equal(faseDe(base, '2026-12-07').fase.n, 3);
assert.equal(faseDe(base, '2027-01-04').fase, null);
assert.equal(faseDe(base, '2027-01-04').semana, 13);
assert.equal(lunesDe('2026-10-18'), '2026-10-12');

// Rutina: días de partido y de recuperación, no.
assert.equal(planDelDia(base, '2026-10-17').rutina, false);
assert.equal(planDelDia(base, '2026-10-18').rutina, false);
assert.equal(planDelDia(base, '2026-10-13').rutina, true);

// Recordatorios de un día.
const delDia = (c, f) => recordatoriosDelDia(c, f).map((r) => `${r.hora} ${r.clave}`);
assert.deepEqual(delDia(base, '2026-10-13'), ['08:30 rutina', '11:00 pausa-11:00', '13:00 pausa-13:00', '17:00 pausa-17:00', '18:30 sesion-fuerzaA']);
assert.deepEqual(delDia(base, '2026-10-17'), ['09:00 partido-partido']); // sin hora de partido: aviso de la mañana
assert.deepEqual(delDia(marJue, '2026-10-13'), ['11:00 pausa-11:00', '13:00 pausa-13:00', '17:00 pausa-17:00', '19:30 calentar-partido']);
assert.deepEqual(delDia(marJue, '2026-10-15'), ['11:00 pausa-11:00', '13:00 pausa-13:00', '17:00 pausa-17:00', '18:30 calentar-partidoSuave']);
assert.deepEqual(delDia(base, '2026-10-18'), ['18:30 sesion-recuperar', '20:00 registro']);

// Recordatorios de la semana, agrupados por días.
const lista = recordatoriosSemanales(marJue, '2026-10-11');
const de = (clave) => lista.find((r) => r.clave === clave);
assert.equal(lista.length, 12);
assert.deepEqual(de('rutina').dias, [1, 5, 6, 0]);           // lunes, viernes, sábado y domingo
assert.equal(de('rutina').primera, '2026-10-12');             // no empieza antes del inicio del plan
assert.deepEqual(de('pausa-11:00').dias, [1, 2, 3, 4, 5]);
assert.deepEqual(de('calentar-partido').dias, [2]);
assert.equal(de('calentar-partido').primera, '2026-10-13');
assert.deepEqual(de('sesion-fuerzaB').dias, [0]);
assert.equal(textoDias([1, 5, 6, 0]), 'lunes, viernes, sábado y domingo');
assert.equal(textoDias([1, 2, 3, 4, 5]), 'de lunes a viernes');
assert.equal(textoDias([2]), 'martes');
// Pasada la fecha de inicio, la primera fecha es el siguiente día que toca, nunca en el pasado.
assert.equal(de('rutina').primera <= '2026-10-18', true);
assert.equal(recordatoriosSemanales(marJue, '2026-11-04').find((r) => r.clave === 'calentar-partido').primera, '2026-11-10');

// Enlace de Google Calendar: hora local, sin zona, repetición semanal.
const enlace = new URL(enlaceGoogle(de('rutina'), marJue.url));
assert.equal(enlace.origin + enlace.pathname, 'https://calendar.google.com/calendar/render');
assert.equal(enlace.searchParams.get('dates'), '20261012T083000/20261012T084500');
assert.equal(enlace.searchParams.get('recur'), 'RRULE:FREQ=WEEKLY;BYDAY=MO,FR,SA,SU');
assert.equal(enlace.searchParams.get('text'), 'Rutina diaria');
assert.ok(enlace.searchParams.get('details').endsWith('https://ejemplo.test/app/#/hoy'));

// Archivo .ics: un evento por recordatorio, líneas de 75 octetos como mucho, aviso a la hora.
const archivo = ics(lista, marJue.url, new Date('2026-10-11T10:00:00Z'));
assert.equal((archivo.match(/BEGIN:VEVENT/g) || []).length, 12);
assert.equal((archivo.match(/TRIGGER:PT0M/g) || []).length, 12);
assert.ok(archivo.startsWith('BEGIN:VCALENDAR\r\n') && archivo.endsWith('END:VCALENDAR\r\n'));
assert.ok(archivo.includes('DTSTART:20261013T193000\r\nDTEND:20261013T200000\r\nRRULE:FREQ=WEEKLY;BYDAY=TU'));
for (const l of archivo.split('\r\n')) assert.ok(new TextEncoder().encode(l).length <= 75, `línea larga: ${l}`);
assert.equal(new Set(archivo.match(/UID:.*/g)).size, 12);
assert.ok(!/DESCRIPTION:[^\r]*[^\\],/.test(archivo.replace(/\r\n /g, '')), 'coma sin escapar');

// Horas cambiadas en el móvil: el sábado (6) la rutina a las 10:00, y el lunes (1) sin la pausa de las 13:00.
const horas = { 6: { rutina: { h: '10:00' } }, 1: { 'pausa-13:00': { off: true } } };
const editada = recordatoriosSemanales(marJue, '2026-10-11', horas);
const por = (id) => editada.find((r) => r.id === id);
assert.deepEqual(por('rutina@08:30').dias, [1, 5, 0]);          // lunes, viernes y domingo siguen a las 08:30
assert.deepEqual(por('rutina@10:00').dias, [6]);                // el sábado, a las 10:00
assert.equal(por('rutina@10:00').primera, '2026-10-17');
assert.deepEqual(por('pausa-13:00@13:00').dias, [2, 3, 4, 5]);  // el lunes ya no
assert.equal(editada.length, 13);
assert.equal(new Set(editada.map((r) => r.id)).size, 13);
assert.equal(new Set(ics(editada, marJue.url).match(/UID:.*/g)).size, 13);
// La pantalla de edición ve también los desactivados, con su hora original.
const lunes = semanaEditable(marJue, '2026-10-11', horas).find((d) => d.dia === 1).recordatorios;
assert.deepEqual(lunes.map((r) => `${r.clave} ${r.activo}`), ['rutina true', 'pausa-11:00 true', 'pausa-13:00 false', 'pausa-17:00 true', 'sesion-pilatesSuave true']);
const sabado = semanaEditable(marJue, '2026-10-11', horas).find((d) => d.dia === 6).recordatorios.find((r) => r.clave === 'rutina');
assert.deepEqual([sabado.hora, sabado.porDefecto], ['10:00', '08:30']);
assert.equal(semanaEditable(marJue, '2026-10-11', {})[0].dia, 1); // empieza en lunes
// Una hora mal escrita se ignora.
assert.equal(recordatoriosSemanales(marJue, '2026-10-11', { 6: { rutina: { h: '25h' } } }).find((r) => r.clave === 'rutina').hora, '08:30');

console.log(`Todo correcto: ${lista.length} recordatorios semanales, ${editada.length} con horas cambiadas.`);
