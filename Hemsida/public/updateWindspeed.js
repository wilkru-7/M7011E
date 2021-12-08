$( document ).ready(function() {
    updateWindspeed()
    updateModelledPrice()
    updateConsumption()
    updateProduction()
    updateNetProduction()
    updateBuffer()
});
/* {
    "Data":[
        "windSpeed": 12,
        "price": 12,
        "Consumption": 12
    ]
} */
/* async function updateData() {
    $.ajax({
       type: 'GET',
       url: '/getData',
       success :(data) => {
           //updateData(data);
           $("#wind").text(data);
           console.log("wind: " + data);
       }
    }).then(function () {
       setTimeout(updateData, 1000) //call itself every 1000ms
    });
} */
async function updateWindspeed() {
    $.ajax({
       type: 'GET',
       url: '/getWindspeed',
       success :(data) => {
           //updateData(data);
           $("#wind").text(data);
           console.log("wind: " + data);
       }
    }).then(function () {
       setTimeout(updateWindspeed, 1000) //call itself every 1000ms
    });
}
async function updateModelledPrice() {
    $.ajax({
       type: 'GET',
       url: '/getModelledPrice',
       success :(data) => {
           //updateData(data);
           $("#modelledPrice").text(data);
           console.log("price:" + data);
       }
    }).then(function () {
       setTimeout(updateModelledPrice, 1000) //call itself every 1000ms
    });
}

async function updateProduction() {
    $.ajax({
       type: 'GET',
       url: '/getProduction',
       success :(data) => {
           //updateData(data);
           $("#production").text(data);
           console.log("production: " + data);
       }
    }).then(function () {
       setTimeout(updateProduction, 1000) //call itself every 1000ms
    });
}

async function updateConsumption() {
    $.ajax({
       type: 'GET',
       url: '/getConsumption',
       success :(data) => {
           //updateData(data);
           $("#consumption").text(data);
           console.log("consumption: "+ data);
       }
    }).then(function () {
       setTimeout(updateConsumption, 1000) //call itself every 1000ms
    });
}

async function updateNetProduction() {
    $.ajax({
       type: 'GET',
       url: '/getNetProduction',
       success :(data) => {
           //updateData(data);
           $("#netProduction").text(data);
           console.log("netProduction: "+ data);
       }
    }).then(function () {
       setTimeout(updateNetProduction, 1000) //call itself every 1000ms
    });
}

async function updateBuffer() {
    $.ajax({
       type: 'GET',
       url: '/getBuffer',
       success :(data) => {
           //updateData(data);
           $("#buffer").text(data);
           console.log("buffer: "+ data);
       }
    }).then(function () {
       setTimeout(updateBuffer, 1000) //call itself every 1000ms
    });
}