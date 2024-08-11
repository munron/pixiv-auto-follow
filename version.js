import * as fs from 'fs'

const json = JSON.parse(fs.readFileSync('./package.json', 'utf8'))
console.log(json.version)
