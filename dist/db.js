"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAssetTransfersERC20 = exports.insertTransactionsERC20 = exports.getMaxBlockNum = exports.clearTable = exports.initTable = exports.execute = void 0;
const sqlite3_1 = __importDefault(require("sqlite3"));
const config_1 = require("./config");
const db = new sqlite3_1.default.Database("snapshot.db");
const getAsync = (sql) => {
    return new Promise((resolve, reject) => {
        db.get(sql, (err, row) => {
            if (err)
                reject(err);
            resolve(row);
        });
    });
};
const execute = async (db, sql) => {
    return new Promise((resolve, reject) => {
        db.exec(sql, (err) => {
            if (err)
                reject(err);
            resolve(true);
        });
    });
};
exports.execute = execute;
const getTransactionStructure = () => {
    const config = (0, config_1.getConfig)();
    let columns = `
    id INTEGER PRIMARY KEY,
    blockNum INTEGER NOT NULL,
    hash TEXT NOT NULL,
    sender TEXT NOT NULL,
    recipient TEXT NOT NULL,
    logIndex INTEGER NOT NULL
  `;
    // 根据 category 动态添加字段
    if (config.category === "ERC20") {
        columns += `,
    value TEXT NOT NULL`;
    }
    else if (config.category === "ERC721") {
        columns += `,
    tokenId TEXT NOT NULL`;
    }
    else if (config.category === "ERC1155") {
        columns += `,
    metadata TEXT NOT NULL`;
    }
    const tableSql = `CREATE TABLE IF NOT EXISTS transaction_${config.name} (${columns})`;
    const indexSql = `CREATE UNIQUE INDEX IF NOT EXISTS idx_transaction_${config.name}_block_log ON transaction_${config.name} (blockNum, logIndex)`;
    return { tableSql, indexSql };
};
const initTable = async () => {
    const { tableSql, indexSql } = getTransactionStructure();
    await (0, exports.execute)(db, tableSql);
    await (0, exports.execute)(db, indexSql);
};
exports.initTable = initTable;
const clearTable = async () => {
    await (0, exports.initTable)();
    await (0, exports.execute)(db, `DELETE FROM transaction_${(0, config_1.getConfig)().name};`);
};
exports.clearTable = clearTable;
const getMaxBlockNum = async () => {
    const config = (0, config_1.getConfig)();
    const sql = `SELECT MAX(blockNum) AS maxBlockNum FROM transaction_${config.name}`;
    const result = await getAsync(sql);
    return result?.maxBlockNum; // 返回最大值，如果没有记录则返回 null
};
exports.getMaxBlockNum = getMaxBlockNum;
const insertTransactionsERC20 = async (transactions) => {
    const config = (0, config_1.getConfig)();
    if (config.category !== "ERC20") {
        throw new Error("Invalid category");
    }
    const tableName = `transaction_${config.name}`;
    const sql = `
    INSERT INTO ${tableName} (blockNum, hash, sender, recipient, value, logIndex)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run("BEGIN TRANSACTION");
            const stmt = db.prepare(sql);
            try {
                for (const tx of transactions) {
                    stmt.run(tx.blockNum, tx.hash, tx.sender, tx.recipient, tx.value, tx.logIndex);
                }
                stmt.finalize();
                db.run("COMMIT", (err) => {
                    if (err)
                        reject(err);
                    resolve();
                });
            }
            catch (error) {
                db.run("ROLLBACK", () => reject(error));
            }
        });
    });
};
exports.insertTransactionsERC20 = insertTransactionsERC20;
const getAssetTransfersERC20 = async (lastId = 0) => {
    const config = (0, config_1.getConfig)();
    if (config.category !== "ERC20") {
        throw new Error("Invalid category");
    }
    const tableName = `transaction_${config.name}`;
    const sql = `
  SELECT id, sender, recipient, value
  FROM ${tableName}
  WHERE id > ?
  ORDER BY id ASC
  LIMIT ?
`;
    return new Promise((resolve, reject) => {
        db.all(sql, [lastId, config.blocksPerBatch], (err, rows) => {
            if (err)
                reject(err);
            resolve(rows);
        });
    });
};
exports.getAssetTransfersERC20 = getAssetTransfersERC20;
