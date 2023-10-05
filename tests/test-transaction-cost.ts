import { expect } from 'chai';
import { step } from 'mocha-steps';

import { describeWithMetachain, customRequest } from './util';

describeWithMetachain('Metachain RPC (Transaction cost)', (context) => {
	step('should take transaction cost into account and not submit it to the pool', async function () {
		// Simple transfer with gas limit 0 manually signed to prevent web3 from rejecting client-side.
		const rawtx =
			'0xf86180843b9aca00809412cb274aad8251c875c0bf6872b67d9983e53fdd01801ca00e28ba2dd3c5a3fd467d4afd7aefb4a34b373314fff470bb9db743a84d674a0aa06e5994f2d07eafe1c37b4ce5471caecec29011f6f5bf0b1a552c55ea348df35f';
		const tx = await customRequest(context.web3, 'eth_sendRawTransaction', [rawtx]);
		// let msg = 'intrinsic gas too low';
		let msg = `Custom error: Could not publish raw transaction: ${rawtx} reason: Test EvmTx execution failed:\nevm tx failed to pre-validate tx gas price is lower than initial block base fee`;
		expect(tx.error).to.include({
			message: msg,
		});
	});
});
