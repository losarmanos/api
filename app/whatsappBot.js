const wppconnect = require('@wppconnect-team/wppconnect')
let client

if (process.env.ENVIRONMENT !== 'localhost') {
  wppconnect
    .create({
      session: 'armanosBot',
      autoClose: false,
      headless: 'new',
      puppeteerOptions: {
        args: ['--no-sandbox']
      }
    })
    .then((c) => start(c))
    .catch((error) => console.log(error))
}

const start = c => {
  client = c
  client.onMessage(message => {
    console.log(message.content === 'ping', message.content)
    if (message.content !== 'ping') return
    console.log(message)
    client.sendText(message.from, 'pong')
      .then(_ => {})
      .catch(console.error)
  })
}

const sendAlert = msg => {
  if (process.env.ENVIRONMENT === 'localhost') return
  client.sendText(process.env.WHATSAPP_CHANNEL, msg)
    .then(console.log)
    .catch(console.error)
}

module.exports = {
  sendAlert
}
