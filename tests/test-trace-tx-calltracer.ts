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

// Import contracts
import CallForwarder from "../build/contracts/CallForwarder.json";
import MultiplyBy7 from '../build/contracts/MultiplyBy7.json';
import TraceCallee from '../build/contracts/TraceCallee.json';

describeWithMetachain('Metachain RPC (TraceTransaction - CallTracer)', (context) => {
    // gen(1) is required to enable evm feature in defichain ecosys
    step('should be at block 1', async function () {
        expect(await context.web3.eth.getBlockNumber()).to.equal(1);
    });

    // Test 1
    it("should format as request (Call)", async function () {
        const { result: send } = await nestedSingle(context);
        await generate(context.client, 1);
        const { result: traceTx } = await customRequest(
            context.web3,
            'debug_traceTransaction',
            [send, { tracer: "callTracer" }]);
        const res = traceTx;
        // Fields
        expect(Object.keys(res).sort()).to.deep.equal([
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
        // Type
        expect(res.type).to.be.equal("CALL");
        // Nested calls
        const calls = res.calls;
        expect(calls.length).to.be.eq(1);
        const nested_call = calls[0];
        expect(res.to).to.be.equal(nested_call.from);
        expect(nested_call.type).to.be.equal("CALL");
    });

    // Test 2
    it("should format as request (Create)", async function () {
        const TEST_TRACE_CALLEE_BYTECODE = TraceCallee.bytecode;
        const tx = await context.web3.eth.accounts.signTransaction(
            {
                from: GENESIS_ACCOUNT,
                data: TEST_TRACE_CALLEE_BYTECODE,
                value: '0x00',
                gasPrice: context.web3.utils.numberToHex(INITIAL_BASE_FEE),
                gas: '0x100000',
            },
            GENESIS_ACCOUNT_PRIVATE_KEY
        );
        await customRequest(context.web3, 'eth_sendRawTransaction', [tx.rawTransaction]);
        await generate(context.client, 1);

        const { result: traceTx } = await customRequest(
            context.web3,
            'debug_traceTransaction',
            [tx.transactionHash, { tracer: "callTracer" }]);

        // Fields
        expect(Object.keys(traceTx).sort()).to.deep.equal([
            "from",
            "gas",
            "gasUsed",
            "input",
            "output",
            "to",
            "type",
            "value",
        ]);
        // Type
        expect(traceTx.type).to.be.equal("CREATE");
        await generate(context.client, 1);
    });

    // Test 3
    it("should correctly trace subcall", async function () {
        const TEST_CALL_FORWARDER_BYTECODE = CallForwarder.bytecode;
        const TEST_CALL_FORWARDER_ABI = CallForwarder.abi as AbiItem[];
        const nonce = await context.web3.eth.getTransactionCount(GENESIS_ACCOUNT);
        const abiProxy = new context.web3.eth.Contract(TEST_CALL_FORWARDER_ABI);
        const tx1 = await context.web3.eth.accounts.signTransaction(
            {
                from: GENESIS_ACCOUNT,
                data: TEST_CALL_FORWARDER_BYTECODE,
                value: '0x00',
                gasPrice: context.web3.utils.numberToHex(INITIAL_BASE_FEE),
                gas: '0x100000',
                nonce: nonce,
            },
            GENESIS_ACCOUNT_PRIVATE_KEY
        );
        await customRequest(context.web3, 'eth_sendRawTransaction', [tx1.rawTransaction]);

        const TEST_MULTIPLY_BY_7_BYTECODE = MultiplyBy7.bytecode;
        const TEST_MULTIPLY_BY_7_ABI = MultiplyBy7.abi as AbiItem[];
        const abiDummy = new context.web3.eth.Contract(TEST_MULTIPLY_BY_7_ABI);
        const tx2 = await context.web3.eth.accounts.signTransaction(
            {
                from: GENESIS_ACCOUNT,
                data: TEST_MULTIPLY_BY_7_BYTECODE,
                value: '0x00',
                gasPrice: context.web3.utils.numberToHex(INITIAL_BASE_FEE),
                gas: '0x100000',
                nonce: nonce + 1,
            },
            GENESIS_ACCOUNT_PRIVATE_KEY
        )
        await customRequest(context.web3, 'eth_sendRawTransaction', [tx2.rawTransaction]);

        // Deploy contracts
        await generate(context.client, 1);
        let receipt1 = await context.web3.eth.getTransactionReceipt(tx1.transactionHash);
        let receipt2 = await context.web3.eth.getTransactionReceipt(tx2.transactionHash);
        let contractProxy = receipt1.contractAddress;
        let contractDummy = receipt2.contractAddress;

        const callTx = await context.web3.eth.accounts.signTransaction(
            {
                from: GENESIS_ALICE,
                to: contractProxy,
                gas: '0x100000',
                value: '0x00',
                data: abiProxy.methods.call(
                    contractDummy,
                    abiDummy.methods.multiply(42).encodeABI(),
                ).encodeABI(),
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
            [data, { tracer: "callTracer" }],
        );
        expect(traceTx.from).to.be.eq(GENESIS_ALICE.toLowerCase());
        expect(traceTx.to).to.be.eq(contractProxy.toLowerCase());
        expect(traceTx.calls.length).to.be.eq(1);
        expect(traceTx.calls[0].from).to.be.eq(contractProxy.toLowerCase());
        expect(traceTx.calls[0].to).to.be.eq(contractDummy.toLowerCase());
        expect(traceTx.calls[0].type).to.be.eq("CALL");
    });

    // Test 4
    it("should correctly trace delegatecall subcall", async function () {
        const TEST_CALL_FORWARDER_BYTECODE = CallForwarder.bytecode;
        const TEST_CALL_FORWARDER_ABI = CallForwarder.abi as AbiItem[];
        const nonce = await context.web3.eth.getTransactionCount(GENESIS_ACCOUNT);
        const abiProxy = new context.web3.eth.Contract(TEST_CALL_FORWARDER_ABI);
        const tx1 = await context.web3.eth.accounts.signTransaction(
            {
                from: GENESIS_ACCOUNT,
                data: TEST_CALL_FORWARDER_BYTECODE,
                value: '0x00',
                gasPrice: context.web3.utils.numberToHex(INITIAL_BASE_FEE),
                gas: '0x100000',
                nonce: nonce,
            },
            GENESIS_ACCOUNT_PRIVATE_KEY
        );
        await customRequest(context.web3, 'eth_sendRawTransaction', [tx1.rawTransaction]);

        const TEST_MULTIPLY_BY_7_BYTECODE = MultiplyBy7.bytecode;
        const TEST_MULTIPLY_BY_7_ABI = MultiplyBy7.abi as AbiItem[];
        const abiDummy = new context.web3.eth.Contract(TEST_MULTIPLY_BY_7_ABI);
        const tx2 = await context.web3.eth.accounts.signTransaction(
            {
                from: GENESIS_ACCOUNT,
                data: TEST_MULTIPLY_BY_7_BYTECODE,
                value: '0x00',
                gasPrice: context.web3.utils.numberToHex(INITIAL_BASE_FEE),
                gas: '0x100000',
                nonce: nonce + 1,
            },
            GENESIS_ACCOUNT_PRIVATE_KEY
        )
        await customRequest(context.web3, 'eth_sendRawTransaction', [tx2.rawTransaction]);

        // Deploy contracts
        await generate(context.client, 1);
        let receipt1 = await context.web3.eth.getTransactionReceipt(tx1.transactionHash);
        let receipt2 = await context.web3.eth.getTransactionReceipt(tx2.transactionHash);
        let contractProxy = receipt1.contractAddress;
        let contractDummy = receipt2.contractAddress;

        const callTx = await context.web3.eth.accounts.signTransaction(
            {
                from: GENESIS_ALICE,
                to: contractProxy,
                gas: '0x100000',
                value: '0x00',
                data: abiProxy.methods.delegateCall(
                    contractDummy,
                    abiDummy.methods.multiply(42).encodeABI(),
                ).encodeABI(),
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
            [data, { tracer: "callTracer" }],
        );
        expect(traceTx.from).to.be.eq(GENESIS_ALICE.toLowerCase());
        expect(traceTx.to).to.be.eq(contractProxy.toLowerCase());
        expect(traceTx.calls.length).to.be.eq(1);
        expect(traceTx.calls[0].from).to.be.eq(contractProxy.toLowerCase());
        expect(traceTx.calls[0].to).to.be.eq(contractDummy.toLowerCase());
        expect(traceTx.calls[0].type).to.be.eq("DELEGATECALL");
    });
});
