const { readFileSync } = require('fs')

// Lee el archivo .env para cargar las variables de entorno
// no se usa otra estrategia porque esta funciona para el CI/CD
readFileSync('./.env', 'utf8')
  .split('\n')
  .map(line => line.split(' '))
  .forEach(([variable, ...value]) => {
    process.env[variable] = value.join(' ')
  })

process.env.GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
