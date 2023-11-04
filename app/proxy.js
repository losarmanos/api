const https = require('https')
const { processCalendar } = require('./calendar')
const { FishBrain } = require('./fishbrain')

// Proxy para obtener la información del calendario requerido
const proxy = (targetUrl, res) => {
  const { value } = FishBrain.read(targetUrl)
  if (value) {
    console.log('<- Cache response')
    res.json(value)
    return {
      end: () => { },
      on: () => { }
    }
  }

  console.log('<- Remote response')
  return https.request(targetUrl, (proxyRes) => {
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
      FishBrain.store(targetUrl, calendar)
      res.json(calendar)
    })
  })
}

module.exports = {
  proxy
}
