import { formatUnits } from 'viem';
import { getConfig } from './config';
import {
  getBlockNumber,
  getERC20Decimals,
  getERC20Transfer,
  getERC721Transfer
} from './contract';
import {
  getAssetTransfersERC20,
  getAssetTransfersERC721,
  getMaxBlockNum,
  insertTransactionsERC20,
  insertTransactionsERC721
} from './db';
import { sleep } from './helper';
import { exportBalancesERC20, exportBalancesERC721 } from './export';

const zeroAddress = '0x0000000000000000000000000000000000000000';

export const start = async () => {
  const config = getConfig();
  if (config.category === 'ERC20') {
    await handleERC20();
  } else if (config.category === 'ERC721') {
    await handleERC721();
  } else if (config.category === 'ERC1155') {
    await handleERC1155();
  } else {
    console.error('Invalid category');
  }
};

const handleERC20 = async () => {
  const config = getConfig();

  await getERC20Decimals();

  let fromBlock = BigInt(config.fromBlock);
  let toBlock = 0n;

  const maxBlockNum = await getMaxBlockNum();

  if (maxBlockNum) {
    console.log('Resuming from the last downloaded block #', maxBlockNum);
    fromBlock = BigInt(maxBlockNum) + 1n;
  }

  if (config.toBlock === 'latest') {
    toBlock = await getBlockNumber();
  } else {
    toBlock = BigInt(config.toBlock);
  }

  console.log('From %d to %d', fromBlock, toBlock);

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

    console.log('Batch', i, ' From', start, 'to', end);

    const logs = await getERC20Transfer(start, end);

    const transactions = logs.map((log) => ({
      blockNum: Number(log.blockNum),
      hash: log.hash,
      sender: log.from,
      recipient: log.to,
      logIndex: log.logIndex,
      value: log.value.toString()
    }));

    console.log('Transactions count ', transactions.length);

    await insertTransactionsERC20(transactions);

    start = end + 1n;
    end = start + blocksPerBatch;

    if (end > toBlock) {
      end = toBlock;
    }
  }

  console.log('Calculating balances of %s ', config.name);

  let isComplete = false;
  let lastId = 0;

  const balancesTable = new Map<string, bigint>();
  balancesTable.set(zeroAddress, 0n); // add 0x0 address

  while (!isComplete) {
    const transactions = await getAssetTransfersERC20(lastId);
    if (transactions && transactions.length > 0) {
      lastId = transactions[transactions.length - 1].id;

      for (const event of transactions) {
        balancesTable.has(event.recipient)
          ? balancesTable.set(
              event.recipient,
              (balancesTable.get(event.recipient) as bigint) +
                BigInt(event.value)
            )
          : balancesTable.set(event.recipient, BigInt(event.value));

        balancesTable.set(
          event.sender,
          (balancesTable.get(event.sender) as bigint) - BigInt(event.value)
        );
      }
    } else {
      isComplete = true;
    }
  }

  const balances = Array.from(balancesTable, ([wallet, balance]) => ({
    wallet,
    balance
  }))
    .filter(({ balance }) => balance > 0n)
    .sort((a, b) => (a.balance > b.balance ? -1 : 1))
    .map(({ wallet, balance }) => ({
      wallet,
      balance: formatUnits(balance, config.decimals!)
    }));

  console.log('Exporting balances');
  await exportBalancesERC20(balances);
  console.log('Exporting balances complete');
};

const handleERC721 = async () => {
  const config = getConfig();

  let fromBlock = BigInt(config.fromBlock);
  let toBlock = 0n;

  const maxBlockNum = await getMaxBlockNum();

  if (maxBlockNum) {
    console.log('Resuming from the last downloaded block #', maxBlockNum);
    fromBlock = BigInt(maxBlockNum) + 1n;
  }

  if (config.toBlock === 'latest') {
    toBlock = await getBlockNumber();
  } else {
    toBlock = BigInt(config.toBlock);
  }

  console.log('From %d to %d', fromBlock, toBlock);

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

    console.log('Batch', i, ' From', start, 'to', end);

    const logs = await getERC721Transfer(start, end);

    const transactions = logs.map((log) => ({
      blockNum: Number(log.blockNum),
      hash: log.hash,
      sender: log.from,
      recipient: log.to,
      logIndex: log.logIndex,
      tokenId: log.tokenId.toString()
    }));

    console.log('Transactions count ', transactions.length);

    await insertTransactionsERC721(transactions);

    start = end + 1n;
    end = start + blocksPerBatch;

    if (end > toBlock) {
      end = toBlock;
    }
  }

  console.log('Calculating balances of %s ', config.name);

  let isComplete = false;
  let lastId = 0;

  const balancesTable = new Map<string, string[]>();
  balancesTable.set(zeroAddress, []); // add 0x0 address

  while (!isComplete) {
    const transactions = await getAssetTransfersERC721(lastId);
    if (transactions && transactions.length > 0) {
      lastId = transactions[transactions.length - 1].id;

      for (const event of transactions) {
        balancesTable.has(event.recipient)
          ? (balancesTable.get(event.recipient) as string[]).push(event.tokenId)
          : balancesTable.set(event.recipient, [event.tokenId]);
        const updatedBalances = (
          balancesTable.get(event.sender) as string[]
        ).filter((tokenId) => tokenId !== event.tokenId);
        balancesTable.set(event.sender, updatedBalances);
      }
    } else {
      isComplete = true;
    }
  }

  balancesTable.delete(zeroAddress); // remove 0x0 address

  const balances = Array.from(balancesTable, ([wallet, tokenIds]) => ({
    wallet,
    tokenIds
  })).filter((b) => b.tokenIds.length > 0);

  console.log('Exporting balances');
  await exportBalancesERC721(balances);
  console.log('Exporting balances complete');
};

const handleERC1155 = async () => {
  console.warn('Not implemented yet');
};
