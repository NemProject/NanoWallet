const nem = require('nem-library');
const voting = require('nem-voting');

class Voting {
    constructor($filter, $timeout, Alert, Wallet, VotingUtils) {
        'ngInject';

        /***
         * Declare services
         */
        this._$timeout = $timeout;
        this._$filter = $filter;
        this._Alert = Alert;
        this._Wallet = Wallet;
        this._VotingUtils = VotingUtils;
        if(this._Wallet.network < 0){
            nem.NEMLibrary.bootstrap(nem.NetworkTypes.TEST_NET);
        }
        else{
            nem.NEMLibrary.bootstrap(nem.NetworkTypes.MAIN_NET);
        }
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
        const obs = voting.PollIndex.fromAddress(new nem.Address(pollIndexAddress))
            .map((index) => {
                console.log(index);
                return index.headers.map((header) => {
                    return {
                        title: header.title,
                        type: header.type,
                        doe: header.doe,
                        address: header.address.plain(),
                        whitelist: header.whitelist,
                    }
                });
            });
        return obs.first().toPromise();
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
        const formData = {
            title: details.formData.title,
            doe: details.formData.doe,
            type: details.formData.type,
            multiple: details.formData.multiple,
        };
        const description = details.description;
        const options = details.options;
        const whitelist = details.whitelist;

        const poll = new voting.UnbroadcastedPoll(formData, description, options, whitelist);
        const account = nem.Account.createWithPrivateKey(common.privateKey);

        return poll.broadcast(account)
            .map((broadcastedPoll) => {
                return broadcastedPoll.address.plain();
            }).first().toPromise();
    }

    /**
     * vote(address, common, multisigAccount) sends a vote to the given address. Can vote as multisig
     *
     * @param {object} poll - poll address
     * @param {string} option - option string on which to vote
     * @param {object} common - common object
     * @param {string} multisigAccount - NEM address of the multisig account we want to send the vote for (optional)
     *
     * @return {promise} - returns a promise that resolves when the vote has been sent
     */
    vote(poll, option, common, multisigAccount) {
        return voting.BroadcastedPoll.fromAddress(new nem.Address(poll))
            .switchMap((poll) => {
                const account = nem.Account.createWithPrivateKey(common.privateKey);
                if (multisigAccount) {
                    const multisigAcc = nem.PublicAccount.createWithPublicKey(multisigAccount.publicKey);
                    return poll.voteMultisig(account, multisigAcc, option);
                } else {
                    return poll.vote(account, option);
                }
            }).first().toPromise();
    }

    /**
     * pollDetails(pollAddress) returns the details of a poll stored in the given pollAddress
     *
     * @param {string} pollAddress - NEM address for the poll account
     *
     * @return {promise} - a promise that returns the details object of the poll
     */
    pollDetails(pollAddress) {
        return voting.BroadcastedPoll.fromAddress(new nem.Address(pollAddress))
            .map((poll) => {
                const data = {
                    formData: poll.data.formData,
                    description: poll.data.description,
                    options: {
                        strings: poll.data.options,
                        link: {},
                    },
                    whitelist: poll.data.whitelist,
                };
                poll.data.options.forEach((option) => {
                    data.options.link[option] = poll.getOptionAddress(option).plain();
                });
                return data;
            }).first().toPromise();
    }

    /**
     * getResults(pollAddress, type, end) returns the result object for the poll depending of the type of the counting
     *
     * @param {string} pollAddress - NEM address of the poll
     *
     * @return {promise} - A promise that returns the result object of the poll
     */
    getResults(pollAddress) {
        return voting.BroadcastedPoll.fromAddress(new nem.Address(pollAddress))
            .switchMap((poll) => {
                return poll.getResults();
            }).first().toPromise();
    }

    /**
     * hasVoted(addrses, pollDetails)
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
        var orderedAddresses = [];
        if(pollDetails.options.link){
            orderedAddresses = pollDetails.options.strings.map((option)=>{
                return pollDetails.options.link[option];
            });
        }
        else{
            orderedAddresses = pollDetails.options.addresses;
        }
        var confirmedPromises = orderedAddresses.map((optionAddress) => {
            return this._VotingUtils.existsTransaction(address, optionAddress);
        });
        return Promise.all(confirmedPromises).then((data) => {
            return Math.max.apply(null, data);
        });
    }
}

export default Voting;
