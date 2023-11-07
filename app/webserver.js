require('./dotenv')
const express = require('express')
const { proxy } = require('./proxy')
const { getMember } = require('./mamalonadb')
const { sendAlert } = require('./bot.js')

const { PORT = 8080 } = process.env

// servidor web para procesar las llamadas
const app = express()
app.use(express.json())

const gateway = (req, res, next) => {
  const urlMatch = req.params.city.toUpperCase()
  const targetUrl = process.env[urlMatch]

  // validamos que el usuario esté buscando una ciudad definida
  // y que solo sean los métodos aceptados
  if (!targetUrl) {
    res.status(404).send('Esta no es la página que estás buscando')
    return
  }
  req.targetUrl = targetUrl
  next()
}

const cors = (req, res, next) => {
  const allowedOrigins = process.env.ORIGINS.split(',')
  const origin = req.get('origin')
  // CORS para unicamente orígenes válidos
  if (!allowedOrigins.includes(origin)) {
    res.status(403).send('Acceso no autorizado')
    return
  }
  // Si ya llegó hasta acá no hay problema con CORS ni respuestas
  res.set('Access-Control-Allow-Origin', origin)
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.set('Access-Control-Allow-Headers', 'Content-Type')
  res.set('Content-Type', 'application/json')
  next()
}

app.options('/calendar/:city', [cors, gateway], (_req, res) => { res.sendStatus(200) })
app.get('/calendar/:city', [cors, gateway], (req, res) => {
  console.log(`-> Querying calendar for ${req.params.city}`)

  const proxyReq = proxy(req.targetUrl, res)

  // Route handlers para todo lo demás
  proxyReq.on('error', (err) => {
    console.error('Error en la solicitud proxy:', err)
    res.writeHead(500)
    res.end('Error en la solicitud proxy')
  })
  proxyReq.end()
})

app.get('/members/:uid', cors, async (req, res) => {
  const member = await getMember(req.params.uid)
  delete member.address
  delete member.phone
  delete member.emergencyContact
  delete member.emergencyPhone
  res.json(member)
})

app.options('/members/:city', cors, (_req, res) => { res.sendStatus(200) })
app.post('/members/:uid', cors, async (req, res) => {
  const member = await getMember(req.params.uid)
  const { message, location } = req.body
  let text = `
*A T E N C I O N*
Hay un reporte para _${member.name}_

Contactar a _${member.emergencyContact}_ al ${member.emergencyPhone}

Mensaje:
\`\`\`
${message.message}
\`\`\`
Reporte levantado desde la página de alertas por: _${message.author}_. Para más información contactarle al: ${message.phone}
  `
  if (location.latitude) {
    text += `
[Localización del evento](https://maps.google.com/?q=${location.latitude},${location.longitude}) \\(aproximado a ${location.accuracy}m\\)
    `
  }
  sendAlert(text)
  res.sendStatus(200)
})

app.get('/', (_req, res) => {
  res.json({
    now: new Date(),
    build: process.env.BUILD
  })
})

app.listen(PORT, () => {
  console.log(`Proxy escuchando en el puerto ${PORT}`)
})
