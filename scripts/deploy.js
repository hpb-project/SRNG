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

var duration = 6000;
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

    var tx = await commiter.setAddress(oracle.address, token.address, config.address, deposit.address, stats.address, storage.address);
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

async function doReveal(contractMap, seed, hash) {
    var token = contractMap.get("token");
    var config = contractMap.get("config");
    var oracle = contractMap.get("oracle");
    var deposit = contractMap.get("deposit");

    //var seed = "0xfc6577bc19f809e507627b2b3fd3450343122238aa6bb238fe2da5b13acbf695";
    //var hash = "0x24d017b0953c33f78ef5715de507a0b087125c6bec8e8d6456148070adc403c0";
    console.log("hash is", hash,"seed is", seed);


    tx = await oracle.reveal(hash, seed, {gasLimit:10000000});
    await tx.wait();
    console.log("reveal succeed");

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

    const ConsumerExample = await hre.ethers.getContractFactory("ComsumerExample");
    const consumerContract = await ConsumerExample.deploy();
    await consumerContract.deployed();
    
    var tx = await consumerContract.setting(oracle.address, token.address);
    await tx.wait();
    sleep(duration);
    
    var fee = await config.getFee();
    tx = await token.transfer(consumerContract.address, fee);
    await tx.wait();
    sleep(duration);

    tx = await consumerContract.approveToken(150);
    await tx.wait();
    sleep(duration);

    var passwd = hre.ethers.utils.hashMessage("Hello World");
    var start = await consumerContract.startNewGame(passwd);
    var receipt = await start.wait();
    sleep(duration);
    console.log("subscribe succeed", "tx hash", receipt.transactionHash);
    contractMap.set("consumer", consumerContract);
    return contractMap;
}

//async function doSubscribe(contractMap) {
//    var config = contractMap.get("config");
//    var oracle= contractMap.get("oracle");
//    var token = contractMap.get("token");
//    var deposit = contractMap.get("deposit");
//    var passwd = hre.ethers.utils.hashMessage("Hello World");
//    const ConsumerExample = await hre.ethers.getContractFactory("ComsumerExample");
//    const consumerContract = await ConsumerExample.deploy(oracle.address);
//    await consumerContract.deployed();
//    var fee = await config.getFee();
//    var r = await token.approve(oracle.address,fee);
//    await r.wait();
//    var start = await consumerContract.startNewGame(passwd);
//    var receipt = await start.wait();
//    sleep(duration);
//    console.log("subscribe succeed", "tx hash", receipt.transactionHash);
//    contractMap.set("consumer", consumerContract);
//    return contractMap;
//}

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
	console.log("testCommitAndSubscribeAndReveal");

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
    var r = await oracle.getRandom(hash);
    //var r = await oracle.getRandom(hash, rawSign);
    console.log("got random is ", r);
    //var consumer = contractMap.get("consumer");
    //var joingame = await consumer.joinGame();
    //await joingame.wait();
    //var endgame = await consumer.endGame(hash, rawSign);
    //await endgame.wait();
    //console.log("consumer end game succeed");
}

