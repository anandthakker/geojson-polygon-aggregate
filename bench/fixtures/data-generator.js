var random = require('geojson-random')
var fs = require('fs')
var path = require('path')

var geo = random.polygon(10000, 4, 1)

fs.writeFileSync(path.join(__dirname, 'data.geojson'), JSON.stringify(geo))
