;( function() {
		
	"use strict";

	var App = require( "./../namespaces.js" );
	
	App.Models.ChartDimensionsModel = Backbone.Model.extend( {

		urlRoot: Global.rootUrl + '/chartTypes/',

		defaults: {},

		loadConfiguration: function( chartTypeId ) {

			this.set( "id", chartTypeId );
			this.fetch( {
				success: function( response ) {
				}
			} );

		}

	} );

	module.exports = App.Models.ChartDimensionsModel;

})();