var fs = require('fs')
var path = require('path')
var aggregate = require('./index')
var reducers = require('./reducers')

var groups = JSON.parse(fs.readFileSync(path.join(__dirname, 'test/fixtures/groups.geojson')))
var data = JSON.parse(fs.readFileSync(path.join(__dirname, 'test/fixtures/data.geojson')))

var extraArg = 1337
var thisArg = { called: 0 }

var before = Date.now()

aggregate.groups(groups, data, {
  'something': reducers.sum('something'),
  'something-aw': reducers.areaWeightedSum('something'),
  'something-mean': reducers.areaWeightedMean('something'),
  'area': reducers.totalArea(),
  'count': reducers.count()
}, thisArg, [extraArg])

var after = Date.now()
console.log(after - before)
