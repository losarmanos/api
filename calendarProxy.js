const http = require('http')
const https = require('https')
const { readFileSync } = require('fs')

// Lee el archivo .env para cargar las variables de entorno
// no se usa otra estrategia porque esta funciona para el CI/CD
const env = readFileSync('./.env', 'utf8')
  .split('\n')
  .map(line => line.split(' '))
  .map(([variable, value]) => {
    process.env[variable] = value
  })

const { PORT = 8080 } = process.env

// limpieza de strings
const processText = text => {
  return text.replace(/\\/g, '')
}

// Recibe un timestamp en formato internacional o en formato de 8 digitos y
// regresa un epoch
const processTimeStamp = timestamp => {
  const year = parseInt(timestamp.slice(0, 4))
  const month = parseInt(timestamp.slice(4, 6)) - 1
  const day = parseInt(timestamp.slice(6, 8))
  if (timestamp.length === 8) {
    return new Date(Date.UTC(year, month, day)).getTime()
  }
  const hour = parseInt(timestamp.slice(9, 11))
  const minute = parseInt(timestamp.slice(11, 13))
  const second = parseInt(timestamp.slice(13, 15))
  return new Date(Date.UTC(year, month, day, hour, minute, second)).getTime()
}

// Procesamiento de iCal, obtiene el string completo y regresa un arreglo
// ordenado y filtrado de objetos de calendario con textos
// y elementos normalizados
const processCalendar = (icalData) => {
  const [def, ...items] = icalData.split('BEGIN:VEVENT')
  return items
    .map(item => {
      const event = {}

      const lines = item.split('\r\n')
      let section = ''
      for (const line of lines.filter(l => l !== '')) {
        if (/^[A-Z-=;]+:/.test(line)) {
          const [k, value] = line.split(':')
          const key = k.toLowerCase()
          section = key
          event[key] = value.trim()
        } else {
          event[section] += line.trim()
        }
      }
      const evt = {}
      evt.start = processText(event.dtstart || event['dtstart;value=date'])
      evt.end = processText(event.dtend || event['dtend;value=date'])
      if (event.location) evt.location = processText(event.location)
      evt.name = processText(event.summary)
      if (event.description) evt.description = processText(event.description)
      evt.isFullDay = !!event['dtstart;value=date']
      evt.key = processTimeStamp(evt.start)

      return evt
    })
    .sort((a, b) => { // sort porque originalmente vienen en orden de creación
      if (a.key < b.key) return -1
      if (a.key > b.key) return 1
      return 0
    })
    .filter(item => {
      const yd = new Date()
      yd.setDate(yd.getDate() - 1)
      return new Date(item.key).getTime() > yd.getTime()
    })
}

// Obtiene la URL del vcal haciendo match de un string con lo cargado
// en las variables de entorno (puede regresar null)
const getCalUrl = url => {
  const match = url.replace('/', '').toUpperCase()
  return process.env[match]
}

// servidor web para procesar las llamadas
const server = http.createServer((req, res) => {

  // validamos que el usuario esté buscando una ciudad definida
  // y que solo sean los métodos aceptados
  const targetUrl = getCalUrl(req.url)
  if (!targetUrl || !['GET', 'OPTIONS'].includes(req.method)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('Esta no es la página que estás buscando')
    return
  }
  const allowedOrigins = process.env.ORIGINS.split(',')
  const { headers } = req
  const origin = headers['origin']

  // CORS para unicamente orígenes válidos
  if (!allowedOrigins.includes(origin)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' })
    res.end('Acceso no autorizado')
    return
  }

  // Si ya llegó hasta acá no hay problema con CORS ni respuestas
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Content-Type', 'application/json')

  // Proxy para obtener la información del calendario requerido
  const proxyReq = https.request(targetUrl, (proxyRes) => {
    if (proxyRes.statusCode !== 200) {
      res.writeHead(proxyRes.statusCode)
      res.end()
      return
    }
    let icalData = ''
    proxyRes.on('data', (chunk) => {
      icalData += chunk
    })
    proxyRes.on('end', () => {
      const calendar = processCalendar(icalData)
      res.writeHead(200)
      res.end(JSON.stringify(calendar))
    })
  })

  // Route handlers para todo lo demás
  proxyReq.on('error', (err) => {
    console.error('Error en la solicitud proxy:', err)
    res.writeHead(500)
    res.end('Error en la solicitud proxy')
  })
  if (req.method === 'OPTIONS') {
    res.writeHead(200)
    res.end()
  } else if (req.method === 'GET') {
    proxyReq.end()
  }
})

// Iniciamos el server
server.listen(PORT, () => {
  console.log(`Proxy escuchando en el puerto ${PORT}`)
})
