import { expect } from 'chai';
import { step } from 'mocha-steps';
import { AbiItem } from 'web3-utils';

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
    customRequest,
    nestedSingle,
} from './util';

// Import custom tracers
import BS_TRACER from '../tracer/blockscout_tracer.min.json'
import BS_TRACER_V2 from '../tracer/blockscout_tracer_v2.min.json'

// Import contracts
import Looper from '../build/contracts/Looper.json';

describeWithMetachain('Metachain RPC (TraceTransaction - Blockscout)', (context) => {
    // gen(1) is required to enable evm feature in defichain ecosys
    step('should be at block 1', async function () {
        expect(await context.web3.eth.getBlockNumber()).to.equal(1);
    });

    // Test 1
    it("trace blockscout - should format as request", async function () {
        const { result: send } = await nestedSingle(context);
        await generate(context.client, 1);
        const { result: traceTx } = await customRequest(
            context.web3, 'debug_traceTransaction',
            [send, { tracer: BS_TRACER.body }],
        );
        const entries = traceTx;
        expect(entries).to.be.lengthOf(2);
        const resCaller = entries[0];
        const resCallee = entries[1];
        expect(resCaller.callType).to.be.equal("call");
        expect(resCallee.type).to.be.equal("call");
        expect(resCallee.from).to.be.equal(resCaller.to);
        expect(resCaller.traceAddress).to.be.empty;
        expect(resCallee.traceAddress.length).to.be.eq(1);
        expect(resCallee.traceAddress[0]).to.be.eq(0);
    });

    // Test 2
    it("trace blockscout-v2 - AllEthTxTypes", async function () {
        const { result: send } = await nestedSingle(context);
        await generate(context.client, 1);
        const { result: traceTx } = await customRequest(
            context.web3, 'debug_traceTransaction',
            [send, { tracer: BS_TRACER_V2.body }],
        );
        const entries = traceTx;
        expect(entries).to.be.lengthOf(2);
        const resCaller = entries[0];
        const resCallee = entries[1];
        expect(resCaller.callType).to.be.equal("call");
        expect(resCallee.type).to.be.equal("call");
        expect(resCallee.from).to.be.equal(resCaller.to);
        expect(resCaller.traceAddress).to.be.empty;
        expect(resCallee.traceAddress.length).to.be.eq(1);
        expect(resCallee.traceAddress[0]).to.be.eq(0);
    });

    // Test 3
    it("trace blockscout-v2 should trace correctly out of gas tx execution", async function () {
        const TEST_LOOPER_BYTECODE = Looper.bytecode;
        const tx = await context.web3.eth.accounts.signTransaction(
            {
                from: GENESIS_ACCOUNT,
                data: TEST_LOOPER_BYTECODE,
                value: '0x00',
                gasPrice: context.web3.utils.numberToHex(INITIAL_BASE_FEE),
                gas: '0x100000',
            },
            GENESIS_ACCOUNT_PRIVATE_KEY
        );
        await customRequest(context.web3, 'eth_sendRawTransaction', [tx.rawTransaction]);
        await generate(context.client, 1);
        let receipt0 = await context.web3.eth.getTransactionReceipt(tx.transactionHash);
        let contractAddress = receipt0.contractAddress;
        const callTx = await context.web3.eth.accounts.signTransaction(
            {
                from: GENESIS_ALICE,
                to: contractAddress,
                data: '0x5bec9e67',
                value: '0x00',
                gas: '0x100000',
            },
            GENESIS_ALICE_PRIVATE_KEY,
        );
        const { result: data } = await customRequest(
            context.web3,
            'eth_sendRawTransaction',
            [callTx.rawTransaction],
        );
        await generate(context.client, 1);
        const { result: traceTx } = await customRequest(
            context.web3, 'debug_traceTransaction',
            [data, { tracer: BS_TRACER_V2.body }],
        );
        expect(traceTx.length).to.be.eq(1);
        expect(traceTx[0].error).to.be.equal("out of gas");
    });

    // Test 4
    it("trace blockscout should trace correctly out of gas tx execution", async function () {
        const TEST_LOOPER_BYTECODE = Looper.bytecode;
        const tx = await context.web3.eth.accounts.signTransaction(
            {
                from: GENESIS_ACCOUNT,
                data: TEST_LOOPER_BYTECODE,
                value: '0x00',
                gasPrice: context.web3.utils.numberToHex(INITIAL_BASE_FEE),
                gas: '0x100000',
            },
            GENESIS_ACCOUNT_PRIVATE_KEY
        );
        await customRequest(context.web3, 'eth_sendRawTransaction', [tx.rawTransaction]);
        await generate(context.client, 1);
        let receipt0 = await context.web3.eth.getTransactionReceipt(tx.transactionHash);
        let contractAddress = receipt0.contractAddress;
        const callTx = await context.web3.eth.accounts.signTransaction(
            {
                from: GENESIS_ALICE,
                to: contractAddress,
                data: '0x5bec9e67',
                value: '0x00',
                gas: '0x100000',
            },
            GENESIS_ALICE_PRIVATE_KEY,
        );
        const { result: data } = await customRequest(
            context.web3,
            'eth_sendRawTransaction',
            [callTx.rawTransaction],
        );
        await generate(context.client, 1);
        const { result: traceTx } = await customRequest(
            context.web3, 'debug_traceTransaction',
            [data, { tracer: BS_TRACER.body }],
        );
        expect(traceTx.length).to.be.eq(1);
        expect(traceTx[0].error).to.be.equal("out of gas");
    });
});
