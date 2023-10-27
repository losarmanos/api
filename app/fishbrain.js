const FishBrain = {
  memory: {},
  store (key, value) {
    this.memory[key] = {
      value,
      TTL: new Date().getTime() + 1000 * 60 * 10 // mili * secs * mins
    }
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
