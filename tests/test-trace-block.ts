import { expect } from 'chai';
import { step } from 'mocha-steps';

import {
    GENESIS_ACCOUNT,
    GENESIS_ALICE,
    GENESIS_ACCOUNT_PRIVATE_KEY,
    GENESIS_ALICE_PRIVATE_KEY,
    INITIAL_BASE_FEE,
} from './config';

import {
    generate,
    describeWithMetachain,
    createContracts,
    customRequest,
    nestedCall,
    nestedSingle,
} from './util';

describeWithMetachain('Metachain RPC (TraceBlock)', (context) => {
    // gen(1) is required to enable evm feature in defichain ecosys
    step('should be at block 1', async function () {
        expect(await context.web3.eth.getBlockNumber()).to.equal(1);
    });

    // Test 1
    it("trace blockscout should trace correctly out of gas tx execution", async function () {
        const contracts = await createContracts(context);

        let nonce = await context.web3.eth.getTransactionCount(GENESIS_ALICE);
        let callerAddr = contracts[0];
        let calleeAddr = contracts[1];
        await nestedCall(
            context,
            callerAddr,
            calleeAddr,
            nonce++,
        );
        await nestedCall(
            context,
            callerAddr,
            calleeAddr,
            nonce++,
        );
        await nestedCall(
            context,
            callerAddr,
            calleeAddr,
            nonce++,
        );
        await generate(context.client, 1);
        const block = await context.web3.eth.getBlock('latest');
        const block_number = await context.web3.eth.getBlockNumber();
        const block_hash = block.hash;
        let { result: traceTxByNum } = await customRequest(
            context.web3,
            'debug_traceBlockByNumber',
            [block_number, { tracer: "callTracer" }],
        );
        expect(block.transactions.length).to.be.equal(traceTxByNum.length);
        traceTxByNum.forEach((trace: { [key: string]: any }) => {
            expect(trace.calls.length).to.be.equal(1);
            expect(Object.keys(trace).sort()).to.deep.equal([
                "calls",
                "from",
                "gas",
                "gasUsed",
                "input",
                "output",
                "to",
                "type",
                "value",
            ]);
        });
        // Trace block by hash
        let { result: traceTxByHash } = await customRequest(
            context.web3,
            'debug_traceBlockByHash',
            [block_hash, { tracer: "callTracer" }],
        );
        expect(block.transactions.length).to.be.equal(traceTxByHash.length);
        traceTxByHash.forEach((trace: { [key: string]: any }) => {
            expect(trace.calls.length).to.be.equal(1);
            expect(Object.keys(trace).sort()).to.deep.equal([
                "calls",
                "from",
                "gas",
                "gasUsed",
                "input",
                "output",
                "to",
                "type",
                "value",
            ]);
        });
    });
});
