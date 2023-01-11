import WalletFixture from '../data/wallet';
import { runPromiseErrorTest } from '../helper';

const SUPER_NODE_PROGRAM_API_BASE_URL = 'https://nem.io/supernode/api';

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
        it('should call fetch with valid endpoint url when nodeId and pageNumber=0 passed', async (done) => {
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

        it('should call fetch with valid endpoint url when nodeId and pageNumber=4 passed', async (done) => {
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
        it('should call fetch with valid endpoint url', async (done) => {
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

    describe('getNodes()', () => {
        it('should call fetch with valid endpoint url when pageNumber=0 passed', async (done) => {
            // Arrange:
            const mockedFetch = mockFetch([]);
            const baseUrl = SUPER_NODE_PROGRAM_API_BASE_URL;
            const pageNumber = 0;
            const count = 50;
            const offset = 0;
            const status = 'active';
            const expectedEndpoint = `${baseUrl}/nodes?count=${count}&offset=${offset}&status=${status}`;

            // Act:
            await SuperNodeProgram.getNodes(pageNumber);

            // Assert:
            expect(mockedFetch).toHaveBeenCalledWith(expectedEndpoint);
            done();
        });

        it('should call fetch with valid endpoint url when pageNumber=4 passed', async (done) => {
            // Arrange:
            const mockedFetch = mockFetch([]);
            const baseUrl = SUPER_NODE_PROGRAM_API_BASE_URL;
            const pageNumber = 4;
            const count = 50;
            const offset = 200;
            const status = 'active';
            const expectedEndpoint = `${baseUrl}/nodes?count=${count}&offset=${offset}&status=${status}`;

            // Act:
            await SuperNodeProgram.getNodes(pageNumber);

            // Assert:
            expect(mockedFetch).toHaveBeenCalledWith(expectedEndpoint);
            done();
        });

        it('should call fetch with valid endpoint url when pageNumber=0 and status=all passed', async (done) => {
            // Arrange:
            const mockedFetch = mockFetch([]);
            const baseUrl = SUPER_NODE_PROGRAM_API_BASE_URL;
            const pageNumber = 0;
            const count = 50;
            const offset = 0;
            const status = 'all';
            const expectedEndpoint = `${baseUrl}/nodes?count=${count}&offset=${offset}`;

            // Act:
            await SuperNodeProgram.getNodes(pageNumber, count, status);

            // Assert:
            expect(mockedFetch).toHaveBeenCalledWith(expectedEndpoint);
            done();
        });

        it('should return valid DTO', async (done) => {
            // Arrange:
            const expectedDTO = new Array(15).fill({
                endpoint: "http://localhost:7890",
                id: 844,
                name: 'superNode',
                status: 'active'
            });

            const pageNumber = 0;
            mockFetch(expectedDTO);

            // Act:
            const result = await SuperNodeProgram.getNodes(pageNumber);

            // Assert:
            expect(result).toEqual(expectedDTO);
            done();
        })

        it('should throw an error when request failed', async (done) => {
            // Arrange:
            mockFetch(null, false);
            const pageNumber = 1;
            const expectedError = Error('failed_to_get_nodes');
            const promiseToTest = SuperNodeProgram.getNodes(pageNumber);

            // Act + Assert:
            await runPromiseErrorTest(promiseToTest, expectedError);
            done();
        });
    });

    describe('getAllNodes()', () => {
        it('should call fetch all nodes until the last page is empty', async (done) => {
            // Arrange:
            const page1Response = new Array(5).fill({
                endpoint: "http://localhost:7890",
                id: 1,
                name: 'superNode',
                status: 'all'
            });

            const page2Response = new Array(5).fill({
                endpoint: "http://localhost:7890",
                id: 2,
                name: 'superNode',
                status: 'all'
            });

            spyOn(SuperNodeProgram, 'getNodes').and.callFake((pageNumber) => {
                if (pageNumber === 0) {
                    return page1Response;
                } else if (pageNumber === 1) {
                    return page2Response;
                } else {
                    return [];
                }
            })

            // Act:
            const result = await SuperNodeProgram.getAllNodes();

            // Assert:
            expect(SuperNodeProgram.getNodes).toHaveBeenCalledWith(0, 100, 'all');
            expect(SuperNodeProgram.getNodes).toHaveBeenCalledWith(1, 100, 'all');
            expect(SuperNodeProgram.getNodes).toHaveBeenCalledWith(2, 100, 'all');
            expect(SuperNodeProgram.getNodes).not.toHaveBeenCalledWith(3, 100, 'all');
            expect(result).toEqual([...page1Response, ...page2Response]);
            done();
        })
    });

    describe('getRandomNodes()', () => {
        it('returns 5 random node endpoint when status and number=5 is provided', async (done) => {
            // Arrange:
            const nodes = new Array(10).map(index => ({
                endpoint: "http://localhost:7890",
                id: index,
                name: 'superNode',
                status: 'active'
            }))

            spyOn(SuperNodeProgram, 'getAllNodes').and.returnValue(Promise.resolve(nodes));

            // Act:
            const result = await SuperNodeProgram.getRandomNodes('active', 5);

            // Assert:
            expect(result.length).toEqual(5);
            result.forEach(node => {
                expect(nodes.some(node)).toEqual(true);
                expect(node.hasOwnProperty('host')).toEqual(true);
                expect(node.hasOwnProperty('port')).toEqual(true);
            });
            done();
        })
    })
});
