var random = require('geojson-random')
var fs = require('fs')

var geo = random.polygon(1000, 4, 1)

fs.writeFileSync('data.geojson', JSON.stringify(geo))
