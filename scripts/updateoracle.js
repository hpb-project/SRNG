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
	var token           = "0xecd36A108570F04cb2175d3D52A9653BA90557fc";
	var deposit         = "0x2A386de23BE5CE7d2CF67bC56481b0851484CBa8";
	var config          = "0x9A6A513d36903FBB7D5091fFD628E7831c726822";
	var storage         = "0x89feB09786EB6B1861229EF12bb720C5928C566D";
	var stats           = "0xAA7dD9820bB929dF883376C14E2E25CE44f139A1";
	var commiter        = "0xcBeA23e62e3Eaa40312d8aB7fC7Cfb9353C0b343";
	var internalstore   = "0x318bc7265d2D48BFe06ed098a8AB418C725BF8a5";
	var oracle          = "0x6d21466DE46731Fe60a4B3d0E637f2b23b3EB991";
	//var oracle          = "0xC64a38A3F84ec773F0c8F33C190FeB850F2b52d2";

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
