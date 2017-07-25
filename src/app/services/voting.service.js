import CryptoHelpers from '../utils/CryptoHelpers';
import Address from '../utils/Address';
import KeyPair from '../utils/KeyPair';
import helpers from '../utils/helpers';

class Voting {
    constructor($q, $filter, $timeout, $state, Alert, Wallet, DataBridge, NetworkRequests, nemUtils, Transactions, WalletBuilder) {
        'ngInject';

        /***
         * Declare services
         */
        this._$q = $q;
        this._$timeout = $timeout;
        this._$state = $state;
        this._$filter = $filter;
        this._Alert = Alert;
        this._Wallet = Wallet;
        this._DataBridge = DataBridge;
        this._NetworkRequests = NetworkRequests;
        this._nemUtils = nemUtils;
        this._Transactions = Transactions;
        this._WalletBuilder = WalletBuilder;
    }

    // Voting Functions

    /**
     * getPolls(pollIndexAddress) returns a list with the poll headers from all the polls that are on the given index
     *
     * @param {string} pollIndexAddress - NEM address for the poll index account
     *
     * @return {promise} - a list of all the poll header objects on the index account
     */
    getPolls(pollIndexAddress) {
        //get all polls in poll index account (messages that start with poll:)
        return this._nemUtils.getFirstMessageWithString(pollIndexAddress, 'pollIndex:').then((message)=>{
            let indexInfo = JSON.parse(message.replace('pollIndex:', ''));
            let isPrivate = indexInfo.private;
            let creator = indexInfo.creator;
            var allPolls = [];
            return this._nemUtils.getTransactionsWithString(pollIndexAddress, "poll:").then((transactions) => {
                for (var i = 0; i < transactions.length; i++) {
                    let transaction = transactions[i];
                    if(isPrivate){
                        let address = Address.toAddress(transaction.transaction.signer, this._Wallet.network);
                        if(address === creator){
                            allPolls.push(JSON.parse(transaction.transaction.message.replace('poll:', '')));
                        }
                    }
                    else{
                        allPolls.push(JSON.parse(transaction.transaction.message.replace('poll:', '')));
                    }
                }
                return allPolls;
            }).catch((e)=>{
                throw e;
            });
        }).catch((e)=>{
            throw e;
        });
    }

    /**
     * createPoll(details, pollIndex, common) creates a poll with the given details on the given pollIndex
     *
     * @param {object} details - poll details, without the option addresses
     * @param {string} pollIndex - NEM address of the poll index
     * @param {object} common - common object
     *
     * @return {promise} - the generated poll Address
     */
    createPoll(details, pollIndex, common) {
        if (!details.whitelist)
            details.whitelist = [];

        var currentAddress = this._Wallet.currentAccount.address;
        var message = "";
        var IndexAccount = pollIndex;

        this._nemUtils.disableSuccessAlerts();

        var PollAccount;
        var OptionAccounts = [];

        console.log("// 0.create poll account (PA)");
        return this._nemUtils.createNewAccount().then((data) => {
            console.log("//1.generate 1 account per option (OA)");
            PollAccount = data;

            var addresses = [];
            for (var i = 0; i < details.options.length; i++) {
                addresses.push(this._nemUtils.createNewAccount());
            }

            return Promise.all(addresses);
        }).then((data) => {
            OptionAccounts = data;
            //console.log("addresses", OptionAccounts);
            //GENERATE ALL THE MESSAGES
            var formDataMessage = "formData:" + JSON.stringify(details.formData);
            var descriptionMessage = "description:" + details.description;
            let optionsObj = {
                strings: details.options,
                addresses: OptionAccounts.map((acc) => {
                    return acc.address
                })
            };
            var optionsMessage = "options:" + JSON.stringify(optionsObj);
            details.whitelist = details.whitelist.map((address) => {
                return address.toUpperCase().replace(/-/g, '');
            });
            var whitelistMessage = "whitelist:" + JSON.stringify(details.whitelist);
            console.log("//2.send data to PA");
            console.log("//2.1.send formData");
            return this._nemUtils.sendMessage(PollAccount.address, formDataMessage, common).then(() => {
                console.log("//2.2.send description");
                return this._nemUtils.sendMessage(PollAccount.address, descriptionMessage, common);
            }).then(() => {
                console.log("//2.3.send options");
                return this._nemUtils.sendMessage(PollAccount.address, optionsMessage, common);
            }).then(() => {
                if (details.formData.type === 1) {
                    console.log("//2.4.send whitelist");
                    return this._nemUtils.sendMessage(PollAccount.address, whitelistMessage, common);
                } else {
                    return;
                }
            });
        }).then((data) => {
            //Create poll message
            let header = {
                title: details.formData.title,
                type: details.formData.type,
                doe: details.formData.doe,
                address: PollAccount.address
            };
            if (details.formData.type === 1) {
                header.whitelist = details.whitelist;
            } else if (details.formData.type === 2) {
                header.mosaic = details.formData.mosaic;
            }
            var pollMessage = "poll:" + JSON.stringify(header);
            console.log("//3.send poll header to IA");
            return this._nemUtils.sendMessage(IndexAccount, pollMessage, common);
        }).then(() => {
            // Return the poll address
            return PollAccount.address;
        });
    }

