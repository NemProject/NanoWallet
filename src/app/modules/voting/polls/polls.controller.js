import CryptoHelpers from '../../../utils/CryptoHelpers';

class pollsCtrl {
    // Set services as constructor parameter
    constructor($location, $scope, DataBridge, Alert, Wallet, nemUtils, Voting) {
        'ngInject';

        // Declaring services
        this._location = $location;
        this._scope = $scope;
        this._Alert = Alert;
        this._Wallet = Wallet;
        this._Voting = Voting;
        this._nemUtils = nemUtils;
        this._DataBridge = DataBridge;

        // If no wallet show alert and redirect to home
        if (!this._Wallet.current) {
            this._Alert.noWalletLoaded();
            this._location.path('/');
            return;
        }

        // Results object for the chart library
        this.results = {};
        this.chart = {};
        this.chart.options = {
            legend: {
                display: true
            }
        };
        this.chart.options.legend.position = "bottom";
        this.chart.options.segmentShowStroke = false;
        this.chart.options.tooltips = {
            enabled: false
        };
        this.chart.values = [];
        this.chart.labels = [];

        // Loading indicators
        this.loadingPoll = false;
        this.loadingResults = false;
        this.loadingVote = false;
        this.loadingPolls = false;

        // Default poll Index
        // testnet is -104 and mainnet is 104
        if(this._Wallet.network < 0){
            this.pollIndexAccount = "TAVGTNCVGALLUPZC4JTLKR2WX25RQM2QOK5BHBKC";
        }
        else{
            this.pollIndexAccount = "NAZN26HYB7C5HVYVJ4SL3KBTDT773NZBAOMGRFZB";
        }
        this.pollIndexPrivate = false;

        this.votingFee = this._nemUtils.getMessageFee("");

        // Common
        this.common = {
            "password": "",
            "privateKey": ""
        };

        // Tags for types
        this.types = ["POI", "WhiteList"];
        this.classes = ["label label-success poi-tag", "label label-primary whitelist-tag"];

        // Poll list
        this.allPolls = [];  // Has all the poll headers on the poll Index (unfiltered)
        this.pollsList = [];  // Filtered poll headers
        this.selectedPoll = null;  // Details object for the selected poll
        this.currentPollAddress = '';  // The poll Address of the currently selected poll

        // Selected options
        this.selectedOption = "";  // for single choice
        this.selectedOptions = [];  // for multiple choice

        // Variables for knowing which data to show
        this.showDetails = false;
        this.showVote = false;  //wether to show voting options or results
        this.multisigVote = false;
        this.createIndex = false;

        this.tab = 1;  //selected tab
        this.onlyVotable = true;  //if true only votable polls appear in index

        // Issues for not being able to vote
        this.issues = [];
        this.invalidVote = true;
        this.alreadyVoted = 0;
        this.pollFinished = false;

        // To lock our send button if a transaction is not finished processing
        this.voting = false;

        // Info for multisig voting
        // checks if the user is cosignatory of an account, if false the multisig vote tab will not be shown
        this.isCosignatory = this._DataBridge.accountData.meta.cosignatoryOf.length == 0
            ? ''
            : this._DataBridge.accountData.meta.cosignatoryOf[0];
        this.multisigAccount = '';

        // The address that is inputted on the options tab
        this.inputAccount = '';
        this.searching = false;
        this.inputAddressValid = true;
        this.loadingAddressError = false;

        // List of poll indexes created by the user
        this.createdIndexes = [];
        this.getCreatedIndexes().then((indexes)=>{
            this.createdIndexes = indexes;
        });

        // for creating indexes
        this.createPrivateIndex = false;
        this.indexCreationFee = (this._Wallet.network < 0) ? 0.35 : 5;

        this.getPolls();
    }

