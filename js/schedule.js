// Lógica compartida entre la web y el envío de avisos (GitHub Actions).
// Sin dependencias: funciona igual en el navegador y en Node.

export const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
export const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export const ACTIVIDADES = {
  partido: { titulo: 'Partido', min: 20, resumen: 'Calentamiento completo de 20 minutos y partido.' },
  partidoSuave: { titulo: 'Partido suave', min: 20, resumen: 'Calentamiento de 20 minutos y partido suave: césped antes que pista, 45 a 60 minutos, sin competición.' },
  recuperar: { titulo: 'Caminar para recuperar', min: 30, resumen: 'Paseo de 30 minutos a ritmo cómodo.' },
  pilates: { titulo: 'Pilates o yoga', min: 40, resumen: 'Sesión de 40 minutos. Avisa al instructor de las hernias; sin flexiones profundas hacia delante ni torsiones forzadas.' },
  pilatesSuave: { titulo: 'Pilates o yoga suave', min: 30, resumen: 'Sesión suave de 30 minutos. Sin flexiones profundas hacia delante ni torsiones forzadas.' },
  fuerzaA: { titulo: 'Fuerza A', min: 25, resumen: 'Sentadilla a una silla, bisagra de cadera, press Pallof y pasos laterales.' },
  fuerzaB: { titulo: 'Fuerza B', min: 25, resumen: 'Zancada hacia atrás, puente a una pierna, paseo con peso y gemelos.' },
  natacion: { titulo: 'Natación de espalda o caminar', min: 30, resumen: '30 minutos de natación de espalda o de caminata.' },
  caminarSuave: { titulo: 'Caminar suave', min: 20, resumen: 'Paseo suave de 20 minutos. Mañana hay partido.' },
};

// Días contados desde el partido principal (0 = día de partido).
const SEMANA_UN_PARTIDO = ['partido', 'recuperar', 'pilates', 'fuerzaA', 'natacion', 'fuerzaB', 'caminarSuave'];
// Con dos partidos: una plantilla por cada separación (días del principal al segundo).
// En todas, la fuerza nunca cae el día antes de un partido y sus dos sesiones no son seguidas.
const SEMANAS_DOS_PARTIDOS = {
  2: ['partido', 'recuperar', 'partidoSuave', 'fuerzaA', 'natacion', 'fuerzaB', 'pilatesSuave'],
  3: ['partido', 'fuerzaA', 'natacion', 'partidoSuave', 'recuperar', 'fuerzaB', 'pilatesSuave'],
  4: ['partido', 'recuperar', 'fuerzaA', 'natacion', 'partidoSuave', 'fuerzaB', 'pilatesSuave'],
  5: ['partido', 'fuerzaA', 'natacion', 'fuerzaB', 'pilatesSuave', 'partidoSuave', 'caminarSuave'],
};

export const FASES = [
  { n: 1, nombre: 'Base', semanas: '1 a 4', desde: 1, hasta: 4,
    anade: 'Rutina diaria, de 3 días por semana a diaria. Caminar hasta 30 minutos. Fuerza solo con peso corporal. Calentamiento completo antes de cada partido.',
    criterio: 'Cuatro semanas sin dolor irradiado y rutina hecha al menos 5 días por semana.' },
  { n: 2, nombre: 'Fuerza', semanas: '5 a 8', desde: 5, hasta: 8,
    anade: 'Carga externa en fuerza. Peso muerto rumano ligero, solo si un fisioterapeuta ha dado por buena la técnica. Plancha lateral con piernas estiradas.',
    criterio: 'Cargas en aumento sin molestias al día siguiente.' },
  { n: 3, nombre: 'Gestos de fútbol', semanas: '9 a 12', desde: 9, hasta: 12,
    anade: 'Diez minutos en una sesión de fuerza: frenadas, cambios de dirección, giros controlados, saltos y aterrizajes.',
    criterio: 'Gestos a velocidad de partido sin síntomas.' },
];

const pad = (n) => String(n).padStart(2, '0');

