/**
 * Tests promise to throw given error.
 *
 * @param {Promise} promiseToTest - Promise to be tested.
 * @param {any} expectedError - Error to be thrown.
 */
export const runPromiseErrorTest = async (promiseToTest, expectedError) => {
    // Act:
    try {
        await promiseToTest;
    }
    catch (error) {
        // Assert:
        expect(error instanceof expectedError.constructor).toBe(true);
        expect(error.message).toBe(expectedError.message);
    }
};
