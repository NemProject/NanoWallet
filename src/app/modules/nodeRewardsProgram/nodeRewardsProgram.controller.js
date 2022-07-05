import nem from 'nem-sdk';

class NodeRewardsProgramCtrl {

    /**
     * Initialize dependencies and properties
     *
     * @params {services} - Angular services to inject
     */
    constructor($filter, Wallet, DataStore, $timeout, Alert, NodeRewardsProgram) {
        'ngInject';

        //// Module dependencies region ////

        this._filter = $filter;
        this._Wallet = Wallet;
        this._DataStore = DataStore;
        this._$timeout = $timeout;
        this._Alert = Alert;
        this._nodeRewardsProgram = NodeRewardsProgram;

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
            domainOrIP: '',
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
            name: 'TAB_ENROLL_TO_PROGRAM_NAME',
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
        return (this.selectedTab === tab);
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
        // Create a new object to not affect the view
        let transferTransaction = nem.model.objects.get("transferTransaction");

        // Set recipient
        transferTransaction.recipient = this.formData.enrollAddress.toUpperCase().replace(/-/g, '');

        // Set amount
        transferTransaction.amount = 0

        // Set empty mosaics
        transferTransaction.mosaics = null;

        // Set the message
        transferTransaction.message = `enroll ${this.formData.domainOrIP} ${codewordHash ? codewordHash :'0'.repeat(64)}`;

        // Set multisig, if selected
        if (this.formData.isMultisig) {
            transferTransaction.isMultisig = true;
            transferTransaction.multisigAccount =  this.selectedAccount;
        }

        // Prepare transaction object according to transfer type
        const entity = nem.model.transactions.prepare("transferTransaction")(this.common, transferTransaction, this._Wallet.network);

        // Set the entity for fees in view
        this.preparedTransaction = entity;

        // Return prepared transaction
        return entity;
    }

    /**
     * Select enroll status tab
     */
    async selectStatusTab() {
        try {
            const result = await this._nodeRewardsProgram.getNodeInfo(this.formData.mainPublicKey);

            this._$timeout(() => {
                this.enrollStatus = {
                    nodeName: result.name,
                    status: result.status,
                    endpoint: result.endpoint,
                    publicKey: result.mainPublicKey,
                    remotePublicKey: result.remotePublicKey,
                    totalReward: this.computeXEMBalance(result.totalRewardsEarned),
                    nodeId: result.id,
                }

                this.lastPage = Number((result.rewardCount / 15).toFixed())
            })
        } catch (error) {
            this._$timeout(() => {
                this.enrollStatus = {
                    nodeName: '-',
                    status: false,
                    endpoint: '-',
                    publicKey: '-',
                    remotePublicKey: '-',
                    totalReward: '-',
                };
            })
        }
    }

    /**
     * Announce enroll transaction
     */
    async sendEnroll() {
        this.okPressed = true;

        // Password validation
        if (!this._Wallet.decrypt(this.common)) return this.okPressed = false;

        // Enroll validation and request codeWord
        const [isEnrolled, isEnrollmentAddressValid, codewordHash] = await Promise.all([
            this._nodeRewardsProgram.checkEnrollmentStatus(this.formData.mainPublicKey),
            this._nodeRewardsProgram.checkEnrollmentAddress(this.formData.enrollAddress),
            this._nodeRewardsProgram.getCodewordHash(this.formData.mainPublicKey)
        ])

        if (isEnrolled) {
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

        if (!isEnrolled && isEnrollmentAddressValid) {
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
            this.formData.domainOrIP = this.enrollStatus.endpoint;
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
        try {
            const payouts = await this._nodeRewardsProgram.getNodePayouts(this.enrollStatus.nodeId, this.currentPage);

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
            this._$timeout(() => {
                this.payoutHistory = [];
            })
        }
    }

    //// End methods region ////
}

export default NodeRewardsProgramCtrl;
