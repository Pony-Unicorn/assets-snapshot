import { Address, createPublicClient, erc20Abi, erc721Abi, http, PublicClient, Hex, getAddress } from "viem";
import { setConfigDecimals, getConfig, verifyAddress, verifyHex } from "./config";
import { mainnet } from "viem/chains";
import { z } from "zod";

let client: PublicClient;

export const getClient = () => {
  if (typeof client === "undefined") {
    const config = getConfig();

    client = createPublicClient({
      chain: mainnet,
      transport: http(config.provider)
    });
  }

  return client;
};

export const getBlockNumber = async () => {
  const blockNumber = await getClient().getBlockNumber();

  return blockNumber;
};

export const getERC20Decimals = async () => {
  const decimals = await getClient().readContract({
    address: getConfig().contractAddress,
    abi: erc20Abi,
    functionName: "decimals"
  });

  setConfigDecimals(decimals);
  return decimals;
};

const ERC20TransferSchema = z.array(
  z.object({
    blockNum: z.bigint().nonnegative(),
    hash: verifyHex,
    from: verifyAddress,
    to: verifyAddress,
    value: z.bigint().nonnegative(),
    logIndex: z.number()
  })
);

export type ERC20TransferRecord = z.infer<typeof ERC20TransferSchema>;

export const getERC20Transfer = async (fromBlock: bigint, toBlock: bigint) => {
  const logs = await getClient().getContractEvents({
    address: getConfig().contractAddress,
    abi: erc20Abi,
    eventName: "Transfer",
    fromBlock,
    toBlock
  });

  return ERC20TransferSchema.parse(
    logs.map((log) => {
      return {
        blockNum: log.blockNumber,
        hash: log.transactionHash,
        from: getAddress(log.args.from as Address),
        to: getAddress(log.args.to as Address),
        value: log.args.value as bigint,
        logIndex: log.logIndex
      };
    })
  );
};

const ERC721TransferSchema = z.array(
  z.object({
    blockNum: z.bigint().nonnegative(),
    hash: verifyHex,
    from: verifyAddress,
    to: verifyAddress,
    tokenId: z.bigint().nonnegative(),
    logIndex: z.number()
  })
);

export type ERC721TransferRecord = z.infer<typeof ERC721TransferSchema>;

export const getERC721Transfer = async (fromBlock: bigint, toBlock: bigint) => {
  const logs = await getClient().getContractEvents({
    address: getConfig().contractAddress,
    abi: erc721Abi,
    eventName: "Transfer",
    fromBlock,
    toBlock
  });

  return ERC721TransferSchema.parse(
    logs.map((log) => {
      return {
        blockNum: log.blockNumber,
        hash: log.transactionHash,
        from: getAddress(log.args.from as Address),
        to: getAddress(log.args.to as Address),
        tokenId: log.args.tokenId as bigint,
        logIndex: log.logIndex
      };
    })
  );
};
