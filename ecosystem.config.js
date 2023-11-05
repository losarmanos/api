module.exports = {
  apps: [
    {
      name: 'ArmanosApi',
      script: './app/webserver.js',
      instances: 1,
      max_memory_restart: '100M'
    }
  ]
}
