import WalletFixture from '../data/wallet';

function mockFetch(returnValue, type) {
    spyOn(window, 'fetch').and.returnValue(Promise.resolve({
        [type]: Promise.resolve(returnValue)
    }));
}

describe('NodeRewardsProgram service tests', function() {
    let NodeRewardsProgram;
    let Wallet;

    beforeEach(angular.mock.module('app'));

    beforeEach(angular.mock.inject(function(_NodeRewardsProgram_, _Wallet_) {
        NodeRewardsProgram = _NodeRewardsProgram_;
        Wallet = _Wallet_;

        Wallet.use(WalletFixture.mainnetWallet);
    }));

    describe('prepareEnrollTransaction()', function() {
        it('should return valid enroll transaction', async function() {
            // Arrange
            spyOn(NodeRewardsProgram, 'getEnrollmentHash').and.returnValue(Promise.resolve('hash'));
            const mainPublicKey = '00a30788dc1f042da959309639a884d8f6a87086cda10300d2a7c3a0e0891a4d';
            const host = 'http://108.61.168.86:7890';
            const enrollmentAddress = 'NCHESTYVD2P6P646AMY7WSNG73PCPZDUQNSD6JAK';
            const expectedMessage = `enroll ${host} hash`;

            //Act
            const transaction = await NodeRewardsProgram.prepareEnrollTransaction(mainPublicKey, host, enrollmentAddress);

            // Assert
            expect(transaction.recipient).toBe(enrollmentAddress);
            expect(transaction.amount).toBe(0);
            expect(transaction.mosaics).toBe(null);
            expect(transaction.message).toBe(expectedMessage);
            expect(transaction.isMultisig).toBe(false);
            done();
        });

        it('should return valid multisig enroll transaction', async function() {
            // Arrange
            spyOn(NodeRewardsProgram, 'getEnrollmentHash').and.returnValue(Promise.resolve('hash'));
            const mainPublicKey = '00a30788dc1f042da959309639a884d8f6a87086cda10300d2a7c3a0e0891a4d';
            const host = 'http://108.61.168.86:7890';
            const enrollmentAddress = 'NCHESTYVD2P6P646AMY7WSNG73PCPZDUQNSD6JAK';
            const multisigAddress = 'NDJJQBVYULBZTKR2UCERXYRWXOUWVYH6ATI6OIAA';
            const expectedMessage = `enroll ${host} hash`;

            //Act
            const transaction = await NodeRewardsProgram.prepareEnrollTransaction(mainPublicKey, host, enrollmentAddress, multisigAddress);

            // Assert
            expect(transaction.recipient).toBe(enrollmentAddress);
            expect(transaction.amount).toBe(0);
            expect(transaction.mosaics).toBe(null);
            expect(transaction.message).toBe(expectedMessage);
            expect(transaction.isMultisig).toBe(true);
            expect(transaction.multisigAccount).toBe(multisigAddress);
            done();
        });
    });

    describe('checkEnrollmentAddress()', function() {
        it('should return true when API returns "true" string', async function() {
            // Arrange
            mockFetch('true', 'text');
            const expectedResult = true;

            //Act
            const result = await NodeRewardsProgram.checkEnrollmentAddress(expectedResult);

            // Assert
            expect(result).toBe(expectedResult);
            done();
        });

        it('should return false when API returns "false" string', async function() {
            // Arrange
            mockFetch('false', 'text');
            const expectedResult = false;

            //Act
            const result = await NodeRewardsProgram.checkEnrollmentAddress(expectedResult);

            // Assert
            expect(result).toBe(expectedResult);
            done();
        });
    });

    describe('checkEnrollmentStatus()', function() {
        it('should return true when there is successfull enrollment for given public key and recipient address is a valid enrollment address', async function() {
            // Arrange
            spyOn(NodeRewardsProgram, 'checkEnrollmentAddress').and.returnValue(Promise.resolve(true));
            mockFetch([{
                recipientAddress: 'NCHESTYVD2P6P646AMY7WSNG73PCPZDUQNSD6JAK',
                transactionHeight: 1,
                transactionHash: 'bba40188dc1f042da959309639a884d8f6a87086cda10300d2a7c3a0e0891aua',
                host: 'http://108.61.168.86:7890'
            }], 'json');
            
            const publicKey = '00a30788dc1f042da959309639a884d8f6a87086cda10300d2a7c3a0e0891a4d';
            const expectedEnrollmentStatus = true;

            //Act
            const enrollmentStatus = await NodeRewardsProgram.checkEnrollmentStatus(publicKey);

            // Assert
            expect(enrollmentStatus).toBe(expectedEnrollmentStatus);
            done();
        });

        it('should return false when there is successfull enrollment for given public key and recipient address is not a valid enrollment address', async function() {
            // Arrange
            spyOn(NodeRewardsProgram, 'checkEnrollmentAddress').and.returnValue(Promise.resolve(false));
            mockFetch([{
                recipientAddress: 'NCHESTYVD2P6P646AMY7WSNG73PCPZDUQNSD6JAK',
                transactionHeight: 1,
                transactionHash: 'bba40188dc1f042da959309639a884d8f6a87086cda10300d2a7c3a0e0891aua',
                host: 'http://108.61.168.86:7890'
            }], 'json');
            const publicKey = '00a30788dc1f042da959309639a884d8f6a87086cda10300d2a7c3a0e0891a4d';
            const expectedEnrollmentStatus = false;

            //Act
            const enrollmentStatus = await NodeRewardsProgram.checkEnrollmentStatus(publicKey);

            // Assert
            expect(enrollmentStatus).toBe(expectedEnrollmentStatus);
            done();
        });

        it('should return false when there is no successfull enrollment for given public key', async function() {
            // Arrange
            mockFetch([], 'json');
            const publicKey = '00a30788dc1f042da959309639a884d8f6a87086cda10300d2a7c3a0e0891a4d';
            const expectedEnrollmentStatus = false;

            //Act
            const enrollmentStatus = await NodeRewardsProgram.checkEnrollmentStatus(publicKey);

            // Assert
            expect(enrollmentStatus).toBe(expectedEnrollmentStatus);
            done();
        });
    });
});
