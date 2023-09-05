const WebSocket = require('ws')
const statsdclient = require('./statsD')
const sleep = require('sleep')
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
    timemap[i] = Date.now()
    statsdclient.timing('request_send', 1)
    ws.send(JSON.stringify({
      key: 'key',
      value: 'value',
      requestcount: i
    }))
    sleep.sleep(1)
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
  console.log('response received', sdata.requestcount)
});

ws.on('close', function close() {
  console.log('disconnected');
  console.log("DIFF MAP : ", JSON.stringify(diffmap))
});