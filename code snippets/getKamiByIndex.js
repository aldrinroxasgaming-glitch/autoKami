import { ethers, Interface } from "ethers";

const provider = new ethers.JsonRpcProvider("https://archival-jsonrpc-yominet-1.anvil.asia-southeast.initia.xyz");
const iface = new Interface([{"inputs":[{"internalType":"uint32","name":"index","type":"uint32"}],"name":"getKamiByIndex","outputs":[{"components":[{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"uint32","name":"index","type":"uint32"},{"internalType":"string","name":"name","type":"string"},{"internalType":"string","name":"mediaURI","type":"string"},{"components":[{"components":[{"internalType":"int32","name":"base","type":"int32"},{"internalType":"int32","name":"shift","type":"int32"},{"internalType":"int32","name":"boost","type":"int32"},{"internalType":"int32","name":"sync","type":"int32"}],"internalType":"struct Stat","name":"health","type":"tuple"},{"components":[{"internalType":"int32","name":"base","type":"int32"},{"internalType":"int32","name":"shift","type":"int32"},{"internalType":"int32","name":"boost","type":"int32"},{"internalType":"int32","name":"sync","type":"int32"}],"internalType":"struct Stat","name":"power","type":"tuple"},{"components":[{"internalType":"int32","name":"base","type":"int32"},{"internalType":"int32","name":"shift","type":"int32"},{"internalType":"int32","name":"boost","type":"int32"},{"internalType":"int32","name":"sync","type":"int32"}],"internalType":"struct Stat","name":"harmony","type":"tuple"},{"components":[{"internalType":"int32","name":"base","type":"int32"},{"internalType":"int32","name":"shift","type":"int32"},{"internalType":"int32","name":"boost","type":"int32"},{"internalType":"int32","name":"sync","type":"int32"}],"internalType":"struct Stat","name":"violence","type":"tuple"}],"internalType":"struct KamiStats","name":"stats","type":"tuple"},{"components":[{"internalType":"uint32","name":"face","type":"uint32"},{"internalType":"uint32","name":"hand","type":"uint32"},{"internalType":"uint32","name":"body","type":"uint32"},{"internalType":"uint32","name":"background","type":"uint32"},{"internalType":"uint32","name":"color","type":"uint32"}],"internalType":"struct KamiTraits","name":"traits","type":"tuple"},{"internalType":"string[]","name":"affinities","type":"string[]"},{"internalType":"uint256","name":"account","type":"uint256"},{"internalType":"uint256","name":"level","type":"uint256"},{"internalType":"uint256","name":"xp","type":"uint256"},{"internalType":"uint32","name":"room","type":"uint32"},{"internalType":"string","name":"state","type":"string"}],"internalType":"struct KamiShape","name":"","type":"tuple"}],"stateMutability":"view","type":"function"}]);

const main = async () => {
  const encodedData = iface.encodeFunctionData("getKamiByIndex", ["18"]);

  const rawResult = await provider.call({
    to: "0x12C0989A259471D89D1bA1BB95043D64DAF97c19",
    data: encodedData,
  });

  const decodedResult = iface.decodeFunctionResult("getKamiByIndex", rawResult);
  console.log(decodedResult);
};

main();