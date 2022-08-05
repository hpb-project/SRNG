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
    const InternalStore = await hre.ethers.getContractFactory("InternalStore");

    var token = await deploy_token(HRGToken);
    var oracle = await deploy_contract(Oracle, "Oracle");
    var commiter = await deploy_with_oracle(Commiter, oracle);
    var internalStore = await deploy_with_oracle(InternalStore, oracle);
    var deposit = await deploy_deposit(DepositPool, token, commiter);
    var config = await deploy_contract(Config, "Config");
    var storage = await deploy_with_commiter(Storage, commiter);
    var stats = await deploy_with_commiter(Stats, commiter);



    contractMap.set("token", token);
    contractMap.set("deposit", deposit);
    contractMap.set("config", config);
    contractMap.set("storage", storage);
    contractMap.set("internalstore", internalStore);
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
    var internalstore = contractMap.get("internalstore");
    console.log("deploy token           at address", token.address);
    console.log("deploy deposit         at address", deposit.address);
    console.log("deploy config          at address", config.address);
    console.log("deploy storage         at address", storage.address);
    console.log("deploy stats           at address", stats.address);
    console.log("deploy commiter        at address", commiter.address);
    console.log("deploy internalstore   at address", internalstore.address);
    console.log("deploy oracle          at address", oracle.address);
}
function sleep (time) {
//    return ;
      return new Promise((resolve) => setTimeout(resolve, time));
}

var duration = 10000;
async function deploy_token(tokenFactory) {
    const token = await tokenFactory.deploy("100000000000000000000000000", "HRGToken", 18, "HRG");
    await token.deployed();
    sleep(duration);

    return token;
}

async function deploy_deposit(factory, token, commiter) {
    const contract = await factory.deploy(token.address, commiter.address);
    await contract.deployed();
    sleep(duration);

    return contract;
}

async function deploy_contract(factory, name) {
    const contract = await factory.deploy();
    await contract.deployed();

    sleep(duration);
    return contract;
}

async function deploy_with_oracle(factory, oracle) {
    const contract = await factory.deploy(oracle.address);
    await contract.deployed();

    sleep(duration);
    return contract;
}

async function deploy_with_commiter(factory, commiter) {
    const contract = await factory.deploy(commiter.address);
    await contract.deployed();
    sleep(duration);

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
    var internalstore = contractMap.get("internalstore")

    var tx = await commiter.setAddress(token.address, config.address, deposit.address, stats.address, storage.address);
    await tx.wait();
    sleep(duration);
    tx = await oracle.setting(token.address, config.address, deposit.address, storage.address, commiter.address, stats.address, internalstore.address);
    await tx.wait();

    sleep(duration);
    tx = await token.setMinter(commiter.address);
    await tx.wait();
    sleep(duration);
}

async function getconfig(contractMap) {
    var config = contractMap.get("config");

    var value = await config.getDepositAmount();
    console.log("config deposit amount is", value);

    value = await config.getFee();
    console.log("config fee amount is", value);

    value = await config.getMaxUnverify();
    console.log("config maxUnverify is", value);

    value = await config.getUnSubBlocks();
    console.log("config unsub blocks is", value);

    value = await config.getMaxVerifyBlocks();
    console.log("config max veirfy blocks is", value);
}

async function testsetting(contractMap) {
    var config = contractMap.get("config");

    var tx = await config.setMaxUnverify(10000);
    await tx.wait();
    sleep(duration);

    tx = await config.setUnSubBlocks(100000);
    await tx.wait();

    sleep(duration);
    tx = await config.setMaxVerifyBlocks(100000);
    await tx.wait();
    sleep(duration);

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
    var t = await token.approve(oracle.address, depositwei);
    await t.wait();

    var seed = genrandom();
    var hash = await oracle.getHash(seed);
    console.log("hash is", hash,"seed is", seed);

    var tx = await oracle.commit(hash);
    await tx.wait();
    console.log("commit succeed");
    sleep(duration);

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
    var t = await token.approve(oracle.address, depositwei);
    await t.wait();

    var seed = genrandom();
    var hash = await oracle.getHash(seed);
    console.log("hash is", hash,"seed is", seed);

    var tx = await oracle.commit(hash);
    await tx.wait();
    console.log("commit succeed");
    sleep(duration);

    var storage = contractMap.get("storage");
    var commit = await storage.getCommit(hash);

    tx = await oracle.reveal(hash, seed, {gasLimit:10000000});
    await tx.wait();
    sleep(duration);
    console.log("reveal succeed");

    commit = await storage.getCommit(hash);
}

