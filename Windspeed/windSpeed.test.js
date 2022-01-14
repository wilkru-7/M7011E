const getWindSpeedTest = require("./windSpeed.js");
test("Check sanity of wind speed values", () => {
    var testValue = 0;
    for (var i = 0; i < 100; i++) {
        var data = parseFloat(getWindSpeedTest())
        testValue += data;
    }
    testValue = testValue / 100
    expect(testValue).toBeLessThanOrEqual(10);
    expect(testValue).toBeGreaterThanOrEqual(2);
});

test("Check change of wind speed values", async () => {
    var data1 = parseFloat(getWindSpeedTest())
    var data2 = parseFloat(getWindSpeedTest())
    expect(data2).not.toBe(data1);
});

jest.setTimeout(10000)