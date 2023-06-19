import { expect } from "chai";
import { step } from "mocha-steps";

import { RUNTIME_SPEC_NAME, RUNTIME_SPEC_VERSION } from "./config";
import { describeWithMetachain, customRequest } from "./util";

describeWithMetachain("Metachain RPC (Web3Api)", (context) => {
	step("should get client version", async function () {
		const version = await context.web3.eth.getNodeInfo();
		expect(version).to.be.contains(
			`${RUNTIME_SPEC_NAME}/v${RUNTIME_SPEC_VERSION}`
		);
	});

	step("should remote sha3", async function () {
		const data = context.web3.utils.stringToHex("hello");
		const hash = await customRequest(context.web3, "web3_sha3", [data]);
		const localHash = context.web3.utils.sha3("hello");
		expect(hash.result).to.be.equal(localHash);
	});
});
