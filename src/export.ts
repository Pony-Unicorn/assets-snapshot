import fs from "fs";
import path from "path";
import { getConfig } from "./config";

export interface IExportBalancesERC20 {
  wallet: string;
  balance: string;
}

export const exportBalancesERC20 = (balances: IExportBalancesERC20[]) => {
  const config = getConfig();
  if (config.category !== "ERC20") {
    throw new Error("Invalid category");
  }

  const rootDir = path.resolve(__dirname, "../"); // 根据你的项目结构调整

  const balancesDir = path.join(rootDir, "balances");

  if (!fs.existsSync(balancesDir)) {
    fs.mkdirSync(balancesDir);
  }

  if (config.format === "json") {
    const filePath = path.join(balancesDir, `${config.name}.json`);
    fs.writeFileSync(filePath, JSON.stringify(balances, null, 2), "utf-8");
  } else if (config.format === "csv") {
    return balances.map((balance) => `${balance.wallet},${balance.balance}`).join("\n");
  } else {
    throw new Error("Invalid format");
  }
};
