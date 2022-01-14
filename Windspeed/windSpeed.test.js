const getWindSpeed = require("./windSpeed.js");
test("Check sanity of wind speed values", () => {
    for(var i = 0; i < 100; i++) {
        var data = parseFloat(getWindSpeed())
        expect(data).toBeLessThanOrEqual(10);
        expect(data).toBeGreaterThanOrEqual(0);
    }
});

test("Check change of wind speed values", async () => {
    var data1 = parseFloat(getWindSpeed())
    await new Promise(resolve => setTimeout(resolve, 5000));
    var data2 = parseFloat(getWindSpeed())
    expect(data2).not.toBe(data1);
});

jest.setTimeout(10000)