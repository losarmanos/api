const express = require('express')
const { readFileSync } = require('fs')
const { proxy } = require('./proxy')

// Lee el archivo .env para cargar las variables de entorno
// no se usa otra estrategia porque esta funciona para el CI/CD
readFileSync('./.env', 'utf8')
  .split('\n')
  .map(line => line.split(' '))
  .forEach(([variable, value]) => {
    process.env[variable] = value
  })

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
  req.targetUrl = targetUrl
  next()
}
app.options('/:city', gateway, (_req, res) => { res.sendStatus(200) })
app.get('/:city', gateway, (req, res) => {
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

app.listen(PORT, () => {
  console.log(`Proxy escuchando en el puerto ${PORT}`)
})
