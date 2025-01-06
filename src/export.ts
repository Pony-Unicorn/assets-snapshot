import fs from "fs";
import path from "path";
import * as fastcsv from "fast-csv";
import { getConfig } from "./config";

export interface IExportBalancesERC20 {
  wallet: string;
  balance: string;
}

export const exportBalancesERC20 = (balances: IExportBalancesERC20[]) => {
  return new Promise((resolve, reject) => {
    const config = getConfig();
    if (config.category !== "ERC20") {
      reject("Invalid category");
    }

    const rootDir = path.resolve(__dirname, "../"); // Adapt to your project structure

    const balancesDir = path.join(rootDir, "balances");

    if (!fs.existsSync(balancesDir)) {
      fs.mkdirSync(balancesDir);
    }

    if (config.format === "json") {
      const filePath = path.join(balancesDir, `${config.name}.json`);
      fs.writeFileSync(filePath, JSON.stringify(balances, null, 2), "utf-8");
      resolve(true);
    } else if (config.format === "csv") {
      const ws = fs.createWriteStream(path.join(balancesDir, `${config.name}.csv`));

      fastcsv
        .write(balances, { headers: true })
        .pipe(ws)
        .on("finish", () => {
          console.log("CSV file was written successfully");
          resolve(true);
        });
    } else {
      reject("Invalid format");
    }
  });
};

export interface IExportBalancesERC721 {
  wallet: string;
  tokenIds: string[];
}

export const exportBalancesERC721 = (balances: IExportBalancesERC721[]) => {
  return new Promise((resolve, reject) => {
    const config = getConfig();
    if (config.category !== "ERC721") {
      reject("Invalid category");
    }

    const rootDir = path.resolve(__dirname, "../"); // Adapt to your project structure

    const balancesDir = path.join(rootDir, "balances");

    if (!fs.existsSync(balancesDir)) {
      fs.mkdirSync(balancesDir);
    }

    if (config.format === "json") {
      const filePath = path.join(balancesDir, `${config.name}.json`);
      fs.writeFileSync(filePath, JSON.stringify(balances, null, 2), "utf-8");
      resolve(true);
    } else if (config.format === "csv") {
      const ws = fs.createWriteStream(path.join(balancesDir, `${config.name}.csv`));

      fastcsv
        .write(balances, { headers: true })
        .pipe(ws)
        .on("finish", () => {
          console.log("CSV file was written successfully");
          resolve(true);
        });
    } else {
      reject("Invalid format");
    }
  });
};
