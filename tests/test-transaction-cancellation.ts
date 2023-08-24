import { expect } from 'chai';
import { step } from 'mocha-steps';

import { generate, describeWithMetachain, sendTransaction } from './util';

describeWithMetachain('Metachain RPC (Transaction Cancellation)', (context) => {
	step('should cancel the pre-transaction whilst sending tx with same nonce', async function () {
		this.timeout(15000);

		// usual
		{
			const tx0 = await sendTransaction(context, { nonce: 0 });
			const tx1 = await sendTransaction(context, { nonce: 1 });

			await generate(context.client, 1);

			const block = await context.web3.eth.getBlock('latest', true);
			expect(block.transactions.length).to.be.eq(2);
			expect(block.transactions[0].hash).to.be.eq(tx0.transactionHash);
			expect(block.transactions[1].hash).to.be.eq(tx1.transactionHash);
		}
		// should replace the old tx by the higher gas tx
		{
			// same nonce
			await sendTransaction(context, { nonce: 2 });
			const tx1 = await sendTransaction(context, { nonce: 2, gasPrice: '0x2540be404' });

			await generate(context.client, 1);

			const block = await context.web3.eth.getBlock('latest', true);
			expect(block.transactions.length).to.be.eq(1);
			expect(block.transactions[0].hash).to.be.eq(tx1.transactionHash);
		}
	});
});
