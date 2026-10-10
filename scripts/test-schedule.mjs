// Comprobaciones de la lógica del plan y de los avisos. Uso: npm test
import assert from 'node:assert/strict';
import {
  tipoDelDia, planDelDia, avisosDelDia, avisosEnVentana, instanteDe, fechaEnZona, faseDe, lunesDe, sumarDias, horasEntrePartidos,
} from '../js/schedule.js';

const base = {
  zonaHoraria: 'Europe/Madrid', inicio: '2026-10-12',
  partido: { dia: 6, hora: null }, segundoPartido: { activo: false, hora: null },
  avisos: { rutina: '08:30', pausas: ['11:00', '13:00', '17:00'], sesion: '18:30', partido: '09:00', registro: '20:00' },
};
const semana = (c) => [0, 1, 2, 3, 4, 5, 6].map((i) => tipoDelDia(c, sumarDias('2026-10-12', i)));

// Semana tipo con un partido el sábado (lunes a domingo), como en el plan.
assert.deepEqual(semana(base), ['pilates', 'fuerzaA', 'natacion', 'fuerzaB', 'caminarSuave', 'partido', 'recuperar']);
// Con dos partidos: miércoles suave y sábado.
const dos = { ...base, segundoPartido: { activo: true, hora: null } };
assert.deepEqual(semana(dos), ['fuerzaA', 'natacion', 'partidoSuave', 'fuerzaB', 'pilatesSuave', 'partido', 'recuperar']);
// Martes a las 20:00 y jueves a las 19:00: 47 horas entre partidos.
const marJue = { ...base, partido: { dia: 2, hora: '20:00' }, segundoPartido: { activo: true, dia: 4, hora: '19:00' } };
assert.deepEqual(semana(marJue), ['pilatesSuave', 'partido', 'recuperar', 'partidoSuave', 'fuerzaA', 'natacion', 'fuerzaB']);
assert.equal(horasEntrePartidos(marJue), 47);
assert.equal(horasEntrePartidos(base), null);
assert.equal(horasEntrePartidos(dos), 72);
assert.deepEqual(avisosDelDia(marJue, '2026-10-13').map((a) => `${a.hora} ${a.tag}`), ['09:00 partido', '11:00 pausa', '13:00 pausa', '17:00 pausa', '19:30 calentar']);
assert.deepEqual(avisosDelDia(marJue, '2026-10-15').map((a) => `${a.hora} ${a.tag}`), ['09:00 partido', '11:00 pausa', '13:00 pausa', '17:00 pausa', '18:30 calentar']);

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

// Avisos de un martes: rutina, tres pausas y la sesión.
assert.deepEqual(avisosDelDia(base, '2026-10-13').map((a) => `${a.hora} ${a.tag}`),
  ['08:30 rutina', '11:00 pausa', '13:00 pausa', '17:00 pausa', '18:30 sesion']);
// Sábado de partido con hora: aviso de mañana y de calentar 30 minutos antes.
const conHora = { ...base, partido: { dia: 6, hora: '17:00' } };
assert.deepEqual(avisosDelDia(conHora, '2026-10-17').map((a) => `${a.hora} ${a.tag}`), ['09:00 partido', '16:30 calentar']);
// Domingo: paseo de recuperación y registro. Antes del inicio: nada.
assert.deepEqual(avisosDelDia(base, '2026-10-18').map((a) => a.tag), ['sesion', 'registro']);
assert.deepEqual(avisosDelDia(base, '2026-10-09'), []);

// Zona horaria: horario de verano e invierno en Madrid, y Bogotá.
assert.equal(new Date(instanteDe('2026-10-13', '08:30', 'Europe/Madrid')).toISOString(), '2026-10-13T06:30:00.000Z');
assert.equal(new Date(instanteDe('2026-11-03', '08:30', 'Europe/Madrid')).toISOString(), '2026-11-03T07:30:00.000Z');
assert.equal(new Date(instanteDe('2027-02-02', '08:30', 'America/Bogota')).toISOString(), '2027-02-02T13:30:00.000Z');
assert.deepEqual(fechaEnZona(new Date('2026-10-13T22:30:00Z'), 'Europe/Madrid'), { fecha: '2026-10-14', hora: '00:30' });

// Ventanas contiguas: cada aviso sale exactamente una vez a lo largo de una semana.
const t0 = Date.parse('2026-10-11T22:00:00Z'); let enviados = 0;
for (let t = t0; t < t0 + 7 * 86400000; t += 10 * 60000) enviados += avisosEnVentana(base, t, t + 10 * 60000).length;
const esperados = [0, 1, 2, 3, 4, 5, 6].reduce((n, i) => n + avisosDelDia(base, sumarDias('2026-10-12', i)).length, 0);
assert.equal(enviados, esperados);
// Una ventana que cruza la medianoche local recoge avisos de los dos días.
const cruza = avisosEnVentana({ ...base, avisos: { rutina: '00:10', registro: '23:50' } }, Date.parse('2026-10-18T21:45:00Z'), Date.parse('2026-10-18T22:15:00Z'));
assert.deepEqual(cruza.map((a) => a.tag), ['registro', 'rutina']);

console.log(`Todo correcto: ${esperados} avisos en la primera semana.`);
