const HDWalletProvider = require('@truffle/hdwallet-provider');

function getRequiredEnvVar(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is falsy, enter valid value.`);
  }
  return value;
};
function getEnvVar(name) {
  const value = process.env[name];
  if (!value) {
    return "";
  }
  return value;
};

module.exports = {
  networks: {
    local_geth: {
      provider: () => {
        const accountIndex = getEnvVar('LOCAL_GETH_WALLET_ACCOUNT_INDEX');
        return new HDWalletProvider(
          getRequiredEnvVar('LOCAL_GETH_WALLET_MNEMONIC'),
          'http://localhost:8545',
          accountIndex ? parseInt(accountIndex, 10) : 0,
        )
      },
      network_id: 10,
    },
    goerli: {
      provider: () => {
        const accountIndex = getEnvVar('GOERLI_WALLET_ACCOUNT_INDEX');
        return new HDWalletProvider(
          getRequiredEnvVar('GOERLI_WALLET_MNEMONIC'),
          `https://goerli.infura.io/v3/${getRequiredEnvVar('INFURA_GOERLI_PROJECT_ID')}`,
          accountIndex ? parseInt(accountIndex, 10) : 0,
        )
      },
      network_id: 5,
    },
    mainnet: {
      provider: () => {
        const accountIndex = getEnvVar('ETH_WALLET_ACCOUNT_INDEX');
        return new HDWalletProvider(
          getRequiredEnvVar('ETH_WALLET_MNEMONIC'),
          `https://mainnet.infura.io/v3/${getRequiredEnvVar('INFURA_MAINNET_PROJECT_ID')}`,
          accountIndex ? parseInt(accountIndex, 10) : 0,
        )
      },
      network_id: 1,
    },
  },

  mocha: {
  },

  compilers: {
    solc: {
      version: "0.8.10",
    }
  },
};
