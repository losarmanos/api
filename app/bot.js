const { sendAlert: telegram } = require('./telegramBot.js')
const { sendAlert: whatsapp } = require('./whatsappBot.js')

const sendAlert = msg => {
  telegram(msg)
  whatsapp(msg)
}
module.exports = {
  sendAlert
}
