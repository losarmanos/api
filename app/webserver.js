require('./dotenv')
const express = require('express')
const { proxy } = require('./proxy')
const { getMembers } = require('./mamalonadb')

const { PORT = 8080 } = process.env

// servidor web para procesar las llamadas
const app = express()

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

app.get('/members/:uid', cors, getMembers)

app.listen(PORT, () => {
  console.log(`Proxy escuchando en el puerto ${PORT}`)
})
