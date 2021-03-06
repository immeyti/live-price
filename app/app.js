const Binance = require('binance-api-node').default;
const redis = require("redis");
const redisClient = redis.createClient();
const _ = require('lodash');
const EventEmitter = require('events');
class MyEmitter extends EventEmitter {}
const myEmitter = new MyEmitter();

var USDTIRRPrice = 170000;
var BTCUSDTPrice;
var ETHUSDTPrice;

myEmitter.on('updateConstPrice', (currency, price) => {
    if (currency == 'BTCUSDT') BTCUSDTPrice = price;
    if (currency == 'ETHUSDT') ETHUSDTPrice = price;
})

var client = Binance();
client.dailyStats()
    .then(allCurrency => {
        _.forEach(allCurrency, currency => {
            //save to redis with orginal symbol
            redisClient.set(currency.symbol, JSON.stringify(currency));

            if (currency.symbol === 'BTCUSDT' || currency.symbol === 'ETHUSDT') {
                myEmitter.emit('updateConstPrice', currency.symbol, currency.lastPrice);
            }
        });

        redisClient.keys('*', (err, keys) => {
            if (err) throw err;

            redisClient.mget(keys, (err, res) => {
                _.forEach(res, value => {
                    currency = JSON.parse(value);

                    //can make rial market or not?
                    if (isUSDTMarket(currency) || isBTCMarket(currency) || isETHMarket(currency)) {
                        //make rial market
                        var rialMarket = _.clone(currency);
                        rialMarket.symbol = makeRialSymbol(currency.symbol);
                        rialMarket.lastPrice = convertToRial(currency, 'lastPrice')           
        
                        //save to redis with rial symbol
                        redisClient.set(rialMarket.symbol, JSON.stringify(rialMarket));
                    }
                    
                });
            })
        })
    });

client.ws.allTickers(tickers => {
    _.forEach(tickers, ticker => { 
        redisClient.get(ticker.symbol, (err, res) => {

            if (ticker.symbol === 'BTCUSDT' || ticker.symbol === 'ETHUSDT') {
                myEmitter.emit('updateConstPrice', ticker.symbol, ticker.lastPrice);
            }

            oldObj = JSON.parse(res);
            oldObj.lastPrice = ticker.curDayClose;
            oldObj.priceChange = ticker.priceChange;
            oldObj.priceChangePercent = ticker.priceChangePercent;
            redisClient.set(oldObj.symbol, JSON.stringify(oldObj));

            if (isUSDTMarket(ticker) || isBTCMarket(ticker) || isETHMarket(ticker)) {
                //make rial market
                var rialMarket = _.clone(ticker);
                rialMarket.symbol = makeRialSymbol(ticker.symbol);
                rialMarket.lastPrice = convertToRial(ticker, 'curDayClose');
                rialMarket.priceChange = convertToRial(ticker, 'priceChange');           

                //save to redis with rial symbol
                redisClient.set(rialMarket.symbol, JSON.stringify(rialMarket));
            }
        });
    })

    // redisClient.get('EOSUSDT', (err, res) => {
    //     console.log(JSON.parse(res).lastPrice)
    // })
})



function convertToRial(obj, key) {
    price = 0;

    if(isUSDTMarket(obj)) {
        price = obj[key] * USDTIRRPrice;
    }

    if(isBTCMarket(obj)) {
        price = (obj[key] * BTCUSDTPrice) * USDTIRRPrice;
    }

    if(isETHMarket(obj)) {
        price = (obj[key] * ETHUSDTPrice) * USDTIRRPrice;
    }

    return price;
}

function isUSDTMarket(market){
    symbol = getSymbol(market);
    return _.endsWith(symbol, 'USDT');
}

function isBTCMarket(market){
    symbol = getSymbol(market);
    return _.endsWith(symbol, 'BTC');
}

function isETHMarket(market){
    symbol = getSymbol(market);
    return _.endsWith(symbol, 'ETH');
}

function getSymbol(market) {
    symbol = '';
    if (typeof market === 'string') {
        symbol = market;
    } else {
        symbol = market.symbol;
    }

    return symbol;
}

function makeRialSymbol(symbol) {
    if (isUSDTMarket(symbol)) {
        pattern = 'USDT'
    }else if (isBTCMarket(symbol)) {
        pattern = 'BTC'
    }else if (isETHMarket(symbol)) {
        pattern = 'ETH'
    }

    return _.replace(symbol, pattern, 'IRR')
}