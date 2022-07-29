import nem from 'nem-sdk';

class SuperNodeProgramCtrl {

    /**
     * Initialize dependencies and properties
     *
     * @params {services} - Angular services to inject
     */
    constructor($filter, Wallet, DataStore, $timeout, Alert, SuperNodeProgram) {
        'ngInject';

        //// Module dependencies region ////

        this._filter = $filter;
        this._Wallet = Wallet;
        this._DataStore = DataStore;
        this._$timeout = $timeout;
        this._Alert = Alert;
        this._superNodeProgram = SuperNodeProgram;

        //// End dependencies region ////

        // Initialization
        this.init();
    }

    //// Module methods region ////

    /**
     * Initialize module properties
     */
    init () {
        // Form use for enroll program
        this.formData = {
            nodeHost: '',
            enrollAddress: '',
            isMultisig: false,
            mainPublicKey: '',
        };

        this.tab = {
            status: 'status',
            enroll: 'enroll',
            payout: 'payout'
        };

        this.tabs = [{
            key: this.tab.status,
            name: 'TAB_STATUS_NAME',
        }, {
            key: this.tab.enroll,
            name: 'TAB_ENROLL_IN_PROGRAM_NAME',
        }, {
            key: this.tab.payout,
            name: 'TAB_PAYOUT_HISTORY_NAME',
        }]

        this.selectedTab = this.tab.status;
        this.okPressed = false;
        this.common = nem.model.objects.get("common");
        this.preparedTransaction = {};

        this.currentPage = 0;
        this.lastPage = 0;

        this.getAccount();

        this.resetTab();

        this.prepareTransaction();
    }

    /**
     * Initialize accounts and set the first one as selected
     */
    getAccount() {
        const { meta, account } = this._DataStore.account.metaData;

        const currentAccount = {
            ...account,
            display: account.address,
            formatBalance: this.computeXEMBalance(account.balance)
        }

        if (meta.cosignatoryOf.length > 0) {
            const multisigAccounts = meta.cosignatoryOf.map(account => {
                return {
                    ...account,
                    display: account.address + ' - Multisig',
                    formatBalance: this.computeXEMBalance(account.balance),
                    isMultisig: true
                }
            });

            // Build for account dropdown list
            this.accounts = [...multisigAccounts, currentAccount];

            this.selectedAccount = this.accounts[0];
        } else {
            this.selectedAccount = currentAccount;
        }

        this.setSelectedAccountInfo();
    }

    /**
     * Assign the selected account to the balance view and form data
     */
    setSelectedAccountInfo() {
        this.balance = this.selectedAccount.formatBalance;
        this.formData.mainPublicKey = this.selectedAccount.publicKey;
        this.formData.isMultisig = this.selectedAccount.isMultisig || false;
    }

    /**
     * Format absolute XEM balance to relative string
     * @param {number} absoluteBalance
     * @returns {string} Relative balance string
     */
    computeXEMBalance(absoluteBalance) {
        return this._filter("fmtNemValue")(absoluteBalance || 0)[0] + "." + this._filter("fmtNemValue")(absoluteBalance || 0)[1];
    }

    /**
     * Verify current selected tab
     * @param {'status'|'enroll'|'payout'} tab
     * @returns {boolean} boolean
     */
    isTabSelected(tab) {
        return this.selectedTab === tab;
    }

    /**
     * Set tab
     * @param {'status'|'enroll'|'payout'} tab
     */
    setTab(tab) {
        this.selectedTab = tab;

        switch (tab) {
            case this.tab.status:
                this.selectStatusTab();
                break;
            case this.tab.enroll:
                this.selectEnrollTab();
                break;
            case this.tab.payout:
                this.selectPayoutHistory();
                break;
        }
    }

    /**
     * Reset current tab to status
     */
    resetTab() {
        this.setTab(this.tab.status);
    }

    /**
     * Switch account if account contain multisig
     */
    onChangeAccount() {
        this.setSelectedAccountInfo();
        this.resetTab();
    }

    /**
     * Prepare the transaction
     * @param {string} codewordHash
     * @returns {object} transaction object
     */
    prepareTransaction(codewordHash) {
        let transferTransaction = nem.model.objects.get("transferTransaction");

        // Set enroll address to recipient
        transferTransaction.recipient = this.formData.enrollAddress.toUpperCase().replace(/-/g, '');

        transferTransaction.amount = 0

        transferTransaction.mosaics = null;

        // If codewordHash is not provided, use the default one to make sure we have the right message length
        // to calculate transaction fees
        transferTransaction.message = `enroll ${this.formData.nodeHost} ${codewordHash ? codewordHash :'0'.repeat(64)}`;

        // Set multisig, if selected
        if (this.formData.isMultisig) {
            transferTransaction.isMultisig = true;
            transferTransaction.multisigAccount =  this.selectedAccount;
        }

        // Prepare transaction object according to transfer type
        const entity = nem.model.transactions.prepare("transferTransaction")(this.common, transferTransaction, this._Wallet.network);

        // Set the entity for fees in view
        this.preparedTransaction = entity;

        return entity;
    }

