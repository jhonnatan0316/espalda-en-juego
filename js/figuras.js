// Ilustraciones esquemáticas de cada ejercicio, dibujadas como SVG.
// Son dibujos propios: muestran la posición, no sustituyen a una corrección de técnica.
// Ángulos en grados: 0 = hacia la derecha, 90 = hacia abajo, -90 = hacia arriba, 180 = izquierda.

const L = { torso: 46, cabeza: 15, brazo: 24, antebrazo: 22, muslo: 38, pierna: 38, pie: 11 };
const SUELO = 158;
const rad = (g) => (g * Math.PI) / 180;
const mover = ([x, y], ang, largo) => [x + largo * Math.cos(rad(ang)), y + largo * Math.sin(rad(ang))];
const f = (n) => Math.round(n * 10) / 10;

/** Convierte una pose por ángulos en puntos. Cada pose puede traer puntos ya calculados. */
function puntos(p) {
  if (p.pts) return p.pts;
  const cadera = p.cadera;
  const hombro = mover(cadera, p.torso, L.torso);
  const cabeza = mover(hombro, p.cabeza ?? p.torso, L.cabeza);
  const piernas = p.piernas.map((q) => {
    const rodilla = mover(cadera, q.m, q.lm ?? L.muslo);
    const tobillo = mover(rodilla, q.p, q.lp ?? L.pierna);
    return { rodilla, tobillo, pie: q.pie === undefined ? null : mover(tobillo, q.pie, L.pie) };
  });
  const brazos = (p.brazos || []).map((q) => {
    const codo = mover(hombro, q.b, q.lb ?? L.brazo);
    return { codo, mano: mover(codo, q.a, q.la ?? L.antebrazo) };
  });
  return { cadera, hombro, cabeza, piernas, brazos };
}

const linea = (a, b, clase) => `<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" class="${clase}"/>`;
const tramo = (pts, clase) => `<polyline points="${pts.map((q) => `${f(q[0])},${f(q[1])}`).join(' ')}" class="${clase}"/>`;

function flecha([x1, y1, x2, y2]) {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const ala = (d) => [x2 - 9 * Math.cos(ang + d), y2 - 9 * Math.sin(ang + d)];
  return tramo([[x1, y1], [x2, y2]], 'fg-flecha') + tramo([ala(0.5), [x2, y2], ala(-0.5)], 'fg-flecha');
}

function objeto(o) {
  if (o.t === 'linea') return linea(o.a, o.b, `fg-obj ${o.c || ''}`);
  if (o.t === 'poli') return tramo(o.p, `fg-obj ${o.c || ''}`);
  if (o.t === 'pesa') return `<rect x="${f(o.en[0] - 7)}" y="${f(o.en[1] - 2)}" width="14" height="13" rx="2" class="fg-pesa"/>`;
  if (o.t === 'punto') return `<circle cx="${f(o.en[0])}" cy="${f(o.en[1])}" r="5" class="fg-pesa"/>`;
  return '';
}

function cuerpo(p) {
  const q = puntos(p);
  const pierna = (x, clase) => tramo([q.cadera, x.rodilla, x.tobillo, ...(x.pie ? [x.pie] : [])], clase);
  const brazo = (x, clase) => tramo([q.hombro, x.codo, x.mano], clase);
  const out = [];
  // Lado lejano primero (más claro), luego tronco, y encima el lado cercano.
  if (q.piernas[0]) out.push(pierna(q.piernas[0], 'fg-lejos'));
  if (q.brazos[0] && q.brazos.length > 1) out.push(brazo(q.brazos[0], 'fg-lejos'));
  // Las partes cercanas llevan un borde del color del fondo para que no se fundan con lo que tapan.
  if (q.piernas[1]) out.push(pierna(q.piernas[1], 'fg-halo'));
  out.push(linea(q.cadera, q.hombro, 'fg-tronco'));
  if (q.piernas[1]) out.push(pierna(q.piernas[1], 'fg-cerca'));
  const cerca = q.brazos.length > 1 ? q.brazos[1] : q.brazos[0];
  out.push(`<circle cx="${f(q.cabeza[0])}" cy="${f(q.cabeza[1])}" r="9.5" class="fg-cabeza"/>`);
  if (cerca) out.push(brazo(cerca, 'fg-halo'), brazo(cerca, 'fg-cerca'));
  return out.join('');
}

