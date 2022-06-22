// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function doSubscribe(contractMap) {
    var config = contractMap.get("config");
    var oracle = contractMap.get("oracle");
    var token = contractMap.get("token");
    var deposit = contractMap.get("deposit");

    const ConsumerExample = await hre.ethers.getContractFactory("ComsumerExample");
    const consumerContract = await ConsumerExample.deploy(oracle.address);
    await consumerContract.deployed();

    var fee = await config.getFee();
    console.log("approve fee", fee);

    var r = await token.approve(deposit.address, fee);
    await r.wait();

    var start = await consumerContract.startNewGame();
    var receipt = await start.wait();
    console.log("start game and subscribe succeed");
}



async function main() {
    // Hardhat always runs the compile task when running scripts with its command
    // line interface.
    //
    // If this script is run directly using `node` you may want to call compile
    // manually to make sure everything is compiled
    // await hre.run('compile');

    // We get the contract to deploy
    const Greeter = await hre.ethers.getContractFactory("Greeter");
    const greeter = await Greeter.deploy("Hello, Hardhat!");

    await greeter.deployed();

    console.log("Greeter deployed to:", greeter.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });