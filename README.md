# Espalda en juego

Web instalable con el plan de ejercicios de espalda para seguir jugando al fútbol: qué toca cada día, temporizador guiado, vídeos de cada ejercicio, registro de síntomas, modo crisis y avisos en el móvil.

Esta herramienta guía y recuerda. No sustituye la valoración de un médico o un fisioterapeuta.

## Cómo funciona

- **Web**: archivos estáticos servidos con GitHub Pages. Sin compilación.
- **Datos personales**: el registro de sesiones y síntomas se guarda solo en el móvil (`localStorage`). No sale del dispositivo ni entra en este repositorio.
- **Avisos**: la tarea programada `.github/workflows/avisos.yml` se ejecuta cada 10 minutos y envía por Web Push los recordatorios que tocan según `config.json`.

## Puesta en marcha

1. **Publicar la web**: Settings, Pages, "Deploy from a branch", rama `main`, carpeta `/ (root)`.
2. **Clave de los avisos**: Settings, Secrets and variables, Actions, "New repository secret" con nombre `VAPID_PRIVATE_KEY`.
3. **Instalar en el móvil**: abrir la web con Chrome en Android, "Instalar" o "Añadir a pantalla de inicio".
4. **Suscribir el móvil**: en la web, Ajustes, "Activar avisos". Copiar el texto que aparece y guardarlo como secreto `PUSH_SUBSCRIPTIONS`.
5. **Probar**: Actions, "Avisos", "Run workflow" con la casilla de prueba marcada.

Para varios móviles, `PUSH_SUBSCRIPTIONS` admite una lista: `[{...}, {...}]`.

## Configuración: `config.json`

| Campo | Qué es |
| --- | --- |
| `zonaHoraria` | Zona horaria de los avisos, por ejemplo `Europe/Madrid` o `America/Bogota` |
| `inicio` | Primer día del plan (`AAAA-MM-DD`). De ahí salen la semana y la fase |
| `partido.dia` | Día del partido principal: 0 domingo, 1 lunes … 6 sábado |
| `partido.hora` | Hora del partido (`"18:00"`) para avisar de calentar 30 minutos antes, o `null` |
| `segundoPartido.activo` | `true` para la semana con dos partidos; el segundo cae 3 días antes del principal |
| `avisos.rutina` | Hora del aviso de la rutina diaria |
| `avisos.pausas` | Horas de las pausas de la silla, de lunes a viernes |
| `avisos.sesion` | Hora del aviso de la sesión del día |
| `avisos.partido` | Hora del aviso de la mañana los días de partido |
| `avisos.registro` | Hora del aviso de registro semanal, los domingos |
| `vapidPublicKey` | Clave pública de los avisos; hace pareja con el secreto `VAPID_PRIVATE_KEY` |

Poner una hora a `null` desactiva ese aviso.

## Límites conocidos de los avisos

- GitHub Actions puede retrasar una ejecución programada varios minutos. Un aviso con más de una hora de retraso se descarta.
- GitHub desactiva las tareas programadas tras 60 días sin actividad en el repositorio. La tarea intenta reactivarse sola cada semana; si los avisos dejan de llegar, revisar Actions.
- Si se borran los datos del navegador o se reinstala la web, hay que activar los avisos otra vez y actualizar el secreto.

## Desarrollo

```bash
python3 -m http.server 8080   # servir la web en local
npm install && npm test       # comprobar la lógica del plan y los avisos
```
