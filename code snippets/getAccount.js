import { ethers, Interface } from "ethers";

const provider = new ethers.JsonRpcProvider("https://archival-jsonrpc-yominet-1.anvil.asia-southeast.initia.xyz");
const iface = new Interface([{"inputs":[{"internalType":"uint256","name":"id","type":"uint256"}],"name":"getAccount","outputs":[{"components":[{"internalType":"uint32","name":"index","type":"uint32"},{"internalType":"string","name":"name","type":"string"},{"internalType":"int32","name":"currStamina","type":"int32"},{"internalType":"uint32","name":"room","type":"uint32"}],"internalType":"struct AccountShape","name":"","type":"tuple"}],"stateMutability":"view","type":"function"}]);

const main = async () => {
  const encodedData = iface.encodeFunctionData("getAccount", ["428395918952713945797547645073977871254434031276"]);

  const rawResult = await provider.call({
    to: "0x12C0989A259471D89D1bA1BB95043D64DAF97c19",
    data: encodedData,
  });

  const decodedResult = iface.decodeFunctionResult("getAccount", rawResult);
  console.log(decodedResult);
};

main();