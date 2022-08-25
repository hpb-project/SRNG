const hre = require("hardhat");
const web3 = require("web3");

function sleep (time) {
	  return new Promise((resolve) => setTimeout(resolve, time));
}
function genrandom() {
	const hexString = Array(64)
	  .fill()
	  .map(() => Math.round(Math.random() * 0xF).toString(16))
	  .join('');
	return '0x'+hexString
}

async function CommitAndReveal() {
  var token           = "0xc212057F863FB3633EdDf4a2fc1AdFc2bF5424E0";
  var config          = "0x723d0c427885AB997d249E5DB8F19E4ee94FA2D1";
  var oracle          = "0xf2FfB77d5fd72eBa74416Df747DD5CD3E0C9Bd36";

  const Token = await hre.ethers.getContractAt("HRGToken", token);
  const Config = await hre.ethers.getContractAt("Config", config);
  const Oracle = await hre.ethers.getContractAt("Oracle", oracle);
  
  // step1. generate random seed and compute hash.
  var seed = genrandom();
  var hash = await Oracle.getHash(seed);
  console.log("hash is", hash,"seed is", seed);

  // step2. compute seed hash and call commit.
  // need approve hrg token to deposit contract.
  var depositAmount = await Config.getDepositAmount();
  var depositwei = web3.utils.toWei(depositAmount.toString(), 'wei').toString();
  var t = await Token.approve(Oracle.address, depositwei);
  await t.wait();
  // call commit.
  var tx = await Oracle.commit(hash);
  await tx.wait();
  console.log("commit succeed");

  // wait some time.
  var duration = 20000;
  sleep(duration);

  // step3. reveal with seed.
  tx = await Oracle.reveal(hash, seed, {gasLimit:10000000});
  await tx.wait();
  console.log("reveal succeed");
}

async function main() {
  for (let i=0; i < 10; i++) {
    await CommitAndReveal();
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
