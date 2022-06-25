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

async function CommitAndReveal(contractMap) {
    var tokenAddr     = "0xaB06f2bEd629106236dA27fdc41E90654aD75C09";
    var depositAddr   = "0xd834452287dcCF0cf40F14CF252E593bC9191a78";
    var configAddr    = "0x4E3aa47E2a6ac00918Bd819294eCe17235EfA986";
    var oracleAddr    = "0x800B5105b31bD100bE85E8646f86EA263aDB1786";

    const token = await hre.ethers.getContractAt("HRGToken", tokenAddr);
    const config = await hre.ethers.getContractAt("Config", configAddr);
    const oracle = await hre.ethers.getContractAt("Oracle", oracleAddr);
    
    // step1. generate random seed and compute hash.
    var seed = genrandom();
    var hash = await oracle.getHash(seed);
    console.log("hash is", hash,"seed is", seed);

    // step2. compute seed hash and call commit.
    // need approve hrg token to deposit contract.
    var depositAmount = await config.getDepositAmount();
    var depositwei = web3.utils.toWei(depositAmount.toString(), 'wei').toString();
    var t = await token.approve(depositAddr, depositwei);
    await t.wait();
    // call commit.
    var tx = await oracle.commit(hash);
    await tx.wait();
    console.log("commit succeed");

    // wait some time.
    var duration = 100000;
    sleep(duration);

    // step3. reveal with seed.
    tx = await oracle.reveal(hash, seed, {gasLimit:10000000});
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