    // Votes on the selected option to the selected poll
    vote() {
        // Disable send button;
        this.voting = true;
        this.checkValidVote();
        if (this.invalidVote) {
            this._Alert.votingError();
            this.voting = false;
            return;
        }
        // Decrypt/generate private key and check it. Returned private key is contained into this.common
        if (!CryptoHelpers.passwordToPrivatekeyClear(this.common, this._Wallet.currentAccount, this._Wallet.algo, false)) {
            this._Alert.invalidPassword();
            this.voting = false;
            return;
        } else if (!CryptoHelpers.checkAddress(this.common.privateKey, this._Wallet.network, this._Wallet.currentAccount.address)) {
            this._Alert.invalidPassword();
            this.voting = false;
            return;
        }
        //Get list of addresses from the selected options
        var optionAddresses = [];
        var optionStrings = [];
        let allAddresses = this.selectedPoll.options.addresses;
        let allStrings = this.selectedPoll.options.strings;
        if (this.selectedPoll.formData.multiple) {
            optionAddresses = this.selectedOptions.map((i) => {
                return allAddresses[i];
            });
            optionStrings = this.selectedOptions.map((i) => {
                return allStrings[i];
            });
        } else {
            optionAddresses = [allAddresses[this.selectedOption]];
            optionStrings = [allStrings[this.selectedOption]];
        }

        let votes = [];
        for (var i = 0; i < optionAddresses.length; i++) {
            if (this.multisigVote) {
                votes.push(this._Voting.vote(optionAddresses[i], this.common, this.multisigAccount, "vote for poll " + this.currentPollAddress + ' with option "' + optionStrings[i] + '"').then((data) => {
                    this.alreadyVoted = 1;
                    this.voting = false;
                }).catch((e) => {
                    this.voting = false;
                    throw e;
                }));
            } else {
                votes.push(this._Voting.vote(optionAddresses[i], this.common).then((data) => {
                    this.alreadyVoted = 1;
                    this.voting = false;
                }).catch((e) => {
                    this.voting = false;
                    throw e;
                }));
            }
        }
        Promise.all(votes).then((d) => {
            this._Alert.votingSuccess();
            this.common.password = '';
            this._scope.$digest();
        }, (e)=>{
            this.voting = false;
            throw e;
        }).catch((e)=>{
            this.common.password = '';
            this.voting = false;
        });
    }

    // Returns all addresses of the poll Indexes created by the user
    getCreatedIndexes(){
        let options = {
            fromAddress: this._Wallet.currentAccount.address,
            start: 0
        }
        return this._nemUtils.getTransactionsWithString(this._Wallet.currentAccount.address, "createdPollIndex:", options).then((creationTrans)=>{
            return creationTrans.map((trans)=>{
                return trans.transaction.message.replace('createdPollIndex:', '');
            });
        });
    }

    // Creates a new poll index (private can be true or false)
    createNewIndex(){

        // Decrypt/generate private key and check it. Returned private key is contained into this.common
        if (!CryptoHelpers.passwordToPrivatekeyClear(this.common, this._Wallet.currentAccount, this._Wallet.algo, false)) {
            this._Alert.invalidPassword();
            this.voting = false;
            return;
        } else if (!CryptoHelpers.checkAddress(this.common.privateKey, this._Wallet.network, this._Wallet.currentAccount.address)) {
            this._Alert.invalidPassword();
            this.voting = false;
            return;
        }

        this._nemUtils.createNewAccount().then((account)=>{
            this._nemUtils.sendMessage(this._Wallet.currentAccount.address, 'createdPollIndex:'+account.address, this.common);
            let obj = {
                private: this.createPrivateIndex
            };
            if(this.createPrivateIndex){
                obj.creator = this._Wallet.currentAccount.address
            }
            let message = "pollIndex:" + JSON.stringify(obj);
            this._nemUtils.sendMessage(account.address, message, this.common);
        });
    }

    // toggles between vote / details views
    toggleView() {
        this.showVote = !this.showVote;
    }

    // manages inputted Poll address on the options tab
    pollAddressInput(){
        this.searching = true;
        this.inputAddressValid = true;
        this.loadingAddressError = false;
        //check if it is a valid address
        this.inputAccount = this.inputAccount.toUpperCase().replace(/-/g, '');
        this.inputAddressValid = this._nemUtils.isValidAddress(this.inputAccount);
        if(!this.inputAddressValid){
            this.inputAddressValid = false;
            this.searching = false;
            return;
        }
        this.getPoll(this.inputAccount).then(()=>{
            this.searching = false;
        }).catch((e)=>{
            this.searching = false;
            this.loadingAddressError = true;
            this._scope.$digest();
        });
    }

