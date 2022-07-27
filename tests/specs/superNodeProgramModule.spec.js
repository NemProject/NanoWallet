import AccountDataFixture from '../data/accountData';
import nem from 'nem-sdk';

describe('SuperNode program module tests', () => {
    let $controller, $rootScope, $timeout, DataStore, Nodes, SuperNodeProgram, Alert, Wallet;

    const mockEnrollStatus = {
        id: 1,
        endpoint: 'https://superlong.domain.name:7890',
        lastPayoutRound: 9999,
        name: 'Alice6',
        remotePublicKey: 'ca37a2ee96b94fd5e7879105733c97a21ffc2c00d961b2995a59a82463708e6a',
        mainPublicKey: '00a30788dc1f042da959309639a884d8f6a87086cda10300d2a7c3a0e0891a4d',
        status: 'active',
        totalRewardsEarned: 12000000
    };

    beforeEach(() => {
        angular.mock.module('app');

        angular.mock.inject((_$controller_, _$rootScope_, _$timeout_, _DataStore_, _Nodes_, _SuperNodeProgram_, _Alert_, _Wallet_) => {
            $controller = _$controller_;
            $rootScope = _$rootScope_;
            $timeout = _$timeout_;
            DataStore = _DataStore_;
            Nodes = _Nodes_;
            SuperNodeProgram = _SuperNodeProgram_;
            Alert = _Alert_;
            Wallet = _Wallet_;
        })

        Nodes.setDefault();

        DataStore.account.metaData = AccountDataFixture.mainnetAccountData;
    })

    describe('getAccount', () => {
        it('returns normal account and balance', () => {
            // Arrange:
            const ctrl = $controller('SuperNodeProgramCtrl', {
                $scope: $rootScope.$new()
            });

            // Act:
            ctrl.getAccount();

            // Assert:
            expect(ctrl.selectedAccount).toEqual({
                ...AccountDataFixture.mainnetAccountData.account,
                display: AccountDataFixture.mainnetAccountData.account.address,
                formatBalance: ctrl.computeXEMBalance(AccountDataFixture.mainnetAccountData.account.balance)
            });
            expect(ctrl.balance).toEqual('0.000000');
            expect(ctrl.formData.isMultisig).toEqual(false);
            expect(ctrl.formData.mainPublicKey).toEqual('343648ce70fcaf85a7cb32d1dd76dcacae81303eed1fb0cdfad2847f2482017f');
        })

        it('returns multisig account and balance', () => {
            // Arrange:
            DataStore.account.metaData = AccountDataFixture.mainnetCosignerAccountData;

            const ctrl = $controller('SuperNodeProgramCtrl', {
                $scope: $rootScope.$new()
            });

            // Act:
            ctrl.getAccount();

            // Assert:
            const expectedAccounts = [{
                ...AccountDataFixture.mainnetCosignerAccountData.meta.cosignatoryOf[0],
                display: 'NCC7KUVPQYBTPBABABR5D724CJAOMIA2RJERW3N7 - Multisig',
                formatBalance: '16.000000',
                isMultisig: true
            }, {
                ...AccountDataFixture.mainnetCosignerAccountData.account,
                display: 'NC2YRCZB25RHND45HMX7YAZPHYMBKT5VQYMNAOCO',
                formatBalance: '0.000000'
            }]

            expect(ctrl.accounts).toEqual(expectedAccounts);
            expect(ctrl.selectedAccount).toEqual(expectedAccounts[0]);
            expect(ctrl.balance).toEqual(expectedAccounts[0].formatBalance);
            expect(ctrl.formData.isMultisig).toEqual(expectedAccounts[0].isMultisig);
            expect(ctrl.formData.mainPublicKey).toEqual(expectedAccounts[0].publicKey);
        })
    })

    describe('setSelectedAccountInfo', () => {
        const runBasicSetSelectedAccountInfoTests = selectedAccount => {
            // Arrange:
            const ctrl = $controller('SuperNodeProgramCtrl', {
                $scope: $rootScope.$new()
            });

            ctrl.selectedAccount = selectedAccount;

            // Act:
            ctrl.setSelectedAccountInfo();

            // Assert:
            expect(ctrl.balance).toEqual(selectedAccount.formatBalance);
            expect(ctrl.formData.isMultisig).toEqual(selectedAccount.isMultisig);
            expect(ctrl.formData.mainPublicKey).toEqual(selectedAccount.publicKey);
        }

        it('set normal account info to form data and balance', () => {
            // Arrange:
            runBasicSetSelectedAccountInfoTests({
                publicKey: 'ca37a2ee96b94fd5e7879105733c97a21ffc2c00d961b2995a59a82463708e6a',
                formatBalance: '0.000010',
                isMultisig: false
            });
        })

        it('set multisig account info to form data and balance', () => {
            // Arrange:
            runBasicSetSelectedAccountInfoTests({
                publicKey: 'ca37a2ee96b94fd5e7879105733c97a21ffc2c00d961b2995a59a82463708e6a',
                formatBalance: '0.000010',
                isMultisig: true
            });
        })
    })

    describe('computeXEMBalance', () => {
        it('returns formatted XEM balance in string (6 divisibility)', () => {
            // Arrange:
            const ctrl = $controller('SuperNodeProgramCtrl', {
                $scope: $rootScope.$new()
            });

            // Act:
            const balance = ctrl.computeXEMBalance(10);

            // Assert:
            expect(balance).toEqual('0.000010');
        })
    })

    describe('isTabSelected', () => {
        const runBasicTabSelectedTests = ({selectedTab, isTabToTestSelected, expectedResult}) => {
            it(`returns ${expectedResult} when selected tab ${expectedResult ? 'matched' : 'unmatched'} with current tab`, () => {
                // Arrange:
                const ctrl = $controller('SuperNodeProgramCtrl', {
                    $scope: $rootScope.$new()
                });

                ctrl.selectedTab = selectedTab;

                // Act:
                const resultTab = ctrl.isTabSelected(isTabToTestSelected);

                // Assert:
                expect(resultTab).toEqual(expectedResult);
            });
        };

        // Arrange:
        const tabs = [
            {
                selectedTab: 'status',
                isTabToTestSelected: 'status',
                expectedResult: true
            },
            {
                selectedTab: 'enroll',
                isTabToTestSelected: 'status',
                expectedResult: false
            },
        ]

        tabs.forEach(tab => {
            runBasicTabSelectedTests(tab);
        })
    })

    describe('setTab', () => {
        const runBasicSetTabTests = (selectedTab, fn) => {
            it(`${fn} called when ${selectedTab} tab selected`, () => {
                // Arrange:
                const ctrl = $controller('SuperNodeProgramCtrl', {
                    $scope: $rootScope.$new()
                });

                spyOn(ctrl, fn);

                // Act:
                ctrl.setTab(selectedTab);

                // Assert:
                expect(ctrl.selectedTab).toEqual(selectedTab);
                expect(ctrl[fn]).toHaveBeenCalled();
            })

        }

        // Arrange:
        const tabs = [
            {
                selectedTab: 'status',
                fn: 'selectStatusTab'
            },
            {
                selectedTab: 'enroll',
                fn: 'selectEnrollTab'
            },
            {
                selectedTab: 'payout',
                fn: 'selectPayoutHistory'
            }
        ]

        tabs.forEach(tab => {
            runBasicSetTabTests(tab.selectedTab, tab.fn);
        })
    })

    describe('resetTab', () => {
        it('returns to status tab as default', () => {
            // Arrange:
            const ctrl = $controller('SuperNodeProgramCtrl', {
                $scope: $rootScope.$new()
            });

            spyOn(ctrl, 'setTab');

            // Act:
            ctrl.resetTab();

            // Assert:
            expect(ctrl.selectedTab).toEqual('status');
            expect(ctrl.setTab).toHaveBeenCalled();
        })
    })

    describe('onChangeAccount', () => {
        it('returns selected account info', () => {
            // Arrange:
            const ctrl = $controller('SuperNodeProgramCtrl', {
                $scope: $rootScope.$new()
            });

            spyOn(ctrl, 'setSelectedAccountInfo');

            spyOn(ctrl, 'resetTab');

            // Act:
            ctrl.onChangeAccount();

            // Assert:
            expect(ctrl.setSelectedAccountInfo).toHaveBeenCalled();
            expect(ctrl.resetTab).toHaveBeenCalled();
        })
    })

    describe('prepareTransaction', () => {
        it('returns normal account transaction object', () => {
            // Arrange:
            const ctrl = $controller('SuperNodeProgramCtrl', {
                $scope: $rootScope.$new()
            });

            ctrl.formData.enrollAddress = 'NC2YRCZB25RHND45HMX7YAZPHYMBKT5VQYMNAOCO';

            // Act:
            ctrl.prepareTransaction();

            // Assert:
            expect(ctrl.preparedTransaction.type).toEqual(nem.model.transactionTypes.transfer);
            expect(ctrl.preparedTransaction.recipient).toEqual(ctrl.formData.enrollAddress);
            expect(ctrl.preparedTransaction.fee).toEqual(200000);
            expect(ctrl.preparedTransaction.amount).toEqual(0);
            expect(ctrl.preparedTransaction.mosaics).toEqual(null);
            expect(ctrl.preparedTransaction.message.payload).toEqual(nem.utils.convert.utf8ToHex(`enroll ${ctrl.formData.nodeHost} ${'0'.repeat(64)}`));
        })

        it('returns multisig account transaction object', () => {
            // Arrange:
            DataStore.account.metaData = AccountDataFixture.mainnetCosignerAccountData;

            const ctrl = $controller('SuperNodeProgramCtrl', {
                $scope: $rootScope.$new()
            });

            ctrl.formData.enrollAddress = 'NC2YRCZB25RHND45HMX7YAZPHYMBKT5VQYMNAOCO';

            // Act:
            ctrl.prepareTransaction();

            // Assert:
            expect(ctrl.preparedTransaction.type).toEqual(nem.model.transactionTypes.multisigTransaction);
            expect(ctrl.preparedTransaction.fee).toEqual(150000);

            expect(ctrl.preparedTransaction.otherTrans.recipient).toEqual(ctrl.formData.enrollAddress);
            expect(ctrl.preparedTransaction.otherTrans.fee).toEqual(200000);
            expect(ctrl.preparedTransaction.otherTrans.amount).toEqual(0);
            expect(ctrl.preparedTransaction.otherTrans.mosaics).toEqual(null);
            expect(ctrl.preparedTransaction.otherTrans.message.payload).toEqual(nem.utils.convert.utf8ToHex(`enroll ${ctrl.formData.nodeHost} ${'0'.repeat(64)}`));
        })

        it('returns transaction object provided codewordHash for message payload', () => {
            // Arrange:
            const ctrl = $controller('SuperNodeProgramCtrl', {
                $scope: $rootScope.$new()
            });

            // Act:
            ctrl.prepareTransaction('hash');

            // Assert:
            expect(ctrl.preparedTransaction.message.payload).toEqual(nem.utils.convert.utf8ToHex(`enroll ${ctrl.formData.nodeHost} hash`));
        })
    })

    describe('selectStatusTab', () => {
        const expectedEnrollStatusWithoutResponse = {
            nodeName: '-',
            status: false,
            endpoint: '-',
            publicKey: '-',
            remotePublicKey: '-',
            totalReward: '-',
            lastPayoutRound: '-',
        };

        const expectedEnrollStatusWithResponse = {
            nodeName: mockEnrollStatus.name,
            status: mockEnrollStatus.status,
            endpoint: 'superlong.domain.name',
            publicKey: mockEnrollStatus.mainPublicKey,
            remotePublicKey: mockEnrollStatus.remotePublicKey,
            totalReward: '12.000000',
            nodeId: mockEnrollStatus.id,
            lastPayoutRound: mockEnrollStatus.lastPayoutRound,
        };

        it('returns default enroll status when public key does not exist', async (done) => {
            // Arrange:
            const ctrl = $controller('SuperNodeProgramCtrl', {
                $scope: $rootScope.$new()
            });

            ctrl.formData.mainPublicKey = '';

            // Act:
            await ctrl.selectStatusTab();
            $timeout.flush();

            // Assert:
            expect(ctrl.enrollStatus).toEqual(expectedEnrollStatusWithoutResponse);
            done();
        })

        it('returns default enroll status when super node service throws error', async (done) => {
            // Arrange:
            spyOn(SuperNodeProgram, 'getNodeInfo').and.returnValue(Promise.reject('error'));

            const ctrl = $controller('SuperNodeProgramCtrl', {
                $scope: $rootScope.$new()
            });

            // Act:
            await ctrl.selectStatusTab();
            $timeout.flush();

            // Assert:
            expect(ctrl.enrollStatus).toEqual(expectedEnrollStatusWithoutResponse);
            done();
        })

        it('returns enroll status when accounts enrolled', async (done) => {
            // Arrange:
            spyOn(SuperNodeProgram, 'getNodeInfo').and.returnValue(Promise.resolve(mockEnrollStatus));

            const ctrl = $controller('SuperNodeProgramCtrl', {
                $scope: $rootScope.$new()
            });

            // Act:
            await ctrl.selectStatusTab();
            $timeout.flush();

            // Assert:
            expect(ctrl.enrollStatus).toEqual(expectedEnrollStatusWithResponse);
            done();
        })

        it('returns enroll status when no payouts have been completed', async (done) => {
            // Arrange:
            spyOn(SuperNodeProgram, 'getNodeInfo').and.returnValue(Promise.resolve({
                ...mockEnrollStatus,
                lastPayoutRound: -1
            }));

            const ctrl = $controller('SuperNodeProgramCtrl', {
                $scope: $rootScope.$new()
            });

            // Act:
            await ctrl.selectStatusTab();
            $timeout.flush();

            // Assert:
            expect(ctrl.enrollStatus).toEqual({
                ...expectedEnrollStatusWithResponse,
                lastPayoutRound: '-'
            });
            done();
        })
    })

    describe('sendEnroll', () => {
        it('returns alert when account enrolled and new domain name same as previously registered', async (done) => {
            // Arrange:
            spyOn(Wallet, 'decrypt').and.returnValue(true);

            spyOn(SuperNodeProgram, 'checkEnrollmentStatus').and.returnValue(Promise.resolve(true));
            spyOn(SuperNodeProgram, 'checkEnrollmentAddress').and.returnValue(Promise.resolve(true));
            spyOn(SuperNodeProgram, 'getCodewordHash').and.returnValue(Promise.resolve('40DA0977BE27B03B61FBE461225007E1528FD87F20A92BF8E031CDA59C4592E1'));

            spyOn(Alert, 'addressEnrolled');

            const ctrl = $controller('SuperNodeProgramCtrl', {
                $scope: $rootScope.$new()
            });

            spyOn(ctrl, 'prepareTransaction');

            ctrl.enrollStatus.endpoint = 'old.domain.name';

            ctrl.formData.nodeHost = 'old.domain.name';

            // Act:
            await ctrl.sendEnroll();

            $timeout.flush();

            // Assert:
            expect(Alert.addressEnrolled).toHaveBeenCalled();
            expect(ctrl.prepareTransaction).not.toHaveBeenCalled();
            done();
        })

        it('returns alert when enrollment address incorrect', async (done) => {
            // Arrange:
            spyOn(Wallet, 'decrypt').and.returnValue(true);

            spyOn(SuperNodeProgram, 'checkEnrollmentStatus').and.returnValue(Promise.resolve(true));
            spyOn(SuperNodeProgram, 'checkEnrollmentAddress').and.returnValue(Promise.resolve(false));
            spyOn(SuperNodeProgram, 'getCodewordHash').and.returnValue(Promise.resolve('40DA0977BE27B03B61FBE461225007E1528FD87F20A92BF8E031CDA59C4592E1'));

            spyOn(Alert, 'invalidEnrollmentAddress');

            const ctrl = $controller('SuperNodeProgramCtrl', {
                $scope: $rootScope.$new()
            });

            spyOn(ctrl, 'prepareTransaction');

            // Act:
            await ctrl.sendEnroll();

            $timeout.flush();

            // Assert:
            expect(Alert.invalidEnrollmentAddress).toHaveBeenCalled();
            expect(ctrl.okPressed).toEqual(false);
            expect(ctrl.prepareTransaction).not.toHaveBeenCalled();
            done();
        });

        it('returns alert when codeword hash is empty', async (done) => {
            // Arrange:
            spyOn(Wallet, 'decrypt').and.returnValue(true);

            spyOn(SuperNodeProgram, 'checkEnrollmentStatus').and.returnValue(Promise.resolve(false));
            spyOn(SuperNodeProgram, 'checkEnrollmentAddress').and.returnValue(Promise.resolve(true));
            spyOn(SuperNodeProgram, 'getCodewordHash').and.returnValue(Promise.resolve('0'));

            spyOn(Alert, 'invalidCodewordHash');

            const ctrl = $controller('SuperNodeProgramCtrl', {
                $scope: $rootScope.$new()
            });

            spyOn(ctrl, 'prepareTransaction');

            // Act:
            await ctrl.sendEnroll();

            $timeout.flush();

            // Assert:
            expect(Alert.invalidCodewordHash).toHaveBeenCalled();
            expect(ctrl.okPressed).toEqual(false);
            expect(ctrl.prepareTransaction).not.toHaveBeenCalled();
            done();
        });

        it('returns alert when main public key is not exist (hardware wallet)', async (done) => {
            // Arrange:
            spyOn(Wallet, 'decrypt').and.returnValue(true);

            spyOn(Alert, 'accountHasNoPublicKey');

            const ctrl = $controller('SuperNodeProgramCtrl', {
                $scope: $rootScope.$new()
            });

            spyOn(ctrl, 'prepareTransaction');

            ctrl.formData.mainPublicKey = '';

            ctrl.common = {
                password: '',
                privateKey: '',
                isHW: true
            }

            // Act:
            await ctrl.sendEnroll();

            // Assert:
            expect(Alert.accountHasNoPublicKey).toHaveBeenCalled();
            expect(ctrl.okPressed).toEqual(false);
            expect(ctrl.prepareTransaction).not.toHaveBeenCalled();
            done();
        })

        it('returns alert when form data node host content protocol or port', async (done) => {
            // Arrange:
            spyOn(Wallet, 'decrypt').and.returnValue(true);

            spyOn(Alert, 'invalidFormatNodeHost');

            const ctrl = $controller('SuperNodeProgramCtrl', {
                $scope: $rootScope.$new()
            });

            spyOn(ctrl, 'prepareTransaction');

            ctrl.formData.nodeHost = 'http://old.domain.name:7890';

            // Act:
            await ctrl.sendEnroll();

            // Assert:
            expect(Alert.invalidFormatNodeHost).toHaveBeenCalled();
            expect(ctrl.okPressed).toEqual(false);
            expect(ctrl.prepareTransaction).not.toHaveBeenCalled();
            done();
        })

        it('returns transaction object and announce transaction', async (done) => {
            // Arrange:
            spyOn(Wallet, 'decrypt').and.returnValue(true);
            spyOn(Wallet, 'transact');

            spyOn(SuperNodeProgram, 'checkEnrollmentStatus').and.returnValue(Promise.resolve(false));
            spyOn(SuperNodeProgram, 'checkEnrollmentAddress').and.returnValue(Promise.resolve(true));
            spyOn(SuperNodeProgram, 'getCodewordHash').and.returnValue(Promise.resolve('40DA0977BE27B03B61FBE461225007E1528FD87F20A92BF8E031CDA59C4592E1'));

            const ctrl = $controller('SuperNodeProgramCtrl', {
                $scope: $rootScope.$new()
            });

            spyOn(ctrl, 'prepareTransaction');

            ctrl.formData.mainPublicKey = '';

            ctrl.common = {
                password: '',
                privateKey: '3c11dc7bc6d8cda5c75b041975362d87eb7de5aef1316f432a1bbfe3e9f19ffb',
                isHW: false
            }

            // Act:
            await ctrl.sendEnroll();

            $timeout.flush();

            // Assert:
            expect(Wallet.transact).toHaveBeenCalled();
            expect(ctrl.formData.mainPublicKey).toEqual('b6405c6d3e96228e8a57c7c84013600486dfd64a7bf14ed7c1daccfbd391f386');
            expect(ctrl.prepareTransaction).toHaveBeenCalled();
            expect(ctrl.okPressed).toEqual(false);
            done();
        });

        it('successful announce transaction when enrolled account update domain', async (done) => {
            // Arrange:
            spyOn(Wallet, 'decrypt').and.returnValue(true);
            spyOn(Wallet, 'transact');

            spyOn(SuperNodeProgram, 'checkEnrollmentStatus').and.returnValue(Promise.resolve(true));
            spyOn(SuperNodeProgram, 'checkEnrollmentAddress').and.returnValue(Promise.resolve(true));
            spyOn(SuperNodeProgram, 'getCodewordHash').and.returnValue(Promise.resolve('40DA0977BE27B03B61FBE461225007E1528FD87F20A92BF8E031CDA59C4592E1'));

            const ctrl = $controller('SuperNodeProgramCtrl', {
                $scope: $rootScope.$new()
            });

            spyOn(ctrl, 'prepareTransaction');

            ctrl.formData.mainPublicKey = '';

            ctrl.common = {
                password: '',
                privateKey: '3c11dc7bc6d8cda5c75b041975362d87eb7de5aef1316f432a1bbfe3e9f19ffb',
                isHW: false
            }

            ctrl.enrollStatus.endpoint = 'old.domain.name';

            ctrl.formData.nodeHost = 'new.domain.name';

            // Act:
            await ctrl.sendEnroll();

            $timeout.flush();

            // Assert:
            expect(Wallet.transact).toHaveBeenCalled();
            expect(ctrl.formData.mainPublicKey).toEqual('b6405c6d3e96228e8a57c7c84013600486dfd64a7bf14ed7c1daccfbd391f386');
            expect(ctrl.prepareTransaction).toHaveBeenCalled();
            expect(ctrl.okPressed).toEqual(false);
            done();
        });
    })

    describe('selectEnrollTab', () => {
        it('set IP or domain to empty when no accounts have enrolled', async (done) => {
            // Arrange:
            spyOn(SuperNodeProgram, 'getNodeInfo').and.returnValue(Promise.reject('error'));

            const ctrl = $controller('SuperNodeProgramCtrl', {
                $scope: $rootScope.$new()
            });

            await ctrl.selectStatusTab();
            $timeout.flush();

            // Act:
            ctrl.selectEnrollTab();

            // Assert:
            expect(ctrl.formData.nodeHost).toEqual('');
            expect(ctrl.preparedTransaction.type).toEqual(nem.model.transactionTypes.transfer);
            expect(ctrl.preparedTransaction.fee).toEqual(200000);
            expect(ctrl.preparedTransaction.message.payload).toEqual(nem.utils.convert.utf8ToHex(`enroll ${ctrl.formData.nodeHost} ${'0'.repeat(64)}`));
            done();
        })

        it('set IP or domain to exist endpoint when accounts enrolled', async (done) => {
            // Arrange:
            spyOn(SuperNodeProgram, 'getNodeInfo').and.returnValue(Promise.resolve(mockEnrollStatus));

            const ctrl = $controller('SuperNodeProgramCtrl', {
                $scope: $rootScope.$new()
            });

            await ctrl.selectStatusTab();
            $timeout.flush();

            // Act:
            ctrl.selectEnrollTab();

            // Assert:
            expect(ctrl.formData.nodeHost).toEqual(new URL(mockEnrollStatus.endpoint).hostname);
            expect(ctrl.preparedTransaction.type).toEqual(nem.model.transactionTypes.transfer);
            expect(ctrl.preparedTransaction.fee).toEqual(200000);
            expect(ctrl.preparedTransaction.message.payload).toEqual(nem.utils.convert.utf8ToHex(`enroll ${ctrl.formData.nodeHost} ${'0'.repeat(64)}`));
            done()
        })
    })

    describe('selectPayoutHistory', () => {
        const runBasicPaginationTests = ({page, fn, expectedResult}) => {
            it(`returns ${page} page of payout history`, () => {
                // Arrange:
                const ctrl = $controller('SuperNodeProgramCtrl', {
                    $scope: $rootScope.$new()
                });

                spyOn(ctrl, 'selectPayoutHistory');

                ctrl.currentPage = 5;
                ctrl.lastPage = 10;

                // Act:
                ctrl[fn]();

                // Assert:
                expect(ctrl.currentPage).toEqual(expectedResult);
                expect(ctrl.selectPayoutHistory).toHaveBeenCalled();
            })
        }

        describe('pagination', () => {
            // Arrange:
            const page = [{
                page: 'first',
                fn: 'fetchFirst',
                expectedResult: 0
            },{
                page: 'last',
                fn: 'fetchLast',
                expectedResult: 10
            },{
                page: 'next',
                fn: 'fetchNext',
                expectedResult: 6
            },{
                page: 'previous',
                fn: 'fetchPrevious',
                expectedResult: 4
            }]

            page.forEach(pageInfo => {
                runBasicPaginationTests(pageInfo);
            })
        })

        it('returns empty array when node id is not exist', async (done) => {
            // Arrange:
            const ctrl = $controller('SuperNodeProgramCtrl', {
                $scope: $rootScope.$new()
            });

            // Act:
            await ctrl.selectPayoutHistory();
            $timeout.flush();

            // Assert:
            expect(ctrl.payoutHistory).toEqual([]);
            done();
        })

        it('returns empty array when super node services throws error', async (done) => {
            // Arrange:
            spyOn(SuperNodeProgram, 'getNodePayouts').and.returnValue(Promise.reject('error'));

            const ctrl = $controller('SuperNodeProgramCtrl', {
                $scope: $rootScope.$new()
            });

            // Act:
            await ctrl.selectPayoutHistory();
            $timeout.flush();

            // Assert:
            expect(ctrl.payoutHistory).toEqual([]);
            done();
        })

        it('returns payout history records', async (done) => {
            // Arrange:
            const mockPayouts = [{
                amount: 24000000,
                fromRoundId: 1267,
                isPaid: true,
                timestamp: "2022-06-30T23:22:48.135315+00:00",
                toRoundId: 1267,
                transactionHash: "442D3EC7E12202B3DD8C4A54660BE088235BFD4522A165A522BDC0D368434D94"
            },
            {
                amount: 24000000,
                fromRoundId: 1266,
                isPaid: true,
                timestamp: "2022-06-30T23:17:48.114989+00:00",
                toRoundId: 1266,
                transactionHash: "B5D55D9858479441C81F6A638F17C1E30692BE8771FC44BFF62A989E3048A77E"
            },
            {
                amount: 24000000,
                fromRoundId: 1265,
                isPaid: true,
                timestamp: "2022-06-30T23:07:48.093682+00:00",
                toRoundId: 1265,
                transactionHash: "4C5A91F8FE70A49506176634E30AF7436D42E8BB951CB2DE6E485175CC99781F"
            }];

            spyOn(SuperNodeProgram, 'getNodeInfo').and.returnValue(Promise.resolve(mockEnrollStatus));
            spyOn(SuperNodeProgram, 'getNodePayouts').and.returnValue(Promise.resolve(mockPayouts));

            const ctrl = $controller('SuperNodeProgramCtrl', {
                $scope: $rootScope.$new()
            });

            await ctrl.selectStatusTab();
            $timeout.flush();

            // Act:
            await ctrl.selectPayoutHistory();
            $timeout.flush();

            // Assert:
            ctrl.payoutHistory.forEach((payout, index) => {
                expect(payout).toEqual({
                    ...mockPayouts[index],
                    amount: ctrl.computeXEMBalance(mockPayouts[index].amount),
                    timestamp: new Date(mockPayouts[index].timestamp).toGMTString(),
                });
                done();
            })
        })
    })
})