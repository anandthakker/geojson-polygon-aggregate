var fs = require('fs')
var test = require('tape')
var envelope = require('turf-envelope')
var aggregate = require('../')

test('basic', function (t) {
  var groups = JSON.parse(fs.readFileSync(__dirname + '/fixtures/groups.geojson'))
  var data = JSON.parse(fs.readFileSync(__dirname + '/fixtures/data.geojson'))

  var result = aggregate(groups, data, {
    'something': aggregate.sum('something'),
    'something-aw': aggregate.areaWeightedSum('something'),
    'something-mean': aggregate.areaWeightedMean('something'),
    'area': aggregate.totalArea(),
    'count': aggregate.count()
  })

  t.equal(result.features[0].properties.something, 1729)

  // check out the area-weighted aggregation
  var actual = {
    'something-aw': 0,
    'area': 0
  }
  result.features.forEach(function (feat) {
    for (var k in actual) {
      actual[k] += feat.properties[k] || 0
    }
  })
  var expected = {
    'something-aw': 544975601.80 * 729 + 1892440077.76 * 1000,
    'area': 544975601.80 + 1892440077.76
  }

  for (var k in actual) {
    t.ok(Math.abs(actual[k] - expected[k]) / expected[k] < 0.01, k + ' ' + actual[k] + ' vs ' + expected[k])
  }

  t.end()
})

test('easy area weighted mean', function (t) {
  var data = JSON.parse(fs.readFileSync(__dirname + '/fixtures/data.geojson'))
  var groups = {
    type: 'FeatureCollection',
    features: [envelope(data)]
  }

  var result = aggregate(groups, data, {
    'something-aw': aggregate.areaWeightedSum('something'),
    'something-mean': aggregate.areaWeightedMean('something'),
    'area': aggregate.totalArea()
  })

  var props = result.features[0].properties
  var actual = props['something-mean']
  var expected = props['something-aw'] / props.area
  t.ok(Math.abs(actual - expected) / expected < 0.01)
  t.end()
})
