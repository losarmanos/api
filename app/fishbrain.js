const FishBrain = {
  memory: {},
  timer: null,
  callback: () => {},
  store (key, value, cTTL = 1000 * 60 * 10) { // mili * secs * mins
    this.memory[key] = {
      value,
      TTL: new Date().getTime() + cTTL
    }
  },
  expiring () {
    const now = new Date().getTime()
    const expired = Object.entries(this.memory)
      .filter(([key]) => key.includes('roadie-'))
      .filter(([key]) => this.memory[key].TTL < now)
    this.callback(expired)
  },
  getRoadies () {
    return Object.entries(this.memory)
      .filter(([key]) => key.includes('roadie-'))
  },
  setCallback (callback) {
    this.timer = setInterval(() => this.expiring(), 1000 * 60)
    this.callback = callback
  },
  delete (key) {
    delete this.memory[key]
  },
  read (key) {
    if (!this.memory[key]) return { value: null, error: 404 }
    const { value, TTL } = this.memory[key]
    const now = new Date().getTime()
    if (now > TTL) return { value: null, error: 419 }
    return { value, error: null }
  }
}

module.exports = {
  FishBrain
}
