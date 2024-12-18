import fs from "fs";
import { Command } from "commander";

import pk from "../package.json";
import { start } from "./app";
import { setConfig } from "./config";
import { initTable } from "./db";

const program = new Command();

program.name(pk.name).description(pk.description).version(pk.version);

program.option("-c, --config <path>", "Path to the configuration file").action(async () => {
  console.log("Start synchronizing snapshots...");

  const options = program.opts();

  let configPath = options.config;

  if (typeof configPath === "undefined") {
    configPath = "./snapshot.json";
  }

  // 检查配置文件是否存在
  if (fs.existsSync(configPath)) {
    try {
      setConfig(configPath);
      await initTable();
      await start();
    } catch (e) {
      console.error(e);
    }
  } else {
    console.error(`Config file not found: ${configPath}`);
    process.exit(1);
  }
});

program.parse(process.argv);
