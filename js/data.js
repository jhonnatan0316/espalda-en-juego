// Contenido del plan. Las dosis y descripciones salen del documento
// «Plan de espalda para seguir jugando al fútbol».

const VIDEO_TRES = 'https://www.youtube.com/watch?v=Kz_pVWfk460';
const HARVARD = 'https://www.health.harvard.edu/healthy-aging-and-longevity/three-moves-for-better-spine-health';

export const EJERCICIOS = {
  curlup: {
    nombre: 'Curl-up modificado', dosis: '5, 3 y 1 repeticiones de 10 s',
    modo: 'aguante', bloques: [5, 3, 1], seg: 10, lados: false,
    como: 'Boca arriba, una pierna estirada y otra flexionada, manos bajo la zona lumbar. Se elevan cabeza y hombros apenas unos centímetros.',
    para: 'Abdominales sin doblar la lumbar.',
    guias: [['Vídeo de los tres ejercicios', VIDEO_TRES], ['Paso a paso', HARVARD]],
  },
  plancha: {
    nombre: 'Plancha lateral con rodillas flexionadas', dosis: '5, 3 y 1 repeticiones de 10 s por lado',
    modo: 'aguante', bloques: [5, 3, 1], seg: 10, lados: true,
    como: 'De lado, apoyado en antebrazo y rodillas. Cadera arriba hasta formar una línea de cabeza a rodillas.',
    para: 'Estabilidad lateral del tronco.',
    guias: [['Vídeo de los tres ejercicios', VIDEO_TRES], ['Ficha con foto', 'https://www.acefitness.org/resources/everyone/exercise-library/100/side-plank-modified/']],
  },
  birddog: {
    nombre: 'Bird-dog', dosis: '5, 3 y 1 repeticiones de 10 s por lado',
    modo: 'aguante', bloques: [5, 3, 1], seg: 10, lados: true,
    como: 'A cuatro patas, se extienden brazo y pierna contraria sin inclinar la cadera.',
    para: 'Extensores y control de la rotación.',
    guias: [['Vídeo de los tres ejercicios', VIDEO_TRES], ['Ficha con foto', 'https://www.acefitness.org/education-and-resources/lifestyle/exercise-library/14/bird-dog']],
  },
  puente: {
    nombre: 'Puente de glúteo', dosis: '2 series de 10 a 12',
    modo: 'series', series: 2, reps: '10 a 12 repeticiones',
    como: 'Boca arriba, rodillas flexionadas. Se eleva la cadera apretando glúteos, sin arquear la lumbar.',
    para: 'Glúteos, que descargan la columna al correr.',
    guias: [['Ficha con foto', 'https://www.acefitness.org/resources/everyone/exercise-library/49/glute-bridge/']],
  },
  flexores: {
    nombre: 'Estiramiento de flexores de cadera', dosis: '2 veces 30 s por lado',
    modo: 'aguante', bloques: [2], seg: 30, lados: true, alterna: true,
    como: 'Rodilla trasera en el suelo, cadera hacia delante con el tronco erguido.',
    para: 'Compensar las horas sentado.',
    guias: [['Ficha con foto', 'https://www.acefitness.org/education-and-resources/lifestyle/exercise-library/142/kneeling-hip-flexor-stretch/']],
  },
  sentadilla: {
    nombre: 'Sentadilla a una silla', dosis: '3 series de 8 a 10',
    modo: 'series', series: 3, reps: '8 a 10 repeticiones',
    como: 'De pie delante de una silla. Se baja llevando la cadera atrás hasta rozar el asiento y se sube, con la espalda neutra.',
    para: 'Piernas con la espalda neutra.',
    guias: [['Vídeo', 'https://www.youtube.com/watch?v=yluv--sqkNo']],
  },
  bisagra: {
    nombre: 'Bisagra de cadera con palo en la espalda', dosis: '3 series de 8 a 10',
    modo: 'series', series: 3, reps: '8 a 10 repeticiones',
    como: 'Un palo apoyado en cabeza, dorsales y sacro. Se inclina el tronco llevando la cadera atrás, sin que el palo se separe.',
    para: 'Agacharse desde la cadera, no desde la lumbar.',
    guias: [['Vídeo', 'https://www.youtube.com/watch?v=FmWsCfUs9DI'], ['Ficha con foto', 'https://www.acefitness.org/resources/everyone/exercise-library/33/hip-hinge/']],
  },
  pallof: {
    nombre: 'Press Pallof con goma', dosis: '3 series de 8 a 10 por lado',
    modo: 'series', series: 3, reps: '8 a 10 repeticiones por lado',
    como: 'De lado al anclaje de la goma, manos en el pecho. Se extienden los brazos al frente y se vuelve, sin dejar que el tronco gire.',
    para: 'Resistir la rotación, el gesto que provoca las crisis.',
    guias: [['Vídeo', 'https://www.youtube.com/watch?v=AKdAwZE4nIA']],
  },
  pasos: {
    nombre: 'Pasos laterales con banda', dosis: '2 series de 10 a 12 por lado',
    modo: 'series', series: 2, reps: '10 a 12 pasos por lado',
    como: 'Banda circular en las piernas, rodillas algo flexionadas. Pasos laterales cortos sin juntar los pies ni balancear el tronco.',
    para: 'Glúteo medio, estabilidad en los cambios de dirección.',
    guias: [['Vídeo', 'https://www.youtube.com/watch?v=YHOCvSx8itM']],
  },
  zancada: {
    nombre: 'Zancada hacia atrás', dosis: '3 series de 8 por lado',
    modo: 'series', series: 3, reps: '8 repeticiones por lado',
    como: 'De pie, un paso largo hacia atrás bajando la rodilla trasera hacia el suelo, tronco erguido. Se vuelve empujando con la pierna delantera.',
    para: 'Fuerza a una pierna, frenadas.',
    guias: [['Vídeo', 'https://www.youtube.com/watch?v=PHA9tVMRsj8']],
  },
  puente1: {
    nombre: 'Puente de glúteo a una pierna', dosis: '3 series de 8 por lado',
    modo: 'series', series: 3, reps: '8 repeticiones por lado',
    como: 'Como el puente de glúteo, con una pierna elevada. La cadera sube recta, sin caer hacia un lado.',
    para: 'Glúteo e isquiotibiales.',
    guias: [['Ficha con foto', 'https://www.acefitness.org/resources/everyone/exercise-library/145/glute-bridge-single-leg-progression/']],
  },
  paseo: {
    nombre: 'Paseo con peso en una mano', dosis: '3 tramos de 20 a 30 m por lado',
    modo: 'series', series: 3, reps: '20 a 30 metros por lado',
    como: 'Una mancuerna o garrafa en una mano. Se camina erguido sin inclinar el tronco hacia el peso.',
    para: 'Tronco estable bajo carga lateral.',
    guias: [['Vídeo', 'https://www.youtube.com/watch?v=58zoUXlwDRM']],
  },
  gemelos: {
    nombre: 'Elevación de gemelos', dosis: '2 series de 12 a 15',
    modo: 'series', series: 2, reps: '12 a 15 repeticiones',
    como: 'De pie, se sube de puntillas todo lo posible y se baja despacio.',
    para: 'Tobillo y arrancadas.',
    guias: [['Vídeo', 'https://www.youtube.com/watch?v=yyoubmNCDk4']],
  },
};

