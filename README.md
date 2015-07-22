# geojson-polygon-aggregate

Aggregate properties of GeoJSON polygons, grouped by another set of polygons

## Install

```
npm install geojson-polygon-aggregate
```


## Usage

```javascript
var aggregate = require('geojson-polygon-aggregate')
var groups = { /* geojson FeatureCollection of polygons */ }
var data = { /* geojson FeatureCollection of polygons with some data */ } 

// assumes that the features in data have a numeric property called 'something'
var result = aggregate(groups, data, {
  'something': aggregate.sum('something'),
  'something-area-weighted': aggregate.sum('something'),
  'area': aggregate.totalArea(),
  'count': aggregate.count(),
  'arbitraryProperty': function (memo, feature) {
    // the aggregations above are provided for convenience, but you can
    // do whatever you want here. `memo` is the previous return value
    // of this function, or groups.properties['arbitraryProperty'] on the
    // first iteration.
    if (memo) {
      return memo + ', ' + feature.properties['something']
    } else {
      return 'Values: ' + feature.properties['something']
    }
  }
})
```
