import { expect } from "chai";
import { step } from "mocha-steps";

import { GENESIS_ACCOUNT, GENESIS_ACCOUNT_PRIVATE_KEY } from "./config";
import { generate, describeWithMetachain, customRequest } from "./util";

describeWithMetachain("Metachain RPC (Transaction Cancellation)", (context) => {

	async function sendTransaction(context, nonce: number, value: string, gasPrice = "0x3B9ACA03") {
		const tx = await context.web3.eth.accounts.signTransaction(
			{
				from: GENESIS_ACCOUNT,
				to: GENESIS_ACCOUNT,
				value: value,
				gasPrice: gasPrice,
				gas: "0x100000",
				nonce: nonce,
			},
			GENESIS_ACCOUNT_PRIVATE_KEY
		);

		await customRequest(context.web3, "eth_sendRawTransaction", [tx.rawTransaction]);
		return tx;
	}

	step("should cancel the pre-transaction whilst sending tx with same nonce", async function () {
		this.timeout(15000);

		// usual
		{
			const tx0 = await sendTransaction(context, 0, "0x01", "0x3B9ACA03"); // 1_000_000_003
			const tx1 = await sendTransaction(context, 1, "0x00", "0x3B9ACA03");  // 1_000_000_003

			await generate(context.client, 1);

			const block = await context.web3.eth.getBlock("latest", true);
			expect(block.transactions.length).to.be.eq(2)
			expect(block.transactions[0].hash).to.be.eq(tx0.transactionHash)
			expect(block.transactions[1].hash).to.be.eq(tx1.transactionHash)
		}
		// should replace the old tx by the higher gas tx
		{
			// same nonce
			await sendTransaction(context, 2, "0x01", "0x3B9ACA03"); // 1_000_000_003
			const tx1 = await sendTransaction(context, 2, "0x00", "0xb2d05e09"); // 3_000_000_009

			await generate(context.client, 1);

			const block = await context.web3.eth.getBlock("latest", true);
			expect(block.transactions.length).to.be.eq(1)
			expect(block.transactions[0].hash).to.be.eq(tx1.transactionHash)
		}
	});
});
