import { expect } from 'chai';
import { step } from 'mocha-steps';

import { GENESIS_ACCOUNT, GENESIS_ACCOUNT_PRIVATE_KEY } from './config';
import { generate, describeWithMetachain, customRequest } from './util';

describeWithMetachain('Metachain RPC (Transaction Future)', (context) => {
	async function sendTransaction(context, nonce: number, value: string, gasPrice = '0x3B9ACA03') {
		const tx = await context.web3.eth.accounts.signTransaction(
			{
				from: GENESIS_ACCOUNT,
				to: GENESIS_ACCOUNT,
				value: value,
				gasPrice: gasPrice,
				gas: '0x100000',
				nonce: nonce,
			},
			GENESIS_ACCOUNT_PRIVATE_KEY
		);

		const { result: txHash } = await customRequest(context.web3, 'eth_sendRawTransaction', [tx.rawTransaction]);
		return txHash;
	}

	step('should cancel the future transaction, tx nonce must be queued', async function () {
		this.timeout(15000);

		// usual
		{
			const txHash0 = await sendTransaction(context, 0, '0x01', '0x3B9ACA03'); // 1_000_000_003
			const txHash1 = await sendTransaction(context, 1, '0x00', '0x3B9ACA03'); // 1_000_000_003
			const txHash2 = await sendTransaction(context, 2, '0x00', '0x3B9ACA03'); // 1_000_000_003
			const txHash9 = await sendTransaction(context, 9, '0x00', '0x3B9ACA03'); // 1_000_000_003

			await generate(context.client, 1);

			const block = await context.web3.eth.getBlock('latest', true);
			expect(block.transactions.length).to.be.eq(3);

			const txHashes = block.transactions.map((tx) => tx.hash);
			expect(txHashes.includes(txHash0)).to.be.true;
			expect(txHashes.includes(txHash1)).to.be.true;
			expect(txHashes.includes(txHash2)).to.be.true;
			expect(txHashes.includes(txHash9)).to.be.false;
		}
	});
});
