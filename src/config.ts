import fs from "fs";
import { Address, isAddress, isHex, Hex } from "viem";
import { z } from "zod";

export const verifyAddress = z.custom<Address>((val) => isAddress(val));
export const verifyHex = z.custom<Hex>((val) => isHex(val));

const configSchema = z.object({
  name: z.string(),
  provider: z.string().url(),
  contractAddress: verifyAddress,
  fromBlock: z.union([z.string(), z.number().min(0)]),
  toBlock: z.union([z.string(), z.number().min(0)]),
  category: z.enum(["ERC20", "ERC721", "ERC1155"]),
  format: z.enum(["json", "csv"]),
  blocksPerBatch: z.number().max(2500).min(1000),
  delay: z.number().max(2000).min(0),
  decimals: z.number().optional()
});

export type IConfig = z.infer<typeof configSchema>;

let config: IConfig;

export function setConfig(pathConfig: string) {
  const parseConfig = JSON.parse(fs.readFileSync(pathConfig, "utf8"));

  config = configSchema.parse(parseConfig);
}

export function getConfig() {
  if (typeof config === "undefined") {
    throw new Error("Config not set");
  }
  return config;
}

export function setConfigDecimals(decimals: number) {
  config.decimals = decimals;
}
