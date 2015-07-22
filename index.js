var area = require('turf-area')
var clip = require('geojson-clip-polygon')
var xtend = require('xtend')

/**
 * Aggregate properties of GeoJSON polygon features, grouped by another set of
 * polygons.
 *
 * @param {FeatureCollection<Polygon>|Array} groups - The polygons by which to group the aggregations.
 * @param {FeatureCollection<Polygon>|Array} data - The polygons to aggregate.
 * @param {Object} aggregations - The aggregations as key-value pairs, where the key is the name of the resulting property, and the value is the aggregation function, with signature (accumulator, clippedFeature) => accumulator
 *
 * @return {FeatureCollection<Polygon>} A set of polygons whose geometries are identical to `groups`, but
 * with properties resulting from the aggregations.  Existing properties on features in `groups` are
 * copied (shallowly), but aggregation results will override if they have the same name.
 */
module.exports = function (groups, data, aggregations) {
  groups = Array.isArray(groups) ? groups : groups.features
  data = Array.isArray(data) ? data : data.features

  return {
    type: 'FeatureCollection',
    features: groups.map(aggregate)
  }

  function aggregate (group) {
    var properties = xtend({}, group.properties)
    data
    .map(clip.bind(null, group))
    .filter(function (clipped) { return !!clipped })
    .forEach(function (clipped) {
      for (var prop in aggregations) {
        properties[prop] = aggregations[prop](properties[prop], clipped)
      }
    })

    return {
      type: group.type,
      properties: properties,
      geometry: group.geometry
    }
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

module.exports.count = function () {
  return function (c) { return (c || 0) + 1 }
}

module.exports.totalArea = function () {
  return function (a, feature) {
    return (a || 0) + area(feature)
  }
}