    // manages inputted Index address on the options tab
    pollIndexInput(){
        this.searching = true;
        this.inputAddressValid = true;
        this.loadingAddressError = false;
        //check if it is a valid address
        this.inputAccount = this.inputAccount.toUpperCase().replace(/-/g, '');
        this.inputAddressValid = this._nemUtils.isValidAddress(this.inputAccount);
        if(!this.inputAddressValid){
            this.inputAddressValid = false;
            this.searching = false;
            return;
        }
        this._nemUtils.getFirstMessageWithString(this.inputAccount, 'pollIndex:').then((message)=>{
            this.pollIndexAccount = this.inputAccount;
            let indexInfo = JSON.parse(message.replace('pollIndex:', ''));
            this.pollIndexPrivate = indexInfo.private;
            this.getPolls().then(()=>{
                this.searching = false;
            }).catch((e)=>{
                throw e;
            });
        }).catch((e)=>{
            this.searching = false;
            this.loadingAddressError = true;
            this._scope.$digest();
        });
    }

    // Checks if everything is correct to vote
    checkValidVote() {
        let issueList = [];
        //whitelist
        if (this.selectedPoll.formData.type === 1) {
            if (!this.isVotable(this.selectedPoll)) {
                issueList.push("You are not on the Whitelist");
            }
        }
        //mosaic
        if (this.selectedPoll.formData.type === 2) {
            if (!this.isVotable(this.selectedPoll.formData)) {
                issueList.push("You do not own the mosaic for this poll");
            }
        }
        //no option selected
        if ((this.selectedOption === "" && this.selectedOptions === [])) {
            issueList.push("No option selected");
        }
        //no passwd
        if (this.common.password === "") {
            issueList.push("No password");
        }
        this.invalidVote = (issueList.length > 0);
        this.issues = issueList;
    }

    // For option selection
    toggleSelection(index) {
        var idx = this.selectedOptions.indexOf(index);
        // Is currently selected
        if (idx > -1) {
            this.selectedOptions.splice(idx, 1 // Is newly selected
            );
        } else {
            this.selectedOptions.push(index);
        }
    }

    // Gets the details and results of a poll by address
    getPoll(address){
        this.loadingPoll = true;
        this.loadingResults = true;

        return this._Voting.pollDetails(address).then((data) => {
            this.selectedPoll = data;
            let now = (new Date()).getTime();
            if (this.selectedPoll.formData.doe < now) {
                this.pollFinished = true;
                this.showVote = false;
            } else {
                this.pollFinished = false;
                this.showVote = true;
            }
            this.showDetails = true;
            this.checkValidVote();
            this.selectedOption = "";
            this.selectedOptions = [];

            this.loadingPoll = false;
            this.currentPollAddress = address;
            let resultsPromise;
            if(now < this.selectedPoll.formData.doe){
                resultsPromise = this._Voting.getResults(address, this.selectedPoll.formData.type);
            }
            else{
                resultsPromise = this._Voting.getResults(address, this.selectedPoll.formData.type, this.selectedPoll.formData.doe);
            }
            resultsPromise.then((data) => {
                console.log("results->", data);
                this.results = data;
                this.chart.values = data.options.map((option) => {
                    return option.weighted;
                });
                this.chart.labels = data.options.map((option) => {
                    return (option.text + ': ' + option.percentage.toFixed(2) + '%');
                });
                this.loadingResults = false;
            }).then(()=>{
                this._scope.$digest();
            }).catch(e=>{});
        }).then(() => {
            return this.checkHasVoted();
        }).then(()=>{
            this._scope.$digest();
        }).catch((e)=>{
            this.loadingPoll = false;
            throw e;
        });
    }

    // selects a poll by the index on the polls list
    pollSelect(index) {
        this.getPoll(this.pollsList[index].address).then(()=>{
            this.loadingAddressError = false;
        }).catch((e)=>{
            this.loadingAddressError = true;
        });
    }

