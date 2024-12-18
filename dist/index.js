"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const commander_1 = require("commander");
const package_json_1 = __importDefault(require("../package.json"));
const app_1 = require("./app");
const config_1 = require("./config");
const db_1 = require("./db");
const program = new commander_1.Command();
program.name(package_json_1.default.name).description(package_json_1.default.description).version(package_json_1.default.version);
program.option("-c, --config <path>", "Path to the configuration file").action(async () => {
    console.log("Start synchronizing snapshots...");
    const options = program.opts();
    let configPath = options.config;
    if (typeof configPath === "undefined") {
        configPath = "./snapshot.json";
    }
    // 检查配置文件是否存在
    if (fs_1.default.existsSync(configPath)) {
        try {
            (0, config_1.setConfig)(configPath);
            await (0, db_1.initTable)();
            await (0, app_1.start)();
        }
        catch (e) {
            console.error(e);
        }
    }
    else {
        console.error(`Config file not found: ${configPath}`);
        process.exit(1);
    }
});
program.parse(process.argv);
