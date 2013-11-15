(function() {

  var breakpoints = { width: [ ], height: [ ] };

	(function() {
		parseCssGetBreakpoints( );
		createActionPanel( );
	})();

	function parseCssGetBreakpoints( ) {

		var mediaSizeSelectorsInPx = [ ];

		(function() {
			parseCssGetMediaSizeSelectorsInPx( );
			for ( var i=0; i<mediaSizeSelectorsInPx.length; i++ ) {
				var breakpoint = getBreakpointFromMediaSizeSelector( mediaSizeSelectorsInPx[ i ] );
				if ( 
					typeof( breakpoint.type ) != 'undefined' &&
					breakpoints[ breakpoint.type ].indexOf( breakpoint.px ) == -1
				) {
					breakpoints[ breakpoint.type ].push( breakpoint.px );
				}
			}
			breakpoints.width = breakpoints.width.sort(function(a, b){return a - b;});
			breakpoints.height = breakpoints.height.sort(function(a, b){return a - b;});
		})();

		function parseCssGetMediaSizeSelectorsInPx( ) {

			var emToPxRatio;
			var mediaSizeSelectors = [ ];

			(function() {
				emToPxRatio = getEmInPxRatio( );
				parseCssGetMediaSizeSelectors( );
				for ( var i=0; i<mediaSizeSelectors.length; i++ ) {
					mediaSizeSelectorsInPx[ i ] = mediaSizeSelectors[ i ];
					mediaSizeSelectorsInPx[ i ].px = convertSizeInPixel( mediaSizeSelectors[ i ].value );
				}
			})();

			function parseCssGetMediaSizeSelectors( ) {

				(function() {
					var mediaSelectors = parseCssGetMediaSelectors( );
					for( var i=0; i<mediaSelectors.length; i++ ) {
						addMediaSizeSelectorsFromMediaSelector( mediaSelectors[ i ] );
					}
				})();

				function parseCssGetMediaSelectors( ) {

					return (function() {
						var rules = parseCssGetRules( );
						var mediaSelectors = [ ];
						for( var i=0; i<rules.length; i++ ) {
							if ( isMediaRule( rules[ i ] ) ) {
								mediaSelectors.push( rules[ i ].media.mediaText );
							}
						}
						return mediaSelectors;
					})();

					function parseCssGetRules( ) {
						var rules = [ ];
						for( var i=0; i<document.styleSheets.length; i++ ) {
							try {
								for( var j=0; j<document.styleSheets[ i ].cssRules.length; j++ ) {
									rules.push( document.styleSheets[ i ].cssRules[ j ] );
								}
							} catch ( exception ) {
								// External stylesheet
							}
						}
						return rules;
					}

					function isMediaRule( rule ) {
						return ( typeof( rule.media ) != 'undefined' );
					}
				}

				function addMediaSizeSelectorsFromMediaSelector( mediaSelector ) {

					(function() {
						var mediaSelectorParts = mediaSelector.split( '(' );
						for ( var i=1; i<mediaSelectorParts.length; i++ ) {
							if ( isMediaRulePartASizeSelector( mediaSelectorParts[ i ] ) ) {
								mediaSizeSelectors.push( getSizeSelectorFromMediaSelectorPart( mediaSelectorParts[ i ] ) );
							}
						}
					})();

					function isMediaRulePartASizeSelector( mediaSelectorPart ) {
						return ( mediaSelectorPart.indexOf( ':' ) != -1 );
					}

					function getSizeSelectorFromMediaSelectorPart( mediaSelectorPart ) {
						return { 
							property: mediaSelectorPart.split( ':' )[ 0 ].trim( ),
							value: mediaSelectorPart.split( ':' )[ 1 ].split( ')' )[ 0 ].trim( )
						};
					}
				}
			}

			function convertSizeInPixel( size ) {

				var size = size;
				
				return (function() {
					extractUnitFromSize( );
					convertEmToPixel( );
					return roundPixel( );
				})();

				function extractUnitFromSize( ) {
					size = {
						number: Number( size.replace( /[^\d\.]/g, '' ) ),
						unit: size.replace( /[\d\.]/g, '' )
					};
				}

				function convertEmToPixel( ) {
					if ( size.unit == 'em' || size.unit == 'rem' ) {
						size = size.number * emToPxRatio;
					} else if ( size.unit == 'px' ) {
						size = size.number;
					}
				}

				function roundPixel( ) {
					return Math.round(size*100)/100;
				}
			}

			function getEmInPxRatio( ) {	
				var html = document.documentElement;
				var style = html.getAttribute('style');
				html.setAttribute('style', style+';font-size:1em !important');
				var baseline = parseFloat( getComputedStyle( html ).fontSize );
				html.setAttribute('style', style);
				return baseline;
			}
		}

		function getBreakpointFromMediaSizeSelector( mediaSizeSelectorInPx ) {
			var breakpoint = { };
			if ( typeof ( mediaSizeSelectorInPx.px ) != 'undefined' ) {
				breakpoint.px = mediaSizeSelectorInPx.px;
				if ( mediaSizeSelectorInPx.property == 'min-width' ||  mediaSizeSelectorInPx.property == 'min-height' ) {
					breakpoint.px--;
				}
				breakpoint.px = Math.ceil(breakpoint.px);
				if ( breakpoint.px > 0 ) {
					if ( mediaSizeSelectorInPx.property == 'max-width' ||  mediaSizeSelectorInPx.property == 'min-width' ) {
						breakpoint.type = 'width';
					} else if ( mediaSizeSelectorInPx.property == 'max-height' ||  mediaSizeSelectorInPx.property == 'min-height' ) {
						breakpoint.type = 'height';
					}
				}
			}
			return breakpoint;
		}
	}

	function createActionPanel( ) {

		var fluidZones = { width: [ ], height: [ ] };

		(function() {
			getFluidZonesFromBreakpoints( );
			displayFluidZonesActionPanel( );
		})();

        function getFluidZonesFromBreakpoints( ) {

            (function() {
                formatFluidZonesByDirection( 'width' );
                formatFluidZonesByDirection( 'height' );
            })();

            function formatFluidZonesByDirection( direction ) {
                if ( breakpoints[ direction ].length != 0 ) {
                    var old;
                    for ( var i=0; i<breakpoints[ direction ].length; i++ ) {
                        var point = breakpoints[ direction ][ i ] ;
                        var zone = [ ];
                        if ( old == null ) {
                            zone.push( null );
                        } else if ( old + 1 != point ) {
                            zone.push( old + 1 );
                        }
                        zone.push( point );
                        fluidZones[ direction ].push( zone );
                        old = point;
                    }
                    fluidZones[ direction ].push( [ old + 1, '&#8592; ' + direction ] );
                }
            }
        }
		function displayFluidZonesActionPanel( ) {

			var resizedWindow;

			(function() {
				var panel = createPanelElement( );
				if ( breakpoints.width.length == 0 && breakpoints.height.length == 0 ) {
					panel.addInformationToPanel( 'No breakpoint found' );
				} else {
					for ( var j=0; j<fluidZones.height.length; j++ ) {
						panel.addFluidZoneToPanel( 'height', fluidZones.height[ j ] );
						panel.addBreakLineToPanel( );
					}
					panel.addFluidZoneToPanel( 'no', ['Breaq'], 'http://tzi.fr/CSS/Responsive/Breaq-bookmarklet' );
					for ( var i=fluidZones.width.length-1; i>-1; i-- ) {
						panel.addFluidZoneToPanel( 'width', fluidZones.width[ i ] );
					}
					panel.addBreakLineToPanel( );
				}
			})();

			function createPanelElement( ) {

				// internal
				var panel = document.getElementById( 'panelResize' );
				if ( panel == null ) {
					panel = document.createElement( 'div' );
					panel.setAttribute( 'id', 'panelResize' );
					panel.setAttribute( 'style', 'position: fixed; bottom:10px; right: 10px; z-index: 999999; text-align: left;' );
					document.body.appendChild( panel );
				}

				// private panel methods
				function addPanelElement( element ) {
					element.setAttribute( 'style', 'text-align: center; background: rgba(0, 0, 0, 0.8); border-radius: 10px; padding: 10px; margin: 0 0 2px 2px; min-width: 80px; box-sizing: content-box; -moz-box-sizing: content-box; float: right; color: white; font-weight: normal; font-size: 16px; line-height: 16px; ' );
					panel.appendChild( element );
				}

				// public panel methods
				return {
					addFluidZoneToPanel: function( direction, values, href ) {

						(function() {
							var zone = document.createElement( 'span' );
							zone.innerHTML = '&#160;';
							for ( var i=0; i<values.length; i++ ) {
								zone.appendChild( createResizeElement( i ) );
							}
							addPanelElement( zone );
						})();

						function createResizeElement( i ) {

							var element;

							return (function() {
								if ( typeof( values[ i ] ) == 'number' ) {
									createResizeButtonElement( i );
								} else if (href) {
									createResizeLinkElement( );
								} else {
                                    createResizeTextElement( );
                                }
								element.innerHTML = values[ i ];
								element.setAttribute( 'style', 'color: white; font-weight: bold; font-size: 16px; text-decoration: none; border: 0; float: ' + ( values.length == 1 ? 'none' : i == 0 ? 'left' : 'right' ) );
								return element;
							})();

                            function createResizeLinkElement( ) {
                                element = document.createElement( 'a' );
                                element.setAttribute('href', href);
                                element.setAttribute('target', '_blank');
                            }

							function createResizeTextElement( ) {
								element = document.createElement( 'span' );
							}

							function createResizeButtonElement( ) {
								element = document.createElement( 'a' );
								element.setAttribute( 'href', 'javascript:;' );
								element.addEventListener( 'click', function( ) {
									var size = { };
									var alternate = direction == 'width' ? 'height' : 'width'; 
									var Direction = direction.charAt( 0 ).toUpperCase( ) + direction.substr( 1 );
									var Alternate = alternate.charAt( 0 ).toUpperCase( ) + alternate.substr( 1 );
									var existingPopup = ( resizedWindow != null && ! resizedWindow.closed );
									size[ alternate ] = 600;
									if ( existingPopup ) {
										size[ alternate ] = resizedWindow[ 'outer' + Alternate ];
										resizedWindow.close( );
									}
									resizedWindow = window.open( window.location + '#', 'resized', 'resizable,scrollbars=1,width=800,height=600' );
									var resizePopup = function( ) {
										var innerSize;
										if ( /AppleWebKit/.test(navigator.userAgent) ) {
											innerSize = resizedWindow.document.documentElement[ 'client' + Direction ];
										} else {
											innerSize = resizedWindow[ 'inner' + Direction ];
										}
										size[ direction ] = values[ i ] + resizedWindow[ 'outer' + Direction ] - innerSize;
										resizedWindow.resizeTo( size.width, size.height );
										resizedWindow.focus( );
									};
									var interval = setInterval( function( ) {
										if ( resizedWindow.document.readyState == 'complete' ) {
											clearInterval( interval );
											resizePopup( );
										}
									}, 100);
								}, false );
							}
						}
					},
					addInformationToPanel: function( message ) {
						var information = document.createElement( 'span' );
						information.innerHTML = message;
						addPanelElement( information );
					},
					addBreakLineToPanel: function( ) {
						var br = document.createElement( 'br' );
						br.setAttribute( 'style', 'clear: both' );
						panel.appendChild( br );
					}
				}
			}
		}
	}
})();

