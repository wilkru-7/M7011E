const getWindSpeed = require("./windSpeed.js");
test("Check sanity of wind speed values", () => {
    for(var i = 0; i < 100; i++) {
        var data = parseFloat(getWindSpeed())
        expect(data).toBeLessThanOrEqual(10);
        expect(data).toBeGreaterThanOrEqual(0);
    }
});