/** 'YYYY-MM-DD' → día de la semana 0–6 (0 = domingo). */
export function diaSemana(fecha) {
  const [y, m, d] = fecha.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function sumarDias(fecha, n) {
  const [y, m, d] = fecha.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

export function diasEntre(a, b) {
  const p = (f) => { const [y, m, d] = f.split('-').map(Number); return Date.UTC(y, m - 1, d); };
  return Math.round((p(b) - p(a)) / 86400000);
}

/** Lunes de la semana de una fecha. */
export function lunesDe(fecha) {
  return sumarDias(fecha, -((diaSemana(fecha) + 6) % 7));
}

export function fechaLarga(fecha) {
  const [, m, d] = fecha.split('-').map(Number);
  return `${d} de ${MESES[m - 1]}`;
}

/** Fecha local 'YYYY-MM-DD' y hora 'HH:MM' de un instante en una zona horaria. */
export function fechaEnZona(instante, zona) {
  const f = new Intl.DateTimeFormat('en-CA', {
    timeZone: zona, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(instante);
  const g = (t) => f.find((p) => p.type === t).value;
  return { fecha: `${g('year')}-${g('month')}-${g('day')}`, hora: `${g('hour')}:${g('minute')}` };
}

/** Instante (ms) de una fecha y hora locales en una zona horaria. */
export function instanteDe(fecha, hora, zona) {
  const [y, m, d] = fecha.split('-').map(Number);
  const [hh, mm] = hora.split(':').map(Number);
  const objetivo = Date.UTC(y, m - 1, d, hh, mm);
  let t = objetivo;
  for (let i = 0; i < 3; i++) {
    const loc = fechaEnZona(new Date(t), zona);
    const [ly, lm, ld] = loc.fecha.split('-').map(Number);
    const [lh, lmi] = loc.hora.split(':').map(Number);
    const dif = objetivo - Date.UTC(ly, lm - 1, ld, lh, lmi);
    if (dif === 0) break;
    t += dif;
  }
  return t;
}

export function dosPartidos(config) {
  return Boolean(config.segundoPartido && config.segundoPartido.activo);
}

/** Día de la semana del segundo partido. Sin indicar, 3 días antes del principal. */
export function diaSegundo(config) {
  const d = (config.segundoPartido || {}).dia;
  return Number.isInteger(d) ? d : (config.partido.dia + 4) % 7;
}

/** Horas entre los dos partidos de la semana (la separación más corta), o null con uno solo. */
export function horasEntrePartidos(config) {
  if (!dosPartidos(config)) return null;
  const min = (h) => { if (!h) return null; const [a, b] = h.split(':').map(Number); return a * 60 + b; };
  const dias = (diaSegundo(config) - config.partido.dia + 7) % 7;
  const h1 = min(config.partido.hora); const h2 = min(config.segundoPartido.hora);
  const ida = dias * 24 + (h1 !== null && h2 !== null ? (h2 - h1) / 60 : 0);
  return Math.round(Math.min(ida, 168 - ida));
}

/** Tipo de actividad para una fecha. */
export function tipoDelDia(config, fecha) {
  const desde = (diaSemana(fecha) - config.partido.dia + 7) % 7;
  if (!dosPartidos(config)) return SEMANA_UN_PARTIDO[desde];
  const separacion = (diaSegundo(config) - config.partido.dia + 7) % 7;
  const plantilla = SEMANAS_DOS_PARTIDOS[separacion];
  if (plantilla) return plantilla[desde];
  // Partidos en días seguidos: el plan no lo contempla; se marca el segundo y se deja el resto.
  return desde === separacion ? 'partidoSuave' : SEMANA_UN_PARTIDO[desde];
}

export function esPartido(tipo) { return tipo === 'partido' || tipo === 'partidoSuave'; }

/** La rutina diaria se hace todos los días salvo los de partido y el de recuperación. */
export function tocaRutina(tipo) { return !esPartido(tipo) && tipo !== 'recuperar'; }

/** Semana del plan (1, 2, …) y fase. Semana 0 = todavía no ha empezado. */
export function faseDe(config, fecha) {
  const dias = diasEntre(config.inicio, fecha);
  if (dias < 0) return { semana: 0, fase: null, nombre: 'Sin empezar' };
  const semana = Math.floor(dias / 7) + 1;
  const fase = FASES.find((f) => semana >= f.desde && semana <= f.hasta) || null;
  return { semana, fase, nombre: fase ? fase.nombre : 'Mantenimiento' };
}

export function planDelDia(config, fecha) {
  const tipo = tipoDelDia(config, fecha);
  return {
    fecha, tipo, actividad: ACTIVIDADES[tipo], rutina: tocaRutina(tipo),
    laborable: diaSemana(fecha) >= 1 && diaSemana(fecha) <= 5,
    ...faseDe(config, fecha),
  };
}

function restarMinutos(hora, min) {
  const [h, m] = hora.split(':').map(Number);
  const t = Math.max(0, h * 60 + m - min);
  return `${pad(Math.floor(t / 60))}:${pad(t % 60)}`;
}

/** Avisos de una fecha: [{ hora, titulo, cuerpo, url, tag }] ordenados por hora. */
export function avisosDelDia(config, fecha) {
  const p = planDelDia(config, fecha);
  const a = config.avisos || {};
  const out = [];
  if (p.semana === 0) return out;
  if (p.rutina && a.rutina) {
    out.push({ hora: a.rutina, tag: 'rutina', url: '#/hoy', titulo: 'Rutina diaria',
      cuerpo: 'Unos 15 minutos: curl-up, plancha lateral, bird-dog, puente y estiramiento.' });
  }
  if (p.laborable && Array.isArray(a.pausas)) {
    for (const h of a.pausas) {
      out.push({ hora: h, tag: 'pausa', url: '#/hoy', titulo: 'Pausa de la silla',
        cuerpo: 'Levántate y camina 2 o 3 minutos.' });
    }
  }
  if (esPartido(p.tipo)) {
    if (a.partido) {
      out.push({ hora: a.partido, tag: 'partido', url: '#/partido', titulo: `Hoy hay ${p.actividad.titulo.toLowerCase()}`,
        cuerpo: 'Reserva 20 minutos para el calentamiento completo. Con dolor irradiado u hormigueo no se juega.' });
    }
    const horaPartido = p.tipo === 'partido' ? config.partido.hora : (config.segundoPartido || {}).hora;
    if (horaPartido) {
      out.push({ hora: restarMinutos(horaPartido, 30), tag: 'calentar', url: '#/partido', titulo: 'Hora de calentar',
        cuerpo: 'Carrera suave y movilidad, activación y gestos del partido antes de jugar.' });
    }
  } else if (a.sesion) {
    out.push({ hora: a.sesion, tag: 'sesion', url: '#/hoy', titulo: `Hoy toca: ${p.actividad.titulo.toLowerCase()}`,
      cuerpo: `${p.actividad.min} minutos. ${p.actividad.resumen}` });
  }
  if (diaSemana(fecha) === 0 && a.registro) {
    out.push({ hora: a.registro, tag: 'registro', url: '#/registro', titulo: 'Registro de la semana',
      cuerpo: 'Revisa las sesiones hechas y apunta si hubo síntomas.' });
  }
  return out.sort((x, y) => x.hora.localeCompare(y.hora));
}

/** Avisos cuyo instante cae en (desdeMs, hastaMs]. */
export function avisosEnVentana(config, desdeMs, hastaMs) {
  const zona = config.zonaHoraria;
  const out = [];
  let f = fechaEnZona(new Date(desdeMs), zona).fecha;
  const fin = fechaEnZona(new Date(hastaMs), zona).fecha;
  for (let i = 0; i < 4; i++) {
    for (const av of avisosDelDia(config, f)) {
      const t = instanteDe(f, av.hora, zona);
      if (t > desdeMs && t <= hastaMs) out.push({ ...av, fecha: f, instante: t });
    }
    if (f === fin) break;
    f = sumarDias(f, 1);
  }
  return out;
}
