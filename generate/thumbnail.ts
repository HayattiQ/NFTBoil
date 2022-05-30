import sharp = require('sharp');
import * as traitConfig from "./config.json";
import fs = require('fs');
import { Command, Option } from 'commander';

const program = new Command().addOption(new Option('-i, --increment <number>', 'Thumbnail File increment number').default(0, 'zero'))
const options = program.parse().opts();

const dirFiles = fs.readdirSync(traitConfig.output_dir);

function main(dirFiles: Array<string>) {
  if (!fs.existsSync(traitConfig.thumbnail_dir)) {
    fs.mkdirSync(traitConfig.thumbnail_dir);
  }
  console.log("Start from " + options['increment']);
  for (let i = options['increment']; i < dirFiles.length; i++) {
    const filename = dirFiles[i];
    if (!filename) {
      console.log("dirFiles " + i + " is null");
      continue;
    }
    makeThumbnail(filename);
  }
}

async function makeThumbnail(file: string) {
  await sharp(traitConfig.output_dir + file)
    .resize(traitConfig.thumbnail)
    .toFile(traitConfig.thumbnail_dir + file);
  console.log("thumbnail created;" + file);
}

main(dirFiles);