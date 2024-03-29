const { GoogleSpreadsheet } = require('google-spreadsheet')
const { JWT } = require('google-auth-library')
const { randomUUID } = require('crypto')
const { FishBrain } = require('./fishbrain')

const serviceAccountAuth = new JWT({
  email: process.env.GOOGLE_SERVICE_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY,
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets'
  ]
})

let dirty = false
const setUID = (uids, row) => {
  if (row.get('UID')) return row
  dirty = true
  const [, , , , UID] = randomUUID().split('-')
  if (uids.includes(UID)) return setUID(uids, row)
  row.assign({ UID })
  row._dirty = true
  return row
}

const saveRows = async ([row, ...tail], sheet) => {
  if (!row) return await sheet.getRows()
  if (row._dirty) {
    console.log('saving row...')
    await row.save()
  }
  return saveRows(tail, sheet)
}

const loadRows = async () => {
  const doc = new GoogleSpreadsheet(process.env.GOOGLE_SPREADSHEET, serviceAccountAuth)
  const cleanRows = []
  await doc.loadInfo()
  const sheet = doc.sheetsByIndex[0] // resultados del formulario
  let rows = await sheet.getRows()
  const uids = []
  rows.forEach(row => uids.push(row.get('UID')))
  rows.forEach(_row => { setUID(uids, _row) })
  if (dirty) rows = await saveRows(rows, sheet)
  rows.forEach(row => {
    cleanRows.push({
      name: row.get('Nombre completo'),
      dob: row.get('Fecha de nacimiento'),
      address: row.get('Dirección'),
      phone: row.get('Teléfono'),
      emergencyContact: row.get('Contacto de emergencia'),
      emergencyPhone: row.get('Teléfono del contacto de emergencia'),
      medicConditions: row.get('Enfermedades crónicas y alergias'),
      bloodType: row.get('Tipo de sangre'),
      vehicle: row.get('Marca y modelo de tu moto'),
      insurance: row.get('Seguro de tu moto (Compañía y número de póliza)'),
      active: row.get('Activo'),
      picture: row.get('Foto'),
      UID: row.get('UID')
    })
  })
  return cleanRows
    .filter(row => row.active === 'Si')
    .map(row => {
      delete row.active
      return row
    })
}

const getMember = async (uid) => {
  const { value } = FishBrain.read('members')
  if (value) {
    console.log('<- Cache response')
    return JSON.parse(JSON.stringify(value.find(member => member.UID === uid)))
  }
  console.log('<- Remote response')
  const members = await loadRows()
  FishBrain.store('members', members)
  return JSON.parse(JSON.stringify(members.find(member => member.UID === uid)))
}

module.exports = {
  getMember
}
