import CryptoHelpers from '../../../utils/CryptoHelpers';

class createPollCtrl {
    // Set services as constructor parameter
    constructor($location, Alert, Voting, Wallet, nemUtils, DataBridge) {
        'ngInject';

        // Declaring services
        this._location = $location;
        this._Alert = Alert;
        this._Voting = Voting;
        this._nemUtils = nemUtils;
        this._Wallet = Wallet;
        this._DataBridge = DataBridge;

        // If no wallet show alert and redirect to home
        if (!this._Wallet.current) {
            this._Alert.noWalletLoaded();
            this._location.path('/');
            return;
        }

        // Constants
        this.MOCK_ADDRESS = "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";

        // Default poll Index
        if(this._Wallet.network < 0){
            this.pollIndexAccount = "TAVGTNCVGALLUPZC4JTLKR2WX25RQM2QOK5BHBKC";
            //this.pollIndexAccount = "TAZ73M4C3QDJRC6NFLQP3HAVW4FHYRWJOE7RASVZ";
        }
        else{
            this.pollIndexAccount = "NDIXTBITCK6DHIOWXPAVN5DA3JXZYCD7PLAZC6RN";
        }

        // names of types
        this.pollTypes = ['POI', 'White List'];
        //this.currentAccountMosaicNames = ["nem:xem"];

        // Data of the poll to be sent
        this.formData = {};
        this.formData.title = '';
        this.formData.doe = NaN;
        this.formData.multiple = false;
        //this.formData.updatable = false;
        this.formData.type = 0;
        //this.formData.mosaic = 'nem:xem';
        this.description = '';
        this.options = ['yes', 'no'];
        this.whitelist = [''];

        // input data
        this.hasWhitelist = false;
        this.hasMosaic = false;
        this.doeString = '';
        this.doeISOString = '';
        this.typeString = this.pollTypes[0];
        this.invalidData = true;

        // Creation issues
        this.issues = {};
        this.issues.blankTitle = true;
        this.issues.pastDate = false;
        this.issues.invalidDate = true;
        this.issues.blankOptions = [false, false];
        this.issues.invalidAddresses = [];
        this.issues.invalidIndexAccount = false;
        this.issues.noPassword = true;
        this.issues.noOptions = false;
        this.issues.noWhitelist = false;

        this.issues.titleTooLong = false;
        this.issues.descriptionTooLong = false;
        this.issues.optionsTooLong = false;
        this.issues.whitelistTooLong = false;
        this.issues.pollTooLong = false;

        // Common
        this.common = {
            "password": "",
            "privateKey": ""
        };

        // messages
        this.formDataMessage = '';
        this.descriptionMessage = '';
        this.optionsMessage = '';
        this.whitelistMessage = '';
        this.pollMessage = '';

        // calculated fee
        this.fee = this.calculateFee();

        // To lock our send button if a transaction is not finished processing
        this.creating = false;

        this.checkFormData();
        this.updateCurrentAccountMosaics();
    }

    // Adds an option field
    addOption() {
        this.options.push('');
    }

    // Adds a whitelist Address field
    addWhitelistedUser() {
        this.whitelist.push('');
    }

    // Deletes an option field
    rmOption() {
        this.options.pop();
    }

    // Deteles a whitelist address field
    rmWhitelistedUser() {
        this.whitelist.pop();
    }

    //executed when the poll type changes
    changeType() {
        this.hasWhitelist = (this.typeString === this.pollTypes[1]);
        this.formData.type = this.pollTypes.indexOf(this.typeString);
    }

    // Sets the date of ending
    setDoe(isoString) {
        this.formData.doe = new Date(this.doeString).getTime();
        this.doeISOString = isoString;
    }

