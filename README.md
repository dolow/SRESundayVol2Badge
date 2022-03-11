# Prerequisites for Development

## Install geth

```
% brew tap ethereum/ethereum
% brew install ethereum
```

# Launch local network

```
% geth --networkid 10 --allow-insecure-unlock --nodiscover --datadir ./local_geth_network/ --http --dev console
```

# Deploy

## Local

Add your wallet account to local geth network.
Before adding account, stop local network.

```
% vi key.txt # put your private key
% geth account import --datadir ./local_geth_network/ ./key.txt
Password:
Repeat password:
% rm key.txt
```

Check if account is added.

```
% geth --networkid 10 --allow-insecure-unlock --nodiscover --datadir ./local_geth_network/ --http --dev console
> eth.accounts
[<coin base account>, <your account>]
```

Faucet your wallet account

```
% geth --networkid 10 --allow-insecure-unlock --nodiscover --datadir ./local_geth_network/ --http --dev console
> eth.sendTransaction({from: eth.accounts[0], to: <your account>, value: 1000000000000000000});
> eth.getBalance(<your account>);
```

Migrating contract and set wallet account as owner

```
% LOCAL_GETH_WALLET_MNEMONIC="<your mnemonic>" truffle migrate --network local_geth
```

## Görli (testnet)

```
% INFURA_GOERLI_PROJECT_ID="<project id>" GOERLI_WALLET_MNEMONIC="<your mnemonic>" truffle migrate --network goerli
```

## Mainnet

Obfuscate sensitive data.

```
% INFURA_MAINNET_PROJECT_ID="<project id>" ETH_WALLET_MNEMONIC="<your mnemonic>" truffle migrate --network mainnet
```
