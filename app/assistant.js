const OpenAI = require('openai')
const openai = new OpenAI()

async function main () {
  const assistant = { id: process.env.OPENAI_ASSISTANT_ID }
  const thread = await openai.beta.threads.create()

  return async (content) => {
    await openai.beta.threads.messages.create(
      thread.id,
      {
        role: 'user',
        content
      }
    )

    const run = await openai.beta.threads.runs.createAndPoll(
      thread.id,
      {
        assistant_id: assistant.id
      }
    )

    return new Promise(resolve => {
      if (run.status === 'completed') {
        openai.beta.threads.messages.list(run.thread_id).then(messages => {
          const data = JSON.parse(messages.data[0].content[0].text.value)
          resolve({ status: 'success', data })
        })
      } else {
        console.error(run.status)
        resolve({ status: 'error' })
      }
    })
  }
}

module.exports = {
  main
}