    /**
     * updateCurrentAccountMosaics() Get current account mosaics names
     */
    updateCurrentAccountMosaics() {
        // Get current account
        let acct = this._Wallet.currentAccount.address;
        // Set current account mosaics names if mosaicOwned is not undefined
        if (undefined !== this._DataBridge.mosaicOwned[acct]) {
            this.currentAccountMosaicNames = Object.keys(this._DataBridge.mosaicOwned[acct]).sort();
        } else {
            this.currentAccountMosaicNames = ["nem:xem"];
        }
    }

    // Checks if data is valid
    checkFormData() {
        let invalid = false;

        if (this.formData.title === '') {
            this.issues.blankTitle = true;
            invalid = true;
        } else
            this.issues.blankTitle = false;
        // Regex that validates that the date is valid
        let ISOMatch = this.doeISOString.match(/^(?:[1-9]\d{3}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1\d|2[0-8])|(?:0[13-9]|1[0-2])-(?:29|30)|(?:0[13578]|1[02])-31)|(?:[1-9]\d(?:0[48]|[2468][048]|[13579][26])|(?:[2468][048]|[13579][26])00)-02-29)T(?:[01]\d|2[0-3]):[0-5]\d$/);
        //Date valid and > now
        if (isNaN(this.formData.doe) || !ISOMatch) {
            this.issues.invalidDate = true;
            invalid = true;
        } else {
            this.issues.invalidDate = false;
        }
        if (this.formData.doe <= Date.now()) {
            this.issues.pastDate = true;
            invalid = true;
        } else{
            this.issues.pastDate = false;
        }

        //look for duplicates and blanks
        this.issues.blankOptions = this.options.map((opt) => {
            return (opt === '');
        });
        if (this.hasWhitelist) {
            this.issues.invalidAddresses = this.whitelist.map((addr) => {
                return (!this._nemUtils.isValidAddress(addr));
            });
        } else {
            this.issues.invalidAddresses = [];
        }
        if (this.issues.invalidAddresses.some(a => a) || this.issues.blankOptions.some(a => a)){
            invalid = true;
        }
        if (this.common.password === "") {
            this.issues.noPassword = true;
            invalid = true;
        } else {
            this.issues.noPassword = false;
        }
        if (!this._nemUtils.isValidAddress(this.pollIndexAccount)) {
            this.issues.invalidIndexAccount = true;
            invalid = true;
        } else {
            this.issues.invalidIndexAccount = false;
        }

        if (this.options.length === 0) {
            this.issues.noOptions = true;
            invalid = true;
        } else {
            this.issues.noOptions = false;
        }
        if (this.hasWhitelist && this.whitelist.length === 0) {
            this.issues.noWhitelist = true;
            invalid = true;
        } else {
            this.issues.noWhitelist = false;
        }
        this.invalidData = invalid;
    }

    // Updates the messages to be sent on creation to calculate the fee. The addresses are mocks, not definitive
    updateMessages() {
        var formDataClone = Object.assign({}, this.formData);
        if (this.formData.type !== 2)
            delete formDataClone.mosaic;
        this.formDataMessage = "formData:" + JSON.stringify(formDataClone);
        this.descriptionMessage = "description:" + this.description;
        let optionsObj = {
            strings: this.options,
            addresses: this.options.map((acc) => {
                return this.MOCK_ADDRESS
            })
        };
        this.optionsMessage = "options:" + JSON.stringify(optionsObj);
        this.whitelistMessage = "whitelist:" + JSON.stringify(this.whitelist.map((address) => {
            return address.toUpperCase().replace(/-/g, '');
        }));
        let header = {
            title: this.formData.title,
            type: this.formData.type,
            doe: this.formData.doe,
            address: this.MOCK_ADDRESS
        };
        if (this.formData.type === 1) {
            header.whitelist = this.whitelist;
        } else if (this.formData.type === 2) {
            header.mosaic = this.formData.mosaic;
        }
        this.pollMessage = "poll:" + JSON.stringify(header);

        this.issues.titleTooLong = (this.formDataMessage.length > 1024);
        this.issues.descriptionTooLong = (this.descriptionMessage.length > 1024);
        this.issues.optionsTooLong = (this.optionsMessage.length > 1024);
        this.issues.whitelistTooLong = (this.whitelistMessage.length > 1024);
        this.issues.pollTooLong = (this.pollMessage.length > 1024);

        if (this.issues.titleTooLong || this.issues.descriptionTooLong || this.issues.optionsTooLong || this.issues.pollTooLong || (this.issues.whitelistTooLong && this.hasWhitelist))
            this.invalidData = true;

        this.fee = this.calculateFee();
    }

    // Calculates the fee cost of the messages
    calculateFee() {
        var total = 0;
        total += this._nemUtils.getMessageFee(this.formDataMessage);
        total += this._nemUtils.getMessageFee(this.descriptionMessage);
        total += this._nemUtils.getMessageFee(this.optionsMessage);
        total += this._nemUtils.getMessageFee(this.pollMessage);
        if (this.formData.type === 1) {
            total += this._nemUtils.getMessageFee(this.whitelistMessage);
        }
        return total;
    }

    // clears all form fields
    clearForm(){
        // Data of the poll to be sent
        this.formData = {};
        this.formData.title = '';
        this.formData.doe = NaN;
        this.formData.multiple = false;
        //this.formData.updatable = false;
        this.formData.type = 0;
        //this.formData.mosaic = 'nem:xem';
        this.description = '';
        this.options = ['yes', 'no'];
        this.whitelist = [''];

        // input data
        this.hasWhitelist = false;
        this.hasMosaic = false;
        this.doeString = '';
        this.typeString = this.pollTypes[0];
        this.invalidData = true;

        // Creation issues
        this.issues = {};
        this.issues.blankTitle = true;
        this.issues.pastDate = false;
        this.issues.invalidDate = true;
        this.issues.blankOptions = [false, false];
        this.issues.invalidAddresses = [];
        this.issues.invalidIndexAccount = false;
        this.issues.noPassword = true;

        this.issues.titleTooLong = false;
        this.issues.descriptionTooLong = false;
        this.issues.optionsTooLong = false;
        this.issues.whitelistTooLong = false;
        this.issues.pollTooLong = false;

        // Common
        this.common = {
            "password": "",
            "privateKey": ""
        };

        // messages
        this.formDataMessage = '';
        this.descriptionMessage = '';
        this.optionsMessage = '';
        this.whitelistMessage = '';
        this.pollMessage = '';

        // calculated fee
        this.fee = this.calculateFee();

        // To lock our send button if a transaction is not finished processing
        this.creating = false;

        this.checkFormData();
    }

    // creates the poll
    create() {
        this.creating = true;
        this.checkFormData();
        // Initial checks that may forbid the operation move forward
        if (this._DataBridge.accountData.account.balance < this.fee) {
            // This account has insufficient funds to perform the operation
            this._Alert.errorInsuficientBalance();
            this.creating = false;
            return;
        }
        // Decrypt/generate private key and check it. Returned private key is contained into this.common
        if (!CryptoHelpers.passwordToPrivatekeyClear(this.common, this._Wallet.currentAccount, this._Wallet.algo, false)) {
            this._Alert.invalidPassword();
            this.creating = false;
            return;
        } else if (!CryptoHelpers.checkAddress(this.common.privateKey, this._Wallet.network, this._Wallet.currentAccount.address)) {
            this._Alert.invalidPassword();
            this.creating = false;
            return;
        }

        var details = {}
        details.formData = this.formData;
        if (this.formData.type !== 2)
            delete details.formData.mosaic;
        details.options = this.options;
        details.description = this.description;
        details.whitelist = this.whitelist;

        this._Voting.createPoll(details, this.pollIndexAccount, this.common).then(d => {
            this.creating = false;
            this._Alert.pollCreationSuccess();
            this.clearForm();
        }).catch(err => {
            console.log(err.message);
            this._Alert.votingUnexpectedError(err.message);
            this.creating = false;
            this.clearForm();
        });
    }

}

export default createPollCtrl;