async function initialContract() {
	var token           = "0xD5697fa93b21C12852c605c5b9c349585843642e";
	var deposit         = "0xb6Ecf25762E204cFa46FA82E6103D8be611E33cA";
	var config          = "0xF390aeCc5eb6778fdce4E80aD2188eCb09323718";
	var storage         = "0x2017035CdB21481b0284964a4016A8e8aC093f5B";
	var stats           = "0x43561681a4de8239b39882CE2CF81bb13725E5AF";
	var commiter        = "0x975De39E6bc377da6011B44A2f94359787DA8Ca4";
	var internalstore   = "0xF590B827E013Cc4A93c68B20a24F2422569ac79C";
	var oracle          = "0x0301E0a55e43cC38762bcf6aC4C86F5F14B436F1";

    var contractMap = new Map();

    const HRGToken = await hre.ethers.getContractAt("HRGToken", token);
    const Config = await hre.ethers.getContractAt("Config", config);
    const Oracle = await hre.ethers.getContractAt("Oracle", oracle);
    const Storage = await hre.ethers.getContractAt("Storage", storage);
    const Stats = await hre.ethers.getContractAt("Stats", stats);
    const DepositPool = await hre.ethers.getContractAt("DepositPool", deposit);
    const InternalStore = await hre.ethers.getContractAt("InternalStore", internalstore);
    const Commiter = await hre.ethers.getContractAt("CommitReveal", commiter);


    contractMap.set("token", HRGToken);
    contractMap.set("deposit", DepositPool);
    contractMap.set("config", Config);
    contractMap.set("storage", Storage);
    contractMap.set("stats", Stats);
    contractMap.set("commiter", Commiter);
    contractMap.set("internalstore", InternalStore);
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


async function updateOracle(contractMap) {
    const Oracle = await hre.ethers.getContractFactory("Oracle");
    var oracle = await deploy_contract(Oracle, "Oracle");

    contractMap.set("oracle", oracle);

    await updatesetting(contractMap);

    printinfo(contractMap);

    return contractMap;
}
async function updatesetting(contractMap) {
    var token = contractMap.get("token");
    var deposit = contractMap.get("deposit");
    var config = contractMap.get("config");
    var storage = contractMap.get("storage");
    var stats = contractMap.get("stats");
    var commiter = contractMap.get("commiter");
    var oracle = contractMap.get("oracle");
    var internalstore = contractMap.get("internalstore")
	// commiter.setAddress(address _oracle, address token, address _config, address _pool, address _stat, address _storage)
	var tx = await commiter.setAddress(oracle.address, token.address, config.address, deposit.address, stats.address, storage.address);
	await tx.wait();
	sleep(duration);
	// internalstore.setAddress(address oracle)
	tx = await internalstore.setAddress(oracle.address);
	await tx.wait();
	sleep(duration);
	// oracle.setting(address _token, address _config, address _deposit, address _store, address _commitReveal, address _stat, address _internalstore)
	tx = await oracle.setting(token.address, config.address, deposit.address, storage.address, commiter.address, stats.address, internalstore.address);
	await tx.wait();
	sleep(duration);
}
async function main() {
    var contracts = await initDeploy();
    await testsetting(contracts);
    //await testCommitAndSubscribeAndReveal(contracts);
    //contracts = await updateOracle(contracts);
    //var contracts = await initialContract();
    //await getconfig(contracts);
//	hash is 0xb239db8a2dba9d74e720046664b4a81ba527299c4972d75a2f794d6dfdcc356d seed is 0x6726d434a638413e7231a95969162724d9d23519250df1d9792a784e8e4e5a35
    //await doReveal(contracts, "0x6726d434a638413e7231a95969162724d9d23519250df1d9792a784e8e4e5a35", "0xb239db8a2dba9d74e720046664b4a81ba527299c4972d75a2f794d6dfdcc356d");
    // hash is 0xf01ff01332838ac4525fbcc2e8692aa53cec7544278676a484ee657971a8aa17 seed is 0x7d353a30fc066031c6bbac245bed91ce3612e089c36c379b6ce2d479ab8dcbdd
    //await doReveal(contracts, "0x7d353a30fc066031c6bbac245bed91ce3612e089c36c379b6ce2d479ab8dcbdd", "0xf01ff01332838ac4525fbcc2e8692aa53cec7544278676a484ee657971a8aa17");
    //for (let i = 0; i < 1000; i++) {
    //    //await testCommitAndSubscribeAndReveal(contracts);
    //    await testCommit(contracts);
    //    await testCommitAndReveal(contracts);
    //    await testCommitAndSubscribe(contracts);

    //}

    //await doSubscribe(contracts);
    //await getinfo(contracts);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