export const RUTINA = ['curlup', 'plancha', 'birddog', 'puente', 'flexores'];
export const FUERZA = { A: ['sentadilla', 'bisagra', 'pallof', 'pasos'], B: ['zancada', 'puente1', 'paseo', 'gemelos'] };

export const NORMAS = [
  'Columna en posición neutra en todo momento, sin redondear ni arquear.',
  'Molestia muscular local es aceptable. Dolor que baja por la pierna u hormigueo obliga a parar.',
  'Mejor a media mañana o por la tarde que nada más levantarse.',
];

export const NORMAS_FUERZA = [
  'Cada serie termina con la sensación de poder hacer dos o tres repeticiones más.',
  'Se añade peso cuando salen todas las repeticiones con buena técnica dos sesiones seguidas.',
  'Cargas ligeras, sin giro y con la columna neutra. Si un vídeo muestra barra o mucha carga, aquí se hace con peso corporal o carga ligera.',
];

export const CALENTAMIENTO = [
  ['Carrera suave y movilidad', '6 a 8 minutos', 'Trote, apertura y cierre de cadera, desplazamientos laterales, skipping.'],
  ['Activación', '5 minutos', 'Una ronda de bird-dog, plancha lateral, puente de glúteo, sentadillas y zancadas.'],
  ['Gestos del partido', '5 minutos', 'Aceleraciones y frenadas progresivas, cambios de dirección cada vez más rápidos, pases cortos antes que golpeos largos.'],
];

