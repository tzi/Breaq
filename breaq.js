(function() {

  var breakpoints = { width: [ ], height: [ ] };

	(function() {
		parse_css_get_breakpoints( );
		create_action_panel( );
	})();

	function parse_css_get_breakpoints( ) {

		var media_size_selectors_in_px = [ ];

		(function() {
			parse_css_get_media_size_selectors_in_px( );
			for ( var i=0; i<media_size_selectors_in_px.length; i++ ) {
				var breakpoint = get_breakpoint_from_media_size_selector( media_size_selectors_in_px[ i ] );
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

		function parse_css_get_media_size_selectors_in_px( ) {

			var em_to_px;
			var media_size_selectors = [ ];

			(function() {
				em_to_px = get_em_in_px( );
				parse_css_get_media_size_selectors( );
				for ( var i=0; i<media_size_selectors.length; i++ ) {
					media_size_selectors_in_px[ i ] = media_size_selectors[ i ];
					media_size_selectors_in_px[ i ].px = convert_size_in_pixel( media_size_selectors[ i ].value );
				}
			})();

			function parse_css_get_media_size_selectors( ) {

				(function() {
					var media_selectors = parse_css_get_media_selectors( );
					for( var i=0; i<media_selectors.length; i++ ) {
						add_media_size_selectors_from_media_selector( media_selectors[ i ] );
					}
				})();

				function parse_css_get_media_selectors( ) {

					return (function() {
						var rules = parse_css_get_rules( );
						var media_selectors = [ ];
						for( var i=0; i<rules.length; i++ ) {
							if ( is_media_rules( rules[ i ] ) ) {
								media_selectors.push( rules[ i ].media.mediaText );
							}
						}
						return media_selectors;
					})();

					function parse_css_get_rules( ) {
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

					function is_media_rules( rule ) {
						return ( typeof( rule.media ) != 'undefined' );
					}
				}

				function add_media_size_selectors_from_media_selector( media_selector ) {

					(function() {
						var parts = media_selector.split( '(' );
						for ( var i=1; i<parts.length; i++ ) {
							if ( has_media_rule_part_a_size_selector( parts[ i ] ) ) {
								media_size_selectors.push( get_size_selector_from_media_selector_part( parts[ i ] ) );
							}
						}
					})();

					function has_media_rule_part_a_size_selector( media_selector_part ) {
						return ( media_selector_part.indexOf( ':' ) != -1 );
					}

					function get_size_selector_from_media_selector_part( media_selector_part ) {
						return { 
							property: media_selector_part.split( ':' )[ 0 ].trim( ),
							value: media_selector_part.split( ':' )[ 1 ].split( ')' )[ 0 ].trim( )
						};
					}
				}
			}

			function convert_size_in_pixel( size ) {

				var size = size;
				
				return (function() {
					extract_unit_from_size( );
					if ( size.unit == 'em' || size.unit == 'rem' ) {
						return size.number * em_to_px;
					} else if ( size.unit == 'px' ) {
						return size.number;
					}
				})();

				function extract_unit_from_size( ) {
					size = {
						number: Number( size.replace( /[^\d\.]/g, '' ) ),
						unit: size.replace( /[\d\.]/g, '' ),
					};
				}
			}

			function get_em_in_px( ) {
				return Number( getComputedStyle( document.body.parentNode, null).fontSize.replace( /[^\d\.]/g, '' ) );
			}
		}

		function get_breakpoint_from_media_size_selector( media_size_selector_in_px ) {
			var breakpoint = { };
			if ( typeof ( media_size_selector_in_px.px ) != 'undefined' ) {
				breakpoint.px = media_size_selector_in_px.px;
				if ( media_size_selector_in_px.property == 'min-width' ||  media_size_selector_in_px.property == 'min-height' ) {
					breakpoint.px--;
				}
				if ( breakpoint.px > 0 ) {
					if ( media_size_selector_in_px.property == 'max-width' ||  media_size_selector_in_px.property == 'min-width' ) {
						breakpoint.type = 'width';
					} else if ( media_size_selector_in_px.property == 'max-height' ||  media_size_selector_in_px.property == 'min-height' ) {
						breakpoint.type = 'height';
					}
				}
			}
			return breakpoint;
		}
	}

	function create_action_panel( ) {

		var breakzones = { width: [ ], height: [ ] };

		(function() {
			get_breakzones_from_breakpoints( );
			display_breakzones_action_panel( );
		})();

		function display_breakzones_action_panel( ) {

			var resized_window;

			(function() {
				var panel = create_panel_element( );
				if ( breakpoints.width.length == 0 && breakpoints.height.length == 0 ) {
					panel.add_information_to_panel( 'No breakpoint found' );
				} else {
					for ( var j=0; j<breakzones.height.length; j++ ) {
						panel.add_resize_zone_to_panel( 'height', breakzones.height[ j ] );
						panel.add_break_line_to_panel( );
					}
					panel.add_resize_zone_to_panel( 'no', ' ' );
					for ( var i=breakzones.width.length-1; i>-1; i-- ) {
						panel.add_resize_zone_to_panel( 'width', breakzones.width[ i ] );
					}
					panel.add_break_line_to_panel( );
				}
			})();

			function create_panel_element( ) {

				// internal
				var panel = document.getElementById( 'panel_resize' );
				if ( panel == null ) {
					panel = document.createElement( 'div' );
					panel.setAttribute( 'id', 'panel_resize' );
					panel.setAttribute( 'style', 'position: fixed; bottom:10px; right: 10px; z-index: 999999; text-align: left;' );
					document.body.appendChild( panel );
				}

				// private panel methods
				function add_panel_element( element ) {
					element.setAttribute( 'style', 'text-align: center; background: rgba(0, 0, 0, 0.8); border-radius: 10px; padding: 10px; margin: 0 0 2px 2px; width: 100px; box-sizing: content-box; -moz-box-sizing: content-box; float: right; color: white; font-weight: normal; font-size: 16px; line-height: 16px; ' );
					panel.appendChild( element );
				}

				// public panel methods
				return {
					add_resize_zone_to_panel: function( direction, values ) {

						var values = values;

						(function() {
							var zone = document.createElement( 'span' );
							zone.innerHTML = '&nbsp;';
							for ( var i=0; i<values.length; i++ ) {
								zone.appendChild( create_resize_element( i ) );
							}
							add_panel_element( zone );
						})();

						function create_resize_element( i ) {

							var element;

							return (function() {
								if ( typeof( values[ i ] ) == 'number' ) {
									create_resize_button_element( i );
								} else {
									create_resize_text_element( );
								}
								element.innerHTML = values[ i ];
								element.setAttribute( 'style', 'color: white; float: ' + ( values.length == 1 ? 'none' : i == 0 ? 'left' : 'right' ) );
								return element;
							})();

							function create_resize_text_element( ) {
								element = document.createElement( 'span' );
							}

							function create_resize_button_element( ) {
								element = document.createElement( 'a' );
								element.setAttribute( 'href', 'javascript:;' );
								element.addEventListener( 'click', function( ) {
									var size = { };
									var alternate = direction == 'width' ? 'height' : 'width'; 
									var Direction = direction.charAt( 0 ).toUpperCase( ) + direction.substr( 1 );
									var Alternate = alternate.charAt( 0 ).toUpperCase( ) + alternate.substr( 1 );
									var existing_popup = ( resized_window != null && ! resized_window.closed );
									size[ alternate ] = 600;
									if ( existing_popup ) {
										size[ alternate ] = resized_window[ 'outer' + Alternate ];
										resized_window.close( );
									}
									resized_window = window.open( window.location + '#', 'resized', 'resizable,status=1,width=800,height=600' );
									var resize_popup = function( ) {
										var innerSize;
										if ( /AppleWebKit/.test(navigator.userAgent) ) {
											innerSize = resized_window.document.documentElement[ 'client' + Direction ];
										} else {
											innerSize = resized_window[ 'inner' + Direction ];
										}
										size[ direction ] = values[ i ] + resized_window[ 'outer' + Direction ] - innerSize;
										resized_window.resizeTo( size.width, size.height );
										resized_window.focus( );
									};
									var interval = setInterval( function( ) {
										if ( resized_window.document.readyState !== 'complete' ) {
											clearInterval( interval );
											resize_popup( );
										}
									}, 100);
								}, false );
							}
						}
					},
					add_information_to_panel: function( message ) {
						var information = document.createElement( 'span' );
						information.innerHTML = message;
						add_panel_element( information );
					},
					add_break_line_to_panel: function( ) {
						var br = document.createElement( 'br' );
						br.setAttribute( 'style', 'clear: both' );
						panel.appendChild( br );
					}
				}
			}
		}

		function get_breakzones_from_breakpoints( ) {

			(function() {
				format_breakzones_by_direction( 'width' );
				format_breakzones_by_direction( 'height' );
			})();

			function format_breakzones_by_direction( direction ) {
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
						breakzones[ direction ].push( zone );
						old = point;
					}
					breakzones[ direction ].push( [ old + 1, '&larr; ' + direction ] );
				}
			}
		}
	}
})();

