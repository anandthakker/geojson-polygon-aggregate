var fs = require('fs')
var path = require('path')
var test = require('tape')
var envelope = require('turf-envelope')
var aggregate = require('../')
var reducers = require('../reducers')

test('basic', function (t) {
  var groups = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/groups.geojson')))
  var data = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/data.geojson')))

  var extraArg = 1337
  var thisArg = { called: 0 }
  var extraArgReducer = function (acc, feat, group, arg1) {
    t.ok(feat, 'feature')
    t.equal(arg1, extraArg, 'extra arg')
    t.equal(this, thisArg, 'this arg')
    this.called++
  }

  var result = aggregate.groups(groups, data, {
    'something': reducers.sum('something'),
    'something-aw': reducers.areaWeightedSum('something'),
    'something-mean': reducers.areaWeightedMean('something'),
    'area': reducers.totalArea(),
    'count': reducers.count(),
    'extra': extraArgReducer
  }, thisArg, [extraArg])

  t.equal(result.features[0].properties.something, 1729)
  t.ok(thisArg.called, 'extra args reducer called')

  // check out the area-weighted aggregation
  var actual = { 'something-aw': 0, 'area': 0 }
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
  var data = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/data.geojson')))
  var groups = {
    type: 'FeatureCollection',
    features: [envelope(data)]
  }

  var result = aggregate.groups(groups, data, {
    'something-aw': reducers.areaWeightedSum('something'),
    'something-mean': reducers.areaWeightedMean('something'),
    'area': reducers.totalArea()
  })

  var props = result.features[0].properties
  var actual = props['something-mean']
  var expected = props['something-aw'] / props.area
  t.ok(Math.abs(actual - expected) / expected < 0.01)
  t.end()
})

test('aggregate all features', function (t) {
  var data = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/data.geojson')))

  var extraArg = 1337
  var thisArg = { called: 0 }
  var extraArgReducer = function (acc, feat, group, arg1) {
    t.ok(feat, 'feature')
    t.equal(arg1, extraArg, 'extra arg')
    t.equal(this, thisArg, 'this arg')
    this.called++
    return 'some-value'
  }

  var result = aggregate.all(data, {
    'something': reducers.sum('something'),
    'something-aw': reducers.areaWeightedSum('something'),
    'something-mean': reducers.areaWeightedMean('something'),
    'area': reducers.totalArea(),
    'count': reducers.count(),
    'extra': extraArgReducer
  }, thisArg, [extraArg])

  t.ok(thisArg.called)
  t.deepEqual(result, {
    something: 1729,
    'something-aw': 2289727291472.8496,
    'something-mean': 939.4077959999869,
    area: 2437415679.5616817,
    count: 2,
    extra: 'some-value'
  })
  t.end()
})

test('union', function (t) {
  var data = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/data.geojson')))

  var result = aggregate.all(data, {
    'u1': reducers.union('something'),
    'u2': reducers.union('arr1'),
    'u3': reducers.union('arr2'),
    'u4': reducers.union('str')
  })

  for (var k in result) {
    result[k] = JSON.parse(result[k])
  }

  t.deepEqual(result, {
    'u1': [1000, 729],
    'u2': [1, 2, 3, 4],
    'u3': [2001, 'dave', 'hal'],
    'u4': ['Hello', 'world']
  })
  t.end()
})

test('streaming', function (t) {
  var data = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/data.geojson'))).features

  var extraArg = 1337
  var thisArg = { called: 0 }
  var extraArgReducer = function (acc, feat, group, arg1) {
    t.ok(feat, 'feature')
    t.equal(arg1, extraArg, 'extra arg')
    t.equal(this, thisArg, 'this arg')
    this.called++
    return 'some-value'
  }

  var stream = aggregate.stream({
    'something': reducers.sum('something'),
    'something-aw': reducers.areaWeightedSum('something'),
    'something-mean': reducers.areaWeightedMean('something'),
    'area': reducers.totalArea(),
    'count': reducers.count(),
    'extra': extraArgReducer
  }, thisArg, [extraArg])

  stream.on('data', function (result) {
    t.ok(thisArg.called)
    t.deepEqual(result, {
      something: 1729,
      'something-aw': 2289727291472.8496,
      'something-mean': 939.4077959999869,
      area: 2437415679.5616817,
      count: 2,
      extra: 'some-value'
    })
    t.end()
  })

  data.forEach(function (feature) { stream.write(feature) })
  stream.end()
})

