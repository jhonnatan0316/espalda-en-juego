import {
  DIAS, ACTIVIDADES, FASES, planDelDia, tipoDelDia, esPartido, tocaRutina, dosPartidos, diaSegundo, horasEntrePartidos,
  sumarDias, lunesDe, fechaLarga, diaSemana, diasEntre,
} from './schedule.js';
import {
  EJERCICIOS, RUTINA, FUERZA, NORMAS, NORMAS_FUERZA, CALENTAMIENTO, VIDEOS_CALENTAMIENTO, EN_PARTIDO,
  URGENCIAS, EN_CRISIS, VUELTA, MEDICACION, EVITAR, FUENTES,
} from './data.js';
import { store, rutinasSemana, semanasSinSintomas, semanasCumplidas } from './store.js';
import { abrirPlayer, minutosDe } from './player.js';
import { FIGURAS, svgFigura } from './figuras.js';
import { recordatoriosSemanales, semanaEditable, textoDias, enlaceGoogle, ics } from './recordatorios.js';

const app = document.getElementById('app');
let config = null;
let instalar = null; // evento beforeinstallprompt

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = (n) => String(n).padStart(2, '0');
const hoy = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const mayus = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const lista = (items) => `<ul class="lista">${items.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`;
const enlaces = (pares) => `<p class="guias">${pares.map(([t, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(t)}</a>`).join('')}</p>`;
const MIN_RUTINA = minutosDe(RUTINA);

function aviso(texto) {
  const t = document.getElementById('toast');
  t.textContent = texto; t.hidden = false;
  clearTimeout(aviso.t); aviso.t = setTimeout(() => { t.hidden = true; }, 3200);
}

/* ---------- Vistas ---------- */

function textoFase(p) {
  if (p.semana === 0) return `El plan empieza el ${fechaLarga(config.inicio)}. Hasta entonces puedes probar la rutina.`;
  if (p.fase) return `Semana ${p.semana} de 12, fase ${p.fase.n}: ${p.fase.nombre.toLowerCase()}.`;
  return `Semana ${p.semana}, mantenimiento.`;
}

function vistaBienvenida() {
  return `
    <section class="bloque">
      <h1 class="titular">Antes de empezar</h1>
      <p>Los médicos que llevan el caso desaconsejan el fútbol y todo deporte de impacto. Esta herramienta no rebate esa indicación: ayuda a reducir el riesgo si se decide jugar igualmente.</p>
      <p>Guía y recuerda, pero no sustituye la valoración de un médico o un fisioterapeuta.</p>
      <h2>Urgencias el mismo día</h2>
      ${lista(URGENCIAS)}
      <p>El registro de sesiones y síntomas se guarda solo en este móvil.</p>
      <button class="btn" data-a="entendido">Entendido, ver el plan de hoy</button>
    </section>`;
}

function tarjetasSintoma(f) {
  const s = store.dia(f).sintoma;
  const t = (valor, clase, titulo, sub) => `
    <button class="tarjeta ${clase}" data-a="sintoma" data-v="${valor}" aria-pressed="${s === valor}">
      <span class="tarjeta-titulo">${titulo}</span><span class="tarjeta-sub">${sub}</span>
    </button>`;
  let nota = '';
  if (s === 'local') nota = '<p class="nota nota-amarilla">Una molestia muscular local es aceptable. Sigue con el plan y para si el dolor baja por la pierna.</p>';
  if (s === 'irradiado') {
    nota = `<div class="nota nota-roja"><p>Hoy no se juega ni se hace fuerza. Mantén paseos cortos y solo lo que no provoque dolor irradiado.</p>
      <p>Si es el inicio de una crisis, actívala para ver qué hacer.</p><a class="btn btn-rojo" href="#/crisis">Abrir crisis</a></div>`;
  }
  return `
    <section class="bloque">
      <h2>¿Cómo está hoy la espalda?</h2>
      <div class="tarjetas">
        ${t('no', 'verde', 'Sin síntomas', 'Nada que apuntar')}
        ${t('local', 'amarilla', 'Molestia local', 'Muscular, no baja')}
        ${t('irradiado', 'roja', 'Dolor irradiado', 'Baja por la pierna, hormigueo o pierdes fuerza')}
      </div>
      ${nota}
    </section>`;
}

function filaTarea({ hecho, titulo, meta, accion, clase = '' }) {
  return `
    <li class="tarea ${hecho ? 'hecha' : ''} ${clase}">
      <span class="marca" aria-hidden="true">${hecho ? '✓' : ''}</span>
      <div class="tarea-texto"><strong>${esc(titulo)}</strong><span>${esc(meta)}</span></div>
      ${accion}
    </li>`;
}

function vistaHoy() {
  if (!store.ajustes().visto) return vistaBienvenida();
  const f = hoy(); const p = planDelDia(config, f); const d = store.dia(f);
  if (store.todo.crisis) return vistaCrisis();
  const mal = d.sintoma === 'irradiado';
  const filas = [];
  if (p.rutina) {
    filas.push(filaTarea({
      hecho: d.rutina, titulo: 'Rutina diaria', meta: `Unos ${MIN_RUTINA} minutos, cinco ejercicios`,
      accion: d.rutina ? '<button class="btn-texto" data-a="rutina">Repetir</button>' : '<button class="btn btn-peq" data-a="rutina">Empezar</button>',
    }));
  }
  const act = p.actividad;
  if (esPartido(p.tipo)) {
    filas.push(filaTarea({
      hecho: d.sesion, clase: mal ? 'vetada' : 'cesped', titulo: act.titulo,
      meta: mal ? 'Hoy no se juega: hay síntomas irradiados' : '20 minutos de calentamiento antes de jugar',
      accion: mal ? '' : '<a class="btn btn-peq btn-claro" href="#/partido">Preparar</a>',
    }));
  } else if (p.tipo === 'fuerzaA' || p.tipo === 'fuerzaB') {
    const cual = p.tipo === 'fuerzaA' ? 'A' : 'B';
    filas.push(filaTarea({
      hecho: d.sesion, clase: mal ? 'vetada' : '', titulo: act.titulo,
      meta: mal ? 'Hoy no se hace fuerza: hay síntomas irradiados' : `${act.min} minutos, cuatro ejercicios`,
      accion: mal ? '' : (d.sesion ? `<button class="btn-texto" data-a="fuerza" data-v="${cual}">Repetir</button>` : `<button class="btn btn-peq" data-a="fuerza" data-v="${cual}">Empezar</button>`),
    }));
  } else {
    filas.push(filaTarea({
      hecho: d.sesion, titulo: act.titulo, meta: `${act.min} minutos`,
      accion: `<button class="btn-texto" data-a="sesion">${d.sesion ? 'Desmarcar' : 'Marcar hecha'}</button>`,
    }));
  }
  if (p.laborable) {
    const n = d.pausas || 0;
    filas.push(filaTarea({
      hecho: n >= 3, titulo: 'Pausas de la silla', meta: `Levántate 2 o 3 minutos cada 30 a 45. Hoy llevas ${n}`,
      accion: '<button class="btn-texto" data-a="pausa">Sumar una</button>',
    }));
  }
  let notaFase = '';
  if (p.fase && (p.tipo === 'fuerzaA' || p.tipo === 'fuerzaB')) notaFase = `<p class="nota">En esta fase: ${esc(p.fase.anade)}</p>`;
  else if (!esPartido(p.tipo)) notaFase = `<p class="nota">${esc(act.resumen)}</p>`;

  return `
    <header class="cabecera-dia">
      <h1 class="titular">${mayus(DIAS[diaSemana(f)])}</h1>
      <p>${fechaLarga(f)}. ${textoFase(p)}</p>
    </header>
    ${instalar ? '<p class="nota">Instala la web en el móvil para abrirla como una app. <button class="btn-texto" data-a="instalar">Instalar</button></p>' : ''}
    ${tarjetasSintoma(f)}
    <section class="bloque">
      <h2>Hoy toca</h2>
      <ul class="tareas">${filas.join('')}</ul>
      ${notaFase}
    </section>
    <p class="pie-enlace"><a href="#/semana">Ver la semana completa</a><a href="#/recordatorios">Poner recordatorios en el móvil</a></p>`;
}

function vistaSemana() {
  const f = hoy(); const lunes = lunesDe(f); const p = planDelDia(config, f);
  const filas = [];
  for (let i = 0; i < 7; i++) {
    const dia = sumarDias(lunes, i); const tipo = tipoDelDia(config, dia); const d = store.dia(dia);
    const partes = [];
    if (tocaRutina(tipo)) partes.push(`<span class="${d.rutina ? 'ok' : ''}">Rutina diaria</span>`);
    partes.push(`<span class="${d.sesion ? 'ok' : ''}">${esc(ACTIVIDADES[tipo].titulo)}, ${ACTIVIDADES[tipo].min} min</span>`);
    filas.push(`
      <li class="dia ${dia === f ? 'es-hoy' : ''} ${esPartido(tipo) ? 'cesped' : ''}">
        <span class="dia-nombre">${mayus(DIAS[diaSemana(dia)])}${dia === f ? ' <em>hoy</em>' : ''}</span>
        <span class="dia-plan">${partes.join('')}</span>
      </li>`);
  }
  const fases = FASES.map((x) => `
    <li class="fase ${p.fase && p.fase.n === x.n ? 'actual' : ''}">
      <h3>Fase ${x.n}: ${esc(x.nombre)} <span>semanas ${x.semanas}</span></h3>
      <p>${esc(x.anade)}</p>
      <p class="criterio">Para avanzar: ${esc(x.criterio)}</p>
    </li>`).join('');

  const sin = semanasSinSintomas(config, f); const cumplidas = semanasCumplidas(f); const horas = horasEntrePartidos(config);
  const cond = (ok, texto, detalle) => `<li class="cond ${ok === true ? 'si' : ok === false ? 'no' : ''}"><span class="marca" aria-hidden="true">${ok === true ? '✓' : ''}</span><div><strong>${texto}</strong><span>${detalle}</span></div></li>`;
  return `
    <header class="cabecera-dia"><h1 class="titular">Semana</h1><p>${textoFase(p)}</p></header>
    <section class="bloque">
      <ul class="dias">${filas.join('')}</ul>
      <p class="nota">La fuerza nunca va el día antes de un partido. Si una semana solo cabe una cosa, se mantiene la rutina diaria.</p>
    </section>
    <section class="bloque">
      <h2>Fases</h2>
      <ol class="fases">${fases}</ol>
      <p class="nota">Después de la semana 12, mantenimiento sin fecha de fin: el efecto protector del ejercicio se pierde al abandonarlo.</p>
    </section>
    <section class="bloque">
      <h2>Segundo día de fútbol</h2>
      <p>${dosPartidos(config) ? 'El plan está configurado con dos partidos por semana. Estas son las condiciones que pedía antes de añadir el segundo; las que no se cumplen son riesgo asumido.' : 'Se plantea desde la semana 13 y solo si se cumplen todas las condiciones.'}</p>
      <ul class="conds">
        ${cond(p.semana >= 13, 'Las tres fases completadas', `Vas por la semana ${p.semana}; hace falta la 13`)}
        ${cond(sin >= 12, 'Doce semanas seguidas sin dolor irradiado, hormigueo ni pérdida de fuerza', `Llevas ${sin}, según lo registrado`)}
        ${cond(cumplidas === 4, 'Rutina hecha al menos 5 días por semana', `${cumplidas} de las últimas 4 semanas`)}
        ${horas === null ? cond(null, 'Al menos 48 horas entre partidos, mejor 72', 'Depende del calendario de partidos') : cond(horas >= 48, 'Al menos 48 horas entre partidos, mejor 72', `Entre tus partidos hay ${horas} horas`)}
        ${cond(null, 'El segundo partido es el suave', 'Césped antes que pista, 45 a 60 minutos, sin competición')}
      </ul>
      <p class="nota">Se vuelve a un solo día si aparece una crisis o molestias irradiadas dos semanas seguidas. Más partidos son más giros y frenadas sobre los discos afectados; ningún estudio cuantifica ese riesgo.</p>
    </section>`;
}

/** Tira de ilustraciones de un ejercicio; cada una se abre a pantalla completa. */
function secuencia(id) {
  const e = EJERCICIOS[id]; const cuadros = FIGURAS[id] || [];
  return `<div class="secuencia">${cuadros.map((fr, i) => `
    <button class="cuadro" data-a="ver" data-v="${id}" data-i="${i}" aria-label="Ampliar el paso ${i + 1} de ${cuadros.length}">
      ${svgFigura(fr, esc(`${e.nombre}, paso ${i + 1}`))}
      <span class="cuadro-n">${i + 1}</span>
      <span class="cuadro-texto">${esc(fr.texto)}</span>
    </button>`).join('')}</div>`;
}

function filaEjercicio(id) {
  const e = EJERCICIOS[id]; const fr = (FIGURAS[id] || []).at(-1);
  return `<li><a class="ejercicio" href="#/ejercicio/${id}">
    ${fr ? `<span class="mini">${svgFigura(fr, '')}</span>` : ''}
    <span class="ejercicio-texto"><strong>${esc(e.nombre)}</strong><span>${esc(e.dosis)}</span></span></a></li>`;
}

function vistaEjercicios() {
  return `
    <header class="cabecera-dia"><h1 class="titular">Ejercicios</h1><p>Cada uno con su dosis, las imágenes de cada paso y un vídeo de apoyo.</p></header>
    <section class="bloque">
      <h2>Rutina diaria</h2>
      <ul class="ejercicios">${RUTINA.map(filaEjercicio).join('')}</ul>
      <button class="btn" data-a="rutina">Empezar la rutina, ${MIN_RUTINA} min</button>
    </section>
    <section class="bloque">
      <h2>Fuerza A</h2>
      <ul class="ejercicios">${FUERZA.A.map(filaEjercicio).join('')}</ul>
      <button class="btn btn-borde" data-a="fuerza" data-v="A">Empezar fuerza A</button>
    </section>
    <section class="bloque">
      <h2>Fuerza B</h2>
      <ul class="ejercicios">${FUERZA.B.map(filaEjercicio).join('')}</ul>
      <button class="btn btn-borde" data-a="fuerza" data-v="B">Empezar fuerza B</button>
    </section>
    <section class="bloque">
      <h2>Qué evitar</h2>
      ${lista(EVITAR)}
    </section>
    <p class="pie-enlace"><a href="#/partido">Calentamiento del día de partido</a></p>`;
}

function vistaEjercicio(id) {
  const e = EJERCICIOS[id];
  if (!e) return vistaEjercicios();
  const deFuerza = FUERZA.A.includes(id) || FUERZA.B.includes(id);
  return `
    <p class="volver"><a href="#/ejercicios">Ejercicios</a></p>
    <header class="cabecera-dia"><h1 class="titular titular-peq">${esc(e.nombre)}</h1><p>${esc(e.dosis)}</p></header>
    <section class="bloque">
      <h2>Cómo se hace</h2>
      ${secuencia(id)}
      <p class="nota">Toca una imagen para ampliarla y pasar de una a otra.</p>
      <p>${esc(e.como)}</p>
      <h2>Para qué</h2>
      <p>${esc(e.para)}</p>
      <h2>Si la imagen no basta</h2>
      ${enlaces(e.guias)}
      <button class="btn" data-a="practicar" data-v="${id}">Practicar con temporizador</button>
    </section>
    <section class="bloque">
      <h2>Normas de ejecución</h2>
      ${lista(deFuerza ? NORMAS_FUERZA : NORMAS)}
    </section>`;
}

function vistaPartido() {
  const f = hoy(); const d = store.dia(f); const hechos = d.calentamiento || [];
  const mal = d.sintoma === 'irradiado';
  const pasos = CALENTAMIENTO.map(([t, min, txt], i) => `
    <li><label class="paso"><input type="checkbox" data-a="calentar" data-v="${i}" ${hechos[i] ? 'checked' : ''}>
      <span><strong>${esc(t)}, ${esc(min)}</strong>${esc(txt)}</span></label></li>`).join('');
  return `
    <header class="cabecera-dia cesped-cabecera"><h1 class="titular">Día de partido</h1><p>No se toca el balón en juego sin 15 a 20 minutos de calentamiento.</p></header>
    ${mal ? '<div class="nota nota-roja"><p>Hoy has apuntado síntomas irradiados: no se juega.</p></div>' : ''}
    <section class="bloque">
      <h2>Calentamiento</h2>
      <ol class="pasos">${pasos}</ol>
      ${enlaces(VIDEOS_CALENTAMIENTO)}
    </section>
    <section class="bloque"><h2>Durante el partido</h2>${lista(EN_PARTIDO)}</section>
    <section class="bloque">
      <h2>Después</h2>
      <p>De 5 a 10 minutos caminando antes de sentarse en el coche o el sofá.</p>
      <button class="btn" data-a="sesion">${d.sesion ? 'Desmarcar el partido' : 'Marcar partido jugado'}</button>
    </section>`;
}

function vistaRegistro() {
  const f = hoy(); const lunes = lunesDe(f);
  const celdas = [];
  for (let i = -21; i < 7; i++) {
    const dia = sumarDias(lunes, i); const d = store.dia(dia); const futuro = dia > f;
    const etiqueta = `${fechaLarga(dia)}: ${d.rutina ? 'rutina hecha' : 'sin rutina'}${d.sintoma === 'irradiado' ? ', dolor irradiado' : d.sintoma === 'local' ? ', molestia local' : ''}`;
    celdas.push(`<li class="celda ${d.rutina ? 'con-rutina' : ''} ${d.sintoma || ''} ${futuro ? 'futuro' : ''} ${dia === f ? 'es-hoy' : ''}" aria-label="${esc(etiqueta)}"><span>${Number(dia.slice(8))}</span>${d.sesion ? '<i></i>' : ''}</li>`);
  }
  const crisis = store.todo.historial.slice().reverse().map((c) => `
    <li><strong>${fechaLarga(c.inicio)} a ${fechaLarga(c.fin)}</strong><span>${diasEntre(c.inicio, c.fin) + 1 === 1 ? '1 día' : `${diasEntre(c.inicio, c.fin) + 1} días`}${c.desencadenante ? `. ${esc(c.desencadenante)}` : ''}</span></li>`).join('');
  return `
    <header class="cabecera-dia"><h1 class="titular">Registro</h1><p>Lo que se apunta aquí decide con datos si se pasa de fase o se añade un partido.</p></header>
    <section class="bloque cifras">
      <p><strong>${rutinasSemana(f)}</strong> ${rutinasSemana(f) === 1 ? 'día' : 'días'} con rutina esta semana</p>
      <p><strong>${semanasSinSintomas(config, f)}</strong> semanas seguidas sin síntomas irradiados</p>
    </section>
    <section class="bloque">
      <h2>Últimas cuatro semanas</h2>
      <ol class="rejilla-cab" aria-hidden="true">${['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((x) => `<li>${x}</li>`).join('')}</ol>
      <ol class="rejilla">${celdas.join('')}</ol>
      <p class="leyenda"><span class="ley ley-rutina"></span>Rutina hecha <span class="ley ley-sesion"></span>Sesión o partido <span class="ley ley-local"></span>Molestia local <span class="ley ley-irr"></span>Dolor irradiado</p>
    </section>
    <section class="bloque">
      <h2>Crisis anteriores</h2>
      ${crisis ? `<ul class="historial">${crisis}</ul>` : '<p>Ninguna registrada. Cuando empiece una, actívala en Crisis para que quede apuntada con su fecha y su desencadenante.</p>'}
    </section>`;
}

function vistaCrisis() {
  const c = store.todo.crisis; const f = hoy(); const tel = store.ajustes().telefono;
  const urg = `
    <section class="bloque urgencias">
      <h2>Urgencias el mismo día</h2>
      ${lista(URGENCIAS)}
    </section>`;
  const medic = `
    <section class="bloque">
      <h2>Medicación e infiltración</h2>
      <p>La decide el médico y no se cambia por cuenta propia. Puntos para comentar en la clínica del dolor:</p>
      <dl class="medic">${MEDICACION.map(([t, x]) => `<dt>${esc(t)}</dt><dd>${esc(x)}</dd>`).join('')}</dl>
    </section>`;
  if (!c) {
    return `
      <header class="cabecera-dia"><h1 class="titular">Crisis</h1><p>Si llega una, se para el fútbol y la fuerza el mismo día, pero no el movimiento.</p></header>
      ${urg}
      <section class="bloque">
        <h2>Empezar una crisis</h2>
        <p>Al activarla, la pantalla de hoy cambia al plan de crisis y la fecha queda registrada.</p>
        <label class="campo">Qué la desencadenó, si se sabe
          <input type="text" id="desencadenante" maxlength="120" placeholder="Un giro en un partido, cargar peso…"></label>
        <button class="btn btn-rojo" data-a="crisis-on">Activar la crisis</button>
      </section>
      <section class="bloque"><h2>Qué se hace durante una crisis</h2>${lista(EN_CRISIS)}</section>
      ${medic}`;
  }
  const dias = diasEntre(c.inicio, f) + 1;
  const pasos = VUELTA.map((t, i) => `
    <li><label class="paso"><input type="checkbox" data-a="vuelta" data-v="${i}" ${c.pasos[i] ? 'checked' : ''}><span>${esc(t)}</span></label></li>`).join('');
  return `
    <header class="cabecera-dia cabecera-roja"><h1 class="titular">Crisis, día ${dias}</h1>
      <p>Empezó el ${fechaLarga(c.inicio)}${c.desencadenante ? `. ${esc(c.desencadenante)}` : ''}.${dias > 42 ? ' Han pasado más de 6 semanas: toca consulta médica si no hay mejoría clara.' : ''}</p></header>
    ${urg}
    <section class="bloque">
      <h2>Hoy</h2>
      ${lista(EN_CRISIS)}
      ${tel ? `<a class="btn btn-borde" href="tel:${esc(tel.replace(/[^\d+]/g, ''))}">Llamar a la clínica del dolor</a>` : '<p class="nota">Puedes guardar el teléfono de la clínica del dolor en Ajustes para llamar desde aquí.</p>'}
    </section>
    <section class="bloque">
      <h2>Vuelta al fútbol, paso a paso</h2>
      <p>Cada paso exige una sesión sin síntomas ese día ni al siguiente. No se saltan aunque el dolor haya desaparecido.</p>
      <ol class="pasos">${pasos}</ol>
    </section>
    ${medic}
    <section class="bloque">
      <h2>Terminar la crisis</h2>
      <p>Cuando la vida diaria vuelva a ser sin dolor irradiado. Quedará guardada en el registro con su duración.</p>
      <button class="btn btn-borde" data-a="crisis-off">La crisis ha terminado</button>
    </section>`;
}

function vistaAjustes() {
  const a = store.ajustes(); const av = config.avisos || {};
  const repo = config.repositorio;
  return `
    <header class="cabecera-dia"><h1 class="titular">Ajustes</h1></header>
    ${instalar ? '<section class="bloque"><h2>Instalar</h2><p>Instalada en la pantalla de inicio se abre como una app y funciona sin conexión.</p><button class="btn" data-a="instalar">Instalar en este móvil</button></section>' : ''}
    <section class="bloque">
      <h2>Recordatorios</h2>
      <p>Los avisos los da el calendario del móvil, a su hora y sin depender de internet. Se añaden una vez y se repiten cada semana.</p>
      <a class="btn" href="#/recordatorios">Poner recordatorios</a>
    </section>
    <section class="bloque">
      <h2>Plan configurado</h2>
      <dl class="datos">
        <dt>Inicio del plan</dt><dd>${fechaLarga(config.inicio)} de ${config.inicio.slice(0, 4)}</dd>
        <dt>Día de partido</dt><dd>${mayus(DIAS[config.partido.dia])}${config.partido.hora ? `, ${esc(config.partido.hora)}` : ''}</dd>
        <dt>Segundo partido</dt><dd>${dosPartidos(config) ? `${mayus(DIAS[diaSegundo(config)])}${config.segundoPartido.hora ? `, ${esc(config.segundoPartido.hora)}` : ''}` : 'No'}</dd>
        <dt>Hora de la rutina</dt><dd>${esc(av.rutina || 'No')}</dd>
        <dt>Pausas de la silla</dt><dd>${esc((av.pausas || []).join(', ') || 'No')}</dd>
        <dt>Sesión del día</dt><dd>${esc(av.sesion || 'No')}</dd>
      </dl>
      <p class="nota">Estos datos están en el archivo config.json del repositorio. Si cambias días u horas, borra los recordatorios antiguos del calendario y añade los nuevos.</p>
      <a class="btn btn-borde" target="_blank" rel="noopener" href="https://github.com/${esc(repo)}/edit/main/config.json">Editar en GitHub</a>
    </section>
    <section class="bloque">
      <h2>En este móvil</h2>
      <label class="campo">Teléfono de la clínica del dolor
        <input type="tel" id="telefono" value="${esc(a.telefono)}" placeholder="Para llamar desde la pantalla de crisis"></label>
      <label class="conmutador"><input type="checkbox" data-a="sonido" ${a.sonido ? 'checked' : ''}><span>Pitidos en el temporizador</span></label>
    </section>
    <section class="bloque">
      <h2>Datos</h2>
      <p>El registro vive solo en este móvil. Guarda una copia de vez en cuando.</p>
      <div class="fila-btn"><button class="btn btn-borde" data-a="exportar">Guardar copia</button>
      <label class="btn btn-borde">Cargar copia<input type="file" id="importar" accept="application/json,.json" hidden></label></div>
      <button class="btn-texto peligro" data-a="borrar">Borrar todo el registro</button>
    </section>
    <section class="bloque">
      <h2>Acerca de</h2>
      <p>Este plan reduce el riesgo; no lo elimina. Está elaborado a partir de estudios publicados, sin exploración física ni imágenes. No sustituye la valoración de un médico o un fisioterapeuta.</p>
      <p>Los vídeos enlazados se eligieron por su título. Si alguno contradice la descripción de la web, manda la descripción.</p>
      ${enlaces(FUENTES)}
    </section>`;
}

const diasAbiertos = new Set();

function vistaRecordatorios() {
  const horas = store.ajustes().horas || {}; const puestos = store.ajustes().recordatorios || {};
  const lista = recordatoriosSemanales(config, hoy(), horas);
  const hayCambios = Object.values(horas).some((d) => Object.keys(d).length);

  const dias = semanaEditable(config, hoy(), horas).map(({ dia, recordatorios }) => {
    const activos = recordatorios.filter((r) => r.activo).length;
    const filas = recordatorios.map((r) => `
      <li class="rec-fila ${r.activo ? '' : 'apagado'}">
        <label class="rec-activo"><input type="checkbox" data-a="rec-activo" data-dia="${dia}" data-v="${esc(r.clave)}" ${r.activo ? 'checked' : ''}>
          <span>${esc(r.titulo)}${r.hora !== r.porDefecto ? ` <em>antes ${esc(r.porDefecto)}</em>` : ''}</span></label>
        <input type="time" class="rec-hora" data-a="rec-hora" data-dia="${dia}" data-v="${esc(r.clave)}" value="${esc(r.hora)}"
          aria-label="Hora de ${esc(r.titulo)} el ${DIAS[dia]}" ${r.activo ? '' : 'disabled'}>
      </li>`).join('');
    return `
      <details class="rec-dia" data-dia="${dia}" ${diasAbiertos.has(dia) ? 'open' : ''}>
        <summary><strong>${mayus(DIAS[dia])}</strong><span>${activos === recordatorios.length ? `${activos} recordatorios` : `${activos} de ${recordatorios.length} activos`}</span></summary>
        <ul>${filas}</ul>
      </details>`;
  }).join('');

  const filas = lista.map((r) => `
    <li class="recordatorio ${puestos[r.id] ? 'puesto' : ''}">
      <div><strong>${esc(r.titulo)}</strong><span>${mayus(textoDias(r.dias))}, a las ${esc(r.hora)}</span></div>
      <a class="btn btn-peq ${puestos[r.id] ? 'btn-borde' : ''}" data-a="recordado" data-v="${esc(r.id)}" target="_blank" rel="noopener"
        href="${esc(enlaceGoogle(r, config.url))}">${puestos[r.id] ? 'Añadido' : 'Añadir'}</a>
    </li>`).join('');

  return `
    <p class="volver"><a href="#/ajustes">Ajustes</a></p>
    <header class="cabecera-dia"><h1 class="titular titular-peq">Recordatorios</h1>
      <p>El calendario del móvil avisa a la hora, cada semana, aunque la web esté cerrada.</p></header>
    <section class="bloque">
      <h2>1. Elige las horas</h2>
      <p>Abre un día para cambiar la hora de cada recordatorio o quitar los que no quieras. Cada día puede tener horas distintas.</p>
      <div class="rec-dias">${dias}</div>
      ${hayCambios ? '<button class="btn-texto" data-a="rec-reset">Volver a las horas originales</button>' : ''}
      <p class="nota">Para cambiar la hora solo una semana, hazlo en el calendario: abre ese evento, cambia la hora y elige «solo este evento».</p>
    </section>
    <section class="bloque">
      <h2>2. Llévalos al calendario</h2>
      <p>Con estas horas salen ${lista.length} recordatorios semanales. Descarga el archivo y ábrelo con el calendario: trae todos con su aviso a la hora exacta.</p>
      <button class="btn" data-a="ics">Descargar los ${lista.length} recordatorios</button>
      <p class="nota">Si el calendario del móvil no lo abre, impórtalo desde calendar.google.com en un ordenador: Configuración, Importar y exportar.</p>
      <h2>O uno a uno</h2>
      <p>Cada botón abre Google Calendar con el evento ya relleno y repetido cada semana. Solo hay que guardar.</p>
      <ul class="recordatorios">${filas}</ul>
      <p class="nota">Antes de guardar, revisa la notificación del evento: para que suene a la hora, elige «A la hora del evento».</p>
      <p class="nota">Si cambias horas después de haberlos añadido, borra del calendario los antiguos y añade los nuevos: no se actualizan solos.</p>
    </section>
    <section class="bloque">
      <h2>Si prefieres la alarma del reloj</h2>
      <p>Una web no puede crear alarmas en la app Reloj de Android; hay que ponerlas a mano. Estas son las horas:</p>
      <ul class="lista">${lista.map((r) => `<li>${esc(r.hora)}, ${textoDias(r.dias)}: ${esc(r.titulo)}</li>`).join('')}</ul>
    </section>`;
}

/** Guarda un cambio de hora o de activación de un recordatorio en un día de la semana. */
function cambiarRecordatorio(t, cambio) {
  const dia = Number(t.dataset.dia); const clave = t.dataset.v;
  const horas = structuredClone(store.ajustes().horas || {});
  const actual = { ...((horas[dia] || {})[clave] || {}), ...cambio };
  for (const k of Object.keys(actual)) if (actual[k] === undefined || actual[k] === false) delete actual[k];
  horas[dia] = { ...(horas[dia] || {}) };
  if (Object.keys(actual).length) horas[dia][clave] = actual; else delete horas[dia][clave];
  if (!Object.keys(horas[dia]).length) delete horas[dia];
  store.ajustes({ horas });
  pintar(true);
}

/* ---------- Navegación ---------- */

const RUTAS = { hoy: vistaHoy, semana: vistaSemana, ejercicios: vistaEjercicios, partido: vistaPartido, registro: vistaRegistro, crisis: vistaCrisis, ajustes: vistaAjustes, recordatorios: vistaRecordatorios };

function pintar(mantenerScroll = false) {
  const [, ruta = 'hoy', arg] = location.hash.split('/');
  const y = window.scrollY;
  app.innerHTML = ruta === 'ejercicio' ? vistaEjercicio(arg) : (RUTAS[ruta] || vistaHoy)();
  const activa = ruta === 'ejercicio' ? 'ejercicios' : ruta === 'partido' ? 'hoy' : ruta;
  document.querySelectorAll('nav a').forEach((a) => a.toggleAttribute('aria-current', a.dataset.ruta === activa));
  document.body.classList.toggle('en-crisis', Boolean(store.todo.crisis));
  window.scrollTo(0, mantenerScroll ? y : 0);
}

function empezar(titulo, ids, alTerminar, finTexto) {
  abrirPlayer({ titulo, ids, finTexto, alTerminar: () => { alTerminar && alTerminar(); pintar(); }, alSalir: () => pintar(true) });
}

/* ---------- Visor de ilustraciones ---------- */

function abrirVisor(id, indice) {
  const e = EJERCICIOS[id]; const cuadros = FIGURAS[id]; const visor = document.getElementById('visor');
  visor.innerHTML = `
    <div class="visor-cab"><strong>${esc(e.nombre)}</strong><span class="visor-n"></span>
      <button class="visor-cerrar" data-vz="cerrar" aria-label="Cerrar">Cerrar</button></div>
    <div class="visor-pista">${cuadros.map((fr, i) => `
      <figure class="visor-paso">${svgFigura(fr, esc(`${e.nombre}, paso ${i + 1}`))}
        <figcaption><span class="cuadro-n">${i + 1}</span>${esc(fr.texto)}</figcaption></figure>`).join('')}</div>
    <div class="visor-pie"><button class="btn btn-borde" data-vz="antes">Anterior</button><button class="btn" data-vz="despues">Siguiente</button></div>
    <p class="visor-videos">${e.guias.map(([t, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(t)}</a>`).join('')}</p>`;
  const pista = visor.querySelector('.visor-pista'); const n = visor.querySelector('.visor-n');
  const actual = () => Math.round(pista.scrollLeft / pista.clientWidth);
  const ir = (i) => pista.scrollTo({ left: Math.max(0, Math.min(cuadros.length - 1, i)) * pista.clientWidth, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  const pintarN = () => {
    const i = actual(); n.textContent = `${i + 1} de ${cuadros.length}`;
    visor.querySelector('[data-vz="antes"]').disabled = i === 0;
    visor.querySelector('[data-vz="despues"]').disabled = i === cuadros.length - 1;
  };
  const cerrar = () => { visor.hidden = true; visor.innerHTML = ''; document.body.classList.remove('con-player'); document.removeEventListener('keydown', tecla); };
  const tecla = (ev) => { if (ev.key === 'Escape') cerrar(); if (ev.key === 'ArrowRight') ir(actual() + 1); if (ev.key === 'ArrowLeft') ir(actual() - 1); };
  visor.onclick = (ev) => {
    const b = ev.target.closest('[data-vz]'); if (!b) return;
    if (b.dataset.vz === 'cerrar') cerrar(); else ir(actual() + (b.dataset.vz === 'despues' ? 1 : -1));
  };
  pista.addEventListener('scroll', pintarN, { passive: true });
  document.addEventListener('keydown', tecla);
  visor.hidden = false; document.body.classList.add('con-player');
  pista.scrollLeft = indice * pista.clientWidth; pintarN();
  visor.querySelector('.visor-cerrar').focus();
}

/* ---------- Acciones ---------- */

const ACCIONES = {
  entendido() { store.ajustes({ visto: true }); pintar(); },
  sintoma(b) { const f = hoy(); const v = b.dataset.v; store.marcar(f, { sintoma: store.dia(f).sintoma === v ? undefined : v }); pintar(true); },
  rutina() { const f = hoy(); empezar('Rutina diaria', RUTINA, () => store.marcar(f, { rutina: true }), 'Queda apuntada en el registro de hoy.'); },
  fuerza(b) { const f = hoy(); const cual = b.dataset.v; const toca = tipoDelDia(config, f) === `fuerza${cual}`; empezar(`Fuerza ${cual}`, FUERZA[cual], () => { if (toca) store.marcar(f, { sesion: true }); }, toca ? 'Queda apuntada en el registro de hoy.' : ''); },
  practicar(b) { empezar(EJERCICIOS[b.dataset.v].nombre, [b.dataset.v]); },
  ver(b) { abrirVisor(b.dataset.v, Number(b.dataset.i)); },
  sesion() { const f = hoy(); store.marcar(f, { sesion: !store.dia(f).sesion }); pintar(true); },
  pausa() { const f = hoy(); store.marcar(f, { pausas: (store.dia(f).pausas || 0) + 1 }); pintar(true); },
  calentar(b) { const f = hoy(); const c = (store.dia(f).calentamiento || []).slice(); c[Number(b.dataset.v)] = b.checked; store.marcar(f, { calentamiento: c }); },
  vuelta(b) { store.pasoCrisis(Number(b.dataset.v), b.checked); },
  'crisis-on'() { store.iniciarCrisis(hoy(), document.getElementById('desencadenante').value.trim()); location.replace('#/hoy'); pintar(); },
  'crisis-off'() { if (confirmar(this)) { store.terminarCrisis(hoy()); aviso('Crisis guardada en el registro.'); pintar(); } },
  sonido(b) { store.ajustes({ sonido: b.checked }); },
  salir() {
    window.close();
    // Si el sistema no deja cerrarla, la app sigue aquí: se avisa de cómo salir.
    const instalada = matchMedia('(display-mode: standalone)').matches;
    setTimeout(() => aviso(instalada
      ? 'No se pudo cerrar sola. Sal con el gesto de inicio del móvil.'
      : 'Una pestaña del navegador no se cierra desde la web. Ciérrala tú o instala la app.'), 600);
  },
  recordado(b) { store.ajustes({ recordatorios: { ...(store.ajustes().recordatorios || {}), [b.dataset.v]: true } }); setTimeout(() => pintar(true), 600); },
  'rec-hora'(t) {
    const porDefecto = semanaEditable(config, hoy(), {}).find((d) => d.dia === Number(t.dataset.dia)).recordatorios.find((r) => r.clave === t.dataset.v).hora;
    if (!/^\d\d:\d\d$/.test(t.value)) return pintar(true);
    cambiarRecordatorio(t, { h: t.value === porDefecto ? undefined : t.value });
  },
  'rec-activo'(t) { cambiarRecordatorio(t, { off: !t.checked }); },
  'rec-reset'() { store.ajustes({ horas: {} }); aviso('Horas originales restauradas.'); pintar(true); },
  ics() {
    const lista = recordatoriosSemanales(config, hoy(), store.ajustes().horas);
    const url = URL.createObjectURL(new Blob([ics(lista, config.url)], { type: 'text/calendar' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: 'espalda-en-juego-recordatorios.ics' });
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
    aviso('Archivo descargado. Ábrelo con el calendario.');
  },
  async instalar() { if (!instalar) return; instalar.prompt(); await instalar.userChoice; instalar = null; pintar(true); },
  exportar() {
    const url = URL.createObjectURL(new Blob([store.exportar()], { type: 'application/json' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: `espalda-en-juego-${hoy()}.json` });
    document.body.append(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  },
  borrar(b) { if (confirmar(b)) { store.borrar(); aviso('Registro borrado.'); location.replace('#/hoy'); pintar(); } },
};

// Confirmación en dos toques, sin diálogos del navegador.
function confirmar(boton) {
  const b = boton instanceof Element ? boton : document.querySelector('[data-a="crisis-off"]');
  if (b.dataset.seguro) return true;
  b.dataset.seguro = '1'; b.dataset.texto = b.textContent; b.textContent = 'Toca otra vez para confirmar';
  setTimeout(() => { if (b.isConnected) { delete b.dataset.seguro; b.textContent = b.dataset.texto; } }, 4000);
  return false;
}

document.addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-a]');
  if (b && b.tagName !== 'INPUT') { const fn = ACCIONES[b.dataset.a]; if (fn) fn.call(b, b); }
  // Los enlaces internos sustituyen la página en vez de apilarla: con una sola entrada en el
  // historial, el botón Salir puede cerrar la app y el gesto de atrás del móvil sale de ella.
  const enlace = ev.target.closest('a[href^="#/"]');
  if (enlace && !enlace.target) { ev.preventDefault(); location.replace(enlace.getAttribute('href')); }
});
document.addEventListener('change', (ev) => {
  const t = ev.target;
  if (t.id === 'telefono') return store.ajustes({ telefono: t.value.trim() });
  if (t.id === 'importar' && t.files[0]) {
    return t.files[0].text().then((txt) => { store.importar(txt); aviso('Copia cargada.'); pintar(); }).catch(() => aviso('Ese archivo no es una copia válida.'));
  }
  if (t.dataset.a && ACCIONES[t.dataset.a]) ACCIONES[t.dataset.a].call(t, t);
});
// Recuerda qué días están desplegados en Recordatorios para no cerrarlos al repintar.
document.addEventListener('toggle', (ev) => {
  const d = ev.target; if (!d.classList || !d.classList.contains('rec-dia')) return;
  const dia = Number(d.dataset.dia); if (d.open) diasAbiertos.add(dia); else diasAbiertos.delete(dia);
}, true);
window.addEventListener('hashchange', () => pintar());
window.addEventListener('beforeinstallprompt', (ev) => { ev.preventDefault(); instalar = ev; if (config) pintar(true); });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && config && document.getElementById('player').hidden) pintar(true); });

async function arrancar() {
  try {
    config = await (await fetch('config.json', { cache: 'no-cache' })).json();
  } catch {
    app.innerHTML = '<section class="bloque"><h1 class="titular">Sin conexión</h1><p>No se pudo cargar la configuración del plan. Abre la web con conexión una vez y quedará guardada para usarla sin red.</p></section>';
    return;
  }
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  // Cuando llega una versión nueva de la web, se recarga sola una vez para mostrarla.
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (sessionStorage.getItem('recargada')) return;
      sessionStorage.setItem('recargada', '1'); location.reload();
    });
  }
  pintar();
}
arrancar();
