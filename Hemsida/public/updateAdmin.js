$(document).ready(function () {
    updateBuffer()
    updatePrice()
    updatePower()
});
async function updateBuffer() {
    $.ajax({
        type: 'GET',
        url: '/getUsers',
        success: (users) => {
            for (var i = 0; i < users.length; i++) {
                $("#" + i).text(users[i].buffer);
            }

        }
    }).then(function () {
        setTimeout(updateBuffer, 1000) //call itself every 1000ms
    });
}

async function updatePrice() {
    $.ajax({
        type: 'GET',
        url: '/getPrice',
        success: (price) => {
            $("#price").text(price)
        }
    }).then(function () {
        setTimeout(updatePrice, 1000) //call itself every 1000ms
    });
}

async function updatePower() {
    $.ajax({
        type: 'GET',
        url: '/getPowerplant',
        success: (power) => {
            console.log("power is: " + power)
            $("#power").text(power)
        }
    }).then(function () {
        setTimeout(updatePower, 1000) //call itself every 1000ms
    });
}