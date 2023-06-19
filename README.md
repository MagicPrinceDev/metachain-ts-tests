# Functional testing for Metachain Node RPC

This folder contains a set of functional tests designed to perform functional testing on the Metachain Eth RPC.

It is written in typescript, using Mocha/Chai as Test framework.

## Test flow

Tests are separated depending on their genesis requirements.
Each group will start a `metachain test node` with a given `spec` before executing the tests.

## Build the node for tests

```bash
cargo build --release --features rpc-binary-search-estimate
```

## Installation

```bash
npm install
```

## Run the tests

```bash
npm run build && npm run test
```

You can also add the Metachain Node logs to the output using the `METACHAIN_LOG` env variable. Ex:

```bash
METACHAIN_LOG="warn,rpc=trace" npm run test
```

(The metachain node be listening for RPC on port 19933, mostly to avoid conflict with already running metachain node)

Required env :
`DEFID` to set binary path
`GENESIS_PATH` to load genesis state from a `genesis.json` file. Defaults to repository's `genesis.json`

`genesis.json` format :
```
{
    "coinbase"   : "0x8888f1f195afa192cfee860698584c030f4c9db1",
    "difficulty" : "0x020000",
    "gasLimit"   : "0x2fefd8",
    "mixHash"    : "0x2c85bcbce56429100b2108254bb56906257582aeafcbd682bc9af67a9f5aee46",
    "nonce"      : "0x78cc16f7b4f65485",
    "parentHash" : "0x0000000000000000000000000000000000000000000000000000000000000000",
    "timestamp"  : "0x54c98c81",
    "alloc"      : {
        "0x6be02d1d3665660d22ff9624b7be0551ee1ac91b": {
            "balance" : "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE0B"
        }
    }
}
```
