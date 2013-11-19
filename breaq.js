(function () {

    var axisList = { width: [ ], height: [ ] };

    (function () {
        getAxisBreakpoints();
        createActionPanel( );
    })();

    function Breakpoint(mediaSizeSelector) {

        var mediaQuery = initMediaQuery();
        var property = initProperty();
        var propertyAxis = initPropertyAxis();
        var propertyOperator = initPropertyOperator();
        var value = initValue();
        var valueUnit = initValueUnit();
        var valueNumber = initValueNumber();
        var valuePixel = initValuePixel();

        function initMediaQuery() {
            return mediaSizeSelector.split(')')[ 0 ].trim();
        }

        function initProperty() {
            return mediaQuery.split(':')[ 0 ].trim();
        }

        function initPropertyAxis() {
            if (property == 'max-width' || property == 'min-width') {
                return 'width';
            }
            if (property == 'max-height' || property == 'min-height') {
                return 'height';
            }
        }

        function initPropertyOperator() {
            if (property == 'max-height' || property == 'max-width') {
                return 'max';
            }
            if (property == 'min-height' || property == 'min-width') {
                return 'min';
            }
        }

        function initValue() {
            return mediaQuery.split(':')[ 1 ].trim();
        }

        function initValueUnit() {
            return value.replace(/[\d\.]/g, '');
        }

        function initValueNumber() {
            return Number(value.replace(/[^\d\.]/g, ''));
        }

        function initValuePixel() {
            if (valueUnit == 'em') {
                return roundPixel(valueNumber * getEmInPxRatio());
            } else if (valueUnit == 'px') {
                if (propertyOperator == 'max') {
                    return valueNumber+1;
                }
                return valueNumber;
            }

            function roundPixel(number) {
                return Math.ceil(number);
            }

            function getEmInPxRatio() {
                var html = document.documentElement;
                var style = html.getAttribute('style');
                html.setAttribute('style', style + ';font-size:1em !important');
                var baseline = parseFloat(getComputedStyle(html).fontSize);
                html.setAttribute('style', style);
                return baseline;
            }
        }

        return {
            px: valuePixel,
            axis: propertyAxis,
            isValid: function isValid() {
                return ( valuePixel > 0 && typeof( propertyAxis ) != 'undefined' );
            },
            getLabel: function getLabel(isBeforeBreakpoint) {
                if (valueUnit == 'em') {
                    if (isBeforeBreakpoint && propertyOperator == 'min') {
                        return value+"-";
                    }
                    if (!isBeforeBreakpoint && propertyOperator == 'max') {
                        return value+"+";
                    }
                    return value;
                }
                if (isBeforeBreakpoint) {
                    return valuePixel-1;
                }
                return valuePixel;
            },
            getCriticalSize: function getCriticalSize(isBeforeBreakpoint) {
                if (isBeforeBreakpoint) {
                    return valuePixel-1;
                }
                return valuePixel;
            },
            getMediaQuery: function getMediaQuery() {
                return mediaQuery;
            }
        };
    };

    function getAxisBreakpoints() {

        var breakpointList = [ ];

        (function () {
            parseCssGetBreakpoints();
            var indexs = { width: [ ], height: [ ] };
            for (var i = 0; i < breakpointList.length; i++) {
                var breakpoint = breakpointList[i];
                if (breakpoint.isValid() && typeof indexs[ breakpoint.axis ][ breakpoint.px ] == 'undefined') {
                    axisList[ breakpoint.axis ].push(breakpoint);
                    indexs[ breakpoint.axis ][ breakpoint.px ] = axisList[ breakpoint.axis ].length - 1;
                }
            }
            axisList.width = axisList.width.sort(function (a, b) {
                return a.px - b.px;
            });
            axisList.height = axisList.height.sort(function (a, b) {
                return a.px - b.px;
            });
        })();

        function parseCssGetBreakpoints() {

            (function () {
                var mediaSelectorList = parseCssGetMediaSelectors();
                for (var i = 0; i < mediaSelectorList.length; i++) {
                    getBreakpointsFromMediaSelector(mediaSelectorList[ i ]);
                }
            })();

            function parseCssGetMediaSelectors() {

                return (function () {
                    var ruleList = parseCssGetRules();
                    var mediaSelectorList = [ ];
                    for (var i = 0; i < ruleList.length; i++) {
                        if (isMediaRule(ruleList[ i ])) {
                            mediaSelectorList.push(ruleList[ i ].media.mediaText);
                        }
                    }
                    return mediaSelectorList;
                })();

                function parseCssGetRules() {
                    var ruleList = [ ];
                    for (var i = 0; i < document.styleSheets.length; i++) {
                        try {
                            for (var j = 0; j < document.styleSheets[ i ].cssRules.length; j++) {
                                ruleList.push(document.styleSheets[ i ].cssRules[ j ]);
                            }
                        } catch (exception) {
                            // External stylesheet
                        }
                    }
                    return ruleList;
                }

                function isMediaRule(rule) {
                    return ( typeof( rule.media ) != 'undefined' );
                }
            }

            function getBreakpointsFromMediaSelector(mediaSelector) {

                (function () {
                    var mediaSelectorPartList = mediaSelector.split('(');
                    for (var i = 1; i < mediaSelectorPartList.length; i++) {
                        if (isMediaRulePartASizeSelector(mediaSelectorPartList[ i ])) {
                            breakpointList.push(Breakpoint(mediaSelectorPartList[ i ]));
                        }
                    }
                })();

                function isMediaRulePartASizeSelector(mediaSelectorPart) {
                    return ( mediaSelectorPart.indexOf(':') != -1 );
                }
            }
        }
    }

    function createActionPanel() {

        var fluidZoneList = { width: [ ], height: [ ] };

        (function () {
            getFluidZonesFromBreakpoints();
            displayFluidZonesActionPanel();
        })();

        function getFluidZonesFromBreakpoints() {

            (function () {
                formatFluidZonesByDirection('width');
                formatFluidZonesByDirection('height');
            })();

            function formatFluidZonesByDirection(direction) {
                if (axisList[ direction ].length != 0) {
                    var previousBreakpoint;
                    for (var i = 0; i < axisList[ direction ].length; i++) {
                        var breakpoint = axisList[ direction ][ i ];
                        var zone = [ ];
                        if (previousBreakpoint == null) {
                            zone.push(null);
                        } else if (previousBreakpoint.px + 1 != breakpoint.px) {
                            zone.push(previousBreakpoint);
                        }
                        zone.push(breakpoint);
                        fluidZoneList[ direction ].push(zone);
                        previousBreakpoint = breakpoint;
                    }
                    fluidZoneList[ direction ].push([ previousBreakpoint, '&#8592; ' + direction ]);
                }
            }
        }

        function displayFluidZonesActionPanel() {

            var resizedWindow;

            (function () {
                var panel = createPanelElement();
                if (axisList.width.length == 0 && axisList.height.length == 0) {
                    panel.addInformationToPanel('No breakpoint found');
                } else {
                    for (var j = 0; j < fluidZoneList.height.length; j++) {
                        panel.addFluidZoneToPanel('height', fluidZoneList.height[ j ]);
                        panel.addBreakLineToPanel();
                    }
                    panel.addFluidZoneToPanel('no', ['Breaq'], 'http://tzi.fr/CSS/Responsive/Breaq-bookmarklet');
                    for (var i = fluidZoneList.width.length - 1; i > -1; i--) {
                        panel.addFluidZoneToPanel('width', fluidZoneList.width[ i ]);
                    }
                    panel.addBreakLineToPanel();
                }
            })();

            function createPanelElement() {

                // internal
                var panel = document.getElementById('panelResize');
                if (panel == null) {
                    panel = document.createElement('div');
                    panel.setAttribute('id', 'panelResize');
                    panel.setAttribute('style', 'position: fixed; bottom:10px; right: 10px; z-index: 999999; text-align: left;');
                    document.body.appendChild(panel);
                }

                // private panel methods
                function addPanelElement(element) {
                    element.setAttribute('style', 'text-align: center; background: rgba(0, 0, 0, 0.8); border-radius: 10px; padding: 10px; margin: 0 0 2px 2px; min-width: 80px; box-sizing: content-box; -moz-box-sizing: content-box; float: right; color: white; font-weight: normal; font-size: 16px; line-height: 16px; ');
                    panel.appendChild(element);
                }

                // public panel methods
                return {
                    addFluidZoneToPanel: function (direction, values, href) {

                        (function () {
                            var zone = document.createElement('span');
                            zone.innerHTML = '&#160;';
                            for (var i = 0; i < values.length; i++) {
                                zone.appendChild(createResizeElement(i));
                            }
                            addPanelElement(zone);
                        })();

                        function createResizeElement(i) {

                            var element;

                            return (function () {
                                if (typeof( values[ i ] ) == 'object' && values[ i ] !== null) {
                                    isBeforeBreakpoint = (i==1 || values.length==1);
                                    createResizeButtonElement(values[i], isBeforeBreakpoint);
                                    element.innerHTML = values[ i ].getLabel(isBeforeBreakpoint);
                                } else {
                                    if (href) {
                                        createResizeLinkElement();
                                    } else {
                                        createResizeTextElement();
                                    }
                                    element.innerHTML = values[ i ];
                                }
                                element.setAttribute('style', 'color: white; font-weight: bold; font-size: 16px; text-decoration: none; border: 0; float: ' + ( values.length == 1 ? 'none' : i == 0 ? 'left' : 'right' ));
                                return element;
                            })();

                            function createResizeLinkElement() {
                                element = document.createElement('a');
                                element.setAttribute('href', href);
                                element.setAttribute('target', '_blank');
                            }

                            function createResizeTextElement() {
                                element = document.createElement('span');
                            }

                            function createResizeButtonElement(breakpoint, isBeforeBreakpoint) {
                                element = document.createElement('a');
                                element.setAttribute('href', 'javascript:;');
                                element.setAttribute('title', breakpoint.getCriticalSize(isBeforeBreakpoint)+"px | "+breakpoint.getMediaQuery());
                                element.addEventListener('click', function () {
                                    var size = { };
                                    var alternate = direction == 'width' ? 'height' : 'width';
                                    var Direction = direction.charAt(0).toUpperCase() + direction.substr(1);
                                    var Alternate = alternate.charAt(0).toUpperCase() + alternate.substr(1);
                                    var existingPopup = ( resizedWindow != null && !resizedWindow.closed );
                                    size[ alternate ] = 600;
                                    if (existingPopup) {
                                        size[ alternate ] = resizedWindow[ 'outer' + Alternate ];
                                        resizedWindow.close();
                                    }
                                    resizedWindow = window.open(window.location + '#', 'resized', 'resizable,scrollbars=1,width=800,height=600');
                                    var resizePopup = function () {
                                        var innerSize;
                                        if (/AppleWebKit/.test(navigator.userAgent)) {
                                            innerSize = resizedWindow.document.documentElement[ 'client' + Direction ];
                                        } else {
                                            innerSize = resizedWindow[ 'inner' + Direction ];
                                        }
                                        size[ direction ] = breakpoint.getCriticalSize(isBeforeBreakpoint) + resizedWindow[ 'outer' + Direction ] - innerSize;
                                        resizedWindow.resizeTo(size.width, size.height);
                                        resizedWindow.focus();
                                    };
                                    var interval = setInterval(function () {
                                        if (resizedWindow.document.readyState == 'complete') {
                                            clearInterval(interval);
                                            resizePopup();
                                        }
                                    }, 100);
                                }, false);
                            }
                        }
                    },
                    addInformationToPanel: function (message) {
                        var information = document.createElement('span');
                        information.innerHTML = message;
                        addPanelElement(information);
                    },
                    addBreakLineToPanel: function () {
                        var br = document.createElement('br');
                        br.setAttribute('style', 'clear: both');
                        panel.appendChild(br);
                    }
                }
            }
        }
    }
})();

