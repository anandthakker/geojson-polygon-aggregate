# geojson-polygon-aggregate

Aggregate properties of GeoJSON polygons, grouped by another set of polygons

## Install

    npm install geojson-polygon-aggregate

## Usage

```javascript
var aggregate = require('geojson-polygon-aggregate')
var groups = { /* geojson FeatureCollection of polygons */ }
var data = { /* geojson FeatureCollection of polygons with some data */ } 

// assumes that the features in data have a numeric property called 'something'
var result = aggregate.groups(groups, data, {
  'something': aggregate.reducers.sum('something'),
  'something-area-weighted': aggregate.reducers.areaWeightedSum('something'),
  'area': aggregate.reducers.totalArea(),
  'count': aggregate.reducers.count(),
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

## API

### all

[index.js:21-38](https://github.com/anandthakker/geojson-polygon-aggregate/blob/829fa38329e6f18aa078336a51385d27e07e0f4d/index.js#L21-L38 "Source code on GitHub")

Aggregate properties of GeoJSON polygon features.

**Parameters**

-   `data` **(FeatureCollection.&lt;Polygon>|[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array))** The polygons to aggregate.
-   `features`  
-   `aggregations` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** The aggregations as key-value pairs, where the key is the name of the resulting property, and the value is the reducer function with signature (accumulator, clippedFeature, groupingFeature, additionalArgs[0], additionalArgs[1], ...) => accumulator
-   `thisArg` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)=** Optional 'this' context with which to call reducer functions
-   `additionalArgs` **[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)=** Optional array of additional args with which to call reducer functions

Returns **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** A properties object with the aggregated property values

### groups

[index.js:54-90](https://github.com/anandthakker/geojson-polygon-aggregate/blob/829fa38329e6f18aa078336a51385d27e07e0f4d/index.js#L54-L90 "Source code on GitHub")

Aggregate properties of GeoJSON polygon features, grouped by another set of
polygons.

**Parameters**

-   `groups` **(FeatureCollection.&lt;Polygon>|[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array))** The polygons by which to group the aggregations.
-   `data` **(FeatureCollection.&lt;Polygon>|[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array))** The polygons to aggregate.
-   `aggregations` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** The aggregations as key-value pairs, where the key is the name of the resulting property, and the value is the reducer function with signature (accumulator, clippedFeature, groupingFeature, additionalArgs[0], additionalArgs[1], ...) => accumulator
-   `thisArg` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)=** Optional 'this' context with which to call reducer functions
-   `additionalArgs` **[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)=** Optional array of additional args with which to call reducer functions

Returns **FeatureCollection.&lt;Polygon>** A set of polygons whose geometries are identical to `groups`, but
with properties resulting from the aggregations.  Existing properties on features in `groups` are
copied (shallowly), but aggregation results will override if they have the same name.

### stream

[index.js:101-122](https://github.com/anandthakker/geojson-polygon-aggregate/blob/829fa38329e6f18aa078336a51385d27e07e0f4d/index.js#L101-L122 "Source code on GitHub")

Aggregate properties of streaming GeoJSON polygon features.

**Parameters**

-   `aggregations` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** The aggregations as key-value pairs, where the key is the name of the resulting property, and the value is the reducer function with signature (accumulator, clippedFeature, groupingFeature, additionalArgs[0], additionalArgs[1], ...) => accumulator
-   `thisArg` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)=** Optional 'this' context with which to call reducer functions
-   `additionalArgs` **[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)=** Optional array of additional args with which to call reducer functions

Returns **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** A transform stream reading GeoJSON feature objects and, writing, at the end, a properties object with the aggregated property values

## Thanks

This module relies heavily on the fantastic [Turf.js](https://github.com/turfjs/turf/) project.  If it doesn't do what you need, something over there very likely does!
