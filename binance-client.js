const WebSocket = require('ws'),
    ws = new WebSocket('wss://testnet-dex.binance.org/api/ws/$all@allTickers'),
    redis = require("redis"),
    client = redis.createClient();
    fs = require('fs');



function getBinanceData() {
    let response = null;

    ws.on('message', function (data) {

        console.log(data);
        response = data;

        fs.writeFileSync('data.json', data)

        // data = JSON.parse(data);


        // client.set('btc-price', data.c);
        // client.set('btc-best-price', data.b);
        
        // client.get('btc-price', function (err, res) {
        //     if (err) { 
        //         client.quit();
        //         throw err;
        //     }

        //     response = res;
        // })
    });
    return response;
}

exports = getBinanceData();