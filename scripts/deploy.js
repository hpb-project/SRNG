const hre = require("hardhat");
const web3 = require("web3");

async function initDeploy() {
    var contractMap = new Map();

    const HRGToken = await hre.ethers.getContractFactory("HRGToken");
    const Config = await hre.ethers.getContractFactory("Config");
    const Oracle = await hre.ethers.getContractFactory("Oracle");
    const Storage = await hre.ethers.getContractFactory("Storage");
    const Stats = await hre.ethers.getContractFactory("Stats");
    const DepositPool = await hre.ethers.getContractFactory("DepositPool");
    const Commiter = await hre.ethers.getContractFactory("CommitReveal");

    var token = await deploy_token(HRGToken);
    var oracle = await deploy_contract(Oracle, "Oracle");
    var commiter = await deploy_with_oracle(Commiter, oracle);
    var deposit = await deploy_deposit(DepositPool, token, commiter);
    var config = await deploy_contract(Config, "Config");
    var storage = await deploy_with_commiter(Storage, commiter);
    var stats = await deploy_with_commiter(Stats, commiter);



    contractMap.set("token", token);
    contractMap.set("deposit", deposit);
    contractMap.set("config", config);
    contractMap.set("storage", storage);
    contractMap.set("stats", stats);
    contractMap.set("commiter", commiter);
    contractMap.set("oracle", oracle);

    await setting(contractMap);

    printinfo(contractMap);

    return contractMap;
}

function printinfo(contractMap) {

    var token = contractMap.get("token");
    var deposit = contractMap.get("deposit");
    var config = contractMap.get("config");
    var storage = contractMap.get("storage");
    var stats = contractMap.get("stats");
    var commiter = contractMap.get("commiter");
    var oracle = contractMap.get("oracle");
    console.log("deploy token     at address", token.address);
    console.log("deploy deposit   at address", deposit.address);
    console.log("deploy config    at address", config.address);
    console.log("deploy storage   at address", storage.address);
    console.log("deploy stats     at address", stats.address);
    console.log("deploy commiter  at address", commiter.address);
    console.log("deploy oracle    at address", oracle.address);
}

async function deploy_token(tokenFactory) {
    const token = await tokenFactory.deploy("100000000000000000000000000", "HRGToken", 18, "HRG");
    await token.deployed();
    console.log("deployed token at ", token.address, "hash ", token.hash);

    return token;
}

async function deploy_deposit(factory, token, commiter) {
    const contract = await factory.deploy(token.address, commiter.address);
    await contract.deployed();
    console.log("deployed contract at ", contract.address, "hash ", contract.hash);

    return contract;
}

async function deploy_contract(factory, name) {
    const contract = await factory.deploy();
    await contract.deployed();
    console.log("deployed contract at ", contract.address, "hash ", contract.hash);

    return contract;
}

async function deploy_with_oracle(factory, oracle) {
    const contract = await factory.deploy(oracle.address);
    await contract.deployed();
    console.log("deployed contract at ", contract.address, "hash ", contract.hash);

    return contract;
}

async function deploy_with_commiter(factory, commiter) {
    const contract = await factory.deploy(commiter.address);
    await contract.deployed();
    console.log("deployed contract at ", contract.address, "hash ", contract.hash);

    return contract;
}

async function setting(contractMap) {
    var token = contractMap.get("token");
    var deposit = contractMap.get("deposit");
    var config = contractMap.get("config");
    var storage = contractMap.get("storage");
    var stats = contractMap.get("stats");
    var commiter = contractMap.get("commiter");
    var oracle = contractMap.get("oracle");

    var tx = await commiter.setAddress(token.address, config.address, deposit.address, stats.address, storage.address);
    await tx.wait();
    tx = await oracle.setting(token.address, config.address, deposit.address, storage.address, commiter.address, stats.address);
    await tx.wait();

    tx = await token.setMinter(commiter.address);
    await tx.wait();
}
async function testCommit(contractMap) {
    var token = contractMap.get("token");
    var config = contractMap.get("config");
    var oracle = contractMap.get("oracle");
    var deposit = contractMap.get("deposit");

    var depositAmount = await config.getDepositAmount();
    var depositwei = web3.utils.toWei(depositAmount.toString(), 'wei').toString();
    var t = await token.approve(deposit.address, depositwei);
    await t.wait();

    var seed = "0xe2c84307652ce1de54ce69fdbf6a9faf653c2d47d847daf05b9b6c62616d7b63";
    var hash = await oracle.getHash(seed);
    console.log("get hash is", hash);

    var tx = await oracle.commit(hash);
    await tx.wait();
    console.log("commit succeed with tx", tx.hash);

    var storage = contractMap.get("storage");
    var commit = await storage.getCommit(hash);
}

