const Binance = require('binance-api-node').default;
const redis = require("redis");
const redisClient = redis.createClient();
const _ = require('lodash');

const dollerPrice = 150000;


var client = Binance();
client.dailyStats()
    .then(allCurrency => {
        _.forEach(allCurrency, currency => {
            //save to redis with orginal symbol
            redisClient.set(currency.symbol, JSON.stringify(currency));
        });

        redisClient.keys('*', (err, keys) => {
            if (err) throw err;

            _.forEach(keys, key => {
                redisClient.get(key, (err, res) => {
                    if (err) throw err;
                    currency = JSON.parse(res);

                    if (isUSDTMarket(currency) || isBTCMarket(currency)) {
                        //make rial market
                        rialMarket = currency;
                        rialMarket.symbol = makeRialSymbol(currency.symbol);
                        //rialMarket.prevClosePriceRial = convertToRial(currency, 'prevClosePriceRial')
        
                        //save to redis with rial symbol
                        redisClient.set(rialMarket.symbol, JSON.stringify(currency));
                    }
                })
            })
        })
    });

//  client.ws.allTickers(tickers => {
//     _.forEach(tickers, ticker => {  
//         redisClient.get(ticker.symbol, (err, res) => {
//             oldObj = JSON.parse(res);
//             oldObj.prevClosePrice = ticker.curDayClose;
//             oldObj.prevClosePriceRial = convertToRial(ticker, 'curDayClose')
//             oldObj.priceChange = ticker.priceChange;
//             oldObj.priceChangePercent = ticker.priceChangePercent;
//             redisClient.set(oldObj.symbol, JSON.stringify(oldObj));

//             console.log(oldObj);
//         });
//     })

    // redisClient.get('ETHUSDT', (err, res) => {
    //     var cuurency = JSON.parse(res);
    //     console.log(cuurency.prevClosePrice);
    //     console.log(cuurency.prevClosePriceRial);
    //     console.log(cuurency.priceChange);
    //     console.log(cuurency.priceChangePercent);
    // });
//})

// function convertToRial(obj, key) {
//     symbol = obj.symbol;
//     price = 1300;

//     if(isUSDTMarket(obj)) {
//         price = obj[key] * dollerPrice;
//     }

//     if(isBTCMarket(obj)) {
//         redisClient.get('BNBBTC', (err, res) => {
//             obj = JSON.parse(res)
//             if (res) BNBBTC = res.prevClosePrice;


//         });
//     }

//     return price;
// }

function isUSDTMarket(market){
    if (typeof market === 'string') {
        symbol = market;
    }else{
        symbol = market.symbol;
    }

    return _.endsWith(symbol, 'USDT')
}

function isBTCMarket(market){
    if (typeof market === 'string') {
        symbol = market;
    }else{
        symbol = market.symbol;
    }

    return _.endsWith(symbol, 'BTC')
}

function makeRialSymbol(symbol) {
    if (isUSDTMarket(symbol)) {
        pattern = 'USDT'
    }else {
        pattern = 'BTC'
    }

    return _.replace(symbol, pattern, 'IRR')
}