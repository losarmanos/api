Calendar Proxi
==============

Este proxi de calendario obtiene el VCAL privado de google y regresa un JSON
Tiene todos los CORS abiertos, pero solo acepta llamadas desde los sitios
configurados perviamente.

Además solo muestra resultados de los calendarios especificados como variables
de entorno

No requiere tokens, sesiones o autenticaciones y tampoco requiere que el calendario sea público.

Solo funciona y fue probado con google calendar

## Variables de entorno

`PORT` || el puerto donde va a levantar  
`ORIGINS` || los origenes de donde vas a aceptar llamadas (CORS) separados por coma  
`<CIUDAD>` || la URL del VCAL privado de google calendar, este nombre de ciudad se usará para la ruta

Se pueden definir tantas ciudades como calendarios querramos regresar en JSON


## Uso
**Request**
```
GET https://<URL>/<ciudad>
```
Donde la url es donde esté montado tu proxi y ciudad es la definida en la variable de entorno, no es necesario mandarla en mayúsculas.

**Response**
```json
[
  {
    "start": "20231029T150000Z",
    "end": "20231029T220000Z",
    "location": "Zempoala, Hgo., Mexico",
    "name": "Cumple de Marcus",
    "description": "Planeamos salir desde La Noria a las 7am para llegar 10am a Zempoala. El regreso es a las 4pm para llegar 7pm a Qro.",
    "isFullDay": false,
    "key": 1698591600000
  },
  ...
]
```
`start` y `end` vienen como string porque es probable que vengan en formato de 8 digitos cuando es un evento que dura todo el día o que dura más de 1 día. En todo caso es responsabilidad del cliente hacer la conversión a objeto Date para aprovechar el timezone local.  
`key` es simplemente un epoch del start de cada evento y sirve para ordenarlos  
`isFullDay` es un booleano que indica si el evento dura uno o más días completos
Los demás son texto plano

La respuesta trae los eventos ordenados desde el más actual hasta el futuro. No viene paginado y no trae resultados de eventos pasados.
