# Core 11

Web instalable con el plan de ejercicios de espalda para seguir jugando al fútbol: qué toca cada día, temporizador guiado, ilustraciones y vídeos de cada ejercicio, registro de síntomas, modo crisis y recordatorios para el calendario del móvil.

Esta herramienta guía y recuerda. No sustituye la valoración de un médico o un fisioterapeuta.

## Cómo funciona

- **Web**: archivos estáticos servidos con GitHub Pages desde la rama `main`. Sin compilación ni dependencias.
- **Datos personales**: el registro de sesiones y síntomas se guarda solo en el móvil (`localStorage`). No sale del dispositivo ni entra en este repositorio.
- **Recordatorios**: los da el calendario del móvil. La web genera eventos semanales (enlaces a Google Calendar o un archivo `.ics`) a partir de `config.json`; no hay servidor ni avisos push.

## Uso en el móvil

1. Abrir https://jhonnatan0316.github.io/espalda-en-juego/ con Chrome en Android e instalarla.
2. En Ajustes, "Poner recordatorios": descargar todos de una vez o añadirlos uno a uno.

## Configuración: `config.json`

| Campo | Qué es |
| --- | --- |
| `inicio` | Primer día del plan (`AAAA-MM-DD`). De ahí salen la semana y la fase |
| `partido.dia` | Día del partido principal: 0 domingo, 1 lunes … 6 sábado |
| `partido.hora` | Hora del partido (`"20:00"`), para recordar el calentamiento 30 minutos antes, o `null` |
| `segundoPartido.activo` | `true` para la semana con dos partidos |
| `segundoPartido.dia` | Día del segundo partido, el que se juega suave. Al menos dos días separado del principal |
| `segundoPartido.hora` | Hora del segundo partido, o `null` |
| `avisos.rutina` | Hora del recordatorio de la rutina diaria |
| `avisos.pausas` | Horas de las pausas de la silla, de lunes a viernes |
| `avisos.sesion` | Hora del recordatorio de la sesión del día |
| `avisos.partido` | Hora del recordatorio los días de partido, si el partido no tiene hora |
| `avisos.registro` | Hora del recordatorio de registro semanal, los domingos |

Poner una hora a `null` quita ese recordatorio. Los recordatorios ya añadidos al calendario no cambian solos: al modificar días u horas hay que borrarlos del calendario y añadir los nuevos.

## Desarrollo

```bash
python3 -m http.server 8080   # servir la web en local
npm test                      # comprobar la lógica del plan y de los recordatorios
```
