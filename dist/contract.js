"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getERC721Transfer = exports.getERC20Transfer = exports.getERC20Decimals = exports.getBlockNumber = exports.getClient = void 0;
const viem_1 = require("viem");
const config_1 = require("./config");
const chains_1 = require("viem/chains");
const zod_1 = require("zod");
let client;
const getClient = () => {
    if (typeof client === "undefined") {
        const config = (0, config_1.getConfig)();
        client = (0, viem_1.createPublicClient)({
            chain: chains_1.mainnet,
            transport: (0, viem_1.http)(config.provider)
        });
    }
    return client;
};
exports.getClient = getClient;
const getBlockNumber = async () => {
    const blockNumber = await (0, exports.getClient)().getBlockNumber();
    return blockNumber;
};
exports.getBlockNumber = getBlockNumber;
const getERC20Decimals = async () => {
    const decimals = await (0, exports.getClient)().readContract({
        address: (0, config_1.getConfig)().contractAddress,
        abi: viem_1.erc20Abi,
        functionName: "decimals"
    });
    (0, config_1.setConfigDecimals)(decimals);
    return decimals;
};
exports.getERC20Decimals = getERC20Decimals;
const ERC20TransferSchema = zod_1.z.array(zod_1.z.object({
    blockNum: zod_1.z.bigint().nonnegative(),
    hash: config_1.verifyHex,
    from: config_1.verifyAddress,
    to: config_1.verifyAddress,
    value: zod_1.z.bigint().nonnegative(),
    logIndex: zod_1.z.number()
}));
const getERC20Transfer = async (fromBlock, toBlock) => {
    const logs = await (0, exports.getClient)().getContractEvents({
        address: (0, config_1.getConfig)().contractAddress,
        abi: viem_1.erc20Abi,
        eventName: "Transfer",
        fromBlock,
        toBlock
    });
    return ERC20TransferSchema.parse(logs.map((log) => {
        return {
            blockNum: log.blockNumber,
            hash: log.transactionHash,
            from: (0, viem_1.getAddress)(log.args.from),
            to: (0, viem_1.getAddress)(log.args.to),
            value: log.args.value,
            logIndex: log.logIndex
        };
    }));
};
exports.getERC20Transfer = getERC20Transfer;
const ERC721TransferSchema = zod_1.z.array(zod_1.z.object({
    blockNum: zod_1.z.bigint().nonnegative(),
    hash: config_1.verifyHex,
    from: config_1.verifyAddress,
    to: config_1.verifyAddress,
    tokenId: zod_1.z.bigint().nonnegative(),
    logIndex: zod_1.z.number()
}));
const getERC721Transfer = async (fromBlock, toBlock) => {
    const logs = await (0, exports.getClient)().getContractEvents({
        address: (0, config_1.getConfig)().contractAddress,
        abi: viem_1.erc721Abi,
        eventName: "Transfer",
        fromBlock,
        toBlock
    });
    return ERC721TransferSchema.parse(logs.map((log) => {
        return {
            blockNum: log.blockNumber,
            hash: log.transactionHash,
            from: (0, viem_1.getAddress)(log.args.from),
            to: (0, viem_1.getAddress)(log.args.to),
            tokenId: log.args.tokenId,
            logIndex: log.logIndex
        };
    }));
};
exports.getERC721Transfer = getERC721Transfer;
