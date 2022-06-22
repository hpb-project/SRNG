const hre = require("hardhat");

async function deployConsumer() {
    const ConsumerExample = await hre.ethers.getContractFactory("ComsumerExample");
    const consumerContract = await ConsumerExample.deploy();
    await consumerContract.deployed();

    return consumerContract;
}

async function doSubscribe(consumerContract) {
    var deposit     = "0xd834452287dcCF0cf40F14CF252E593bC9191a78"; // deposit contract address on mainnet.
    var tokenAddr   = "0xaB06f2bEd629106236dA27fdc41E90654aD75C09"; // hrgtoken contract address on mainnet.
    var configAddr  = "0x4E3aa47E2a6ac00918Bd819294eCe17235EfA986"; // config contract address on mainnet.

    const token = await hre.ethers.getContractAt("HRGToken", tokenAddr);
    const config = await hre.ethers.getContractAt("Config", configAddr);

    var fee = await config.getFee();
    console.log("approve fee to deposit");

    var r = await token.approve(deposit, fee);
    await r.wait();

    var start = await consumerContract.startNewGame();
    await start.wait();
    console.log("start game and subscribe succeed");
}

async function main() {
    var consumerContract = await deployConsumer();
    for (let i=0; i < 10; i++) {
		await doSubscribe(consumerContract);
	}
    console.log("deploy and subscribe finished");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });