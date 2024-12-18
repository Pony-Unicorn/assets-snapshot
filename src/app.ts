import { formatUnits } from "viem";
import { getConfig } from "./config";
import { getBlockNumber, getERC20Decimals, getERC20Transfer, getERC721Transfer } from "./contract";
import { getAssetTransfersERC20, getMaxBlockNum, IAssetTransactionsERC20, insertTransactionsERC20 } from "./db";
import { sleep } from "./helper";
import { exportBalancesERC20, IExportBalancesERC20 } from "./export";

export const start = async () => {
  const config = getConfig();
  if (config.category === "ERC20") {
    await handleERC20();
  } else if (config.category === "ERC721") {
    await handleERC721();
  } else if (config.category === "ERC1155") {
    await handleERC1155();
  } else {
    console.error("Invalid category");
  }
};

const handleERC20 = async () => {
  const config = getConfig();

  await getERC20Decimals();

  let fromBlock = BigInt(config.fromBlock);
  let toBlock = 0n;

  const maxBlockNum = await getMaxBlockNum();

  if (maxBlockNum) {
    console.log("Resuming from the last downloaded block #", maxBlockNum);
    fromBlock = BigInt(maxBlockNum) + 1n;
  }

  if (config.toBlock === "latest") {
    toBlock = await getBlockNumber();
  } else {
    toBlock = BigInt(config.toBlock);
  }

  console.log("From %d to %d", fromBlock, toBlock);

  const blocksPerBatch = BigInt(config.blocksPerBatch);
  const delay = config.delay;

  let start = fromBlock;
  let end = fromBlock + blocksPerBatch;
  let i = 0;

  while (end < toBlock) {
    i++;

    if (delay) {
      await sleep(delay);
    }

    console.log("Batch", i, " From", start, "to", end);

    const logs = await getERC20Transfer(start, end);

    const transactions = logs.map((log) => ({
      blockNum: Number(log.blockNum),
      hash: log.hash,
      sender: log.from,
      recipient: log.to,
      logIndex: log.logIndex,
      value: log.value.toString()
    }));

    console.log("Transactions count ", transactions.length);

    await insertTransactionsERC20(transactions);

    start = end + 1n;
    end = start + blocksPerBatch;

    if (end > toBlock) {
      end = toBlock;
    }
  }

  console.log("Calculating balances of %s ", config.name);

  const balances = new Map<string, { deposits: bigint; withdrawals: bigint }>();
  const closingBalances: IExportBalancesERC20[] = [];

  const setDeposits = (event: IAssetTransactionsERC20) => {
    const wallet = event.recipient;

    let deposits = (balances.get(wallet) || {}).deposits || 0n;
    let withdrawals = (balances.get(wallet) || {}).withdrawals || 0n;

    if (event.value) {
      deposits = deposits + BigInt(event.value);
      balances.set(wallet, { deposits, withdrawals });
    }
  };

  const setWithdrawals = (event: IAssetTransactionsERC20) => {
    const wallet = event.sender;

    let deposits = (balances.get(wallet) || {}).deposits || 0n;
    let withdrawals = (balances.get(wallet) || {}).withdrawals || 0n;

    if (event.value) {
      withdrawals = withdrawals + BigInt(event.value);
      balances.set(wallet, { deposits, withdrawals });
    }
  };

  let isComplete = false;
  let lastId = 0;

  while (!isComplete) {
    const transactions = await getAssetTransfersERC20(lastId);
    if (transactions && transactions.length > 0) {
      lastId = transactions[transactions.length - 1].id;

      for (const event of transactions) {
        setDeposits(event);
        setWithdrawals(event);
      }
    } else {
      isComplete = true;
    }
  }

  for (const [key, value] of balances.entries()) {
    if (key === "0x0000000000000000000000000000000000000000") continue;

    const balance = value.deposits - value.withdrawals;

    if (balance > 0n) {
      closingBalances.push({
        wallet: key,
        balance: formatUnits(balance, config.decimals!)
      });
    }
  }

  const sortedBalances = closingBalances.sort((a, b) => Number(b.balance) - Number(a.balance));

  console.log("Exporting balances");
  await exportBalancesERC20(sortedBalances);
  console.log("Exporting balances complete");
};

const handleERC721 = async () => {
  const logs = await getERC721Transfer(17572615n, 17572617n);
  console.log(logs);
};

const handleERC1155 = async () => {};
