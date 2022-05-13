require("@nomiclabs/hardhat-waffle");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// Define mnemonic for accounts.
let mnemonic = process.env.MNEMONIC;
if (!mnemonic) {
  // NOTE: this fallback is for development only!
  // When using other networks, set the secret in .env.
  // DO NOT commit or share your mnemonic with others!
  mnemonic = "test test test test test test test test test test test test";
}

let privateKey = process.env.PRIVATE_KEY;
const accounts = { mnemonic };

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.4",
      },
    ],
  },
  networks: {
    hardhat: {
      accounts,
      gas: 10000000,
      gasPrice: 10000000000,
    },
    mainnet:{
	    url: "https://hpbnode.com",
	    accounts: [privateKey],
    },
  },
};
