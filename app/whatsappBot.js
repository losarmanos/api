const wppconnect = require('@wppconnect-team/wppconnect')
let client

if (process.env.ENVIRONMENT !== 'localhost') {
  wppconnect
    .create({ session: 'armanosBot' })
    .then((c) => start(c))
    .catch((error) => console.log(error))
}

const start = c => {
  client = c
  // client.onMessage(message => {
  //   console.log(message)
  //   console.log(message.from === process.env.WHATSAPP_CHANNEL, message.from, process.env.WHATSAPP_CHANNEL)
  //   console.log(message.content === 'ping', message.content)
  //   if (message.from !== process.env.WHATSAPP_CHANNEL) return
  //   if (message.content !== 'ping') return
  //   client.sendText(process.env.WHATSAPP_CHANNEL, 'pong')
  //     .then(console.log)
  //     .catch(console.error)
  // })
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
