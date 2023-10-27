const http = require('http')
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
const server = http.createServer((req, res) => {
  // validamos que el usuario esté buscando una ciudad definida
  // y que solo sean los métodos aceptados
  const urlMatch = req.url.replace('/', '').toUpperCase()
  const targetUrl = process.env[urlMatch]

  if (!targetUrl || !['GET', 'OPTIONS'].includes(req.method)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('Esta no es la página que estás buscando')
    return
  }
  const allowedOrigins = process.env.ORIGINS.split(',')
  const { headers } = req
  const { origin } = headers

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

  console.log(`-> Querying calendar for ${req.url.replace('/', '')}`)
  const proxyReq = proxy(targetUrl, res)

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
