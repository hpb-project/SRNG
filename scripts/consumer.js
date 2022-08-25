const hre = require("hardhat");

async function deployConsumer() {
    const ConsumerExample = await hre.ethers.getContractFactory("ComsumerExample");
    const consumerContract = await ConsumerExample.deploy();
    await consumerContract.deployed();

    return consumerContract;
}


async function doSubscribe() { 
    var duration = 10000;

    var token           = "0xF02F2575CfB182064477879165A684b895849f2D";
    var config          = "0xea8DE2853087D7425c669Dd1A37CEf8cC35710Ea";
    var oracle          = "0x386A2258AdFa29241863f3B7B55f9116cA7B22f6";
    const Token = await hre.ethers.getContractAt("HRGToken", token);
    const Config = await hre.ethers.getContractAt("Config", config);
    const Oracle = await hre.ethers.getContractAt("Oracle", oracle);

    const consumerContract = await deployConsumer();

    // send token to new contract.
    var fee = await Config.getFee();
    var tx = await Token.transfer(consumerContract.address, fee);
    await tx.wait();
    sleep(duration);

    tx = await consumerContract.approveToken(web3.utils.fromWei(fee.toString(), 'ether'));
    await tx.wait();
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
