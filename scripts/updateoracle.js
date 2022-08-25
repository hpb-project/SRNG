const hre = require("hardhat");
const web3 = require("web3");

async function updateOracle(contractMap) {
    const Oracle = await hre.ethers.getContractFactory("Oracle");
    var oracle = await deploy_contract(Oracle, "Oracle");

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

var duration = 12000;
async function deploy_contract(factory, name) {
    const contract = await factory.deploy();
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

async function initialContract() {
	var token           = "0xF02F2575CfB182064477879165A684b895849f2D";
	var deposit         = "0x57e0AE04ADe43bE0be510b293547B67716c6a781";
	var config          = "0xea8DE2853087D7425c669Dd1A37CEf8cC35710Ea";
	var storage         = "0x4E01AD10d450A4ccbae1C6b3dEEb8B835534e688";
	var stats           = "0x6A4EdC699726606338eC1b575C1578b5842F4D5a";
	var commiter        = "0x2d0B1e8fb15E604E5be624284Fcd457b7e2d09df";
	var internalstore   = "0xFF20E372Bb8D1Ef0c91C9EE61C339f9b154D67cC";
	var oracle          = "0x386A2258AdFa29241863f3B7B55f9116cA7B22f6";

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
	var subs = await storage.getUserSubscribedCommits(user);
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
    var contracts = await initialContract();
    contracts = await updateOracle(contracts);
    await getinfo(contracts);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
