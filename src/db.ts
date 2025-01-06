import sqlite3 from "sqlite3";
import { getConfig } from "./config";

const db = new sqlite3.Database("snapshot.db");

const getAsync = <T>(sql: string): Promise<T | null> => {
  return new Promise((resolve, reject) => {
    db.get(sql, (err, row) => {
      if (err) reject(err);
      resolve(row as T | null);
    });
  });
};

export const execute = async (db: sqlite3.Database, sql: string) => {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) reject(err);
      resolve(true);
    });
  });
};

const getTransactionStructure = () => {
  const config = getConfig();

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
  } else if (config.category === "ERC721") {
    columns += `,
    tokenId TEXT NOT NULL`;
  } else if (config.category === "ERC1155") {
    columns += `,
    metadata TEXT NOT NULL`;
  }

  const tableSql = `CREATE TABLE IF NOT EXISTS transaction_${config.name} (${columns})`;

  const indexSql = `CREATE UNIQUE INDEX IF NOT EXISTS idx_transaction_${config.name}_block_log ON transaction_${config.name} (blockNum, logIndex)`;

  return { tableSql, indexSql };
};

export const initTable = async () => {
  const { tableSql, indexSql } = getTransactionStructure();
  await execute(db, tableSql);
  await execute(db, indexSql);
};

export const clearTable = async () => {
  await initTable();
  await execute(db, `DELETE FROM transaction_${getConfig().name};`);
};

export const getMaxBlockNum = async () => {
  const config = getConfig();

  const sql = `SELECT MAX(blockNum) AS maxBlockNum FROM transaction_${config.name}`;
  const result = await getAsync<{ maxBlockNum: string }>(sql);

  return result?.maxBlockNum; // 返回最大值，如果没有记录则返回 null
};

export interface IInsertTransactionsERC20 {
  blockNum: number;
  hash: string;
  sender: string;
  recipient: string;
  value: string;
  logIndex: number;
}

export const insertTransactionsERC20 = async (transactions: IInsertTransactionsERC20[]) => {
  const config = getConfig();

  if (config.category !== "ERC20") {
    throw new Error("Invalid category");
  }

  const tableName = `transaction_${config.name}`;
  const sql = `
    INSERT INTO ${tableName} (blockNum, hash, sender, recipient, value, logIndex)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  return new Promise<void>((resolve, reject) => {
    db.serialize(() => {
      db.run("BEGIN TRANSACTION");
      const stmt = db.prepare(sql);

      try {
        for (const tx of transactions) {
          stmt.run(tx.blockNum, tx.hash, tx.sender, tx.recipient, tx.value, tx.logIndex);
        }

        stmt.finalize();
        db.run("COMMIT", (err) => {
          if (err) reject(err);
          resolve();
        });
      } catch (error) {
        db.run("ROLLBACK", () => reject(error));
      }
    });
  });
};

export interface IAssetTransactionsERC20 {
  id: number;
  sender: string;
  recipient: string;
  value: string;
}

export const getAssetTransfersERC20 = async (lastId: number = 0) => {
  const config = getConfig();

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

  return new Promise<IAssetTransactionsERC20[] | null>((resolve, reject) => {
    db.all(sql, [lastId, config.blocksPerBatch], (err, rows) => {
      if (err) reject(err);
      resolve(rows as IAssetTransactionsERC20[] | null);
    });
  });
};

export interface IInsertTransactionsERC721 {
  blockNum: number;
  hash: string;
  sender: string;
  recipient: string;
  tokenId: string;
  logIndex: number;
}

export const insertTransactionsERC721 = async (transactions: IInsertTransactionsERC721[]) => {
  const config = getConfig();

  if (config.category !== "ERC721") {
    throw new Error("Invalid category");
  }

  const tableName = `transaction_${config.name}`;
  const sql = `
    INSERT INTO ${tableName} (blockNum, hash, sender, recipient, tokenId, logIndex)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  return new Promise<void>((resolve, reject) => {
    db.serialize(() => {
      db.run("BEGIN TRANSACTION");
      const stmt = db.prepare(sql);

      try {
        for (const tx of transactions) {
          stmt.run(tx.blockNum, tx.hash, tx.sender, tx.recipient, tx.tokenId, tx.logIndex);
        }

        stmt.finalize();
        db.run("COMMIT", (err) => {
          if (err) reject(err);
          resolve();
        });
      } catch (error) {
        db.run("ROLLBACK", () => reject(error));
      }
    });
  });
};

export interface IAssetTransactionsERC721 {
  id: number;
  sender: string;
  recipient: string;
  tokenId: string;
}

export const getAssetTransfersERC721 = async (lastId: number = 0) => {
  const config = getConfig();

  if (config.category !== "ERC721") {
    throw new Error("Invalid category");
  }

  const tableName = `transaction_${config.name}`;

  const sql = `
  SELECT id, sender, recipient, tokenId
  FROM ${tableName}
  WHERE id > ?
  ORDER BY id ASC
  LIMIT ?
`;

  return new Promise<IAssetTransactionsERC721[] | null>((resolve, reject) => {
    db.all(sql, [lastId, config.blocksPerBatch], (err, rows) => {
      if (err) reject(err);
      resolve(rows as IAssetTransactionsERC721[] | null);
    });
  });
};
