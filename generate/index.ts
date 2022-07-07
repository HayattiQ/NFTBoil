import fs = require('fs')
import { parse } from 'csv-parse/sync'
import sharp = require('sharp')
import * as traitConfig from './config.json'

const data = fs.readFileSync('metadata.csv')

type TraitData = {
  id: string
  attributes: {
    [key: string]: string
  }
}

type CSVRecords = {
  [key: string]: string
}[]

const records: any = parse(data, {
  encoding: 'utf8',
  columns: true,
})

const isRecords = (records: any): records is CSVRecords => {
  if (!records) {
    return false
  } else if (!Array.isArray(records)) {
    return false
  }

  for (const rec of records) {
    if (!(rec instanceof Object)) {
      return false
    }
  }
  return true
}

function traitMatch(rec: { [key: string]: string }) {
  // eslint-disable-next-line dot-notation
  if (!rec['id']) {
    console.log(rec)
    throw new Error('CSV need id field')
  }
  const trait: TraitData = {
    // eslint-disable-next-line dot-notation
    id: rec['id'],
    attributes: {},
  }

  for (const [key, value] of Object.entries(rec)) {
    if (traitConfig.traits.find((v) => v.name === key)) {
      trait.attributes[key] = value
    }
  }
  return trait
}

function toTraitData(records: CSVRecords): TraitData[] {
  const traits: TraitData[] = []
  for (const rec of records) {
    traits.push(traitMatch(rec))
  }
  return traits
}

function main(records: any) {
  if (!isRecords(records)) {
    throw new Error('records type is invalid')
  }

  if (!fs.existsSync(traitConfig.output_dir)) {
    fs.mkdirSync(traitConfig.output_dir)
  }

  const traits = toTraitData(records)
  const num = traits.length
  for (const trait of traits) {
    traitConfigCheck(trait)
    compositeImage(trait, String(num).length)
  }
}

function traitConfigCheck(trait: TraitData) {
  const attributeKeys = Object.keys(trait.attributes)
  const traitConfigKeys = traitConfig.traits.map((e) => e.name)
  for (const keys of traitConfigKeys) {
    if (!attributeKeys.find((e) => e === keys)) {
      throw new Error('Error. not found trait attributes in config. ' + keys)
    }
  }
}

async function compositeImage(trait: TraitData, zeroPaddingLength: number) {
  const attributes = Object.entries(trait.attributes)
    .map(([key, value]) => ({ key, value }))
    .sort(fnSort)
  const firstTrait = attributes.shift()
  const restTrait: any[] = []
  if (firstTrait === undefined) throw new Error('First Trait is undefined')

  const id: number = parseInt(trait.id)
  if (id > traitConfig.max_image_generate) {
    return
  }

  for (const atr of attributes) {
    if (atr.value !== 'None') {
      const traitPath =
        traitConfig.assset_dir + atr.key + '/' + atr.value + '.png'
      if (!fs.existsSync(traitPath)) console.log(traitPath + ' is not exsit')
      restTrait.push({ input: traitPath })
    }
  }
  try {
    const firstTraitPath =
      traitConfig.assset_dir + firstTrait.key + '/' + firstTrait.value + '.png'
    if (!fs.existsSync(firstTraitPath)) {
      console.log('First trait path is null. ' + firstTraitPath)
    }
    const image = sharp(firstTraitPath)
    image.composite(restTrait)
    const fileName = zeroPadding(trait.id, zeroPaddingLength) + '.png'

    image
      .toFile(traitConfig.output_dir + fileName)
      .then(function () {
        console.log('image created. ' + fileName)
      })
      .catch(function (err) {
        console.log('Error occured ', err)
        console.log('trait', trait)
      })
  } catch (err) {
    console.log('catched exception', err)
  }
}

main(records)

function fnSort(
  a: { key: string; value: string },
  b: { key: string; value: string }
) {
  return (
    traitConfig.traits.find((v) => v.name === a.key)!.order -
    traitConfig.traits.find((v) => v.name === b.key)!.order
  )
}

function zeroPadding(num: string, len: number) {
  return (Array(len).join('0') + num).slice(-len)
}
