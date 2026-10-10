// Envía los avisos que tocan en la ventana (DESDE, HASTA]. Lo ejecuta GitHub Actions.
// Los registros de Actions son públicos: aquí no se imprime nunca la suscripción.
import { readFile } from 'node:fs/promises';
import webpush from 'web-push';
import { avisosEnVentana } from '../js/schedule.js';

const MIN = 60_000;
const config = JSON.parse(await readFile(new URL('../config.json', import.meta.url), 'utf8'));

const privada = process.env.VAPID_PRIVATE_KEY;
const crudo = (process.env.PUSH_SUBSCRIPTIONS || '').trim();
if (!privada || !crudo) {
  console.log('Faltan los secretos VAPID_PRIVATE_KEY o PUSH_SUBSCRIPTIONS: no se envía nada.');
  process.exit(0);
}

let suscripciones;
try {
  const d = JSON.parse(crudo);
  suscripciones = Array.isArray(d) ? d : [d];
} catch {
  console.error('El secreto PUSH_SUBSCRIPTIONS no es un JSON válido. Vuelve a copiarlo desde Ajustes.');
  process.exit(1);
}

webpush.setVapidDetails(config.url, config.vapidPublicKey, privada);

const hasta = Date.parse(process.env.HASTA || '') || Date.now();
let desde = Date.parse(process.env.DESDE || '') || hasta - 15 * MIN;
desde = Math.max(desde, hasta - 60 * MIN); // un aviso con más de una hora de retraso ya no sirve

const avisos = process.env.PRUEBA === 'true'
  ? [{ titulo: 'Aviso de prueba', cuerpo: 'Los avisos programados funcionan.', url: '#/hoy', tag: 'prueba' }]
  : avisosEnVentana(config, desde, hasta);

console.log(`Ventana: ${new Date(desde).toISOString()} a ${new Date(hasta).toISOString()}. Avisos: ${avisos.length}.`);

let fallos = 0;
for (const av of avisos) {
  const carga = JSON.stringify({ titulo: av.titulo, cuerpo: av.cuerpo, url: av.url, tag: av.tag });
  for (const [i, sub] of suscripciones.entries()) {
    try {
      await webpush.sendNotification(sub, carga, { TTL: 3600, urgency: 'high', topic: av.tag });
      console.log(`Enviado «${av.titulo}» al dispositivo ${i + 1}.`);
    } catch (e) {
      fallos++;
      const caducada = e.statusCode === 404 || e.statusCode === 410;
      console.error(caducada
        ? `La suscripción del dispositivo ${i + 1} ha caducado: activa de nuevo los avisos en Ajustes y actualiza el secreto.`
        : `Fallo al enviar al dispositivo ${i + 1} (código ${e.statusCode || 'desconocido'}).`);
    }
  }
}
process.exit(fallos ? 1 : 0);
