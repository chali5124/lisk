/*
 * Copyright © 2018 Lisk Foundation
 *
 * See the LICENSE file at the top-level directory of this distribution
 * for licensing information.
 *
 * Unless otherwise agreed in a custom licensing agreement with the Lisk Foundation,
 * no part of this software, including this file, may be copied, modified,
 * propagated, or distributed except according to the terms contained in the
 * LICENSE file.
 *
 * Removal or modification of this copyright notice is prohibited.
 */

'use strict';

var Promise = require('bluebird');
var lisk = require('lisk-js').default;
var accountFixtures = require('../../../fixtures/accounts');
var constants = require('../../../../helpers/constants');
var randomUtil = require('../../../common/utils/random');
var waitFor = require('../../../common/utils/wait_for');
var sendTransactionsPromise = require('../../../common/helpers/api')
	.sendTransactionsPromise;
var confirmTransactionsOnAllNodes = require('../common/stress')
	.confirmTransactionsOnAllNodes;

module.exports = function(params) {
	describe('stress test for type 3 transactions @slow', () => {
		var accounts = [];
		var transactions = [];
		var maximum = 1000;

		describe('prepare accounts', () => {
			before(() => {
				transactions = [];
				return Promise.all(
					_.range(maximum).map(() => {
						var tmpAccount = randomUtil.account();
						var transaction = lisk.transaction.transfer({
							amount: 500000000,
							passphrase: accountFixtures.genesis.password,
							recipientId: tmpAccount.address,
						});
						accounts.push(tmpAccount);
						transactions.push(transaction);
						return sendTransactionsPromise([transaction]);
					})
				);
			});

			it('should confirm all transactions on all nodes', done => {
				var blocksToWait =
					Math.ceil(maximum / constants.maxTransactionsPerBlock) + 2;
				waitFor.blocks(blocksToWait, () => {
					confirmTransactionsOnAllNodes(transactions, params).then(done);
				});
			});
		});

		describe('sending vote transactions', () => {
			before(() => {
				transactions = [];
				return Promise.all(
					_.range(maximum).map(num => {
						var transaction = lisk.transaction.castVotes({
							votes: [accountFixtures.existingDelegate.publicKey],
							unvotes: [],
							passphrase: accounts[num].password,
						});
						transactions.push(transaction);
						return sendTransactionsPromise([transaction]);
					})
				);
			});

			it('should confirm all transactions on all nodes', done => {
				var blocksToWait =
					Math.ceil(maximum / constants.maxTransactionsPerBlock) + 2;
				waitFor.blocks(blocksToWait, () => {
					confirmTransactionsOnAllNodes(transactions, params).then(done);
				});
			});
		});
	});
};
