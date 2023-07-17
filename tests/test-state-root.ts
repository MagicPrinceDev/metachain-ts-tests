import { expect } from 'chai';
import { step } from 'mocha-steps';

import { generate, describeWithMetachain, sendTransaction } from './util';

describeWithMetachain('Metachain RPC (State root hash)', (context) => {
	step('should calculate a valid intermediate state root hash', async function () {
		const b1 = await context.web3.eth.getBlock(1);
		expect(b1.stateRoot.length).to.be.equal(66); // 0x prefixed
		expect(b1.stateRoot).to.not.be.equal('0x0000000000000000000000000000000000000000000000000000000000000000');
	});

	step('hash should be unique between blocks', async function () {
		const b1 = await context.web3.eth.getBlock(1);

		await sendTransaction(context, 0, '0x0', '0x3B9ACA00');
		await generate(context.client, 1);

		const b2 = await context.web3.eth.getBlock(2);
		expect(b1.stateRoot).to.not.be.equal(b2.stateRoot);

		await generate(context.client, 1);
		const b3 = await context.web3.eth.getBlock(3);

		expect(b2.stateRoot).to.not.be.equal(b3.stateRoot);
	});
});
