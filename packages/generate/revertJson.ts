import path from 'path'
import * as fs from 'fs'
import * as fsasync from 'fs/promises'
import * as config from './config.json'
import { stringify } from 'csv-stringify/sync'

async function main() {
  if (!fs.existsSync(config.json_dir)) {
    throw new Error(config.json_dir + 'is not exist')
  }

  const attributes = config.traits
    .filter((e) => e.json !== false)
    .map((e) => e.name.toUpperCase())
  console.log(attributes)

  const dirents = fs.readdirSync(config.json_dir, { withFileTypes: true })
  const data = []
  for (const dirent of dirents) {
    const fp = path.join(config.json_dir, dirent.name)
    if (!dirent.isDirectory()) {
      data.push(await readJsonFile(fp, dirent.name))
    }
  }
  const csvData = stringify(data, {
    columns: ['tokenID', 'name', 'image', 'description'].concat(attributes),
    header: true,
  })
  fs.writeFileSync('./jsondata.csv', csvData)
}

async function readJsonFile(fp: string, filename: string) {
  const csvRow: any = {}
  const json: Promise<string> = fsasync.readFile(fp, 'utf8')
  const metadata = JSON.parse(await json)
  csvRow.tokenID = filename
  csvRow.name = metadata.name
  csvRow.description = metadata.description
  csvRow.external_url = metadata.external_url
  csvRow.image = metadata.image
  if (metadata.attributes) {
    for (const atr of metadata.attributes) {
      csvRow[atr.trait_type] = atr.value
    }
  }
  return csvRow
}

main()
