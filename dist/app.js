"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.start = void 0;
const viem_1 = require("viem");
const config_1 = require("./config");
const contract_1 = require("./contract");
const db_1 = require("./db");
const helper_1 = require("./helper");
const export_1 = require("./export");
const start = async () => {
    const config = (0, config_1.getConfig)();
    if (config.category === "ERC20") {
        await handleERC20();
    }
    else if (config.category === "ERC721") {
        await handleERC721();
    }
    else if (config.category === "ERC1155") {
        await handleERC1155();
    }
    else {
        console.error("Invalid category");
    }
};
exports.start = start;
const handleERC20 = async () => {
    const config = (0, config_1.getConfig)();
    await (0, contract_1.getERC20Decimals)();
    let fromBlock = BigInt(config.fromBlock);
    let toBlock = 0n;
    const maxBlockNum = await (0, db_1.getMaxBlockNum)();
    if (maxBlockNum) {
        console.log("Resuming from the last downloaded block #", maxBlockNum);
        fromBlock = BigInt(maxBlockNum) + 1n;
    }
    if (config.toBlock === "latest") {
        toBlock = await (0, contract_1.getBlockNumber)();
    }
    else {
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
            await (0, helper_1.sleep)(delay);
        }
        console.log("Batch", i, " From", start, "to", end);
        const logs = await (0, contract_1.getERC20Transfer)(start, end);
        const transactions = logs.map((log) => ({
            blockNum: Number(log.blockNum),
            hash: log.hash,
            sender: log.from,
            recipient: log.to,
            logIndex: log.logIndex,
            value: log.value.toString()
        }));
        console.log("Transactions count ", transactions.length);
        await (0, db_1.insertTransactionsERC20)(transactions);
        start = end + 1n;
        end = start + blocksPerBatch;
        if (end > toBlock) {
            end = toBlock;
        }
    }
    console.log("Calculating balances of %s ", config.name);
    const balances = new Map();
    const closingBalances = [];
    const setDeposits = (event) => {
        const wallet = event.recipient;
        let deposits = (balances.get(wallet) || {}).deposits || 0n;
        let withdrawals = (balances.get(wallet) || {}).withdrawals || 0n;
        if (event.value) {
            deposits = deposits + BigInt(event.value);
            balances.set(wallet, { deposits, withdrawals });
        }
    };
    const setWithdrawals = (event) => {
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
        const transactions = await (0, db_1.getAssetTransfersERC20)(lastId);
        if (transactions && transactions.length > 0) {
            lastId = transactions[transactions.length - 1].id;
            for (const event of transactions) {
                setDeposits(event);
                setWithdrawals(event);
            }
        }
        else {
            isComplete = true;
        }
    }
    for (const [key, value] of balances.entries()) {
        if (key === "0x0000000000000000000000000000000000000000") {
            continue;
        }
        const balance = value.deposits - value.withdrawals;
        closingBalances.push({
            wallet: key,
            balance: (0, viem_1.formatUnits)(balance, config.decimals)
        });
    }
    console.log("Exporting balances");
    (0, export_1.exportBalancesERC20)(closingBalances);
    console.log("Exporting balances complete");
};
const handleERC721 = async () => {
    const logs = await (0, contract_1.getERC721Transfer)(17572615n, 17572617n);
    console.log(logs);
};
const handleERC1155 = async () => { };
