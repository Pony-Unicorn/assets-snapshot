"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyHex = exports.verifyAddress = void 0;
exports.setConfig = setConfig;
exports.getConfig = getConfig;
exports.setConfigDecimals = setConfigDecimals;
const fs_1 = __importDefault(require("fs"));
const viem_1 = require("viem");
const zod_1 = require("zod");
exports.verifyAddress = zod_1.z.custom((val) => (0, viem_1.isAddress)(val));
exports.verifyHex = zod_1.z.custom((val) => (0, viem_1.isHex)(val));
const configSchema = zod_1.z.object({
    name: zod_1.z.string(),
    provider: zod_1.z.string().url(),
    contractAddress: exports.verifyAddress,
    fromBlock: zod_1.z.union([zod_1.z.string(), zod_1.z.number().min(0)]),
    toBlock: zod_1.z.union([zod_1.z.string(), zod_1.z.number().min(0)]),
    category: zod_1.z.enum(["ERC20", "ERC721", "ERC1155"]),
    format: zod_1.z.enum(["json", "csv"]),
    blocksPerBatch: zod_1.z.number().max(2500).min(1000),
    delay: zod_1.z.number().max(2000).min(0),
    decimals: zod_1.z.number().optional()
});
let config;
function setConfig(pathConfig) {
    const parseConfig = JSON.parse(fs_1.default.readFileSync(pathConfig, "utf8"));
    config = configSchema.parse(parseConfig);
}
function getConfig() {
    if (typeof config === "undefined") {
        throw new Error("Config not set");
    }
    return config;
}
function setConfigDecimals(decimals) {
    config.decimals = decimals;
}
