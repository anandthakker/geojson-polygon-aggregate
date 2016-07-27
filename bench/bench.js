var fs = require('fs')
var path = require('path')
var prettyMs = require('pretty-ms')
var aggregate = require('../')
var reducers = require('../reducers')

var groups = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/groups.geojson')))
var data = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/data.geojson')))

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
console.log(prettyMs(after - before))
