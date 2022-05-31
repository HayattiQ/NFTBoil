import { parse } from "csv-parse/sync";
import fs = require("fs");
import * as config from "./config.json";
import { OptionValues, program } from "commander";

program.option("-p, --pack");
program.option("-i, --indent", "output json add indent");
program.parse();
const options = program.opts();
const indent_number = options["indent"] ? 2 : undefined;

type CSVRecords = {
  [key: string]: string;
}[];

type OpenSeaMetaData = {
  name: string;
  description: string;
  image?: string;
  external_url?: string;
  background_color?: string;
  attributes: {
    trait_type: string;
    value: string;
  }[];
};

const isRecords = (records: any): records is CSVRecords => {
  if (!records) {
    return false;
  } else if (!Array.isArray(records)) {
    return false;
  }

  for (const rec of records) {
    if (!(rec instanceof Object)) {
      return false;
    }
  }
  return true;
};

function main(options: OptionValues) {
  const data = fs.readFileSync(config.csv_file_name);
  const records: any = parse(data, {
    columns: true,
  });

  if (!isRecords(records)) {
    throw new Error("records type is invalid");
  }

  if (!fs.existsSync(config.json_dir)) {
    fs.mkdirSync(config.json_dir);
  }
  if (options["pack"]) {
    const metadata = JSON.stringify(
      records.map((rec) => convertMetaData(rec)),
      null,
      indent_number
    );
    fs.writeFileSync(config.json_dir + "packed.json", metadata);
  } else {
    for (const rec of records) {
      const metadata = JSON.stringify(
        convertMetaData(rec),
        null,
        indent_number
      );
      fs.writeFileSync(config.json_dir + rec["id"] + ".json", metadata);
    }
  }
}

function convertMetaData(rec: { [key: string]: string }): OpenSeaMetaData {
  if (!rec["name"] || !rec["description"])
    throw new Error("name or description is null");
  let metadata: OpenSeaMetaData = {
    name: rec["name"],
    description: rec["description"],
    external_url: rec["external_url"],
    image: rec["image"],
    background_color: rec["background_color"],
    attributes: [],
  };

  for (const att of config.traits) {
    metadata.attributes.push({
      trait_type: att.name.charAt(0).toUpperCase() + att.name.slice(1),
      value: rec[att.name]!,
    });
  }

  return metadata;
}

main(options);
