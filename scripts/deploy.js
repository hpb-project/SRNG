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

    return token;
}

async function deploy_deposit(factory, token, commiter) {
    const contract = await factory.deploy(token.address, commiter.address);
    await contract.deployed();

    return contract;
}

async function deploy_contract(factory, name) {
    const contract = await factory.deploy();
    await contract.deployed();

    return contract;
}

async function deploy_with_oracle(factory, oracle) {
    const contract = await factory.deploy(oracle.address);
    await contract.deployed();

    return contract;
}

async function deploy_with_commiter(factory, commiter) {
    const contract = await factory.deploy(commiter.address);
    await contract.deployed();

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

function genrandom() {
	const hexString = Array(64)
	  .fill()
	  .map(() => Math.round(Math.random() * 0xF).toString(16))
	  .join('');
	return '0x'+hexString
	console.log("get random", hexString);
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

    var seed = genrandom();
    var hash = await oracle.getHash(seed);
    console.log("hash is", hash,"seed is", seed);

    var tx = await oracle.commit(hash);
    await tx.wait();
    console.log("commit succeed");

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

    var seed = genrandom();
    var hash = await oracle.getHash(seed);
    console.log("hash is", hash,"seed is", seed);

    var tx = await oracle.commit(hash);
    await tx.wait();
    console.log("commit succeed");

    var storage = contractMap.get("storage");
    var commit = await storage.getCommit(hash);

    tx = await oracle.reveal(hash, seed, {gasLimit:10000000});
    await tx.wait();
    console.log("reveal succeed");

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
    var r = await token.approve(deposit.address,fee);
    await r.wait();
    var start = await consumerContract.startNewGame();
    var receipt = await start.wait();
    console.log("subscribe succeed");
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
    var depositwei = web3.utils.toWei(depositAmount.toString(), 'wei').toString();
    var t = await token.approve(deposit.address, depositwei);
    await t.wait();

    var seed = genrandom();
    var hash = await oracle.getHash(seed);
    console.log("hash is", hash,"seed is", seed);

    var tx = await oracle.commit(hash);
    await tx.wait();
    console.log("commit succeed");

    var storage = contractMap.get("storage");
    var commit = await storage.getCommit(hash);
    await doSubscribe(contractMap);
}
async function initialContract() {
    var token     = "0x864Dda775dd61B9E45D66A841A13DaA755380890";
    var deposit   = "0x3FDb09cF909C24953e980d3A3d4A15269ef25CDb";
    var config    = "0x33Ea76978f01020aa2b0b40cd0B47E17FcA7501C";
    var storage   = "0x3350C1BC87D327f41c0feb2C9b0cC67179b40ADC";
    var stats     = "0xaE039318642eb91662CaB22119eaa4C6c3B3ca2F";
    var commiter  = "0xDD77BC4Ba1CfD690B483c206Ad85C205F61329d1";
    var oracle    = "0x2d0B741A9F159939E0e797b4bdBD9Cd3b37D4d91";
    var contractMap = new Map();

    const HRGToken = await hre.ethers.getContractAt("HRGToken", token);
    const Config = await hre.ethers.getContractAt("Config", config);
    const Oracle = await hre.ethers.getContractAt("Oracle", oracle);
    const Storage = await hre.ethers.getContractAt("Storage", storage);
    const Stats = await hre.ethers.getContractAt("Stats", stats);
    const DepositPool = await hre.ethers.getContractAt("DepositPool", deposit);
    const Commiter = await hre.ethers.getContractAt("CommitReveal", commiter);


    contractMap.set("token", HRGToken);
    contractMap.set("deposit", DepositPool);
    contractMap.set("config", Config);
    contractMap.set("storage", Storage);
    contractMap.set("stats", Stats);
    contractMap.set("commiter", Commiter);
    contractMap.set("oracle", Oracle);
    return contractMap;
}
async function getinfo(contractMap) {
	const accounts = await hre.ethers.getSigners();
	var user = accounts[0].address;
	console.log("user is", user);
	const oracle = contractMap.get("oracle");
	var infos = await oracle.getUserUnverifiedList(user);
	for (const info of infos) {
		console.log("info is ", info);
	}
	for (let i=0; i < infos.length; i++) {
		const info = infos[i];
		console.log("info at", i, "is ", info);
	}
	var subs = await oracle.getUserSubscribed(user);
	for (let i=0; i < subs.length; i++) {
		const sub= subs[i];
		console.log("sub at", i, "is ", sub);
	}
}

async function main() {
    var contracts = await initDeploy();
    //var contracts = await initialContract();
    await testCommitAndReveal(contracts);
    //await testCommitAndReveal(contracts);
    //await testCommitAndReveal(contracts);
    //await testCommitAndReveal(contracts);
    //await testCommitAndReveal(contracts);
    //await testCommitAndReveal(contracts);
    //await testCommitAndReveal(contracts);
    //await testCommitAndReveal(contracts);

    //await testCommitAndSubscribe(contracts);

    //await testCommit(contracts);
    //await testCommit(contracts);
    //await testCommit(contracts);
    //await testCommit(contracts);
    //await testCommit(contracts);

    await testCommitAndSubscribe(contracts);
    await testCommitAndSubscribe(contracts);
    await testCommitAndSubscribe(contracts);
    await testCommitAndSubscribe(contracts);
    await testCommitAndSubscribe(contracts);
    await testCommitAndSubscribe(contracts);

    //await testCommit(contracts);
    //await testCommit(contracts);
    //await testCommit(contracts);
    //await testCommitAndReveal(contracts);

    //await testCaclReward(contracts);
    await getinfo(contracts);
    await doSubscribe(contracts);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
