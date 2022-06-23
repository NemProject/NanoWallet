/**
 * Tests promise to throw given error.
 *
 * @param {Promise} promiseToTest - Promise to be tested.
 * @param {any} expectedError - Error to be thrown.
 */
export const runPromiseErrorTest = async (promiseToTest, expectedError) => {
    // Arrange:
    let thrownError;

    // Act:
    try {
        await promiseToTest;
    }
    catch (error) {
        thrownError = error;
    }

    // Assert:
    expect(thrownError instanceof expectedError.constructor).toBe(true);
    expect(thrownError.message).toBe(expectedError.message);
};
