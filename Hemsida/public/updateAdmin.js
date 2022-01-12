$(document).ready(function () {
    setStatus()
    setRatio()
    setPrice()
    updateUsers()
    updateBuffer()
    updateModelledPrice()
    updatePrice()
    updatePower()
    updateStatus()
    updateImg()
    updateMarketDemand()
});

async function setStatus() {
    $.ajax({
        type: 'GET',
        url: '/getStatus',
        success: (status) => {
            if (status) {
                $("#switch").prop("checked", true);
            } else {
                $("#switch").prop("checked", false);
            }
        }
    })
}
async function setRatio() {
    $.ajax({
        type: 'GET',
        url: '/getRatio',
        success: (result) => {
            $("#ratio").attr("value", parseFloat(result) * 100);
            $("#ratio2").text(parseFloat(result) * 100);
        }
    })
}
async function setPrice() {
    $.ajax({
        type: 'GET',
        url: '/getPrice',
        success: (result) => {
            $("#setPrice").attr("value", parseFloat(result));
            $("#setPrice2").text(parseFloat(result));
        }
    })
}

async function updateUsers() {
    var marketDemand = 0;
    $.ajax({
        type: 'GET',
        url: '/getUsers',
        success: (users) => {
            $("#users").empty()
            for (var i = 0; i < users.length; i++) {
                if (users[i].role == "prosumer") {
                    var trStart = $("<tr>")

                    var tdUserName = $("<td></td>").text(users[i].username)
                    var tdRole = $("<td></td>").text(users[i].role)
                    var tdStatus = $("<td></td>").text(users[i].status)
                    var tdConsumption = $("<td></td>").text(users[i].consumption)
                    var tdProduction = $("<td></td>").text(users[i].production)
                    var tdBuffer = $("<td></td>").text(users[i].buffer)

                    /* Block Button */
                    var tdBlock = '<td>'
                    var tdBlock1 = '<form method="POST">'
                    var tdBlock2 = '<input type="hidden" name="username" value="' + users[i].username + '">'
                    var tdBlock3 = '<input class="mx-auto btn btn-primary active" type="submit" value="Block" formaction="/block">'
                    var tdBlock4 = '</form></td>'
                    var tdBlock = tdBlock.concat(tdBlock1, tdBlock2, tdBlock3, tdBlock4)

                    /* Update Button */
                    var tdUpdate = '<td>'
                    var tdUpdate1 = ' <form class="" method="POST">'
                    var tdUpdate2 = '<input type="hidden" name="username" value="' + users[i].username + '">'
                    var tdUpdate3 = '<input class="mx-auto btn btn-primary active" type="submit" value="Update" formaction="/updateCredentials" >'
                    var tdUpdate4 = '</form></td>'
                    tdUpdate = tdUpdate.concat(tdUpdate1, tdUpdate2, tdUpdate3, tdUpdate4)

                    /* Delete Button */
                    var tdDelete = '<td>'
                    var tdDelete1 = ' <form method="POST">'
                    var tdDelete2 = '<input  type="hidden" name="username" value="' + users[i].username + '">'
                    var tdDelete3 = '<input class="mx-auto btn btn-primary active" type="submit" value="Delete" formaction="/delete">'
                    var tdDelete4 = '</form></td>'
                    tdDelete = tdDelete.concat(tdDelete1, tdDelete2, tdDelete3, tdDelete4)

                    var trEnd = $("</tr>")
                    $("#users").append(trStart, tdUserName, tdRole, tdStatus, tdConsumption, tdProduction, tdBuffer, tdBlock, tdUpdate, tdDelete, trEnd)
                }
            }
        }
    }).then(function () {
        setTimeout(updateUsers, 1000) //call itself every 1000ms
    });
}

async function updateBuffer() {
    $.ajax({
        type: 'GET',
        url: '/getBufferManager',
        success: (buffer) => {
            $("#buffer").text(buffer)
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

async function updateImg() {
    $.ajax({
        type: 'GET',
        url: '/getImg',
        success: (data) => {
            $("#img").attr('src', data);
        }
    });
}

async function updateMarketDemand() {
    $.ajax({
        type: 'GET',
        url: '/getMarketDemand',
        success: (data) => {
            $("#marketDemand").text(data)
        }
    }).then(function () {
        setTimeout(updateMarketDemand, 1000) //call itself every 1000ms
    });
}