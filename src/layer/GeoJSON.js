L.GeoJSON = L.FeatureGroup.extend({
	initialize: function (geojson, options) {
		L.Util.setOptions(this, options);

		this._layers = {};

		if (geojson) {
			this.addData(geojson);
		}
	},

	addData: function (geojson) {
		var features = geojson instanceof Array ? geojson : geojson.features,
		    i, len;

		if (features) {
			for (i = 0, len = features.length; i < len; i++) {
				this.addData(features[i]);
			}
			return this;
		}

		var options = this.options;

		if (options.filter && !options.filter(geojson)) { return; }

		var layer = L.GeoJSON.geometryToLayer(geojson, options.pointToLayer);
		if (!layer) { // non geometry layer
			return this;
		}
		layer.feature = geojson;

		this.resetStyle(layer);

		if (options.onEachFeature) {
			options.onEachFeature(geojson, layer);
		}

		return this.addLayer(layer);
	},

	resetStyle: function (layer) {
		var style = this.options.style;
		if (style) {
			this._setLayerStyle(layer, style);
		}
	},

	/**
	 * setStyle with yielding (optional)
	 * @param style Object or function
	 * @param yieldSpec opt Array [nChunk, yieldTime] or false, no yielding when not specified or false,
	 *  nChunk: number of layers to batch proccess,
	 *  yieldTime: time to yield in ms
	 * @param onProced opt callback to call when done (with context)
	 * @param cancel opt Array [cancel], cancel: boolean, after setStyle invoked, you can set cancel to true and the next chunks, will be aborted (and call onProced)
	 */
	setStyle: function (style, yieldSpec, onProced, cancel) {
		this.eachLayer(function (layer) {
			this._setLayerStyle(layer, style);
		}, this, yieldSpec, onProced, cancel);
	},

	_setLayerStyle: function (layer, style) {
		if (typeof style === 'function') {
			style = style(layer.feature);
		}
		if (layer.setStyle) {
			layer.setStyle(style);
		}
	}
});

L.Util.extend(L.GeoJSON, {
	geometryToLayer: function (geojson, pointToLayer) {
		var geometry = geojson.type === 'Feature' ? geojson.geometry : geojson,
		    layers = [],
		    coords, latlng, latlngs, i, len, layer;

		// As per geojson spec, Features can be of null geometry  http://www.geojson.org/geojson-spec.html#feature-objects
		if (!geometry) {
			return false;
		}
		coords = geometry.coordinates;

		switch (geometry.type) {
		case 'Point':
			latlng = this.coordsToLatLng(coords);
			return pointToLayer ? pointToLayer(geojson, latlng) : new L.Marker(latlng);

		case 'MultiPoint':
			for (i = 0, len = coords.length; i < len; i++) {
				latlng = this.coordsToLatLng(coords[i]);
				layer = pointToLayer ? pointToLayer(geojson, latlng) : new L.Marker(latlng);
				layers.push(layer);
			}
			return new L.FeatureGroup(layers, {clickable: this.options.clickable});

		case 'LineString':
			latlngs = this.coordsToLatLngs(coords);
			return new L.Polyline(latlngs);

		case 'Polygon':
			latlngs = this.coordsToLatLngs(coords, 1);
			return new L.Polygon(latlngs);

		case 'MultiLineString':
			latlngs = this.coordsToLatLngs(coords, 1);
			return new L.MultiPolyline(latlngs);

		case "MultiPolygon":
			latlngs = this.coordsToLatLngs(coords, 2);
			return new L.MultiPolygon(latlngs);

		case "GeometryCollection":
			for (i = 0, len = geometry.geometries.length; i < len; i++) {
				layer = this.geometryToLayer(geometry.geometries[i], pointToLayer);
				layers.push(layer);
			}
			return new L.FeatureGroup(layers, {clickable: this.options.clickable});

		default:
			throw new Error('Invalid GeoJSON object.');
		}
	},

	coordsToLatLng: function (coords, reverse) { // (Array, Boolean) -> LatLng
		var lat = parseFloat(coords[reverse ? 0 : 1]),
		    lng = parseFloat(coords[reverse ? 1 : 0]);

		return new L.LatLng(lat, lng, true);
	},

	coordsToLatLngs: function (coords, levelsDeep, reverse) { // (Array, Number, Boolean) -> Array
		var latlng,
		    latlngs = [],
		    i, len;

		for (i = 0, len = coords.length; i < len; i++) {
			latlng = levelsDeep ?
					this.coordsToLatLngs(coords[i], levelsDeep - 1, reverse) :
					this.coordsToLatLng(coords[i], reverse);

			latlngs.push(latlng);
		}

		return latlngs;
	}
});

L.geoJson = function (geojson, options) {
	return new L.GeoJSON(geojson, options);
};
