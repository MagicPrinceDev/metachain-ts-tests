import { expect, use as chaiUse } from 'chai';
import chaiAsPromised from 'chai-as-promised';

import Test from '../build/contracts/Test.json';
import { GENESIS_ACCOUNT, GENESIS_ACCOUNT_PRIVATE_KEY, FIRST_CONTRACT_ADDRESS, INITIAL_BASE_FEE } from './config';
import { generate, customRequest, describeWithMetachain } from './util';

chaiUse(chaiAsPromised);

describeWithMetachain('Metachain RPC (Contract)', (context) => {
	const TEST_CONTRACT_BYTECODE = Test.bytecode;
	const TEST_CONTRACT_DEPLOYED_BYTECODE = Test.deployedBytecode;

	// Those test are ordered. In general this should be avoided, but due to the time it takes
	// to spin up a metachain node, it saves a lot of time.

	it('contract creation should return transaction hash', async function () {
		await generate(context.client, 1);
		this.timeout(15000);
		const tx = await context.web3.eth.accounts.signTransaction(
			{
				from: GENESIS_ACCOUNT,
				data: TEST_CONTRACT_BYTECODE,
				value: '0x00',
				gasPrice: context.web3.utils.numberToHex(INITIAL_BASE_FEE),
				gas: '0x100000',
			},
			GENESIS_ACCOUNT_PRIVATE_KEY
		);

		expect(await customRequest(context.web3, 'eth_sendRawTransaction', [tx.rawTransaction])).to.include({
			id: 1,
			jsonrpc: '2.0',
		});

		const t = await customRequest(context.web3, 'eth_getCode', [FIRST_CONTRACT_ADDRESS]);

		// Verify the contract is not yet stored
		expect(await customRequest(context.web3, 'eth_getCode', [FIRST_CONTRACT_ADDRESS])).to.deep.equal({
			jsonrpc: '2.0',
			result: '0x',
			id: 1,
		});

		// TODO handle "pending" block

		// // Verify the contract is in the pending state
		// expect(await customRequest(context.web3, "eth_getCode", [FIRST_CONTRACT_ADDRESS, "pending"])).to.deep.equal({
		// 	id: 1,
		// 	jsonrpc: "2.0",
		// 	result: TEST_CONTRACT_DEPLOYED_BYTECODE,
		// });

		// Verify the contract is stored after the block is produced
		await generate(context.client, 1);
		expect(await customRequest(context.web3, 'eth_getCode', [FIRST_CONTRACT_ADDRESS])).to.deep.equal({
			id: 1,
			jsonrpc: '2.0',
			result: TEST_CONTRACT_DEPLOYED_BYTECODE,
		});
	});

	it('eth_call contract create should return code', async function () {
		expect(
			await context.web3.eth.call({
				data: TEST_CONTRACT_BYTECODE,
			})
		).to.be.eq(TEST_CONTRACT_DEPLOYED_BYTECODE);
	});

	it('eth_call at missing block returns error', async function () {
		const nonExistingBlockNumber = '999999';
		return expect(
			context.web3.eth.call(
				{
					data: TEST_CONTRACT_BYTECODE,
				},

				nonExistingBlockNumber
			)
		).to.eventually.rejectedWith('header not found');
	});
});
