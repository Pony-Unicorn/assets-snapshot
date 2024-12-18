# Assets Snapshot: Create ERC20, ERC721, and ERC1155 Token Snapshot

一个命令行工具和SDK，用于创建任何ERC20、ERC721和ERC1155代币的快照，将数据同步到SQLite，并允许导出为JSON或CSV格式。

- 无需本地Ethereum节点。
- 在失败时会自动恢复。
- 经测试与Alchemy兼容。

## Getting Started

```
npm install assets-snapshot -g
```

### CLI Arguments

None. Prompts for user input and produces a configuration file on the first run.

### How to Use Assets Snapshot?

Navigate to a directory where you'd like to save the token snapshot to.

```
cd path/to/a/directory
```

Run the program:

```
assets-snapshot
```

## Configuration File

为了避免每次运行 `assets-snapshot` 时都需要输入配置参数，请在 `assets-snapshot` 执行的相同位置创建一个 `./config.json` 文件。

### name

唯一名称，建议使用资产的名称。

### provider

最好使用Alchemy云服务。

### contractAddress

您的ERC20、ERC721和ERC1155合约地址。

### fromBlock

扫描的起始区块高度。为了节省时间，请输入代币创建时所在的交易区块号。

### toBlock

扫描的结束区块高度。

### category

可以是以下任意一种：“ERC20”，“ERC721”，“ERC1155”。

### blocksPerBatch

每批查询的区块数。

如果您使用的是像Alchemy这样的远程服务，请将此数字保持相对较低（2000-5000），以避免触发频率限制。如果您使用的是专用的Ethereum节点，则可以根据需要增加此数字。

### delay

每个请求之间的延迟（单位：毫秒）。如果您遇到提供商的频率限制问题，请调整此值。

## Development

### Start running sync

```
npm run start -- -c ./snapshot.json
```