/** Vista desde arriba (press Pallof): cabeza, hombros y brazos. */
function desdeArriba(p) {
  const [mx, my] = p.manos;
  return [
    tramo([[92, 70], [mx - 3, my]], 'fg-cerca'),
    tramo([[128, 70], [mx + 3, my]], 'fg-cerca'),
    linea([90, 70], [130, 70], 'fg-tronco'),
    '<circle cx="110" cy="64" r="11" class="fg-cabeza"/>',
  ].join('');
}

/** Vista de frente (pasos laterales): tronco, caderas y piernas. */
function deFrente(p) {
  const [pi, pd] = p.pies; const [ri, rd] = p.rodillas;
  return [
    tramo([[100, 96], ri, pi], 'fg-cerca'), tramo([[120, 96], rd, pd], 'fg-cerca'),
    linea([110, 50], [110, 96], 'fg-tronco'), linea([98, 96], [122, 96], 'fg-tronco'), linea([94, 52], [126, 52], 'fg-tronco'),
    tramo([[94, 52], [86, 74], [99, 92]], 'fg-cerca'), tramo([[126, 52], [134, 74], [121, 92]], 'fg-cerca'),
    '<circle cx="110" cy="34" r="9.5" class="fg-cabeza"/>',
  ].join('');
}

/** SVG de un fotograma. */
export function svgFigura(fr, titulo) {
  const dibujo = fr.vista === 'arriba' ? desdeArriba(fr) : fr.vista === 'frente' ? deFrente(fr) : cuerpo(fr);
  const suelo = fr.vista === 'arriba' ? '' : `<line x1="6" y1="${SUELO + 5}" x2="214" y2="${SUELO + 5}" class="fg-suelo"/>`;
  return `<svg class="figura" viewBox="${fr.caja || '0 0 220 172'}" role="img" aria-label="${titulo}">${suelo}${(fr.detras || []).map(objeto).join('')}${dibujo}${(fr.objetos || []).map(objeto).join('')}${(fr.flechas || []).map(flecha).join('')}</svg>`;
}

const SILLA = { t: 'poli', p: [[62, 78], [62, 120], [100, 120], [100, 163]] };
const PATA = { t: 'linea', a: [62, 120], b: [62, 163] };
const pie0 = { m: 90, p: 90, pie: 0 };
const DE_PIE = (x, brazos) => ({ cadera: [x, 82], torso: -90, piernas: [pie0, pie0], brazos });
const COLGANDO = [{ b: 70, a: 95 }];

// Las posturas en el suelo no necesitan la mitad superior del lienzo.
const BAJA = '0 78 220 94';

