module.exports = {
  apps: [
    {
      name: 'CalendarProxy',
      script: './app/webserver.js',
      instances: 1,
      max_memory_restart: '100M'
    }
  ]
}