    /**
     * Select enroll status tab
     */
    async selectStatusTab() {
        this.enrollStatus = {
            nodeName: '-',
            status: false,
            endpoint: '-',
            publicKey: '-',
            remotePublicKey: '-',
            totalReward: '-',
            lastPayoutRound: '-'
        }

        if (!this.formData.mainPublicKey) {
            return;
        }

        try {
            const result = await this._superNodeProgram.getNodeInfo(this.formData.mainPublicKey);

            this._$timeout(() => {
                this.enrollStatus = {
                    nodeName: result.name,
                    status: result.status,
                    endpoint: new URL(result.endpoint).hostname || '' ,
                    publicKey: result.mainPublicKey,
                    remotePublicKey: result.remotePublicKey,
                    totalReward: this.computeXEMBalance(result.totalRewardsEarned),
                    nodeId: result.id,
                    lastPayoutRound: result.lastPayoutRound === -1 ? "-" : result.lastPayoutRound,
                }

                this.lastPage = Math.ceil(result.rewardCount/15);
            })
        } catch (error) {
            console.log(error);
        }
    }

    /**
     * Announce enroll transaction
     */
    async sendEnroll() {
        this.okPressed = true;

        // Password validation
        if (!this._Wallet.decrypt(this.common)) {
            this.okPressed = false;
            return;
        }

        // When account does not have a public key in network
        // generate public key from private key
        if(!this.formData.mainPublicKey) {
            if (this.common.isHW) {
                this._Alert.accountHasNoPublicKey();
                this.okPressed = false;
                return;
            } else {
                this.formData.mainPublicKey = new nem.crypto.keyPair.create(this.common.privateKey).publicKey.toString();
            }
        }

        // Validation for domain: protocol and port not required
        const regex = new RegExp(/((https?:\/\/))|((:\d{1,4}))/);
        if (regex.test(this.formData.nodeHost)) {
            this._Alert.invalidFormatNodeHost();
            this.okPressed = false;
            return;
        }

        // Enroll validation and request codeWord
        const [isEnrolled, isEnrollmentAddressValid, codewordHash] = await Promise.all([
            this._superNodeProgram.checkEnrollmentStatus(this.formData.mainPublicKey),
            this._superNodeProgram.checkEnrollmentAddress(this.formData.enrollAddress),
            this._superNodeProgram.getCodewordHash(this.formData.mainPublicKey)
        ])

        const isEnrolledWithSameDomain = isEnrolled && this.formData.nodeHost === this.enrollStatus.endpoint;

        if (isEnrolledWithSameDomain) {
            this._$timeout(() => {
                this._Alert.addressEnrolled();
                this.okPressed = false;
                return;
            })
        }

        if (!isEnrollmentAddressValid) {
            this._$timeout(() => {
                this._Alert.invalidEnrollmentAddress();
                this.okPressed = false;
                return;
            })
        }

        if (codewordHash.length !== 64) {
            this._$timeout(() => {
                this._Alert.invalidCodewordHash();
                this.okPressed = false;
                return;
            })
        }

        if(!isEnrolledWithSameDomain && isEnrollmentAddressValid && 64 === codewordHash.length) {
            // Prepare transaction for enrollment
            const entity = this.prepareTransaction(codewordHash);

            try {
                await this._Wallet.transact(this.common, entity);

                this._$timeout(() => {
                    // Enable send button
                    this.okPressed = false;
                    return;
                })
            } catch (error) {
                this._$timeout(() => {
                    // Delete private key in common
                    this.common.privateKey = '';
                    // Enable send button
                    this.okPressed = false;
                    return;
                });
            }
        }
    }

    /**
     * Set enroll endpoint, when current account is enrolled
     */
    selectEnrollTab() {
        if (this.enrollStatus.endpoint !== '-') {
            this.formData.nodeHost = this.enrollStatus.endpoint;
            // Update Fee view
            this.prepareTransaction();
        }
    }

    /**
     * Fetch first page of payout history
     */
    fetchFirst() {
        this.currentPage = 0;
        this.selectPayoutHistory();
    }

    /**
     * Fetch last page of payout history
     */
    fetchLast() {
        this.currentPage = this.lastPage;
        this.selectPayoutHistory();
    }

    /**
     * Fetch next page of payout history
     */
    fetchNext() {
        ++this.currentPage;
        this.selectPayoutHistory();
    }

    /**
     * Fetch previous page of payout history
     */
    fetchPrevious() {
        --this.currentPage;
        this.selectPayoutHistory();
    }

    /**
     * Fetch payout history records
     */
    async selectPayoutHistory() {
        this.payoutHistory = [];

        if (!this.enrollStatus.nodeId) {
            return;
        }

        try {
            const payouts = await this._superNodeProgram.getNodePayouts(this.enrollStatus.nodeId, this.currentPage);

            this._$timeout(() => {
                this.payoutHistory = payouts.map(item => {
                    return {
                        ...item,
                        amount: this.computeXEMBalance(item.amount),
                        timestamp: new Date(item.timestamp).toGMTString()
                    }
                })
            })
        } catch (error) {
            console.log(error);
        }
    }

    /**
     * Validate enroll address input
     */
    isValid() {
        const { enrollAddress } = this.formData;

        if (enrollAddress.length !== 40 && enrollAddress.length !== 46) {
            return false;
        }

        if (!nem.model.address.isValid(enrollAddress)) {
            return false;
        }

        if (!nem.model.address.isFromNetwork(enrollAddress, this._Wallet.network)) {
            return false;
        }

        return true;
    }

    /**
     * Process address input
     */
    processInput() {
        const { enrollAddress } = this.formData;

        this.formData.enrollAddress = enrollAddress.toUpperCase().replace(/-/g, '');
    }

    //// End methods region ////
}

export default SuperNodeProgramCtrl;