async function doSubscribe(contractMap) {
    var config = contractMap.get("config");
    var oracle= contractMap.get("oracle");
    var token = contractMap.get("token");
    var deposit = contractMap.get("deposit");
    var passwd = hre.ethers.utils.hashMessage("Hello World");
    const ConsumerExample = await hre.ethers.getContractFactory("ComsumerExample");
    const consumerContract = await ConsumerExample.deploy(oracle.address);
    await consumerContract.deployed();
    var fee = await config.getFee();
    var r = await token.approve(oracle.address,fee);
    await r.wait();
    var start = await consumerContract.startNewGame(passwd);
    var receipt = await start.wait();
    sleep(duration);
    console.log("subscribe succeed", "tx hash", receipt.transactionHash);
    contractMap.set("consumer", consumerContract);
    return contractMap;
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
    var t = await token.approve(oracle.address, depositwei);
    await t.wait();

    var seed = genrandom();
    var hash = await oracle.getHash(seed);
    console.log("hash is", hash,"seed is", seed);

    var tx = await oracle.commit(hash);
    await tx.wait();
    sleep(duration);
    console.log("commit succeed");

    var storage = contractMap.get("storage");
    var commit = await storage.getCommit(hash);
    await doSubscribe(contractMap);
}

async function testCommitAndSubscribeAndReveal(contractMap) {
    var token = contractMap.get("token");
    var config = contractMap.get("config");
    var oracle = contractMap.get("oracle");
    var deposit = contractMap.get("deposit");

    var depositAmount = await config.getDepositAmount();
    var depositwei = web3.utils.toWei(depositAmount.toString(), 'wei').toString();
    var t = await token.approve(oracle.address, depositwei);
    await t.wait();

    var seed = genrandom();
    var hash = await oracle.getHash(seed);
    console.log("hash is", hash,"seed is", seed);

    var tx = await oracle.commit(hash);
    await tx.wait();
    console.log("commit succeed");
    sleep(duration);

    contractMap = await doSubscribe(contractMap);

    var storage = contractMap.get("storage");
    var commit = await storage.getCommit(hash);

    tx = await oracle.reveal(hash, seed, {gasLimit:10000000});
    await tx.wait();
    sleep(duration);
    console.log("reveal succeed");

    const accounts = await hre.ethers.getSigners();
    var signature = await accounts[0].signMessage(ethers.utils.arrayify(hash));

    var rawSign = await hre.ethers.utils.joinSignature(signature);
    var r = await oracle.getRandom(hash, rawSign);
    console.log("got random is ", r);
    var consumer = contractMap.get("consumer");
    var joingame = await consumer.joinGame();
    await joingame.wait();
    var endgame = await consumer.endGame(hash, rawSign);
    await endgame.wait();
    console.log("consumer end game succeed");
}