async function testCommitAndReveal(contractMap) {
    var token = contractMap.get("token");
    var config = contractMap.get("config");
    var oracle = contractMap.get("oracle");
    var deposit = contractMap.get("deposit");

    var depositAmount = await config.getDepositAmount();
    var depositwei = web3.utils.toWei(depositAmount.toString(), 'wei').toString();
    var t = await token.approve(deposit.address, depositwei);
    await t.wait();

    var seed = "0x22c84307652ce1de54ce69fdbf6a9faf653c2d47d847daf05b9b6c62616d7b66";
    var hash = await oracle.getHash(seed);
    console.log("get hash is", hash);

    var tx = await oracle.commit(hash);
    await tx.wait();

    var storage = contractMap.get("storage");
    var commit = await storage.getCommit(hash);

    tx = await oracle.reveal(hash, seed);
    await tx.wait();
    console.log("reveal succeed with tx", tx.hash);

    commit = await storage.getCommit(hash);
}

async function doSubscribe(contractMap) {
    var config = contractMap.get("config");
    var oracle= contractMap.get("oracle");
    var token = contractMap.get("token");
    var deposit = contractMap.get("deposit");
    const ConsumerExample = await hre.ethers.getContractFactory("ComsumerExample");
    const consumerContract = await ConsumerExample.deploy(oracle.address);
    await consumerContract.deployed();
    var fee = await config.getFee();
    console.log("approve fee",fee);
    var r = await token.approve(deposit.address,fee);
    await r.wait();
    var start = await consumerContract.startNewGame();
	var receipt = await start.wait();
	console.log("start game and subscribe succeed");
}

async function testCaclReward(contractMap) {
    var deposit = contractMap.get("deposit");
    var minted = "100000000000000000000";
    var testcase = [{
        "minted": "100000000000000000000",
        "expect": "100000000000000000000"
    }, {
        "minted": "100000000000000000000000000",
        "expect": "100000000000000000000"
    }, {
        "minted": "250000000000000000000000001",
        "expect": "50000000000000000000"
    }, {
        "minted": "375000000000000000000000000",
        "expect": "50000000000000000000"
    }, {
        "minted": "375000000000000000000000001",
        "expect": "25000000000000000000"
    }];
    for (const tcase of testcase) {
	    //console.log("tcase is ", tcase);
	    var reward = await deposit.getRewards(tcase.minted);
	    console.log("got reward is ", reward, "expected", tcase.expect);
    }
}

async function testCommitAndSubscribe(contractMap) {
    var token = contractMap.get("token");
    var config = contractMap.get("config");
    var oracle = contractMap.get("oracle");
    var deposit = contractMap.get("deposit");

    var depositAmount = await config.getDepositAmount();
    console.log("got depositAmount is", depositAmount);
    var depositwei = web3.utils.toWei(depositAmount.toString(), 'wei').toString();
    console.log("deposit wei is ", depositwei);
    var t = await token.approve(deposit.address, depositwei);
    await t.wait();

    var seed = "0xf2c84307652ce1de54ce69fdbf6a9faf653c2d47d847daf05b9b6c62616d7b68";
    var hash = await oracle.getHash(seed);
    console.log("get hash is", hash);

    var tx = await oracle.commit(hash);
    await tx.wait();

    var storage = contractMap.get("storage");
    var commit = await storage.getCommit(hash);
    await doSubscribe(contractMap);
}

async function main() {
    var contracts = await initDeploy();
    await testCommitAndSubscribe(contracts);
    await testCommitAndReveal(contracts);
    await testCommit(contracts);
    //await testCaclReward(contracts);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
