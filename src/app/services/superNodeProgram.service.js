import nem from 'nem-sdk';

const SUPER_NODE_PROGRAM_API_BASE_URL = 'https://nem.io/supernode/api';

/** Service to enroll in the SuperNode Program and to get the status related information */
class SuperNodeProgram {

    /**
     * Initialize dependencies and properties.
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

        this.apiBaseUrl = SUPER_NODE_PROGRAM_API_BASE_URL;
        this.common = nem.model.objects.get('common');

        // End properties region //
    }

    // Service methods region //

    /**
     * Make get request.
     *
     * @param {string} url -  URL of the resource to fetch.
     * @param {string} errorMessage - Description of the error that will be thrown in case of an unsuccessful request.
     *
     * @return {Promise<object>} - Response.
     */
    async _get(url, errorMessage) {
        const response = await fetch(url);

        if (!response.ok) {
            throw Error(errorMessage);
        }

        return response;
    }

    /**
     * Checks if an address is the current enrollment address.
     *
     * @param {string} address - Address to check.
     *
     * @return {Promise<boolean>} - If the address to check matches the current enrollment address.
     */
    async checkEnrollmentAddress(address) {
        const response = await this._get(`${this.apiBaseUrl}/enrollment/check/address/${address}`, 'failed_to_validate_enroll_address');
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
        const successEnrollmentResponse = await this._get(`${this.apiBaseUrl}/enrollment/successes/${publicKey}?count=1`, 'failed_to_get_success_enrollments');
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
     * @return {Promise<string>} - The codeword hex string, which should be used in enrollment messages.
     */
    async getCodewordHash(publicKey) {
        const response = await this._get(`${this.apiBaseUrl}/codeword/${publicKey}`, 'failed_to_get_codeword_hash');

        return response.text();
    }

    /**
     * Gets payout information for a single node.
     *
     * @param {string} nodeId - Id of the node to search.
     * @param {number} pageNumber - Page number to return.
     * @param {number} count - record size.
     *
     * @return {Promise<Array<object>>} - List of payouts.
     */
    async getNodePayouts(nodeId, pageNumber, count = 10) {
        const offset = count * pageNumber;
        const response = await this._get(`${this.apiBaseUrl}/node/${nodeId}/payouts?count=${count}&offset=${offset}`, 'failed_to_get_payouts_page');

        return response.json();
    }

    /**
     * Gets detailed information about a single node.
     *
     * @param {string} nodeId - Id of the node to search. Can be one of:
     *   - Database node id
     *   - Hex encoded node main public key
     *   - Node IP (or host)
     *
     * @return {Promise<object>} - Node info.
     */
    async getNodeInfo(nodeId) {
        const response = await this._get(`${this.apiBaseUrl}/node/${nodeId}`, 'failed_to_get_node_info');

        return response.json();
    }

    // End methods region //
}

export default SuperNodeProgram;