export const FIGURAS = {
  curlup: [
    { texto: 'Boca arriba, una pierna estirada y la otra flexionada. Manos bajo la zona lumbar.',
      cadera: [118, 152], torso: 180, piernas: [{ m: 0, p: 0 }, { m: -55, p: 62 }], brazos: [{ b: 6, a: 2 }] },
    { texto: 'Eleva cabeza y hombros apenas unos centímetros, sin doblar la lumbar. Aguanta 10 segundos.',
      cadera: [118, 152], torso: 192, cabeza: 206, piernas: [{ m: 0, p: 0 }, { m: -55, p: 62 }], brazos: [{ b: -4, a: 10 }],
      flechas: [[58, 118, 58, 100]] },
  ],
  plancha: [
    { texto: 'De lado, apoyado en el antebrazo, con el codo bajo el hombro y las rodillas flexionadas.',
      pts: { cadera: [112, 152], hombro: [70, 130], cabeza: [57, 122], piernas: [{ rodilla: [148, 154], tobillo: [170, 146], pie: null }, { rodilla: [150, 156], tobillo: [174, 150], pie: null }],
        brazos: [{ codo: [70, 157], mano: [94, 157] }] } },
    { texto: 'Sube la cadera hasta formar una línea recta de la cabeza a las rodillas. Aguanta 10 segundos.',
      pts: { cadera: [113, 142], hombro: [70, 130], cabeza: [56, 125], piernas: [{ rodilla: [148, 154], tobillo: [170, 146], pie: null }, { rodilla: [150, 156], tobillo: [174, 150], pie: null }],
        brazos: [{ codo: [70, 157], mano: [94, 157] }] },
      flechas: [[116, 124, 116, 106]] },
  ],
  birddog: [
    { texto: 'A cuatro patas: manos bajo los hombros y rodillas bajo las caderas, espalda recta.',
      cadera: [80, 118], torso: 0, cabeza: 22, piernas: [{ m: 90, p: 180 }, { m: 90, p: 180 }], brazos: [{ b: 90, a: 90, lb: 20, la: 20 }, { b: 90, a: 90, lb: 20, la: 20 }] },
    { texto: 'Extiende un brazo y la pierna contraria hasta la horizontal, sin inclinar la cadera. Aguanta 10 segundos.',
      cadera: [80, 118], torso: 0, cabeza: 22, piernas: [{ m: 90, p: 180 }, { m: 178, p: 180 }], brazos: [{ b: 90, a: 90, lb: 20, la: 20 }, { b: -14, a: -14 }],
      flechas: [[176, 96, 198, 90], [36, 104, 14, 104]] },
  ],
  puente: [
    { texto: 'Boca arriba, rodillas flexionadas y pies apoyados. Brazos a los lados.',
      cadera: [118, 152], torso: 180, piernas: [{ m: -50, p: 75 }, { m: -50, p: 75 }], brazos: [{ b: 4, a: 2 }] },
    { texto: 'Aprieta los glúteos y sube la cadera hasta alinear hombros, cadera y rodillas. No arquees la lumbar.',
      pts: { cadera: [115, 134], hombro: [72, 152], cabeza: [58, 152], piernas: [{ rodilla: [148, 121], tobillo: [152, 158], pie: null }, { rodilla: [148, 121], tobillo: [152, 158], pie: null }],
        brazos: [{ codo: [96, 154], mano: [118, 156] }] },
      flechas: [[115, 116, 115, 98]] },
  ],
  flexores: [
    { texto: 'Una rodilla en el suelo y el otro pie adelantado. Tronco erguido.',
      pts: { cadera: [100, 118], hombro: [100, 72], cabeza: [100, 57], piernas: [{ rodilla: [100, 156], tobillo: [62, 156], pie: null }, { rodilla: [138, 118], tobillo: [138, 156], pie: [149, 156] }],
        brazos: [{ codo: [110, 94], mano: [103, 114] }] } },
    { texto: 'Lleva la cadera hacia delante sin inclinar el tronco. Se nota en la ingle de la pierna de atrás. Mantén 30 segundos.',
      pts: { cadera: [112, 122], hombro: [112, 76], cabeza: [112, 61], piernas: [{ rodilla: [100, 156], tobillo: [62, 156], pie: null }, { rodilla: [147, 119], tobillo: [138, 156], pie: [149, 156] }],
        brazos: [{ codo: [122, 98], mano: [115, 118] }] },
      flechas: [[66, 108, 90, 108]] },
  ],
  sentadilla: [
    { texto: 'De pie delante de una silla, pies al ancho de las caderas.',
      ...DE_PIE(118, [{ b: 10, a: 0 }]), detras: [SILLA, PATA] },
    { texto: 'Lleva la cadera atrás y baja hasta rozar el asiento, con la espalda recta. Sube empujando con las piernas.',
      pts: { cadera: [87, 115], hombro: [106, 73], cabeza: [112, 59], piernas: [{ rodilla: [124, 121], tobillo: [118, 158], pie: [129, 158] }, { rodilla: [124, 121], tobillo: [118, 158], pie: [129, 158] }],
        brazos: [{ codo: [130, 73], mano: [152, 73] }] },
      detras: [SILLA, PATA], flechas: [[150, 96, 138, 116]] },
  ],
  bisagra: [
    { texto: 'De pie, con un palo pegado a la cabeza, la espalda y el sacro. Una mano lo sujeta en la nuca y otra en la lumbar.',
      ...DE_PIE(110, [{ b: -50, a: 151 }, { b: 105, a: 92 }]), detras: [{ t: 'linea', a: [102, 8], b: [102, 96], c: 'fg-palo' }] },
    { texto: 'Inclina el tronco llevando la cadera atrás, rodillas apenas flexionadas. El palo no se separa de ninguno de los tres puntos.',
      pts: { cadera: [98, 87], hombro: [133, 57], cabeza: [145, 48], piernas: [{ rodilla: [114, 121], tobillo: [112, 158], pie: [123, 158] }, { rodilla: [114, 121], tobillo: [112, 158], pie: [123, 158] }],
        brazos: [{ codo: [152, 52], mano: [137, 45] }, { codo: [118, 75], mano: [103, 74] }] },
      detras: [{ t: 'linea', a: [86, 88], b: [152, 33], c: 'fg-palo' }], flechas: [[78, 70, 62, 78]] },
  ],
  pallof: [
    { vista: 'arriba', texto: 'Visto desde arriba: de lado al anclaje de la goma, con las manos juntas en el pecho.',
      manos: [110, 86], detras: [{ t: 'linea', a: [18, 86], b: [108, 86], c: 'fg-goma' }, { t: 'punto', en: [16, 86] }] },
    { vista: 'arriba', texto: 'Extiende los brazos al frente y vuelve. La goma tira hacia un lado: el tronco no gira.',
      manos: [110, 132], detras: [{ t: 'linea', a: [18, 86], b: [108, 132], c: 'fg-goma' }, { t: 'punto', en: [16, 86] }], flechas: [[140, 96, 140, 126]] },
  ],
  pasos: [
    { vista: 'frente', texto: 'Visto de frente: banda en las piernas, rodillas algo flexionadas y pies al ancho de las caderas.',
      pies: [[97, 158], [123, 158]], rodillas: [[96, 126], [124, 126]], objetos: [{ t: 'linea', a: [96, 120], b: [124, 120], c: 'fg-goma' }] },
    { vista: 'frente', texto: 'Paso lateral corto contra la banda, sin juntar los pies ni balancear el tronco. Luego sigue la otra pierna.',
      pies: [[97, 158], [146, 158]], rodillas: [[96, 126], [138, 126]], objetos: [{ t: 'linea', a: [96, 120], b: [137, 120], c: 'fg-goma' }], flechas: [[156, 140, 180, 140]] },
  ],
  zancada: [
    { texto: 'De pie, tronco erguido.', ...DE_PIE(118, COLGANDO) },
    { texto: 'Paso largo hacia atrás y baja la rodilla trasera hacia el suelo. Vuelve empujando con la pierna de delante.',
      pts: { cadera: [88, 114], hombro: [88, 68], cabeza: [88, 53], piernas: [{ rodilla: [82, 150], tobillo: [48, 150], pie: [46, 160] }, { rodilla: [124, 120], tobillo: [120, 158], pie: [131, 158] }],
        brazos: [{ codo: [96, 91], mano: [94, 113] }] },
      flechas: [[60, 112, 44, 130]] },
  ],
  puente1: [
    { texto: 'Boca arriba, una rodilla flexionada con el pie apoyado y la otra pierna estirada en el aire.',
      cadera: [118, 152], torso: 180, piernas: [{ m: -50, p: 75 }, { m: -32, p: -32 }], brazos: [{ b: 4, a: 2 }] },
    { texto: 'Sube la cadera con la pierna de apoyo, manteniéndola recta, sin que caiga hacia un lado.',
      pts: { cadera: [115, 134], hombro: [72, 152], cabeza: [58, 152], piernas: [{ rodilla: [148, 121], tobillo: [152, 158], pie: null }, { rodilla: [150, 120], tobillo: [185, 106], pie: null }],
        brazos: [{ codo: [96, 154], mano: [118, 156] }] },
      flechas: [[115, 116, 115, 98]] },
  ],
  paseo: [
    { texto: 'De pie, con una mancuerna o una garrafa en una mano. Hombros a la misma altura.',
      ...DE_PIE(110, COLGANDO), objetos: [{ t: 'pesa', en: [116, 82] }] },
    { texto: 'Camina erguido, sin dejar que el tronco se incline hacia el lado del peso. Cambia de mano en cada tramo.',
      cadera: [110, 82], torso: -90, piernas: [{ m: 112, p: 124, pie: 30 }, { m: 70, p: 96, pie: 0 }], brazos: COLGANDO,
      objetos: [{ t: 'pesa', en: [116, 82] }], flechas: [[150, 60, 176, 60]] },
  ],
  gemelos: [
    { texto: 'De pie, pies al ancho de las caderas. Puedes apoyar una mano en la pared.', ...DE_PIE(110, COLGANDO) },
    { texto: 'Sube de puntillas todo lo posible y baja despacio.',
      cadera: [110, 73], torso: -90, piernas: [{ m: 90, p: 90, pie: 42 }, { m: 90, p: 90, pie: 42 }], brazos: COLGANDO,
      flechas: [[92, 158, 92, 140]] },
  ],
};

for (const id of ['curlup', 'plancha', 'birddog', 'puente', 'puente1']) for (const fr of FIGURAS[id]) fr.caja = BAJA;