    // checks if the currently selected account has voted on the selected poll
    checkHasVoted() {
        this.loadingVote = true;
        if (this.multisigVote) {
            return this._Voting.hasVoted(this.multisigAccount.address, this.selectedPoll).then((resp) => {
                this.alreadyVoted = resp;
                this.loadingVote = false;
                this._scope.$digest();
            });
        } else {
            return this._Voting.hasVoted(this._Wallet.currentAccount.address, this.selectedPoll).then((resp) => {
                this.alreadyVoted = resp;
                this.loadingVote = false;
                this._scope.$digest();
            });
        }
    }

    // for getting polls list tabs
    isTabSet(tab) {
        return (this.tab === tab);
    }

    // for setting polls list tabs
    setTab(tab) {
        this.inputAddressValid = true;
        this.loadingAddressError = false;
        this.createIndex = false;
        this.showDetails = false;
        this.tab = tab;
        if(tab === 4){ //options tab
        }
        else{
            this.updateList();
        }
    }

    // for setting (VOTE/MULTISIG/RESULTS tabs)
    setDetailsTab(tab) {
        this.createIndex = false;
        if (tab === 1) {
            this.showVote = true;
            this.multisigVote = false;
        } else if (tab === 2) {
            this.multisigAccount = this._DataBridge.accountData.meta.cosignatoryOf[0];
            this.showVote = true;
            this.multisigVote = true;
        } else if (tab === 3) {
            this.showVote = false;
            this.multisigVote = false;
        }
        this.checkHasVoted();
    }

    // for getting (VOTE/MULTISIG/RESULTS tabs)
    isDetailsTabSet(tab) {
        if (tab === 1) {
            return (this.showVote && !this.multisigVote);
        } else if (tab === 2) {
            return this.multisigVote;
        } else if (tab === 3) {
            return !this.showVote;
        }
    }

    // for styling tags
    getClass(index) {
        return this.classes[this.pollsList[index].type];
    }

    // for styling tags
    getCurrentTypeTagClass() {
        if (this.selectedPoll) {
            return this.classes[this.selectedPoll.formData.type];
        }
    }

    // for styling tags
    getCurrentTypeTag() {
        if (this.selectedPoll) {
            let type = this.selectedPoll.formData.type;
            if (type === 0)
                return "POI";
            if (type === 1)
                return 'WhiteList';
            /*if (type === 2)
                return this.selectedPoll.formData.mosaic;
            */
        }
    }

    //returns wether current user can vote on the poll(by whitelist, not by doe)
    isVotable(header) {
        var type = ("type" in header)
            ? (header.type)
            : (header.formData.type);
        if (type === 0) {
            return true;
        }
        let address = this._Wallet.currentAccount.address;
        if (type === 1) {
            return (header.whitelist.indexOf(address) > -1);
        } else if (type === 2) {
            let namespace = header.mosaic.split(':')[0];
            let mosaic = header.mosaic.split(':')[1];
            return (this._nemUtils.ownsMosaic(address, namespace, mosaic));
        }
    }

    // applies filters to poll headers
    updateList() {
        let now = (new Date()).getTime();
        if (this.tab === 1) {
            this.pollsList = this.allPolls;
        } else if (this.tab === 2) {
            this.pollsList = this.allPolls.filter((poll) => {
                return (poll.doe > now);
            });
        } else if (this.tab === 3) {
            this.pollsList = this.allPolls.filter((poll) => {
                return (poll.doe <= now);
            });
        }

        if (this.onlyVotable) {
            this.pollsList = this.pollsList.filter(this.isVotable.bind(this));
        }
    }

    // gets al the poll headers on the poll index
    getPolls() {
        //get all polls
        this.loadingPolls = true;
        return this._Voting.getPolls(this.pollIndexAccount).then((data) => {
            this.allPolls = data;
            this.loadingPolls = false;
            this.setTab(1);
            // apply filters
            this.updateList();
        }).catch((e)=>{
            this.loadingPolls = false;
            throw e;
        });
    }

}

export default pollsCtrl;
