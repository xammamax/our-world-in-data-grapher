;( function() {
	
	"use strict";

	App.Views.ImportView = Backbone.View.extend({

		datasetName: "",
		isDataMultiVariant: false,
		uploadedData: false,

		el: "#import-view",
		events: {
			"submit form": "onFormSubmit",
			"input [name=new_dataset_name]": "onNewDatasetNameChange",
			"change [name=new_dataset]": "onNewDatasetChange",
			"click .remove-uploaded-file-btn": "onRemoveUploadedFile",
			"change [name=category_id]": "onCategoryChange",
			"change [name=existing_dataset_id]": "onExistingDatasetChange",
			"change [name=subcategory_id]": "onSubCategoryChange",
			"change [name=multivariant_dataset]": "onMultivariantDatasetChange",
			"click .new-dataset-description-btn": "onDatasetDescription"
		},

		initialize: function( options ) {
			
			this.dispatcher = options.dispatcher;
			this.render();
			this.initUpload();
			
		},

		render: function() {

			//sections
			this.$datasetSection = this.$el.find( ".dataset-section" );
			this.$datasetTypeSection = this.$el.find( ".dataset-type-section" );
			this.$uploadSection = this.$el.find( ".upload-section" );
			this.$variableSection = this.$el.find( ".variables-section" );
			this.$categorySection = this.$el.find( ".category-section" );
			this.$variableTypeSection = this.$el.find( ".variable-type-section" );
			
			//random els
			this.$newDatasetDescription = this.$el.find( "[name=new_dataset_description]" );
			this.$variableSectionList = this.$variableSection.find( "ol" );

			this.$filePicker = this.$el.find( ".file-picker-wrapper [type=file]" );
			this.$dataInput = this.$el.find( "[name=data]" );
			this.$csvImportResult = this.$el.find( ".csv-import-result" );
			this.$newDatasetSection = this.$el.find( ".new-dataset-section" );
			this.$existingDatasetSection = this.$el.find( ".existing-dataset-section" );
			this.$removeUploadedFileBtn = this.$el.find( ".remove-uploaded-file-btn" );

			//category section
			this.$categorySelect = this.$el.find( "[name=category_id]" );
			this.$subcategorySelect = this.$el.find( "[name=subcategory_id]" );

			//hide optional elements
			this.$newDatasetDescription.hide();
			//this.$variableSection.hide();

		},

		initUpload: function() {

			var that = this;
			CSV.begin( this.$filePicker.selector )
				.table( "csv-import-table-wrapper", { header:1, caption: "" } )
				.go( function( err, data ) {
						that.onCsvSelected( err, data );
				} );
			this.$removeUploadedFileBtn.hide();

		},

		updateVariableList: function( data ) {

			var $list = this.$variableSectionList;
			$list.empty();
			
			var that = this;
			if( data && data.variables ) {
				_.each( data.variables, function( v, k ) {
					var $li = that.createVariableEl( v );
					$list.append( $li );
				} );
			}

		},

		createVariableEl: function( data ) {

			//add missing properties
			data.unit = "";
			data.description = "";

			var $li = $( "<li class='variable-item clearfix'></li>" ),
				$inputName = $( "<label>Name<input class='form-control' value='" + data.name + "' placeholder='Enter variable name'/></label>" ),
				$inputUnit = $( "<label>Unit*<input class='form-control' value='' placeholder='Enter variable unit' /></label>" ),
				$inputDescription = $( "<label>Description*<input class='form-control' value='' placeholder='Enter variable description' /></label>" ),
				$inputData = $( "<input type='hidden' name='variables[]' value='" + JSON.stringify( data ) + "' />" );
			
			$li.append( $inputName );
			$li.append( $inputUnit );
			$li.append( $inputDescription );
			$li.append( $inputData );

			var $inputs = $li.find( "input" );
			$inputs.on( "input", function( evt ) {

				//update stored json
				var json = $.parseJSON( $inputData.val() );
				json.name = $inputName.val();
				json.unit = $inputUnit.val();
				json.description = $inputDescription.val();
				$inputData.val( JSON.stringify( json ) );

			} );

			return $li;

		},

		mapData: function() {

			var mappedData = ( this.isDataMultiVariant )? App.Utils.mapMultiVariantData( this.uploadedData.rows, "World" ): App.Utils.mapSingleVariantData( this.uploadedData.rows, this.datasetName ), 
				//var mappedData =  App.Utils.mapSingleVariantData( data.rows, "test" ), 
				json = { "variables": mappedData },
				jsonString = JSON.stringify( json );

			this.$dataInput.val( jsonString );
			this.$removeUploadedFileBtn.show();

			this.updateVariableList( json );

		},

		validateEntityData: function( data ) {

			//validateEntityData doesn't modify the original data

			var $dataTableWrapper = $( ".csv-import-table-wrapper" ),
				$dataTable = $dataTableWrapper.find( "table" ),
				$entitiesCells = $dataTable.find( "th" ),
				entities = _.map( $entitiesCells, function( v ) { return $( v ).text() } );

			//get rid of first one (time label)
			entities.shift();

			$.ajax( {
				url: Global.rootUrl + "/entityIsoNames/validateData",
				data: { "entities": JSON.stringify( entities ) },
				beforeSend: function() {
					$dataTableWrapper.before( "<p class='entities-loading-notice loading-notice'>Validating entities</p>" );
				},
				success: function( response ) {
					if( response.data ) {
							
						var unmatched = response.data;
						$entitiesCells.removeClass( "alert-error" );
						$.each( $entitiesCells, function( i, v ) {
							var $entityCell = $( this ),
								value = $entityCell.text();
							if( _.indexOf( unmatched, value ) > -1 ) {
								$entityCell.addClass( "alert-error" );
							}
						} );

						//remove preloader
						$( ".entities-loading-notice" ).remove();
						//result notice
						$( ".entities-validation-result" ).remove();
						var $resultNotice = (unmatched.length)? $( "<p class='entities-validation-result validation-result text-danger'><i class='fa fa-exclamation-circle'></i>Some countries do not have <a href='http://en.wikipedia.org/wiki/ISO_3166' target='_blank'>standardized name</a>! Rename the highlighted countries and reupload CSV.</p>" ): $( "<p class='entities-validation-result validation-result text-success'><i class='fa fa-check-circle'></i>All countries have standardized name, well done!</p>" );
						$dataTableWrapper.before( $resultNotice );

					}
				}
			} );
			
		},

		validateTimeData: function( data ) {

			//validateTimeData modify the original data

			var $dataTableWrapper = $( ".csv-import-table-wrapper" ),
				$dataTable = $dataTableWrapper.find( "table" ),
				timeDomain = $dataTable.find( "th:first-child" ).text(),
				$timesCells = $dataTable.find( "td:first-child" ),
				times = _.map( $timesCells, function( v ) { return $( v ).text() } );

			//format time domain maybe
			if( timeDomain ) {
				timeDomain = timeDomain.toLowerCase();
			}

			//make sure time is from given domain
			if( _.indexOf( [ "century", "decade", "year" ], timeDomain ) == -1 ) {
				var $resultNotice = $( "<p class='time-domain-validation-result validation-result text-danger'><i class='fa fa-exclamation-circle'></i>First top-left cell should contain time domain infomartion. Either 'century', or'decade', or 'year'.</p>" );
				$dataTableWrapper.before( $resultNotice );
			}

			$.each( $timesCells, function( i, v ) {

				var $timeCell = $( v );
				
				//find corresponding value in loaded data
				var newValue,
					origValue = data[ i+1 ][ 0 ],
					value = App.Utils.parseTimeString( origValue.toString() ),
					date = moment( new Date( value ) );

				if( !date.isValid() ) {

					$timeCell.addClass( "alert-error" );
				
				} else {
					
					//correct date
					$timeCell.removeClass( "alert-error" );
					//insert potentially modified value into cell
					$timeCell.text( value );

					newValue = { "date": date, "label": origValue };

					if( timeDomain == "year" ) {
						
						//try to guess century
						var year = Math.floor( origValue ),
							nextYear = year + 1;
						//convert it to datetime values
						year = moment( new Date( year.toString() ) );
						nextYear = moment( new Date( nextYear.toString() ) ).seconds(-1);
						//modify the initial value
						newValue[ "startDate" ] = year;
						newValue[ "endDate" ] = nextYear;

					} else if( timeDomain == "decade" ) {
						
						//try to guess century
						var decade = Math.floor( origValue / 10 ) * 10,
							nextDecade = decade + 10;
						//convert it to datetime values
						decade = moment( new Date( decade.toString() ) );
						nextDecade = moment( new Date( nextDecade.toString() ) ).seconds(-1);
						//modify the initial value value
						newValue[ "startDate"] = decade;
						newValue[ "endDate" ] = nextDecade;

					} else if( timeDomain == "century" ) {
						
						//try to guess century
						var century = Math.floor( origValue / 100 ) * 100,
							nextCentury = century + 100;
						//convert it to datetime values
						century = moment( new Date( century.toString() ) );
						nextCentury = moment( new Date( nextCentury.toString() ) ).seconds(-1);
						//modify the initial value value
						newValue[ "startDate"] = century;
						newValue[ "endDate" ] = nextCentury;

					}

					//initial was number/string so passed by value, need to insert it back to arreay
					data[ i+1 ][ 0 ] = newValue;

				}

			});

			var $resultNotice;
			if( $timesCells.filter( ".alert-error" ).length ) {
				
				$resultNotice = $( "<p class='times-validation-result validation-result text-danger'><i class='fa fa-exclamation-circle'></i>Time information in the uploaded file is not in <a href='http://en.wikipedia.org/wiki/ISO_8601' target='_blank'>standardized format (YYYY-MM-DD)</a>! Fix the highlighted time information and reupload CSV.</p>" );
			
			} else {

				$resultNotice = $( "<p class='times-validation-result validation-result text-success'><i class='fa fa-check-circle'></i>Time information in the uploaded file is correct, well done!</p>" );

			}
			$dataTableWrapper.before( $resultNotice );
			
		},

		onDatasetDescription: function( evt ) {

			var $btn = $( evt.currentTarget );
			
			if( this.$newDatasetDescription.is( ":visible" ) ) {
				this.$newDatasetDescription.hide();
				$btn.find( "span" ).text( "Add dataset description." );
				$btn.find( "i" ).removeClass( "fa-minus" );
				$btn.find( "i" ).addClass( "fa-plus" );
			} else {
				this.$newDatasetDescription.show();
				$btn.find( "span" ).text( "Nevermind, no description." );
				$btn.find( "i" ).addClass( "fa-minus" );
				$btn.find( "i" ).removeClass( "fa-plus" );;
			}
			
		},

		onNewDatasetChange: function( evt ) {

			var $input = $( evt.currentTarget );
			if( $input.val() === "0" ) {
				this.$newDatasetSection.hide();
				this.$existingDatasetSection.show();
			} else {
				this.$newDatasetSection.show();
				this.$existingDatasetSection.hide();
			}

		},

		onNewDatasetNameChange: function( evt ) {

			var $input = $( evt.currentTarget );
			this.datasetName = $input.val();

		},

		onExistingDatasetChange: function( evt ) {

			var $input = $( evt.currentTarget );
			this.datasetName = $input.find( 'option:selected' ).text();

		},

		onRemoveUploadedFile: function( evt ) {

			this.$filePicker.replaceWith( this.$filePicker.clone() );
			//refetch dom
			this.$filePicker = this.$el.find( ".file-picker-wrapper [type=file]" );
			this.$filePicker.prop( "disabled", false);

			//reset related components
			this.$csvImportResult.empty();
			this.$dataInput.val("");

			this.initUpload();

		},

		onCsvSelected: function( err, data ) {
			
			if( !data ) {
				return;
			}

			this.uploadedData = data;

			this.validateEntityData( data.rows );
			this.validateTimeData( data.rows );

			this.mapData();

		},

		onCategoryChange: function( evt ) {
			
			var $input = $( evt.currentTarget );
			if( $input.val() != "" ) {
				this.$subcategorySelect.show();
				this.$subcategorySelect.css( "display", "block" );
			} else {
				this.$subcategorySelect.hide();
			}

			//filter subcategories select
			this.$subcategorySelect.find( "option" ).hide();
			this.$subcategorySelect.find( "option[data-category-id=" + $input.val() + "]" ).show();

		},

		onSubCategoryChange: function( evt ) {
			
		},

		onMultivariantDatasetChange: function( evt ) {

			var $input = $( evt.currentTarget );
			if( $input.val() === "1" ) {
				this.isDataMultiVariant = true;
				//this.$variableSection.show();
			} else {
				this.isDataMultiVariant = false;
				//this.$variableSection.hide();
			}

			if( this.uploadedData ) {
				this.mapData();
			}
			
		},

		onFormSubmit: function( evt ) {

			var $validationResults = $( ".validation-result.text-danger" );
			if( $validationResults.length ) {
				//do not send form and scroll to error message
				evt.preventDefault();
				$('html, body').animate({
					scrollTop: $validationResults.offset().top - 18
				}, 300);
				return false;
			}

			//evt 
			var $btn = $( "[type=submit]" );
			$btn.prop( "disabled", true );
			$btn.css( "opacity", .5 );

			$btn.after( "Sending form" );

		}


	});

})();