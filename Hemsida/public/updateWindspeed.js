$( document ).ready(function() {
    updateWindspeed()
    updatePrice()
    updateProduction()
    updateConsumption()
    updateConsumption()
});

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
async function updatePrice() {
    $.ajax({
       type: 'GET',
       url: '/getPrice',
       success :(data) => {
           //updateData(data);
           $("#price").text(data);
           console.log("price:" + data);
       }
    }).then(function () {
       setTimeout(updatePrice, 1000) //call itself every 1000ms
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