    /**
     * vote(address, common, multisigAccount) sends a vote to the given address. Can vote as multisig
     *
     * @param {string} address - option address on which to vote
     * @param {object} common - common object
     * @param {string} multisigAccount - NEM address of the multisig account we want to send the vote for
     *
     * @return {promise} - returns a promise that resolves when the vote has been sent
     */
    vote(address, common, multisigAccount, message) {
        this._nemUtils.disableSuccessAlerts();

        var formData = {};
        formData.rawRecipient = '';
        formData.recipient = address;
        formData.recipientPubKey = '';
        formData.message = '';
        formData.amount = 0;
        formData.fee = 0;
        formData.encryptMessage = false;

        // Multisig data
        formData.innerFee = 0;
        if (!multisigAccount) {
            formData.isMultisig = false;
            formData.multisigAccount = '';
        } else {
            if(message){
                formData.message = message;
            }
            formData.isMultisig = true;
            formData.multisigAccount = multisigAccount;
        }

        let now = (new Date()).getTime();

        // Mosaics data
        formData.mosaics = null;
        var mosaicsMetaData = this._DataBridge.mosaicDefinitionMetaDataPair;
        formData.isMosaicTransfer = false;

        // Build the entity to serialize
        let entity = this._Transactions.prepareTransfer(common, formData, mosaicsMetaData);
        return this._Transactions.serializeAndAnnounceTransaction(entity, common).then((res) => {
            // Check status
            if (res.status === 200) {
                // If code >= 2, it's an error
                if (res.data.code >= 2) {
                    this._Alert.transactionError(res.data.message);
                    throw res.data.message;
                }
            }
        }, (e) => {
            throw e;
        });
    }

    /**
     * pollDetails(pollAddress) returns the details of a poll stored in the given pollAddress
     *
     * @param {string} pollAddress - NEM address for the poll account
     *
     * @return {promise} - a promise that returns the details object of the poll
     */
    pollDetails(pollAddress) {
        var details = {
            formData: {},
            description: '',
            options: {},
            whitelist: null
        };
        //get all the data from the Poll address
        let QueryOptions = {
            start: 0
        };

        var formDataPromise = this._nemUtils.getFirstMessageWithString(pollAddress, "formData:", QueryOptions);
        var descriptionPromise = this._nemUtils.getFirstMessageWithString(pollAddress, "description:", QueryOptions);
        var optionsPromise = this._nemUtils.getFirstMessageWithString(pollAddress, "options:", QueryOptions);

        return Promise.all([formDataPromise, descriptionPromise, optionsPromise]).then(([formDataResult, descriptionResult, optionsResult]) => {
            if(formDataResult === ''){
                throw "Address is not a poll";
            }
            details.formData = (JSON.parse(formDataResult.replace('formData:', '')));
            details.description = (descriptionResult.replace('description:', ''));
            details.options = (JSON.parse(optionsResult.replace('options:', '')));
            if (details.formData.type === 1) {
                return this._nemUtils.getFirstMessageWithString(pollAddress, "whitelist:", QueryOptions).then((whiteMsg) => {
                    details.whitelist = (JSON.parse(whiteMsg.replace('whitelist:', '')));
                    return details;
                }).catch((e)=>{
                    throw e;
                });
            } else {
                return details;
            }
        }).catch((e)=>{
            throw e;
        });
    }

