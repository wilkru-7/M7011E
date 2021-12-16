$(document).ready(function () {
    updateBuffer()
    updateModelledPrice()
    updatePrice()
    updatePower()
    updateStatus()
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

async function updateModelledPrice() {
    $.ajax({
        type: 'GET',
        url: '/getModelledPrice',
        success: (price) => {
            $("#modelledPrice").text(price)
        }
    }).then(function () {
        setTimeout(updateModelledPrice, 1000) //call itself every 1000ms
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

async function updateStatus() {
    $.ajax({
        type: 'GET',
        url: '/getStatus',
        success: (status) => {
            $("#status").text(status)
        }
    }).then(function () {
        setTimeout(updateStatus, 1000) //call itself every 1000ms
    });
}