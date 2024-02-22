import { FixedNumber, ethers } from 'ethers';
import contractABI from './contractABI.json';

const getContract = (privateKey: string) => {
	const provider = new ethers.providers.InfuraProvider('sepolia', import.meta.env.INFURA_API_KEY);

	const wallet = new ethers.Wallet(privateKey, provider);
	console.log(wallet);

	//GAS LIMIT ERROR
	// const contractAddress = '0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85';

	const contractAddress = '0xea12A5c8efef7D93D747430BaA9E164E81c60e3C';
	// const contractAddress = '0x616F8F6C731f805C4Ae7D0D315cD97877F99745a';

	const contract = new ethers.Contract(contractAddress, contractABI, wallet);
	console.log('contract', contract);

	return contract;
};

export async function becomeMemberOfGroup(groupId: number, privateKey: string): Promise<void> {
	try {
	  const gasPrice = ethers.utils.parseUnits('10000000000', 'gwei');
  
	  const contract = getContract(privateKey);

	  const functionName = 'becameMemberOfGroup';

	  const args = [groupId];

	//   const estimatedGas = await contract.estimateGas[functionName]([...args]);
	//   console.log('Estimated gas: ', estimatedGas.toString());

	  const gasLimitMultipier: FixedNumber = FixedNumber.fromString('1.1', 'fixed128x18');
  
	  // Adjust maxFeePerGas and maxPriorityFeePerGas (optional)
	  const transaction = await contract[functionName]([...args], {
		// gasLimit: estimatedGas.mul(estimatedGas),
		gasLimit: 1000000,
		// gasPrice: 1000000
	  });
  
	  await transaction.wait();
  
	  console.log('Right to vote given successfully');
	} catch (error) {
	  console.error('Error giving right to vote:', error);
	  // Handle error gracefully (e.g., retry or alert user)
	}
  }


// export const becomeMemberOfGroup = async (groupId: number, privateKey:string) => {
// 	console.log('becomeMember of group is called')
// 	const contract = getContract(privateKey);
	
// 	// Set gasPrice value
// 	const gasPrice = ethers.utils.parseUnits('0.1', 'gwei');
	
// 	// Update transaction options with gasPrice
// 	const tx = await contract.giveRightToVote(groupId.toLocaleString(), { gasLimit: 212040000, gasPrice });
	
	
// 	// Timeout for when the transactions takes too long
// 	const txReceipt = await tx.wait({ timeout: 20000 }).catch((error:any) => {
// 		console.error('Error waiting for transaction:', error);
// 	});

// 	console.log('Transaction receipt', txReceipt);
	
	
// 	if (txReceipt.status === 1) {
// 		console.log('Transaction successful');
// 		console.log(txReceipt);
// 	} else console.warn('Transaction failed');
// };

export const delegate = async (groupId: number, reciever: any, privateKey:string) => {
	const contract = getContract(privateKey);

	console.log(groupId, reciever);
	const tx = await contract.delegate(groupId.toString(), reciever.toString());

	const txReceipt = await tx.wait();

	if (txReceipt.status === 1) {
		console.log('Transaction successful');
		console.log(txReceipt.logs);
	}
};
export const becomeDelegate = async (groupId: number, privateKey:string) => {
	const contract = getContract(privateKey);
	console.log('HERE');
	const tx = await contract.becomeDelegate(groupId);

	const txReceipt = await tx.wait();

	if (txReceipt.status === 1) {
		console.log('Transaction successful');
		const logs = txReceipt.logs;
		console.log(logs);

		const parsedLogs = logs.map((log: any) => contract.interface.parseLog(log));
		console.log(parsedLogs);
	}
};

//becomeMemberOfGroup(1)
//becomeDelegate(1);

//delegate(1,"adress");
