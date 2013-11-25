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
            var valuePixel;
            if (valueUnit == 'em') {
                valuePixel = valueNumber * getEmInPxRatio();
            } else if (valueUnit == 'px') {
                valuePixel =  valueNumber;
            }
            if (propertyOperator == 'max') {
                valuePixel = Math.floor(valuePixel+1);
            } else {
                valuePixel = Math.ceil(valuePixel);
            }
            return valuePixel;

            function getEmInPxRatio() {
                var html = document.documentElement;
                var style = html.getAttribute('style');
                html.setAttribute('style', style + ';font-size:1em !important');
                var baseline = parseFloat(getComputedStyle(html).fontSize);
                html.setAttribute('style', style);
                return baseline;
            }
        }
        
        function getCriticalSize(isSizeBeforeBreakpoint) {
            if (isSizeBeforeBreakpoint) {
                return valuePixel-1;
            }
            return valuePixel;
        }
        
        function getCriticalSizeEmLabel(isSizeBeforeBreakpoint) {
            if (isSizeBeforeBreakpoint && propertyOperator == 'min') {
                return value+"-";
            }
            if (!isSizeBeforeBreakpoint && propertyOperator == 'max') {
                return value+"+";
            }
            return value;
        }

        return {
            px: valuePixel,
            axis: propertyAxis,
            isValid: function isValid() {
                return ( valuePixel > 0 && typeof( propertyAxis ) != 'undefined' );
            },
            getCriticalSizeShortLabel: function getCriticalSizeShortLabel(isSizeBeforeBreakpoint) {
                if (valueUnit == 'em') {
                    return getCriticalSizeEmLabel(isSizeBeforeBreakpoint);
                }
                return getCriticalSize(isSizeBeforeBreakpoint);
            },
            getCriticalSizeLabel: function getCriticalSizeLabel(isSizeBeforeBreakpoint) {
                if (valueUnit == 'em') {
                    var label = getCriticalSizeEmLabel(isSizeBeforeBreakpoint);
                    return label+" ("+getCriticalSize(isSizeBeforeBreakpoint)+"px)";
                }
                return getCriticalSize(isSizeBeforeBreakpoint)+"px";
            },
            getCriticalSize: getCriticalSize,
            getMediaQuery: function getMediaQuery() {
                return mediaQuery;
            },
            isSizeMatch: function isSizeMatch(size) {
                if (propertyOperator == 'min') {
                    return valuePixel<=size;
                }
                return valuePixel>size;
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
                if (! panel) {
                    return;
                }
                if (axisList.width.length == 0 && axisList.height.length == 0) {
                    panel.addInformationToPanel('No breakpoint found');
                } else {
                    for (var j = 0; j < fluidZoneList.height.length; j++) {
                        panel.addFluidZoneToPanel('height', fluidZoneList.height[ j ], 'height');
                        panel.addBreakLineToPanel();
                    }
                    for (var i = fluidZoneList.width.length-1; i>=0 ; i--) {
                        panel.addFluidZoneToPanel('width', fluidZoneList.width[ i ], 'width');
                    }
                    panel.addBreakLineToPanel();
                }
            })();

            function createPanelElement() {

                var baseElementId = 'BreaqBookmarklet';
                var containerElementId = baseElementId+'Container';
                var controlElementId = baseElementId+'Control';
                var panelElementId = baseElementId+'Panel';
                var boxStyle = 'margin: 0 3px 2px; border: 0; padding: 10px; background: rgba(0, 0, 0, 0.8);';
                var textResetStyle = 'color: white; font-family: Arial, sans-serif;font-weight: normal; font-size: 14px; text-decoration: none;';

                // internal
                var container = document.getElementById(containerElementId);
                if (container !== null) {
                    return ;
                }
                container = document.createElement('div');
                container.setAttribute('id', containerElementId);
                
                var control = createControlElement();
                container.appendChild(control);
                
                var panel = createPanelElement();
                container.appendChild(panel);
                document.body.appendChild(container);

                // private panel methods
                function createControlElement() {
                    var control = document.createElement('div');
                    control.setAttribute('id', controlElementId);
                    control.setAttribute('style', 'position: fixed; top:10px; left: 10px; z-index: 999999;');    
                    addLinktoPanel('Breaq', 'http://tzi.fr/CSS/Responsive/Breaq-bookmarklet', 'See official project page', control);
   
                    var closeButton = document.createElement('a');
                    closeButton.setAttribute('href', 'javascript:;');
                    closeButton.setAttribute('title', 'Close BreaqBookmarklet');
                    closeButton.addEventListener('click', function () {
                        var container = document.getElementById(containerElementId);
                        if (container !== null) {
                            container.parentNode.removeChild(container);
                        }
                    }, false);
                    closeButton.innerHTML = 'close';
                    addPanelElement(closeButton, control);

                    return control;
                }
                
                function createPanelElement() {
                    panel = document.createElement('div');
                    panel.setAttribute('id', panelElementId);
                    panel.setAttribute('style', 'position: fixed; bottom:10px; right: 10px; z-index: 999999;');
                    return panel;
                }
                
                function addPanelElement(element, parent) {
                    if (typeof parent =='undefined') {
                        parent = panel;
                    }
                    element.setAttribute('style', boxStyle+' display: inline-block; min-width: 80px; box-sizing: content-box; -moz-box-sizing: content-box; text-align: center; '+textResetStyle);
                    parent.appendChild(element);
                }

                function addInformationToPanel(message, parent) {
                    var information = document.createElement('span');
                    information.innerHTML = message;
                    addPanelElement(information, parent);
                }

                function addLinktoPanel(label, href, title, parent) {
                    link = document.createElement('a');
                    link.setAttribute('href', href);
                    link.setAttribute('target', '_blank');
                    link.setAttribute('title', title);
                    link.innerHTML = label;
                    addPanelElement(link, parent);
                }

                function addBreakLineToPanel() {
                    var br = document.createElement('br');
                    br.setAttribute('style', 'clear: both');
                    panel.appendChild(br);
                }

                // public panel methods
                return {
                    addFluidZoneToPanel: function (direction, zoneBreakpointList, direction) {

                        (function () {
                            var zone = document.createElement('span');
                            zone.innerHTML = '&#160;';
                            var initialIndex = zoneBreakpointList.length-1;
                            for (var i=initialIndex; i>=0; i--) {
                                var element = createResizeElement(i);
                                if (element) {
                                    panel.appendChild(createResizeElement(i));
                                }
                            }
                        })();

                        function createResizeElement(i) {

                            var element;

                            return (function () {
                                var style = boxStyle+' float: right;'+textResetStyle;
                                if (typeof( zoneBreakpointList[ i ] ) == 'object' && zoneBreakpointList[ i ] !== null) {
                                    var isSingleSize = (zoneBreakpointList.length==1);
                                    var isSizeBeforeBreakpoint = (i==1 || isSingleSize);
                                    createResizeButtonElement(zoneBreakpointList[i], isSizeBeforeBreakpoint);
                                    element.innerHTML = zoneBreakpointList[ i ].getCriticalSizeShortLabel(isSizeBeforeBreakpoint);
                                    style += 'border-radius: '+(isSingleSize?'10px':isSizeBeforeBreakpoint?'0 10px 10px 0':'10px 0 0 10px')+';';
                                    if (isSingleSize || isSizeBeforeBreakpoint) {
                                        style += 'margin-right: 0;';
                                    }
                                    if (isSingleSize || !isSizeBeforeBreakpoint) {
                                        style += 'margin-left: 0;';
                                    }
                                } else if (zoneBreakpointList[ i ]) {
                                    createResizeTextElement();
                                    element.innerHTML = zoneBreakpointList[ i ];
                                }
                                if (element) {
                                    element.setAttribute('style', style);
                                    return element;
                                }
                            })();

                            function createResizeTextElement() {
                                element = document.createElement('span');
                            }

                            function createResizeButtonElement(breakpoint, isSizeBeforeBreakpoint) {
                                var targetSize = breakpoint.getCriticalSize(isSizeBeforeBreakpoint);
                                element = document.createElement('a');
                                element.setAttribute('href', 'javascript:;');
                                element.setAttribute('title', 'Resize the '+breakpoint.axis+' to '+breakpoint.getCriticalSizeLabel(isSizeBeforeBreakpoint)+' '+(breakpoint.isSizeMatch(targetSize)?'':'not ')+'to match: '+breakpoint.getMediaQuery());
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
                                    var resizePopup = function resizePopup() {
                                        var innerSize = resizedWindow[ 'inner' + Direction ];
                                        size[ direction ] = targetSize + resizedWindow[ 'outer' + Direction ] - innerSize;
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
                    addInformationToPanel: addInformationToPanel,
                    addLinktoPanel: addLinktoPanel,
                    addBreakLineToPanel: addBreakLineToPanel
                }
            }
        }
    }
})();

