import { expect } from 'chai';
import { AbiItem } from 'web3-utils';

import ExplicitRevertReason from '../build/contracts/ExplicitRevertReason.json';
import { GENESIS_ACCOUNT, GENESIS_ACCOUNT_PRIVATE_KEY, INITIAL_BASE_FEE } from './config';
import { generate, customRequest, describeWithMetachain } from './util';

describeWithMetachain('Metachain RPC (Revert Reason)', (context) => {
	let contractAddress;

	const REVERT_W_MESSAGE_BYTECODE = ExplicitRevertReason.bytecode;

	const TEST_CONTRACT_ABI = ExplicitRevertReason.abi as AbiItem[];

	before('create the contract', async function () {
		this.timeout(15000);
		const tx = await context.web3.eth.accounts.signTransaction(
			{
				from: GENESIS_ACCOUNT,
				data: REVERT_W_MESSAGE_BYTECODE,
				value: '0x00',
				gasPrice: context.web3.utils.numberToHex(INITIAL_BASE_FEE),
				gas: '0x100000',
			},
			GENESIS_ACCOUNT_PRIVATE_KEY
		);
		const r = await customRequest(context.web3, 'eth_sendRawTransaction', [tx.rawTransaction]);
		await generate(context.client, 1);
		const receipt = await context.web3.eth.getTransactionReceipt(r.result);
		contractAddress = receipt.contractAddress;
	});

	it('should fail with revert reason', async function () {
		const contract = new context.web3.eth.Contract(TEST_CONTRACT_ABI, contractAddress, {
			from: GENESIS_ACCOUNT,
			gasPrice: context.web3.utils.numberToHex(INITIAL_BASE_FEE),
		});
		try {
			await contract.methods.max10(30).call();
		} catch (error) {
			expect(error.message).to.be.eq('Returned error: execution reverted: Value must not be greater than 10.');
		}
	});
});