    /**
     * get1a1vResults(pollAddress, end) returns the result object for the poll
     *
     * @param {string} pollAddress - NEM address of the poll
     * @param {integer} end - a timestamp for the end of the counting. All votes after this will be ignored
     *
     * @return {promise} - A promise that returns the result object of the poll
     */
    get1a1vResults(pollAddress, end) {
        var details;
        var endBlock;
        var optionTransactions = [];

        // get the end block
        let blockPromise;
        if (end) {
            blockPromise = this._nemUtils.getHeightByTimestamp(end);
        } else {
            blockPromise = this._nemUtils.getCurrentHeight();
        }
        return blockPromise.then((block) => {
            endBlock = block;
            // get poll details
            return this.pollDetails(pollAddress);
        }).then((data) => {
            details = data;
            //get all Transactions
            for (var i = 0; i < details.options.addresses.length; i++) {
                optionTransactions.push(this._nemUtils.getTransactionsWithString(details.options.addresses[i], ""));
            }
            return Promise.all(optionTransactions)
        }).then((data) => {
            optionTransactions = data;
            //console.log("optionTransactions", optionTransactions);
            if (end) {
                optionTransactions = optionTransactions.map((transactions) => {
                    return transactions.filter((transaction) => {
                        return transaction.meta.height <= endBlock;
                    });
                })
            } else {
                end = new Date().getTime();
            }
            var optionAddresses = [];
            //convert public keys to addresses and filter by WhiteList
            for (var i = 0; i < optionTransactions.length; i++) {
                optionAddresses.push(optionTransactions[i].map((transaction) => {
                    return Address.toAddress(transaction.transaction.signer, this._Wallet.network);
                }).filter((address) => {
                    return (details.whitelist.indexOf(address) > -1);
                }));
            }
            //eliminate repetitions in array
            const unique = function(list) {
                return list.sort().filter((item, pos, ary) => {
                    return !pos || item !== ary[pos - 1];
                });
            };
            optionAddresses = optionAddresses.map(unique); // the lists are now sorted

            // merge for two sorted arrays
            const merge = function(a, b) {
                var answer = new Array(a.length + b.length),
                    i = 0,
                    j = 0,
                    k = 0;
                while (i < a.length && j < b.length) {
                    if (a[i] < b[j]) {
                        answer[k] = a[i];
                        i++;
                    } else {
                        answer[k] = b[j];
                        j++;
                    }
                    k++;
                }
                while (i < a.length) {
                    answer[k] = a[i];
                    i++;
                    k++;
                }
                while (j < b.length) {
                    answer[k] = b[j];
                    j++;
                    k++;
                }
                return answer;
            };
            // merge addresses from all options (they remain sorted)
            var allAddresses = optionAddresses.reduce(merge, []);
            //console.log("addresses", allAddresses);
            //we don't need to do anything if there are no votes
            if (allAddresses.length === 0) {
                var resultsObject = {
                    "totalVotes": 0,
                    "options": []
                }
                details.options.strings.map((option) => {
                    resultsObject.options.push({"text": option, "votes": 0, "weighted": 0, "percentage": 0});
                });
                return resultsObject;
            }
            //if not multiple invalidate multiple votes
            let occurences = {};
            if (details.formData.multiple) {
                allAddresses.map((address)=>{
                    if(!occurences[address]){
                        occurences[address] = 1;
                    }
                    else{
                        occurences[address]++;
                    }
                });
            }
            else {
                var nullified = [];
                // Since we deleted repeated votes in the same option, we can know all repetitions now mean they voted in more than one option
                nullified = allAddresses.filter((item, pos, ary) => {
                    return pos && item === ary[pos - 1];
                });
                //remove null votes
                optionAddresses = optionAddresses.map((addresses) => {
                    return addresses.filter((address) => {
                        return (nullified.indexOf(address) < 0);
                    });
                });
                allAddresses = allAddresses.filter((address) => {
                    return (nullified.indexOf(address) < 0);
                });
                allAddresses.map((address)=>{
                    occurences[address] = 1;
                });
            }
            // Only valid votes now on optionAddresses

            // calculate weights
            var weights = [];
            for(var i = 0; i < allAddresses.length; i++){
                weights[i] = 1/occurences[allAddresses[i]];
            }
            var addressWeights = {}; // maps addresses to their importance
            for (var i = 0; i < allAddresses.length; i++) {
                addressWeights[allAddresses[i]] = weights[i];
            }
            //count number of votes for each option
            var voteCounts = optionAddresses.map((addresses) => {
                return addresses.length;
            });
            //count votes weighted
            var voteCountsWeighted = optionAddresses.map((addresses) => {
                return addresses.reduce((accumulated, v) => {
                    return accumulated + addressWeights[v];
                }, 0);
            });

            var totalVotes = allAddresses.length;
            var resultsObject = {
                "totalVotes": totalVotes,
                "options": []
            };
            for (var i = 0; i < details.options.strings.length; i++) {
                let percentage = (totalVotes === 0)
                    ? (0)
                    : (voteCountsWeighted[i] * 100 / totalVotes);
                resultsObject.options.push({"text": details.options.strings[i], "votes": voteCounts[i], "weighted": voteCountsWeighted[i], "percentage": percentage});
            }
            return resultsObject;
        }).catch();
    }

