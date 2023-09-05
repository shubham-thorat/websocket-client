const WebSocket = require('ws')
const statsdclient = require('./statsD')
require('dotenv').config()

const startTime = Date.now()

let timemap = {

}

let diffmap = {

}

const ws = new WebSocket('ws://cb-stage-ws-alb-454351763.ap-south-1.elb.amazonaws.com:8080', {
  perMessageDeflate: false
});


ws.on('error', (args) => {
  console.log('Error occurred', JSON.stringify(args))
});

ws.on('open', function open() {
  const endTime = Date.now()
  console.log(`Websocket connection time ${endTime - startTime}ms `)
  const total_request = process.env.TOTAL || 10000
  for (let i = 0; i < total_request; i++) {
    statsdclient.timing('request_send', 1)
    setTimeout(() => {
      timemap[i] = Date.now()
      ws.send(JSON.stringify({
        key: 'key',
        value: 'value',
        requestcount: i
      }))
    }, i * 1000);
  }
});

ws.on('message', function message(data) {
  statsdclient.timing('response_received', 1)
  // console.log(data)
  const endTime = Date.now()
  const bufferData = Buffer.from(data)
  let sdata = JSON.parse(bufferData.toString('utf8'))



  const requiredtime = endTime - timemap[sdata?.requestcount]
  diffmap[sdata?.requestcount] = requiredtime
  statsdclient.timing('response_time', requiredtime)
  console.log('response received', sdata.requestcount, " requiredtime: ", requiredtime)
});

ws.on('close', function close() {
  console.log('disconnected');
  console.log("DIFF MAP : ", JSON.stringify(diffmap))
});