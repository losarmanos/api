const TelegramBot = require('node-telegram-bot-api')

const token = process.env.TELEGRAM_TOKEN
const bot = new TelegramBot(token, { polling: true })

// bot.on('message', (msg) => {
//   console.log(msg)
// })

const sendAlert = msg => {
  bot.sendMessage(process.env.TELEGRAM_CHANNEL, msg, {
    parse_mode: 'MarkdownV2',
    message_thread_id: process.env.TELEGRAM_CHANNEL_TOPIC
  })
}
module.exports = {
  sendAlert
}