    /**
     * TODO: right now you can't get past information about mosaics from the api. Hopefully with catapult we will be able to
     * getTokenResults(pollAddress, end) returns the result object for the poll
     *
     * @param {string} pollAddress - NEM address of the poll
     * @param {integer} end - a timestamp for the end of the counting. All votes after this will be ignored
     *
     * @return {promise} - A promise that returns the result object of the poll
     */
    /*
    getTokenResults(pollAddress, end) {
        // get poll details
        var details;
        return this.pollDetails(pollAddress).then((data) => {
            details = data;
            let splitted = details.formData.mosaic.split(':');
            var namespace = splitted[0];
            var mosaicName = splitted[1];
            console.log("detailsToken->", details);
            var optionTransactions = [];
            //get all Transactions
            for (var i = 0; i < details.options.addresses.length; i++) {
                optionTransactions.push(this.getTransactionsWithString(details.options.addresses[i], ""));
            }
            return Promise.all(optionTransactions).then((data) => {
                optionTransactions = data;
                console.log("transactions", optionTransactions);
                var optionAddresses = [];
                for (var i = 0; i < optionTransactions.length; i++) {
                    //convert public keys to addresses
                    optionAddresses.push(optionTransactions[i].map((transaction) => {
                        if (transaction.transaction.type == 4100) {
                            return Address.toAddress(transaction.transaction.otherTrans.signer, this._Wallet.network);
                        } else if (transaction.transaction.type == 257) {
                            return Address.toAddress(transaction.transaction.signer, this._Wallet.network);
                        }
                    }).filter((el) => {
                        return (el !== undefined)
                    }));
                }
                console.log("addresses->", optionAddresses);
                //elim repetitions in array
                const unique = function(list) {
                    return list.sort().filter((item, pos, ary) => {
                        return !pos || item !== ary[pos - 1];
                    });
                }
                optionAddresses = optionAddresses.map(unique); // the lists are now sorted too!
                const merge = function(a, b) {
                    var answer = new Array(a.length + b.length),
                        i = 0,
                        j = 0,
                        k = 0;
                    while (i < a.length && j < b.length) {
                        if (a[i] < b[j]) {
                            answer[k] = a[i];
                            i++;
                        } else {
                            answer[k] = b[j];
                            j++;
                        }
                        k++;
                    }
                    while (i < a.length) {
                        answer[k] = a[i];
                        i++;
                        k++;
                    }
                    while (j < b.length) {
                        answer[k] = b[j];
                        j++;
                        k++;
                    }
                    return answer;
                }
                var allAddresses = optionAddresses.reduce(merge, []);
                //if not multiple disable multiple option votes
                if (!details.formData.multiple) {
                    var nullified = [];
                    nullified = allAddresses.filter((item, pos, ary) => {
                        return pos && item === ary[pos - 1];
                    });
                    optionAddresses = optionAddresses.map((addresses) => {
                        return addresses.filter((address) => {
                            return (nullified.indexOf(address) < 0);
                        });
                    });
                }
                //only valid votes now on optionAddresses
                //get tokens
                var tokens = new Array(allAddresses.length);
                for (var i = 0; i < allAddresses.length; i++) {
                    tokens[i] = this._nemUtils.getOwnedMosaics(allAddresses[i], namespace, mosaicName);
                }

                return Promise.all(tokens).then((data) => {
                    var totalTokens = data.reduce((a, b) => {
                        return a + b;
                    }, 0);
                    var addressTokens = {}; //maps address to number of tokens
                    for (var i = 0; i < allAddresses.length; i++) {
                        addressTokens[allAddresses[i]] = data[i];
                    }
                    var voteCounts = optionAddresses.map((addresses) => {
                        return addresses.length;
                    });
                    var voteCountsWeighted = optionAddresses.map((addresses) => {
                        return addresses.reduce((acc, v) => {
                            return acc + addressTokens[v];
                        }, 0);
                    });

                    var totalVotes = allAddresses.length;
                    var resultsObject = {
                        "totalVotes": totalVotes,
                        "options": []
                    };
                    for (var i = 0; i < details.options.strings.length; i++) {
                        let percentage = (totalVotes === 0)
                            ? (0)
                            : (voteCountsWeighted[i] * 100 / totalTokens);
                        //console.log(details.options.strings[i]+"->", voteCounts[i]+"["+ percentage +"%]");
                        resultsObject.options.push({"text": details.options.strings[i], "votes": voteCounts[i], "weighted": voteCountsWeighted[i], "percentage": percentage});
                    }
                    return resultsObject;

                }).catch();
            }).catch();
        }).catch();
    }
    */

