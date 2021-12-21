$(document).ready(function () {
    updateBuffer()
    updateModelledPrice()
    updatePrice()
    updatePower()
    updateStatus()
    updateImg()
});

/*  <% for(var i=0; i<users.length; i++) {%>
    <tr>
        <th scrope="row">
            <%= i %>
        </th>
        <td>
            <%= users[i].username %>
        </td>
        <td>
            <%= users[i].role %>
        </td>
        <td>
            <%= users[i].status %>
        </td>
        <td></td>
        <td></td>
        <td id=<%=i %>>
        </td>
        <td>
            <form method="POST">
                <input type="hidden" name="username" value=<%=users[i].username %>>
                <input type="submit" value="Block">
            </form>
        </td>
        <td>
            <form method="POST">
                <input type="hidden" name="username" value=<%=users[i].username %>>
                <input type="submit" value="Update">
            </form>
        </td>
        <td>
            <form method="POST">
                <input type="hidden" name="username" value=<%=users[i].username %>>
                <input type="submit" value="Delete" formaction="/delete">
            </form>
        </td>
    </tr>
    <% } %>  */

async function updateBuffer() {
    $.ajax({
        type: 'GET',
        url: '/getUsers',
        success: (users) => {
            $("#users").empty()
            for (var i = 0; i < users.length; i++) {
                var trStart = $("<tr>")
                var th = $("<th></th>").text(i)
                var tdUserName = $("<td></td>").text(users[i].username)
                var tdRole = $("<td></td>").text(users[i].role)
                var tdStatus = $("<td></td>").text(users[i].status)
                var tdConsumption = $("<td></td>").text("")
                var tdProduction = $("<td></td>").text("")
                var tdBuffer = $("<td></td>").text(users[i].buffer)
                var tdBlock = $('<td>')
                var tdBlock1 = $(' <form method="POST">')
                var tdBlock2 = $('<input  type="hidden" name="username" value="">').attr('value', users[i].username)
                var tdBlock3 = $('<input type="submit" value="Block">')
                var tdBlock4 = $('</form></td>')
                $(tdBlock).append(tdBlock1, tdBlock2, tdBlock3, tdBlock4)

                var tdUpdate = $('<td>')
                var tdUpdate1 = $(' <form method="POST">')
                var tdUpdate2 = $('<input  type="hidden" name="username" value="">').attr('value', users[i].username)
                var tdUpdate3 = $('<input type="submit" value="Update">')
                var tdUpdate4 = $('</form></td>')
                $(tdUpdate).append(tdUpdate1, tdUpdate2, tdUpdate3, tdUpdate4)

                var tdDelete = $('<td>')
                var tdDelete1 = $(' <form method="POST">')
                var tdDelete2 = $('<input  type="hidden" name="username" value="">').attr('value', users[i].username)
                var tdDelete3 = $('<input type="submit" value="Delete">')
                var tdDelete4 = $('</form></td>')
                $(tdDelete).append(tdDelete1, tdDelete2, tdDelete3, tdDelete4)

                var trEnd = $("</tr>")
                $("#users").append(trStart, th, tdUserName, tdRole, tdStatus, tdConsumption, tdProduction, tdBuffer, tdBlock, tdUpdate, tdDelete, trEnd)
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
async function updateImg() {
    $.ajax({
        type: 'GET',
        url: '/getImg',
        success: (data) => {
            console.log("data: " + data)
            //updateData(data);
            $("#img").attr('src', data);
        }
    })
}