var area = require('turf-area')
var clip = require('geojson-clip-polygon')
var xtend = require('xtend')
var uniq = require('uniq')

/**
 * Aggregate properties of GeoJSON polygon features.
 *
 * @param {FeatureCollection<Polygon>|Array} data - The polygons to aggregate.
 * @param {Object} aggregations - The aggregations as key-value pairs, where the key is the name of the resulting property, and the value is the aggregation function, with signature (accumulator, clippedFeature, groupingFeature) => accumulator
 *
 * @return {Object} A properties object with the aggregated property values
 */
/**
 * Aggregate properties of GeoJSON polygon features, grouped by another set of
 * polygons.
 *
 * @param {FeatureCollection<Polygon>|Array} groups - The polygons by which to group the aggregations.
 * @param {FeatureCollection<Polygon>|Array} data - The polygons to aggregate.
 * @param {Object} aggregations - The aggregations as key-value pairs, where the key is the name of the resulting property, and the value is the aggregation function, with signature (accumulator, clippedFeature, groupingFeature) => accumulator
 *
 * @return {FeatureCollection<Polygon>} A set of polygons whose geometries are identical to `groups`, but
 * with properties resulting from the aggregations.  Existing properties on features in `groups` are
 * copied (shallowly), but aggregation results will override if they have the same name.
 */
module.exports = function (groups, data, aggregations) {
  if (!aggregations) {
    aggregations = data
    data = groups
    return aggregateAll(data, aggregations)
  }

  groups = Array.isArray(groups) ? groups : groups.features
  data = Array.isArray(data) ? data : data.features

  return {
    type: 'FeatureCollection',
    features: groups.map(aggregate)
  }

  function aggregate (group) {
    var properties = xtend({}, group.properties)
    data
    .map(function (f) { return clip(group, f, { threshold: 0 }) })
    .filter(function (clipped) { return !!clipped })
    .forEach(function (clipped) {
      for (var prop in aggregations) {
        properties[prop] = aggregations[prop](properties[prop], clipped)
      }
    })

    for (var prop in aggregations) {
      if (typeof aggregations[prop].finish === 'function') {
        properties[prop] = aggregations[prop].finish(properties[prop], group)
      }
    }

    return {
      type: group.type,
      properties: properties,
      geometry: group.geometry
    }
  }
}

function aggregateAll (features, aggregations) {
  if (!Array.isArray(features)) { features = features.features }
  var properties = {}
  for (var prop in aggregations) {
    for (var i = features.length - 1; i >= 0; i--) {
      properties[prop] = aggregations[prop](properties[prop], features[i])
    }

    if (typeof aggregations[prop].finish === 'function') {
      properties[prop] = aggregations[prop].finish(properties[prop])
    }
  }
  return properties
}

module.exports.count = function () {
  return function (c) { return (c || 0) + 1 }
}

/**
 * Return an aggregation that collects the unique, primitive values of the given
 * property into a (stringified) array.  If the property value is a stringified
 * array, it is unpacked--i.e., the array contents are collected rather than the
 * array itself.
 */
module.exports.union = function (property) {
  function collect (memo, feature) {
    memo = (memo || [])
    if (!(property in feature.properties)) { return memo }

    // this is safe bc JSON.parse is a noop if the value is already a primitive
    var value = JSON.parse(feature.properties[property])

    if (Array.isArray(value)) {
      memo.push.apply(memo, value)
    } else {
      memo.push(value)
    }
    return memo
  }

  collect.finish = function (memo) {
    return memo ? JSON.stringify(uniq(memo, false, false)) : '[]'
  }

  return collect
}

module.exports.totalArea = function () {
  return function (a, feature) {
    return (a || 0) + area(feature)
  }
}

module.exports.sum = function (property) {
  return function (s, feature) {
    return (s || 0) + (feature.properties[property] || 0)
  }
}

module.exports.areaWeightedSum = function (property) {
  return function (s, feature) {
    return (s || 0) + area(feature) * (feature.properties[property] || 0)
  }
}

module.exports.areaWeightedMean = function (property) {
  var ws = module.exports.areaWeightedSum(property)
  var ta = module.exports.totalArea()

  function weightedMean (memo, feature) {
    memo = memo || {}
    memo.sum = ws(memo.sum, feature)
    memo.area = ta(memo.area, feature)
    return memo
  }

  weightedMean.finish = function (memo) {
    return memo ? memo.sum / memo.area : 0
  }

  return weightedMean
}
