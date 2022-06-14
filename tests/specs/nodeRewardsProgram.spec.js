import WalletFixture from '../data/wallet';
import nem from 'nem-sdk';

function mockFetch(returnValue) {
    window.fetch = () => {
        return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(returnValue),
            text: () => Promise.resolve(returnValue),
        });
    }
}

describe('NodeRewardsProgram service tests', () => {
    let NodeRewardsProgram;
    let Wallet;

    beforeEach(angular.mock.module('app'));

    beforeEach(angular.mock.inject((_NodeRewardsProgram_, _Wallet_) => {
        NodeRewardsProgram = _NodeRewardsProgram_;
        Wallet = _Wallet_;

        Wallet.use(WalletFixture.mainnetWallet);
    }));

    describe('prepareEnrollTransaction()', () => {
        it('should return valid enroll transaction', async (done) => {
            // Arrange
            spyOn(NodeRewardsProgram, 'getCodewordHash').and.returnValue(Promise.resolve('hash'));
            const mainPublicKey = '00a30788dc1f042da959309639a884d8f6a87086cda10300d2a7c3a0e0891a4d';
            const host = 'http://108.61.168.86:7890';
            const enrollmentAddress = 'NCHESTYVD2P6P646AMY7WSNG73PCPZDUQNSD6JAK';
            const expectedMessage = nem.utils.convert.utf8ToHex(`enroll ${host} hash`);
            const transferTransactionType = 257;

            //Act
            const transaction = await NodeRewardsProgram.prepareEnrollTransaction(mainPublicKey, host, enrollmentAddress);

            // Assert
            expect(transaction.type).toBe(transferTransactionType);
            expect(transaction.recipient).toBe(enrollmentAddress);
            expect(transaction.amount).toBe(0);
            expect(transaction.mosaics).toBe(null);
            expect(transaction.message.payload).toBe(expectedMessage);
            done();
        });

        it('should return valid multisig enroll transaction', async (done) => {
            // Arrange
            spyOn(NodeRewardsProgram, 'getCodewordHash').and.returnValue(Promise.resolve('hash'));
            const mainPublicKey = '00a30788dc1f042da959309639a884d8f6a87086cda10300d2a7c3a0e0891a4d';
            const host = 'http://108.61.168.86:7890';
            const enrollmentAddress = 'NCHESTYVD2P6P646AMY7WSNG73PCPZDUQNSD6JAK';
            const multisigAddress = 'NDJJQBVYULBZTKR2UCERXYRWXOUWVYH6ATI6OIAA';
            const expectedMessage = nem.utils.convert.utf8ToHex(`enroll ${host} hash`);
            const transferTransactionType = 257;
            const multisigTransactionType = 4100;

            //Act
            const transaction = await NodeRewardsProgram.prepareEnrollTransaction(mainPublicKey, host, enrollmentAddress, multisigAddress);

            // Assert
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
            // Arrange
            mockFetch('true');
            const expectedResult = true;

            //Act
            const result = await NodeRewardsProgram.checkEnrollmentAddress(expectedResult);

            // Assert
            expect(result).toBe(expectedResult);
            done()
        });

        it('should return false when API returns "false" string', async (done) => {
            // Arrange
            mockFetch('false');
            const expectedResult = false;

            //Act
            const result = await NodeRewardsProgram.checkEnrollmentAddress(expectedResult);

            // Assert
            expect(result).toBe(expectedResult);
            done()
        });
    });

    describe('checkEnrollmentStatus()', () => {
        it('should return true when there is successfull enrollment for given public key and recipient address is a valid enrollment address', async (done) => {
            // Arrange
            spyOn(NodeRewardsProgram, 'checkEnrollmentAddress').and.returnValue(Promise.resolve(true));
            mockFetch([{
                recipientAddress: 'NCHESTYVD2P6P646AMY7WSNG73PCPZDUQNSD6JAK',
                transactionHeight: 1,
                transactionHash: 'bba40188dc1f042da959309639a884d8f6a87086cda10300d2a7c3a0e0891aua',
                host: 'http://108.61.168.86:7890'
            }]);
            
            const publicKey = '00a30788dc1f042da959309639a884d8f6a87086cda10300d2a7c3a0e0891a4d';
            const expectedEnrollmentStatus = true;

            //Act
            const enrollmentStatus = await NodeRewardsProgram.checkEnrollmentStatus(publicKey);

            // Assert
            expect(enrollmentStatus).toBe(expectedEnrollmentStatus);
            done();
        });

        it('should return false when there is successfull enrollment for given public key and recipient address is not a valid enrollment address', async (done) => {
            // Arrange
            spyOn(NodeRewardsProgram, 'checkEnrollmentAddress').and.returnValue(Promise.resolve(false));
            mockFetch([{
                recipientAddress: 'NCHESTYVD2P6P646AMY7WSNG73PCPZDUQNSD6JAK',
                transactionHeight: 1,
                transactionHash: 'bba40188dc1f042da959309639a884d8f6a87086cda10300d2a7c3a0e0891aua',
                host: 'http://108.61.168.86:7890'
            }]);
            const publicKey = '00a30788dc1f042da959309639a884d8f6a87086cda10300d2a7c3a0e0891a4d';
            const expectedEnrollmentStatus = false;

            //Act
            const enrollmentStatus = await NodeRewardsProgram.checkEnrollmentStatus(publicKey);

            // Assert
            expect(enrollmentStatus).toBe(expectedEnrollmentStatus);
            done();
        });

        it('should return false when there is no successfull enrollment for given public key', async (done) => {
            // Arrange
            mockFetch([]);
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
