import { expect } from 'chai';
import { step } from 'mocha-steps';

import { ETH_BLOCK_GAS_LIMIT } from './config';
import { generate, describeWithMetachain, customRequest } from './util';

describeWithMetachain('Metachain RPC (Block)', (context) => {
	let previousBlock;
	// Those tests are dependant of each other in the given order.
	// The reason is to avoid having to restart the node each time
	// Running them individually will result in failure

	// gen(1) is required to enable evm feature in defichain ecosys
	step('should be at block 1', async function () {
		expect(await context.web3.eth.getBlockNumber()).to.equal(1);
	});

	it('should return genesis block by number', async function () {
		const { result: block } = await customRequest(context.web3, 'eth_getBlockByNumber', [0]);
		expect(block).to.include({
			difficulty: '0x20000',
			extraData: '0x',
			gasLimit: '0x2fefd8',
			gasUsed: '0x0',
			logsBloom:
				'0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
			miner: '0x0000000000000000000000000000000000000000',
			number: '0x0',
			receiptsRoot: '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421',
			size: '0x200',
			totalDifficulty: '0x0',
		});

		expect(block.nonce).to.eql('0x78cc16f7b4f65485');
		expect(block.hash).to.be.a('string').lengthOf(66);
		expect(block.parentHash).to.be.a('string').lengthOf(66);
		expect(block.timestamp).to.be.a('string');

		previousBlock = block;
	});

	it('genesis block should be already available by hash', async function () {
		const { result: block } = await customRequest(context.web3, 'eth_getBlockByHash', [previousBlock.hash]);
		expect(block).to.include({
			difficulty: '0x20000',
			extraData: '0x',
			gasLimit: '0x2fefd8',
			gasUsed: '0x0',
			logsBloom:
				'0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
			miner: '0x0000000000000000000000000000000000000000',
			number: '0x0',
			receiptsRoot: '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421',
			size: '0x200',
			totalDifficulty: '0x0',
		});

		previousBlock = block;
	});

	step('should have empty uncles and correct sha3Uncles', async function () {
		const block = await context.web3.eth.getBlock(0);
		expect(block.uncles).to.be.a('array').empty;
		expect(block.sha3Uncles).to.equal('0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347');
	});

	step('should have empty transactions and correct transactionRoot', async function () {
		const block = await context.web3.eth.getBlock(0);
		expect(block.transactions).to.be.a('array').empty;
		expect(block).to.include({
			transactionsRoot: '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421',
		});
	});

	// NOTE(canonbrother): latest block number is 1 due to enable evm feat. by gen(1)
	it('should return current block by latest', async function () {
		const { result: block } = await customRequest(context.web3, 'eth_getBlockByNumber', ['latest']);
		expect(block).not.null;
		expect(block.number).to.eq('0x1');
		previousBlock = block;
	});

	let firstBlockCreated = false;
	step('should increase block number after block production', async function () {
		const n = await context.web3.eth.getBlockNumber();
		this.timeout(15000);
		await generate(context.client, 1);
		expect(await context.web3.eth.getBlockNumber()).to.equal(n + 1);
		firstBlockCreated = true;
	});

	step('should have valid timestamp after block production', async function () {
		const block = await context.web3.eth.getBlock('latest');
		// expect(block.timestamp).to.be.eq(BLOCK_TIMESTAMP);
		expect(block.timestamp).to.be.a('number');
	});

	step('retrieve block information', async function () {
		expect(firstBlockCreated).to.be.true;
		const { result: block } = await customRequest(context.web3, 'eth_getBlockByNumber', ['latest']);
		expect(block).to.include({
			// author: "0x0000000000000000000000000000000000000000",
			// difficulty: "0",
			extraData: '0x4446493a20313038',
			gasLimit: `0x${ETH_BLOCK_GAS_LIMIT.toString(16)}`,
			gasUsed: '0x0',
			//hash: "0x14fe6f7c93597f79b901f8b5d7a84277a90915b8d355959b587e18de34f1dc17",
			logsBloom:
				'0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
			// miner: "0x0000000000000000000000000000000000000000",
			number: '0x2',
			//parentHash: "0x04540257811b46d103d9896e7807040e7de5080e285841c5430d1a81588a0ce4",
			parentHash: previousBlock.hash,
			receiptsRoot: '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421',
			// size: 507,
			// timestamp: BLOCK_TIMESTAMP,
			totalDifficulty: '0x0',
			//transactions: [],
			transactionsRoot: '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421',
			//uncles: []
			baseFeePerGas: '0x2540be400',
		});
		previousBlock = block;

		expect(block.transactions).to.be.a('array').empty;
		expect(block.uncles).to.be.a('array').empty;
		expect(block.nonce).to.eql('0x0000000000000000');
		expect(block.hash).to.be.a('string').lengthOf(66);
		expect(block.parentHash).to.be.a('string').lengthOf(66);
		expect(block.timestamp).to.be.a('string');
	});

	step('get block by hash', async function () {
		const latest_block = await context.web3.eth.getBlock('latest');
		const block = await context.web3.eth.getBlock(latest_block.hash);
		expect(block.hash).to.be.eq(latest_block.hash);
	});

	step('get block by number', async function () {
		const block = await context.web3.eth.getBlock(2);
		expect(block).not.null;
	});

	it('should include previous block hash as parent', async function () {
		this.timeout(15000);
		await generate(context.client, 1);
		const block = await context.web3.eth.getBlock('latest');
		expect(block.hash).to.not.equal(previousBlock.hash);
		expect(block.parentHash).to.equal(previousBlock.hash);
	});
});
