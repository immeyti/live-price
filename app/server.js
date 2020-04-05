const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8380 })
const redis = require('redis');
const redisClient = redis.createClient();
const _ = require('lodash');
const EventEmitter = require('events');
class MyEmitter extends EventEmitter {}
const emitter = new MyEmitter();


wss.on('connection', (ws) => {
    emitter.on('data-updated', (data) => {
        ws.send(data);
    })
})


setInterval(function () {

    redisClient.keys('*', (err, keys) => {
        redisClient.mget(keys, (err, res) => {
            var data = [];
            _.forEach(res, value => {
                currency =  JSON.parse(value);
                
                data.push(currency);
            })
            
            console.log('server is runnign');
            emitter.emit('data-updated', JSON.stringify(data));
        });
    });

}, 1000);
