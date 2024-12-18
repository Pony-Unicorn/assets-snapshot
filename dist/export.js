"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportBalancesERC20 = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const config_1 = require("./config");
const exportBalancesERC20 = (balances) => {
    const config = (0, config_1.getConfig)();
    if (config.category !== "ERC20") {
        throw new Error("Invalid category");
    }
    const rootDir = path_1.default.resolve(__dirname, "../"); // 根据你的项目结构调整
    const balancesDir = path_1.default.join(rootDir, "balances");
    if (!fs_1.default.existsSync(balancesDir)) {
        fs_1.default.mkdirSync(balancesDir);
    }
    if (config.format === "json") {
        const filePath = path_1.default.join(balancesDir, `${config.name}.json`);
        fs_1.default.writeFileSync(filePath, JSON.stringify(balances, null, 2), "utf-8");
    }
    else if (config.format === "csv") {
        return balances.map((balance) => `${balance.wallet},${balance.balance}`).join("\n");
    }
    else {
        throw new Error("Invalid format");
    }
};
exports.exportBalancesERC20 = exportBalancesERC20;
