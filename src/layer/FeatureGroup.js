/*
 * L.FeatureGroup extends L.LayerGroup by introducing mouse events and bindPopup method shared between a group of layers.
 */

L.FeatureGroup = L.LayerGroup.extend({
	includes: L.Mixin.Events,

	options: {
		clickable: true
	},

	initialize: function (layers, options) {
		L.LayerGroup.prototype.initialize.call(this, layers, options);
	},

	addLayer: function (layer) {
		if (this._layers[L.Util.stamp(layer)]) {
			return this;
		}

		if (this.options.clickable) {
			layer.on('click dblclick mouseover mouseout mousemove contextmenu', this._propagateEvent, this);
		}

		// NOTE: Mutates initial object, could be problem if it is reattached standalone, but avoids uneccasary overhead
		if (!layer.options) { layer.options = {}; }
		layer.options.clickable = this.options.clickable;

		L.LayerGroup.prototype.addLayer.call(this, layer);

		if (this._popupContent && layer.bindPopup) {
			layer.bindPopup(this._popupContent);
		}

		return this;
	},

	removeLayer: function (layer) {
		if (this.options.clickable) {
			layer.off('click dblclick mouseover mouseout mousemove contextmenu', this._propagateEvent, this);
		}

		L.LayerGroup.prototype.removeLayer.call(this, layer);

		if (this._popupContent) {
			return this.invoke('unbindPopup');
		} else {
			return this;
		}
	},

	bindPopup: function (content) {
		this._popupContent = content;
		return this.invoke('bindPopup', content);
	},

	setStyle: function (style) {
		return this.invoke('setStyle', style);
	},

	bringToFront: function () {
		return this.invoke('bringToFront');
	},

	bringToBack: function () {
		return this.invoke('bringToBack');
	},

	getBounds: function () {
		var bounds = new L.LatLngBounds();
		this.eachLayer(function (layer) {
			bounds.extend(layer instanceof L.Marker ? layer.getLatLng() : layer.getBounds());
		}, this);
		return bounds;
	},

	_propagateEvent: function (e) {
		e.layer  = e.target;
		e.target = this;

		this.fire(e.type, e);
	}
});

L.featureGroup = function (layers) {
	return new L.FeatureGroup(layers);
};
