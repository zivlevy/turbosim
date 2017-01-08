var lineReader = require('readline').createInterface({
  input: require('fs').createReadStream('airports.txt')
});
var fs = require('fs');
var logger = fs.createWriteStream('airports.json', {
  flags: 'a' // 'a' means appending (old data will be preserved)
})

logger.write('[');

lineReader.on('line', function (line) {
  var a = line.split(',');
  var jsonline = {"name": a[1],
    "name": a[1],
    "city": a[2],
    "country": a[3],
    "symbol": a[4],
    "ICAO": a[5],
    "latitude": a[6],
    "longitude": a[7],
    "altitude": a[8]
  };
  logger.write(JSON.stringify(jsonline));
  logger.write(',');
  console.log(JSON.stringify(jsonline));

});
