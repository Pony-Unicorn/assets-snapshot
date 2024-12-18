# Assets Snapshot: Create ERC20, ERC721, and ERC1155 Token Snapshot

A command-line tool and SDK that creates snapshots of any ERC20, ERC721, and ERC1155 tokens, synchronizes the data to SQLite, and allows exporting to JSON or CSV formats.

- Works without a local Ethereum node.
- Automatically resumes the next time upon failure.
- Tested to work with Alchemy.

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

To avoid getting prompted for each configuration parameters, each time `assets-snapshot` is ran, have a `./config.json` file at the same location as `assets-snapshot` is executed.

### name

Unique name, recommended as the name of the asset.

### provider

It is best to use the Alchemy cloud services.

### contractAddress

Address of your ERC20, ERC721, and ERC1155 contract.

### fromBlock

The block height to scan from. To save time, enter the block number of the transaction your token was created on.

### toBlock

The block height to end the scan at.

### category

Can be any of the following: "ERC20", "ERC721", "ERC1155".

### blocksPerBatch

The number of blocks to query per batch.

If you are using remote service like Alchemy, keep this number relative low (2000-5000) to avoid rate limits. If you are using a dedicated Ethereum node, you can increase this number to suit your needs.

### delay

The delay (in ms) between each request in the loop. Tweak this if you are experiencing rate limit from your provider.

## Development

### Start running sync

```
npm run start -- -c ./snapshot.json
```
