const updateConsumptionTest = require("./consumption.js");
test("Check sanity of consumption values", () => {
    var testValue = 0;
    for (var i = 0; i < 100; i++) {
        var data = parseFloat(updateConsumptionTest())
        testValue += data;
    }
    testValue = testValue / 100
    expect(testValue).toBeLessThanOrEqual(14);
    expect(testValue).toBeGreaterThanOrEqual(8);
});

test("Check change of consumption values", async () => {
    var data1 = parseFloat(updateConsumptionTest())
    var data2 = parseFloat(updateConsumptionTest())
    expect(data2).not.toBe(data1);
});

jest.setTimeout(10000)