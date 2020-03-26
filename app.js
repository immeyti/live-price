const Binance = require('binance-api-node').default;
const redis = require("redis");
const redisClient = redis.createClient();
const _ = require('lodash');


var client = Binance();
client.dailyStats()
    .then(allCurrency => {
        redisClient.set('allCurrency', JSON.stringify(allCurrency));
    });