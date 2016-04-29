var area = require('turf-area')
var uniq = require('uniq')

module.exports.count = function () {
  return function (c) { return (c || 0) + 1 }
}

/*
 * Return an aggregation that collects the unique, primitive values of the given
 * property into a (stringified) array.  If the property value is a stringified
 * array, it is unpacked--i.e., the array contents are collected rather than the
 * array itself.
 */
module.exports.union = function (property) {
  function collect (memo, feature) {
    memo = (memo || [])
    if (!(property in feature.properties)) { return memo }

    var value
    try {
      value = JSON.parse(feature.properties[property])
    } catch (e) {
      value = feature.properties[property]
    }

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