async function initialContract() {
//	deploy token           at address 0x95B3e4f53e2e30a87D5f420a4e4974CD5465f5Cc
//	deploy deposit         at address 0xd5248755D8c2f057931252DA4d91C03ff3d53Fb3
//	deploy config          at address 0x6265AEf966c05611122Bd274589c1a98801A4FdA
//	deploy storage         at address 0x2501b7af5418B9F2A922F20217C854a880EBf23F
//	deploy stats           at address 0x119d1ba67B07E643eE6D1142BF8dd868F8a5805C
//	deploy commiter        at address 0x9463e35B6786f7e4b0F6E1ee2B6fCcd5eB6F53Ac
//	deploy internalstore   at address 0xD5D3fbC3CDC89b851452F143a2E37E885e0c4415
//	deploy oracle          at address 0xAb1E4324f4F85Dd2Bd1Ce029D43AF22427313887
    var token     = "0x95B3e4f53e2e30a87D5f420a4e4974CD5465f5Cc";
    var deposit   = "0xd5248755D8c2f057931252DA4d91C03ff3d53Fb3";
    var config    = "0x6265AEf966c05611122Bd274589c1a98801A4FdA";
    var storage   = "0x2501b7af5418B9F2A922F20217C854a880EBf23F";
    var stats     = "0x119d1ba67B07E643eE6D1142BF8dd868F8a5805C";
    var commiter  = "0x9463e35B6786f7e4b0F6E1ee2B6fCcd5eB6F53Ac";
    var innerstore = "0xD5D3fbC3CDC89b851452F143a2E37E885e0c4415";
    var oracle    = "0xAb1E4324f4F85Dd2Bd1Ce029D43AF22427313887";

    var contractMap = new Map();

    const HRGToken = await hre.ethers.getContractAt("HRGToken", token);
    const Config = await hre.ethers.getContractAt("Config", config);
    const Oracle = await hre.ethers.getContractAt("Oracle", oracle);
    const Storage = await hre.ethers.getContractAt("Storage", storage);
    const Stats = await hre.ethers.getContractAt("Stats", stats);
    const DepositPool = await hre.ethers.getContractAt("DepositPool", deposit);
    const InternalStore = await hre.ethers.getContractAt("InternalStore", innerstore);
    const Commiter = await hre.ethers.getContractAt("CommitReveal", commiter);


    contractMap.set("token", HRGToken);
    contractMap.set("deposit", DepositPool);
    contractMap.set("config", Config);
    contractMap.set("storage", Storage);
    contractMap.set("stats", Stats);
    contractMap.set("commiter", Commiter);
    contractMap.set("internalstore", internalStore);
    contractMap.set("oracle", Oracle);
    return contractMap;
}
async function getinfo(contractMap) {
	const accounts = await hre.ethers.getSigners();
	var user = accounts[0].address;
	console.log("user is", user);
	const oracle = contractMap.get("oracle");
	const storage = contractMap.get("storage");
	var infos = await oracle.getUserUnverifiedList(user);
	for (let i=0; i < infos.length; i++) {
		const info = infos[i];
		console.log("unverified info at", i, "is ", info);
	}
//	var subinfo = await storage.getUserSubsInfo(user);
//	console.log("get usdr subscribe info is", subinfo.);
	var subs = await storage.getUserSubscribedCommits(user);
	//console.log("get user subscribed is ", subs);
	for (let i=0; i < subs.length; i++) {
		const sub= subs[i];
		console.log("subinfo at", i, "is ", sub);
	}

	var allinfos = await oracle.getUserCommitsList(user);
	for (let i=0; i < allinfos.length; i++) {
		const info = allinfos[i];
		console.log("allinfo at", i, "is ", info);
	}
}

async function main() {
    var contracts = await initDeploy();
    await testsetting(contracts);
    await testCommitAndSubscribeAndReveal(contracts);
    // var contracts = await initialContract();
    //await getconfig(contracts);
    //await testCommitAndReveal(contracts);
    //await testCommitAndReveal(contracts);
    //await testCommitAndReveal(contracts);
    //await testCommitAndReveal(contracts);
    //await testCommitAndReveal(contracts);
    //await testCommitAndReveal(contracts);
    //await testCommitAndReveal(contracts);
    //await testCommitAndReveal(contracts);

    //await testCommitAndSubscribe(contracts);
    //await testCommitAndSubscribe(contracts);
    //await testCommitAndSubscribe(contracts);
    //await testCommitAndSubscribe(contracts);

    //await testCommit(contracts);
    //await testCommit(contracts);
    //await testCommit(contracts);
    //await testCommit(contracts);
    //await testCommit(contracts);

    //await testCommitAndSubscribe(contracts);
    //await testCommitAndSubscribe(contracts);
    //await testCommitAndSubscribe(contracts);

    //await testCommit(contracts);
    //await testCommit(contracts);
    //await testCommit(contracts);
    //await testCommitAndReveal(contracts);

    //await testCaclReward(contracts);
    //await getinfo(contracts);
    //await doSubscribe(contracts);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
