// limpieza de strings
const processText = text => {
  return text.replace(/\\/g, '')
}

// Recibe un timestamp en formato internacional o en formato de 8 digitos y
// regresa un epoch
const processTimeStamp = timestamp => {
  const year = parseInt(timestamp.slice(0, 4))
  const month = parseInt(timestamp.slice(4, 6)) - 1
  const day = parseInt(timestamp.slice(6, 8))
  if (timestamp.length === 8) {
    return new Date(Date.UTC(year, month, day)).getTime()
  }
  const hour = parseInt(timestamp.slice(9, 11))
  const minute = parseInt(timestamp.slice(11, 13))
  const second = parseInt(timestamp.slice(13, 15))
  return new Date(Date.UTC(year, month, day, hour, minute, second)).getTime()
}

// Procesamiento de iCal, obtiene el string completo y regresa un arreglo
// ordenado y filtrado de objetos de calendario con textos
// y elementos normalizados
const processCalendar = (icalData) => {
  const [, ...items] = icalData.split('BEGIN:VEVENT')
  return items
    .map(item => {
      const event = {}

      const lines = item.split('\r\n')
      let section = ''
      for (const line of lines.filter(l => l !== '')) {
        if (/^[A-Z-=;]+:/.test(line)) {
          const [k, value] = line.split(':')
          const key = k.toLowerCase()
          section = key
          event[key] = value.trim()
        } else {
          event[section] += line.trim()
        }
      }
      const evt = {}
      evt.start = processText(event.dtstart || event['dtstart;value=date'])
      evt.end = processText(event.dtend || event['dtend;value=date'])
      if (event.location) evt.location = processText(event.location)
      evt.name = processText(event.summary)
      if (event.description) evt.description = processText(event.description)
      evt.isFullDay = !!event['dtstart;value=date']
      evt.key = processTimeStamp(evt.start)

      return evt
    })
    .sort((a, b) => { // sort porque originalmente vienen en orden de creación
      if (a.key < b.key) return -1
      if (a.key > b.key) return 1
      return 0
    })
    .filter(item => {
      const yd = new Date()
      yd.setDate(yd.getDate() - 1)
      return new Date(item.key).getTime() > yd.getTime()
    })
}

module.exports = {
  processCalendar
}
