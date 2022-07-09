import WalletFixture from '../data/wallet';
import nem from 'nem-sdk';
import { runPromiseErrorTest } from '../helper';

const SUPER_NODE_PROGRAM_API_BASE_URL = 'https://supernodesapi.nem.io';

function mockFetch(returnValue, ok = true) {
    return spyOn(window, 'fetch').and.returnValue(Promise.resolve({
        ok,
        json: () => Promise.resolve(returnValue),
        text: () => Promise.resolve(returnValue),
    }));
}

describe('SuperNodeProgram service tests', () => {
    let SuperNodeProgram;
    let Wallet;

    beforeEach(angular.mock.module('app'));

    beforeEach(angular.mock.inject((_SuperNodeProgram_, _Wallet_) => {
        SuperNodeProgram = _SuperNodeProgram_;
        Wallet = _Wallet_;

        Wallet.use(WalletFixture.mainnetWallet);
    }));

    describe('prepareEnrollTransaction()', () => {
        it('should return valid enroll transaction', async (done) => {
            // Arrange:
            spyOn(SuperNodeProgram, 'getCodewordHash').and.returnValue(Promise.resolve('hash'));
            const mainPublicKey = '00a30788dc1f042da959309639a884d8f6a87086cda10300d2a7c3a0e0891a4d';
            const host = 'http://108.61.168.86:7890';
            const enrollmentAddress = 'NCHESTYVD2P6P646AMY7WSNG73PCPZDUQNSD6JAK';
            const expectedMessage = nem.utils.convert.utf8ToHex(`enroll ${host} hash`);
            const transferTransactionType = 257;

            // Act:
            const transaction = await SuperNodeProgram.prepareEnrollTransaction(mainPublicKey, host, enrollmentAddress);

            // Assert:
            expect(transaction.type).toBe(transferTransactionType);
            expect(transaction.recipient).toBe(enrollmentAddress);
            expect(transaction.amount).toBe(0);
            expect(transaction.mosaics).toBe(null);
            expect(transaction.message.payload).toBe(expectedMessage);
            done();
        });

        it('should return valid multisig enroll transaction', async (done) => {
            // Arrange:
            spyOn(SuperNodeProgram, 'getCodewordHash').and.returnValue(Promise.resolve('hash'));
            const mainPublicKey = '00a30788dc1f042da959309639a884d8f6a87086cda10300d2a7c3a0e0891a4d';
            const host = 'http://108.61.168.86:7890';
            const enrollmentAddress = 'NCHESTYVD2P6P646AMY7WSNG73PCPZDUQNSD6JAK';
            const multisigAddress = 'NDJJQBVYULBZTKR2UCERXYRWXOUWVYH6ATI6OIAA';
            const expectedMessage = nem.utils.convert.utf8ToHex(`enroll ${host} hash`);
            const transferTransactionType = 257;
            const multisigTransactionType = 4100;

            // Act:
            const transaction = await SuperNodeProgram.prepareEnrollTransaction(mainPublicKey, host, enrollmentAddress, multisigAddress);

            // Assert:
            expect(transaction.type).toBe(multisigTransactionType);
            expect(transaction.otherTrans.type).toBe(transferTransactionType);
            expect(transaction.otherTrans.recipient).toBe(enrollmentAddress);
            expect(transaction.otherTrans.amount).toBe(0);
            expect(transaction.otherTrans.mosaics).toBe(null);
            expect(transaction.otherTrans.message.payload).toBe(expectedMessage);
            done();
        });
    });

    describe('checkEnrollmentAddress()', () => {
        it('should return true when API returns "true" string', async (done) => {
            // Arrange:
            mockFetch('true');
            const expectedResult = true;

            // Act:
            const result = await SuperNodeProgram.checkEnrollmentAddress('');

            // Assert:
            expect(result).toBe(expectedResult);
            done();
        });

        it('should return false when API returns "false" string', async (done) => {
            // Arrange:
            mockFetch('false');
            const expectedResult = false;

            // Act:
            const result = await SuperNodeProgram.checkEnrollmentAddress('');

            // Assert:
            expect(result).toBe(expectedResult);
            done();
        });

        it('should throw an error when request failed', async (done) => {
            // Arrange:
            mockFetch(null, false);
            const expectedError = Error('failed_to_validate_enroll_address');
            const promiseToTest = SuperNodeProgram.checkEnrollmentAddress('');

            // Act + Assert:
            await runPromiseErrorTest(promiseToTest, expectedError);
            done();
        });
    });

    describe('checkEnrollmentStatus()', () => {
        const runSuccessfullEnrollmentRecipientAddressValidityTest = async isAddressValid => {
            // Arrange:
            spyOn(SuperNodeProgram, 'checkEnrollmentAddress').and.returnValue(Promise.resolve(isAddressValid));
            mockFetch([{
                recipientAddress: 'NCHESTYVD2P6P646AMY7WSNG73PCPZDUQNSD6JAK',
                transactionHeight: 1,
                transactionHash: 'bba40188dc1f042da959309639a884d8f6a87086cda10300d2a7c3a0e0891aua',
                host: 'http://108.61.168.86:7890'
            }]);
            const publicKey = '00a30788dc1f042da959309639a884d8f6a87086cda10300d2a7c3a0e0891a4d';

            // Act:
            const enrollmentStatus = await SuperNodeProgram.checkEnrollmentStatus(publicKey);

            // Assert:
            expect(enrollmentStatus).toBe(isAddressValid);
        };

        it('should return true when there is successfull enrollment for given public key and recipient address is a valid enrollment address', async (done) => {
            await runSuccessfullEnrollmentRecipientAddressValidityTest(true);
            done();
        });

        it('should return false when there is successfull enrollment for given public key and recipient address is not a valid enrollment address', async (done) => {
            await runSuccessfullEnrollmentRecipientAddressValidityTest(false);
            done();
        });

        it('should return false when there is no successfull enrollment for given public key', async (done) => {
            // Arrange:
            mockFetch([]);
            const publicKey = '00a30788dc1f042da959309639a884d8f6a87086cda10300d2a7c3a0e0891a4d';
            const expectedEnrollmentStatus = false;

            // Act:
            const enrollmentStatus = await SuperNodeProgram.checkEnrollmentStatus(publicKey);

            // Assert:
            expect(enrollmentStatus).toBe(expectedEnrollmentStatus);
            done();
        });

        it('should throw an error when request failed', async (done) => {
            // Arrange:
            mockFetch(null, false);
            const publicKey = '00a30788dc1f042da959309639a884d8f6a87086cda10300d2a7c3a0e0891a4d';
            const expectedError = Error('failed_to_get_success_enrollments');
            const promiseToTest = SuperNodeProgram.checkEnrollmentStatus(publicKey);

            // Act + Assert:
            await runPromiseErrorTest(promiseToTest, expectedError);
            done();
        });
    });

    describe('getCodewordHash()', () => {
        it('should fetch codeword hash string', async (done) => {
            // Arrange:
            const baseUrl = SUPER_NODE_PROGRAM_API_BASE_URL;
            const publicKey = '00a30788dc1f042da959309639a884d8f6a87086cda10300d2a7c3a0e0891a4d';
            const expectedString = 'hash';
            const expectedEndpoint = `${baseUrl}/codeword/${publicKey}`;
            const mockedFetch = mockFetch(expectedString);

            // Act:
            const result = await SuperNodeProgram.getCodewordHash(publicKey);

            // Assert:
            expect(mockedFetch).toHaveBeenCalledWith(expectedEndpoint);
            expect(result).toEqual(expectedString);
            done();
        });

        it('should throw an error when request failed', async (done) => {
            // Arrange:
            mockFetch(null, false);
            const expectedError = Error('failed_to_get_codeword_hash');
            const promiseToTest = SuperNodeProgram.getCodewordHash('');

            // Act + Assert:
            await runPromiseErrorTest(promiseToTest, expectedError);
            done();
        });
    });

    describe('getNodePayouts()', () => {
        it('should fetch to be called with valid endpoint url when nodeId and pageNumber=0 passed', async (done) => {
            // Arrange:
            const mockedFetch = mockFetch([]);
            const baseUrl = SUPER_NODE_PROGRAM_API_BASE_URL;
            const nodeId = 1;
            const pageNumber = 0;
            const count = 10;
            const offset = 0;
            const expectedEndpoint = `${baseUrl}/node/${nodeId}/payouts?count=${count}&offset=${offset}`;

            // Act:
            await SuperNodeProgram.getNodePayouts(nodeId, pageNumber);

            // Assert:
            expect(mockedFetch).toHaveBeenCalledWith(expectedEndpoint);
            done();
        });

        it('should fetch to be called with valid endpoint url when nodeId and pageNumber=4 passed', async (done) => {
            // Arrange:
            const mockedFetch = mockFetch([]);
            const baseUrl = SUPER_NODE_PROGRAM_API_BASE_URL;
            const nodeId = 1;
            const pageNumber = 4;
            const count = 10;
            const offset = 40;
            const expectedEndpoint = `${baseUrl}/node/${nodeId}/payouts?count=${count}&offset=${offset}`;

            // Act:
            await SuperNodeProgram.getNodePayouts(nodeId, pageNumber);

            // Assert:
            expect(mockedFetch).toHaveBeenCalledWith(expectedEndpoint);
            done();
        });

        it('should return valid DTO', async (done) => {
            // Arrange:
            const expectedDTO = new Array(15).fill({
                amount: 0,
                fromRoundId: 844,
                isPaid: false,
                timestamp: '2022-06-16T12:15:27.427749+00:00',
                toRoundId: 844,
                transactionHash: null
            });
            const nodeId = 1;
            const pageNumber = 0;
            mockFetch(expectedDTO);

            // Act:
            const result = await SuperNodeProgram.getNodePayouts(nodeId, pageNumber);

            // Assert:
            expect(result).toEqual(expectedDTO);
            done();
        });

        it('should throw an error when request failed', async (done) => {
            // Arrange:
            mockFetch(null, false);
            const nodeId = 1;
            const pageNumber = 4;
            const expectedError = Error('failed_to_get_payouts_page');
            const promiseToTest = SuperNodeProgram.getNodePayouts(nodeId, pageNumber);

            // Act + Assert:
            await runPromiseErrorTest(promiseToTest, expectedError);
            done();
        });
    });

    describe('getNodeInfo()', () => {
        it('should fetch to be called with valid endpoint url', async (done) => {
            // Arrange:
            const mockedFetch = mockFetch(null);
            const baseUrl = SUPER_NODE_PROGRAM_API_BASE_URL;
            const nodeId = 1;
            const expectedEndpoint = `${baseUrl}/node/${nodeId}`;

            // Act:
            await SuperNodeProgram.getNodeInfo(nodeId);

            // Assert:
            expect(mockedFetch).toHaveBeenCalledWith(expectedEndpoint);
            done();
        });

        it('should return valid DTO', async (done) => {
            // Arrange:
            const expectedDTO = {
                endpoint: 'http://108.61.168.86:7890',
                lastPayoutRound: 9172,
                name: 'Alice6',
                remotePublicKey: '00a30788dc1f042da959309639a884d8f6a87086cda10300d2a7c3a0e0891a4d',
                mainPublicKey: '00a30788dc1f042da959309639a884d8f6a87086cda10300d2a7c3a0e0891a4d',
                status: 'active',
                totalRewardsEarned: 863404000342
            };
            const nodeId = 1;
            mockFetch(expectedDTO);

            // Act:
            const result = await SuperNodeProgram.getNodeInfo(nodeId);

            // Assert:
            expect(result).toEqual(expectedDTO);
            done();
        });

        it('should throw an error when request failed', async (done) => {
            // Arrange:
            mockFetch(null, false);
            const nodeId = 1;
            const expectedError = Error('failed_to_get_node_info');
            const promiseToTest = SuperNodeProgram.getNodeInfo(nodeId);

            // Act + Assert:
            await runPromiseErrorTest(promiseToTest, expectedError);
            done();
        });
    });
});