    /**
     * getPOIResults(pollAddress, end) returns the result object for the poll
     *
     * @param {string} pollAddress - NEM address of the poll
     * @param {integer} end - a timestamp for the end of the counting. All votes after this will be ignored,
     * and the importance score of the voters will be determined from historical data
     *
     * @return {promise} - A promise that returns the result object of the poll
     */
    getPOIResults(pollAddress, end) {
        // get poll details2
        var details;
        var endBlock;
        var optionTransactions = [];

        let blockPromise;
        if (end) {
            blockPromise = this._nemUtils.getHeightByTimestamp(end);
        } else {
            blockPromise = Promise.resolve(-1);
        }
        return blockPromise.then((block) => {
            endBlock = block;
            return this.pollDetails(pollAddress);
        }).then((data) => {
            details = data;
            console.log("details->", details);
            //get all Transactions
            for (var i = 0; i < details.options.addresses.length; i++) {
                optionTransactions.push(this._nemUtils.getTransactionsWithString(details.options.addresses[i], ""));
            }
            return Promise.all(optionTransactions)
        }).then((data) => {
            optionTransactions = data;
            //console.log("optionTransactions", optionTransactions);
            if (end) {
                optionTransactions = optionTransactions.map((transactions) => {
                    return transactions.filter((transaction) => {
                        return transaction.meta.height <= endBlock;
                    });
                })
            } else {
                end = -1;
            }
            var optionAddresses = [];
            for (var i = 0; i < optionTransactions.length; i++) {
                //convert public keys to addresses
                optionAddresses.push(optionTransactions[i].map((transaction) => {
                    return Address.toAddress(transaction.transaction.signer, this._Wallet.network);
                }));
            }
            //eliminate repetitions in array
            const unique = function(list) {
                return list.sort().filter((item, pos, ary) => {
                    return !pos || item !== ary[pos - 1];
                });
            };
            optionAddresses = optionAddresses.map(unique); // the lists are now sorted

            // merge for two sorted arrays
            const merge = function(a, b) {
                var answer = new Array(a.length + b.length),
                    i = 0,
                    j = 0,
                    k = 0;
                while (i < a.length && j < b.length) {
                    if (a[i] < b[j]) {
                        answer[k] = a[i];
                        i++;
                    } else {
                        answer[k] = b[j];
                        j++;
                    }
                    k++;
                }
                while (i < a.length) {
                    answer[k] = a[i];
                    i++;
                    k++;
                }
                while (j < b.length) {
                    answer[k] = b[j];
                    j++;
                    k++;
                }
                return answer;
            };
            // merge addresses from all options (they remain sorted)
            var allAddresses = optionAddresses.reduce(merge, []);
            //console.log("addresses", allAddresses);
            //we don't need to do anything if there are no votes
            if (allAddresses.length === 0) {
                var resultsObject = {
                    "totalVotes": 0,
                    "options": []
                }
                details.options.strings.map((option) => {
                    resultsObject.options.push({"text": option, "votes": 0, "weighted": 0, "percentage": 0});
                });
                return resultsObject;
            }
            //if not multiple invalidate multiple votes
            let occurences = {};
            if (details.formData.multiple) {
                allAddresses.map((address)=>{
                    if(!occurences[address]){
                        occurences[address] = 1;
                    }
                    else{
                        occurences[address]++;
                    }
                });
            }
            else {
                var nullified = [];
                // Since we deleted repeated votes in the same option, we can know all repetitions now mean they voted in more than one option
                nullified = allAddresses.filter((item, pos, ary) => {
                    return pos && item === ary[pos - 1];
                });
                //remove null votes
                optionAddresses = optionAddresses.map((addresses) => {
                    return addresses.filter((address) => {
                        return (nullified.indexOf(address) < 0);
                    });
                });
                allAddresses = allAddresses.filter((address) => {
                    return (nullified.indexOf(address) < 0);
                });
                allAddresses.map((address)=>{
                    occurences[address] = 1;
                });
            }
            // Only valid votes now on optionAddresses

            // GET IMPORTANCES

            var importances = new Array(allAddresses.length);
            for (var i = 0; i < allAddresses.length; i++) {
                importances[i] = this._nemUtils.getImportance(allAddresses[i], endBlock);
            }
            return Promise.all(importances).then((importances) => {
                for(var i = 0; i < importances.length; i++){
                    importances[i] /= occurences[allAddresses[i]];
                }
                //console.log("importances", importances);
                // calculate the sum of all importances
                var totalImportance = importances.reduce((a, b) => {
                    return a + b;
                }, 0);
                var addressImportances = {}; // maps addresses to their importance
                for (var i = 0; i < allAddresses.length; i++) {
                    addressImportances[allAddresses[i]] = importances[i];
                }
                //count number of votes for each option
                var voteCounts = optionAddresses.map((addresses) => {
                    return addresses.length;
                });
                //count votes weighted by importance
                var voteCountsWeighted = optionAddresses.map((addresses) => {
                    return addresses.reduce((accumulated, v) => {
                        return accumulated + addressImportances[v];
                    }, 0);
                });

                var totalVotes = allAddresses.length;
                var resultsObject = {
                    "totalVotes": totalVotes,
                    "options": []
                };
                for (var i = 0; i < details.options.strings.length; i++) {
                    let percentage = (totalVotes === 0 || totalImportance === 0)
                        ? (0)
                        : (voteCountsWeighted[i] * 100 / totalImportance);
                    resultsObject.options.push({"text": details.options.strings[i], "votes": voteCounts[i], "weighted": voteCountsWeighted[i], "percentage": percentage});
                }
                return resultsObject;
            }).catch();
        }).catch();
    }

