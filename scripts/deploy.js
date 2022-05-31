const hre = require("hardhat");

async function main() {
    var contractMap = new Map();

    const HRGToken = await hre.ethers.getContractFactory("HRGToken");
    const Config = await hre.ethers.getContractFactory("Config");
    const Oracle = await hre.ethers.getContractFactory("Oracle");
    const Storage = await hre.ethers.getContractFactory("Storage");
    const Stats = await hre.ethers.getContractFactory("Stats");
    const DepositPool = await hre.ethers.getContractFactory("DepositPool");
    const Commiter = await hre.ethers.getContractFactory("CommitReveal");

    var token = await deploy_token(HRGToken);
    var deposit = await deploy_deposit(DepositPool, token);
    var config = await deploy_contract(Config, "Config");
    var storage = await deploy_contract(Storage, "Storage");
    var stats = await deploy_contract(Stats, "Stats");
    var commiter = await deploy_contract(Commiter, "Commiter");
    var oracle = await deploy_contract(Oracle, "Oracle");

    contractMap.set("token", token);
    contractMap.set("deposit", deposit);
    contractMap.set("config", config);
    contractMap.set("storage", storage);
    contractMap.set("stats", stats);
    contractMap.set("commiter", commiter);
    contractMap.set("oracle", oracle);

    await setting(contractMap);

    printinfo(contractMap);
}

function printinfo(contractMap) {

    var token = contractMap.get("token");
    var deposit = contractMap.get("deposit");
    var config = contractMap.get("config");
    var storage = contractMap.get("storage");
    var stats = contractMap.get("stats");
    var commiter = contractMap.get("commiter");
    var oracle = contractMap.get("oracle");
    console.log("deploy token at address", token.address);
    console.log("deploy deposit at address", deposit.address);
    console.log("deploy config at address", config.address);
    console.log("deploy storage at address", storage.address);
    console.log("deploy stats at address", stats.address);
    console.log("deploy commiter at address", commiter.address);
    console.log("deploy oracle at address", oracle.address);
}

async function deploy_token(tokenFactory) {
    const token = await tokenFactory.deploy("100000000000000000000000000", "HRGToken", 18, "HRG");
    await token.deployed();
    console.log("deployed token at ", token.address, "hash ", token.hash);

    return token;
}

async function deploy_deposit(factory, token) {
    const contract = await factory.deploy(token.address);
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

async function setting(contractMap) {
    var token = contractMap.get("token");
    var deposit = contractMap.get("deposit");
    var config = contractMap.get("config");
    var storage = contractMap.get("storage");
    var stats = contractMap.get("stats");
    var commiter = contractMap.get("commiter");
    var oracle = contractMap.get("oracle");

    await commiter.setAddress(token.address, config.address, deposit.address, stats.address, storage.address);
    await oracle.setAddress(token.address, config.address, deposit.address, storage.address, commiter.address, stats.address);
}


// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });