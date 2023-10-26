const http = require('http')
const https = require('https')

const { PORT = 8080 } = process.env

const processText = text => {
  return text.replace(/\\/g, '')
}

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
      evt.end = processText(event.dtend || event['dtstart;value=date'])
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

const getCalUrl = url => {
  const match = url.replace('/', '').toUpperCase()
  return process.env[match]
}

const server = http.createServer((req, res) => {
  const targetUrl = getCalUrl(req.url)
  if (!targetUrl) {
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('Kha?')
    return
  }
  const allowedOrigins = ['https://losarmanos.com', 'http://localhost:8080']
  const { headers } = req
  const origin = headers['origin']

  if (!allowedOrigins.includes(origin)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' })
    res.end('Acceso no autorizado')
    return
  }

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
      if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin); // Establece el origen permitido
      }
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
      res.setHeader('Content-Type', 'application/json')
      res.writeHead(200)
      res.end(JSON.stringify(calendar))
    })
  })

  proxyReq.on('error', (err) => {
    console.error('Error en la solicitud proxy:', err)
    res.writeHead(500)
    res.end('Error en la solicitud proxy')
  })

  if (req.method === 'OPTIONS') {
    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin); // Establece el origen permitido
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.writeHead(200)
    res.end()
  } else if (req.method === 'GET') {
    proxyReq.end()
  }
})

server.listen(PORT, () => {
  console.log(`Proxy escuchando en el puerto ${PORT}`)
})
