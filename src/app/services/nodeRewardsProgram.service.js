import nem from 'nem-sdk';

const NODE_REWARDS_PROGRAM_API_BASE_URL = 'https://supernodesapi.nem.io';

/** Service to enroll in the Node Rewards Program and to get the status related information */
class NodeRewardsProgram {

    /**
     * Initialize dependencies and properties
     *
     * @params {services} - Angular services to inject
     */
    constructor($localStorage, $filter, Wallet) {
        'ngInject';

        // Service dependencies region //

        this._storage = $localStorage;
        this._$filter = $filter;
        this._Wallet = Wallet;

        // End dependencies region //

        // Service properties region //

        this.apiBaseUrl = NODE_REWARDS_PROGRAM_API_BASE_URL;
        this.common = nem.model.objects.get('common');

        // End properties region //
    }

    // Service methods region //

    /**
     * Prepare the enroll transaction
     *
     * @param {string} mainPublicKey - Delegated harvesting public key.
     * @param {string} host - IP or domain of the node.
     * @param {string} enrollmentAddress - Node Rewards Program enrollment address.
     * @param {string} [multisigAccountAddress] - Multisig account address. For multisig enrollment only.
     *
     * @return {Promise<object>} - Prepared enroll transaction
     */
    async prepareEnrollTransaction(mainPublicKey, host, enrollmentAddress, multisigAccountAddress) {
        // Create a new transaction object
        const transferTransaction = nem.model.objects.get('transferTransaction');

        // Set enrollment address as recipient
        transferTransaction.recipient = enrollmentAddress.toUpperCase().replace(/-/g, '');

        // Set multisig, if selected
        if (multisigAccountAddress) {
            transferTransaction.isMultisig = true;
            transferTransaction.multisigAccount = multisigAccountAddress.toUpperCase().replace(/-/g, '');
        }        

        // Set the message
        const hash = await this.getCodewordHash(mainPublicKey);
        transferTransaction.message = `enroll ${host} ${hash}`;

        // Set no mosaics
        transferTransaction.mosaics = null;

        return nem.model.transactions.prepare('transferTransaction')(this.common, transferTransaction, this._Wallet.network);
    }

    /**
     * Checks if an address is the current enrollment address.
     *
     * @param {string} address - Address to check.
     *
     * @return {Promise<boolean>} - If the address to check matches the current enrollment address.
     */
    async checkEnrollmentAddress(address) {
        const response = await fetch(this.apiBaseUrl + `/enrollment/check/address/${address}`);

        if (!response.ok) {
            throw Error('failed_to_validate_enroll_address');
        }
        
        const status = await response.text();
        
        return status === 'true';
    }

    /**
     * Checks if a signer public key is enrolled in the current period.
     *
     * @param {string} publicKey - Delegated harvesting public key to check.
     *
     * @return {Promise<boolean>} - If the public key is enrolled in the current period.
     */
    async checkEnrollmentStatus(publicKey) {
        const successEnrollmentResponse = await fetch(this.apiBaseUrl + `/enrollment/successes/${publicKey}?count=1`);

        if (!successEnrollmentResponse.ok) {
            throw Error('failed_to_get_success_enrollments');
        }

        const successEnrollments = await successEnrollmentResponse.json();

        if (successEnrollments.length === 0) {
            return false;
        }

        const latestSuccessEnrollment = successEnrollments[0];
        const enrollAddress = latestSuccessEnrollment.recipientAddress;

        return this.checkEnrollmentAddress(enrollAddress);
    }

    /**
     * Gets codeword dependent hash for the current period given a public key.
     *
     * @param {string} publicKey - Signer public key to use in hash calculation.
     *
     * @return {Promise<string>} - The result of keccak_256(codeword || public_key) as a hex string, which should be used in enrollment messages.
     */
    async getCodewordHash(publicKey) {
        const response = await fetch(this.apiBaseUrl + `/codeword/${publicKey}`);

        if (!response.ok) {
            throw Error('failed_to_get_codeword_hash');
        }
        
        return await response.text();
    }

    /**
     * Gets payout information for a single node.
     *
     * @param {string} nodeId - Id of the node to search.
     * @param {number} pageNumber - Page number to return.
     *
     * @return {Promise<Array<object>>} - List of payouts.
     */
    async getNodePayouts(nodeId, pageNumber) {
        const count = 15;
        const offset = count * pageNumber;

        const response = await fetch(this.apiBaseUrl + `/node/${nodeId}/payouts?count=${count}&offset=${offset}`);

        if (!response.ok) {
            throw Error('failed_to_get_payouts_page');
        }
        
        return await response.json();
    }

    /**
     * Gets detailed information about a single node.
     *
     * @param {string} nodeId - Id of the node to search. Can be one of:
     *   - Database node id
     *   - Hex encoded node main public key
     *   - Node IP (or host)
     *
     * @return {Promise<Array<object>>} - List of payouts.
     */
    async getNodeInfo(nodeId) {
        const response = await fetch(this.apiBaseUrl + `/node/${nodeId}`);

        if (!response.ok) {
            throw Error('failed_to_get_node_info');
        }
        
        return await response.json();
    }

    // End methods region //
}

export default NodeRewardsProgram;