export const VIDEOS_CALENTAMIENTO = [
  ['FIFA 11+, parte 1 en español', 'https://www.youtube.com/watch?v=t8h12fy3aAw'],
  ['FIFA 11+, parte 3 en español', 'https://www.youtube.com/watch?v=jBlEYn6yY_c'],
  ['Lista de reproducción completa', 'https://www.youtube.com/playlist?list=PLCGIzmTE4d0jJ8nngB9Szd8uWwuEPD4QD'],
];

export const EN_PARTIDO = [
  'Los primeros 5 a 10 minutos se juegan a intensidad contenida.',
  'Dolor que baja por la pierna, hormigueo o pérdida de fuerza: se deja de jugar ese día. No se aguanta.',
  'Nunca dos días seguidos de partido; entre uno y otro, al menos 48 horas.',
  'Si se puede elegir, césped antes que pista dura.',
];

export const URGENCIAS = [
  'Pérdida de control de la orina o las heces, o dificultad nueva para orinar.',
  'Adormecimiento en genitales, periné o cara interna de los muslos.',
  'Debilidad que avanza en el pie o la pierna, o síntomas en las dos piernas.',
];

export const EN_CRISIS = [
  'Llamar a la clínica del dolor al empezar la crisis, sin esperar a que empeore.',
  'Paseos cortos y frecuentes, dentro de lo que el dolor permita.',
  'De la rutina diaria se mantiene solo lo que no provoque dolor irradiado.',
  'No se juega ni se hace fuerza mientras dure la crisis o su medicación.',
  'Consulta médica si no hay mejoría clara a las 6 semanas, o antes si el dolor no se controla.',
];

export const VUELTA = [
  'Vida diaria sin dolor irradiado y capacidad de caminar de puntillas y de talones.',
  'Rutina diaria y fuerza completas sin síntomas.',
  'Trote suave, luego 20 minutos de carrera continua.',
  'Frenadas y cambios de dirección.',
  'Golpeo de balón, de corto a largo.',
  'Partido con tiempo reducido, luego completo.',
];

export const MEDICACION = [
  ['Gabapentina', 'La guía británica NICE no la recomienda para la ciática. No se suspende sin indicación médica: pregunta si sigue siendo la mejor opción.'],
  ['Nolotil (metamizol)', 'Tratamientos cortos, de 7 días como máximo. Suspender y consultar ante fiebre, dolor de garganta o llagas en la boca.'],
  ['Infiltración epidural', 'Mejora pequeña y de corto plazo en los ensayos. Es una opción para una crisis intensa, no una obligación.'],
];

export const EVITAR = [
  'Jugar sin calentamiento.',
  'Jugar con dolor irradiado, hormigueo o pérdida de fuerza.',
  'Jugar bajo medicación de crisis o tomar analgésicos para poder jugar.',
  'Dos partidos con menos de 48 horas entre ellos.',
  'Reposo en cama durante una crisis.',
  'Abdominales clásicos, giros rusos y elevaciones de piernas rectas.',
  'En yoga y pilates, flexiones profundas hacia delante y torsiones forzadas.',
  'Levantar peso con la espalda redondeada o girando el tronco.',
  'Pasar de cero a todo en la primera semana.',
];

export const FUENTES = [
  ['Steffens 2016, prevención del dolor lumbar con ejercicio', 'https://search.pedro.org.au/search-results/record-detail/44791'],
  ['Thorborg 2017, calentamiento FIFA 11+', 'https://bjsm.bmj.com/content/51/7/562'],
  ['NICE NG59, dolor lumbar y ciática', 'https://www.nice.org.uk/guidance/ng59/chapter/Recommendation'],
  ['Harvard Health, tres ejercicios para la columna', HARVARD],
  ['AEMPS 2018, metamizol', 'https://www.aemps.gob.es/informa/notasinformativas/medicamentosusohumano-3/seguridad-1/2018/ni_muh_fv-15-2018-metamizol-agranulocitosis/'],
];