    /**
     * getResults(pollAddress, type, end) returns the result object for the poll depending of the type of the counting
     *
     * @param {string} pollAddress - NEM address of the poll
     * @param {number} type - the type of the poll
     *                          0 for POI
     *                          1 for 1 account 1 vote
     *                          2 for mosaic
     * @param {integer} end - a timestamp for the end of the counting. All votes after this will be ignored,
     * and the weighted score of the voters will be determined from historical data
     *
     * @return {promise} - A promise that returns the result object of the poll
     */
    getResults(pollAddress, type, end) {
        if (type === 0) {
            return this.getPOIResults(pollAddress, end);
        } else if (type === 1) {
            return this.get1a1vResults(pollAddress, end);
        }/* else if (type === 2) {
            return this.getTokenResults(pollAddress, end);
        }*/
    }

    /**
     * getPOIResults(address, pollDetails) checks if the current account has any votes sent to any option of the poll
     *
     * @param {string} address - NEM address of the poll
     * @param {object} pollDetails - poll details object of the poll. The details can be obtained from the address,
     * but passing as a parameter is faster, since when we check for votes on the voting module we already have the details
     *
     * @return {promise} - A promise that returns:
     *                          0 if there are no votes
     *                          1 if there is an unconfirmed vote
     *                          2 if there is a confirmed vote
     */
    hasVoted(address, pollDetails) {
        var addresses = pollDetails.options.addresses;
        var confirmedPromises = addresses.map((optionAddress) => {
            return this._nemUtils.existsTransaction(address, optionAddress);
        });
        return Promise.all(confirmedPromises).then((data) => {
            return Math.max.apply(null, data);
        });
    }
}

export default Voting;
