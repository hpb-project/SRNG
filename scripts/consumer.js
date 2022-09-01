const hre = require("hardhat");

function sleep (time) {
	  return new Promise((resolve) => setTimeout(resolve, time));
}
async function deployConsumer() {
    const ConsumerExample = await hre.ethers.getContractFactory("ComsumerExample");
    const consumerContract = await ConsumerExample.deploy();
    await consumerContract.deployed();

    return consumerContract;
}


async function doSubscribe() { 
    var duration = 10000;

	var token           = "0xB691d5FC540A8327D8D64Bf013309DE47AeF78dB";
	var config          = "0xD471aeE47025aa773594B4F0C3b3ebC16B7E7D1F";
	var oracle          = "0x6747596001fc61e338b46F6e7D2e5fe21BdfFB25";
    const Token = await hre.ethers.getContractAt("HRGToken", token);
    const Config = await hre.ethers.getContractAt("Config", config);
    const Oracle = await hre.ethers.getContractAt("Oracle", oracle);

    const consumerContract = await deployConsumer();

    // send token to new contract.
    var fee = await Config.getFee();
    var tx = await Token.transfer(consumerContract.address, fee);
    await tx.wait();
    console.log("transfer token to consumer contract finished");
    sleep(duration);

    tx = await consumerContract.approveToken(web3.utils.fromWei(fee.toString(), 'ether'));
    await tx.wait();
    console.log("approve tokenfinished");
    sleep(duration);

    var start = await consumerContract.startNewGame();
    var receipt = await start.wait();
    sleep(duration);
    console.log("subscribe succeed", "tx hash", receipt.transactionHash);

}

async function main() {
    await doSubscribe();
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
