var clip = require('geojson-clip-polygon')
var xtend = require('xtend')
var through = require('through2')
var rbush = require('rbush')
var bbox = require('turf-bbox')

module.exports = all
module.exports.all = all
module.exports.groups = groups
module.exports.stream = stream
module.exports.reducers = require('./reducers')

/**
 * Aggregate properties of GeoJSON polygon features.
 *
 * @param {FeatureCollection<Polygon>|Array} data - The polygons to aggregate.
 * @param {Object} aggregations - The aggregations as key-value pairs, where the key is the name of the resulting property, and the value is the reducer function with signature (accumulator, clippedFeature, groupingFeature, additionalArgs[0], additionalArgs[1], ...) => accumulator
 * @param {Object} [thisArg] - Optional 'this' context with which to call reducer functions
 * @param {Array} [additionalArgs] - Optional array of additional args with which to call reducer functions
 *
 * @return {Object} A properties object with the aggregated property values
 */
function all (features, aggregations, thisArg, additionalArgs) {
  if (!Array.isArray(features)) { features = features.features }
  var args = [undefined, undefined, undefined].concat(additionalArgs)
  var memo = {}
  for (var prop in aggregations) {
    for (var i = features.length - 1; i >= 0; i--) {
      args[0] = memo[prop]
      args[1] = features[i]
      args[2] = undefined // no grouping feature
      memo[prop] = aggregations[prop].apply(thisArg, args)
    }

    if (typeof aggregations[prop].finish === 'function') {
      memo[prop] = aggregations[prop].finish.apply(thisArg, [memo[prop], undefined].concat(additionalArgs))
    }
  }
  return memo
}

/**
 * Aggregate properties of GeoJSON polygon features, grouped by another set of
 * polygons.
 *
 * @param {FeatureCollection<Polygon>|Array} groups - The polygons by which to group the aggregations.
 * @param {FeatureCollection<Polygon>|Array} data - The polygons to aggregate.
 * @param {Object} aggregations - The aggregations as key-value pairs, where the key is the name of the resulting property, and the value is the reducer function with signature (accumulator, clippedFeature, groupingFeature, additionalArgs[0], additionalArgs[1], ...) => accumulator
 * @param {Object} [thisArg] - Optional 'this' context with which to call reducer functions
 * @param {Array} [additionalArgs] - Optional array of additional args with which to call reducer functions
 *
 * @return {FeatureCollection<Polygon>} A set of polygons whose geometries are identical to `groups`, but
 * with properties resulting from the aggregations.  Existing properties on features in `groups` are
 * copied (shallowly), but aggregation results will override if they have the same name.
 */
function groups (groups, data, aggregations, thisArg, additionalArgs) {
  groups = Array.isArray(groups) ? groups : groups.features
  data = Array.isArray(data) ? data : data.features
  var args = [undefined, undefined, undefined].concat(additionalArgs)

  var tree = rbush()
  tree.load(data.map(function (d) {
    var dataBbox = bbox(d)
    return {
      minX: dataBbox[0],
      minY: dataBbox[1],
      maxX: dataBbox[2],
      maxY: dataBbox[3],
      feature: d
    }
  }))

  return {
    type: 'FeatureCollection',
    features: groups.map(aggregate)
  }

  function aggregate (group) {
    var memo = xtend({}, group.properties)

    var groupBbox = bbox(group)
    tree.search({
      minX: groupBbox[0],
      minY: groupBbox[1],
      maxX: groupBbox[2],
      maxY: groupBbox[3]
    })
    .map(function (f) { return f.feature })
    .map(function (f) { return clip(group, f, { threshold: 0 }) })
    .filter(function (clipped) { return !!clipped })
    .forEach(function (clipped) {
      for (var prop in aggregations) {
        args[0] = memo[prop]
        args[1] = clipped
        args[2] = group
        memo[prop] = aggregations[prop].apply(thisArg, args)
      }
    })

    for (var prop in aggregations) {
      if (typeof aggregations[prop].finish === 'function') {
        memo[prop] = aggregations[prop].finish.apply(thisArg, [memo[prop], group].concat(additionalArgs))
      }
    }

    return {
      type: group.type,
      properties: memo,
      geometry: group.geometry
    }
  }
}

/**
 * Aggregate properties of streaming GeoJSON polygon features.
 *
 * @param {Object} aggregations - The aggregations as key-value pairs, where the key is the name of the resulting property, and the value is the reducer function with signature (accumulator, clippedFeature, groupingFeature, additionalArgs[0], additionalArgs[1], ...) => accumulator
 * @param {Object} [thisArg] - Optional 'this' context with which to call reducer functions
 * @param {Array} [additionalArgs] - Optional array of additional args with which to call reducer functions
 *
 * @return {Object} A transform stream reading GeoJSON feature objects and, writing, at the end, a properties object with the aggregated property values
 */
function stream (aggregations, thisArg, additionalArgs) {
  var memo = {}
  var args = [undefined, undefined, undefined].concat(additionalArgs)
  return through.obj(function write (feature, enc, next) {
    for (var prop in aggregations) {
      args[0] = memo[prop]
      args[1] = feature
      args[2] = undefined // no grouping feature
      memo[prop] = aggregations[prop].apply(thisArg, args)
    }
    next()
  }, function end () {
    for (var prop in aggregations) {
      if (typeof aggregations[prop].finish === 'function') {
        memo[prop] = aggregations[prop].finish.apply(thisArg, [memo[prop], undefined].concat(additionalArgs))
      }
    }

    this.push(memo)
    this.push(null)
  })
}
