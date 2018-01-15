let kucoin = require('./app/client/kucoin');
async function run() {
  const pair = "VEN-BTC";
  var res = await kucoin.getTicker(pair);
  if (!res.success) {
    console.log("Failed on get ticker:", res);
    return;
  }
  var high = res.data.high;
  var unreasonableTarget = high * 10;
  console.log(pair + " high:", high, "-> creating sell order at", unreasonableTarget);

  res = await kucoin.createSellOrder(pair, unreasonableTarget, 1);
  if (!res.success) {
    console.log("Failed on create sell order:", res);
    return;
  }
  var orderID = res.data.orderOid;
  console.log("Created order", res.data);

  res = await kucoin.getSellOrderDetails(pair, orderID);
  if (!res.success) {
    console.log("Failed on get order details:", res);
    return;
  }
  console.log("Order details:", res.data);

  res = await kucoin.cancelSellOrder(pair, orderID);
  if (!res.success) {
    console.log("Failed on cancel order:", res);
    return;
  }
  console.log("Success!", res);
}

run();
