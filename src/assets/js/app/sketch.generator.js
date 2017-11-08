var appJs = {
    // |-> ## App Configurations
    config: {
        sketchCanv: "sketchCanv",
        sketchContainerSelector: "#sketchContainer",
        maxCanvasSize: 1024,
        minCanvasSize: 450,
        gridSize: 16,
        isBusy: false,
        colors: {
            backColor: "#f5f5f5",
            freeDrawBackColor: "#ccdddb",
            streetColor: "#3a3a42", //"#e6e6e6",
            streetBorder: "#3a3a42",
            buildingColor: "white",
            objectBorder: "#666666",
            mainServiceLine: "#ff00e1",
            measurementLine: "#47c1ff",
            measurementTopLine: "#ff00e1",
            controlPointFill: "white",
            controlPointStroke: "#666",
            gridColor: "#ccc",
            gridDrawingColor: "#ff7f7f"
        }
    },

    // |-> ## Canvas and Sketch Operations
    canvas: {
        // Canvas object
        canvasObject: null,

        // Init and binding
        initCanvas: function () {
            fabric.Object.prototype.objectCaching = false;
            this.canvasObject = window._canvas = new fabric.Canvas(app.config.sketchCanv, {
                imageSmoothingEnabled: false,
                renderOnAddRemove: false,
                stateful: false,
                hoverCursor: "pointer",
                selection: false,
                isDrawingMode: false // Set that to true for hand drawing
            });

            app.canvas.bindCanvasEvents();

            // Init Free Drawing Values
            app.canvas.canvasObject.freeDrawingBrush.width = 5;
            app.canvas.canvasObject.freeDrawingBrush.color = "rgba(255, 0, 0, 0.5)";
        },
        bindCanvasEvents: function () {
            this.canvasObject.on("object:moving", function (e) {
                window._target = e.target;
                const p = e.target;
                const origin = app.sketch.sketchObject.service.sub.customRadious;
                p.line1 && p.line1.set({ "x2": p.left + origin, "y2": p.top + origin });
                p.line2 && p.line2.set({ "x1": p.left + origin, "y1": p.top + origin });
                p.line3 && p.line3.set({ "x1": p.left + origin, "y1": p.top + origin });
                p.line4 && p.line4.set({ "x1": p.left + origin, "y1": p.top + origin });

                if (p.line1) {
                    app.sketch.sketchObject.service.sub.customCoords[e.target.id].x1 = p.line1.x1;
                    app.sketch.sketchObject.service.sub.customCoords[e.target.id].y1 = p.line1.y1;
                    app.sketch.sketchObject.service.sub.customCoords[e.target.id].x2 = p.line1.x2;
                    app.sketch.sketchObject.service.sub.customCoords[e.target.id].y2 = p.line1.y2;
                }

                if (p.line2) {
                    app.sketch.sketchObject.service.sub.customCoords[e.target.id + 1].x1 = p.line2.x1;
                    app.sketch.sketchObject.service.sub.customCoords[e.target.id + 1].y1 = p.line2.y1;
                    app.sketch.sketchObject.service.sub.customCoords[e.target.id + 1].x2 = p.line2.x2;
                    app.sketch.sketchObject.service.sub.customCoords[e.target.id + 1].y2 = p.line2.y2;
                }
            });

            this.canvasObject.on("path:created", function (opt) {
                opt.path.id = opt.path.xid = `path_${fabric.Object.__uid++}`;
                opt.path.type = "path";

                app.sketch.sketchObject.paths.push(opt.path);
                app.canvas.finalizeRendering();
            });

            this.canvasObject.on("object:selected", function () {
                if (app.canvas.canvasObject.getActiveObject().type === "path")
                    $("#freeDrawingPanel").removeClass("inactivePanel").addClass("activePanel");
                else
                    $("#freeDrawingPanel").removeClass("activePanel").addClass("inactivePanel");
            });

            this.canvasObject.on("before:selection:cleared", function () {
                $("#freeDrawingPanel").removeClass("activePanel").addClass("inactivePanel");
            });
        },

        // Plotting operations
        plotGrid: function () {
            const grid = app.config.gridSize;
            const gridArray = [];
            app.canvas.canvasObject.renderOnAddRemove = false;

            for (let i = 0; i < (app.sketch.sketchObject.canvas.width / grid); i++)
                gridArray.push(new fabric.Line([i * grid, 0, i * grid, app.sketch.sketchObject.canvas.height], { stroke: app.config.colors.gridColor, strokeWidth: 0.5, selectable: false }));

            for (let i = 0; i < (app.sketch.sketchObject.canvas.height / grid); i++)
                gridArray.push(new fabric.Line([0, i * grid, app.sketch.sketchObject.canvas.width, i * grid], { stroke: app.config.colors.gridColor, strokeWidth: 0.5, selectable: false }));

            const gridGroup = new fabric.Group(gridArray,
                {
                    id: "grid",
                    selectable: false,
                    objectCaching: false
                });
            app.canvas.canvasObject.add(gridGroup);
        },

        plotText: function (text, color, x, y, isVertical, isCentered, isSmallerFont, backgroundColor) {
            let calcFontSize = (app.sketch.sketchObject.canvas.margin / (isSmallerFont ? 2.5 : 1.5)).toFixed(2) / 1;
            calcFontSize = calcFontSize < 10 ? 10 : calcFontSize;

            const txt = new fabric.Text(text, {
                fontFamily: "Arial",
                fill: color,
                fontSize: calcFontSize,
                textAlign: "center",
                left: x,
                top: y,
                angle: isVertical ? 90 : 0,
                selectable: false,
                hasControls: true,
                hasRotatingPoint: false,
                objectCaching: false,
                textBackgroundColor: backgroundColor
            });

            if (isCentered) {
                txt.left -= txt.getBoundingRectWidth() / 2;
                txt.top -= txt.getBoundingRectHeight() / 2;
            }

            this.canvasObject.add(txt);
        },
        plotRectangle: function (cord, thickness, fillColor, fillOpacity, borderColor, fillPattern) {
            var rect = new fabric.Rect({
                top: cord.top,
                left: cord.left,
                width: cord.width,
                height: cord.height,
                fill: fillColor,
                stroke: borderColor,
                strokeWidth: thickness,
                opacity: fillOpacity,
                selectable: false,
                objectCaching: false
            });
            this.canvasObject.add(rect);

            if (fillPattern) {
                fabric.util.loadImage("assets/images/tile.jpg", function (img) {
                    rect.set("fill", new fabric.Pattern({ source: img, repeat: "repeat" }));
                    app.canvas.finalizeRendering();
                });
            };
        },
        plotLine: function (cord, thickness, fillColor, isDashed) {
            this.canvasObject.add(new fabric.Line([cord.x1, cord.y1, cord.x2, cord.y2], {
                strokeWidth: thickness,
                strokeDashArray: isDashed ? [thickness * 4, thickness * 2] : [],
                stroke: fillColor,
                objectCaching: false,
                selectable: false
            }));
        },
        plotMeasurementLine: function (cord, thickness, fillColor, isDashed, measurementText, isHorizontal) {
            const lines = [];

            // Main line
            lines.push(new fabric.Line([cord.x1, cord.y1, cord.x2, cord.y2],
                {
                    strokeWidth: thickness,
                    strokeDashArray: isDashed ? [thickness * 4, thickness * 2] : [],
                    stroke: fillColor,
                    selectable: false
                }));

            if (isHorizontal) {
                lines.push(new fabric.Line([cord.x1 - app.sketch.sketchObject.canvas.margin / 2, cord.y1, cord.x2 + app.sketch.sketchObject.canvas.margin / 2, cord.y1],
                    {
                        strokeWidth: thickness,
                        strokeDashArray: isDashed ? [thickness * 4, thickness * 2] : [],
                        stroke: app.helper.shadeColor(app.config.colors.measurementTopLine, 50),
                        selectable: false
                    }));

                lines.push(new fabric.Line([cord.x1 - app.sketch.sketchObject.canvas.margin / 2, cord.y2, cord.x2 + app.sketch.sketchObject.canvas.margin / 2, cord.y2],
                    {
                        strokeWidth: thickness,
                        strokeDashArray: isDashed ? [thickness * 4, thickness * 2] : [],
                        stroke: app.helper.shadeColor(app.config.colors.measurementTopLine, 50),
                        selectable: false
                    }));

                app.canvas.canvasObject.add(new fabric.Group(lines,
                    {
                        selectable: false,
                        objectCaching: false,
                        opacity: 1
                    }));

                app.canvas.plotText(` ${measurementText} `, "white", cord.x1, cord.y1 + ((cord.y2 - cord.y1) / 2), false, true, true, "black");
            } else {
                lines.push(new fabric.Line([cord.x1, cord.y1 - app.sketch.sketchObject.canvas.margin / 2, cord.x1, cord.y1 + app.sketch.sketchObject.canvas.margin / 2],
                    {
                        strokeWidth: thickness,
                        strokeDashArray: isDashed ? [thickness * 4, thickness * 2] : [],
                        stroke: app.helper.shadeColor(app.config.colors.measurementTopLine, 50),
                        selectable: false
                    }));

                lines.push(new fabric.Line([cord.x2, cord.y2 - app.sketch.sketchObject.canvas.margin / 2, cord.x2, cord.y2 + app.sketch.sketchObject.canvas.margin / 2],
                    {
                        strokeWidth: thickness,
                        strokeDashArray: isDashed ? [thickness * 4, thickness * 2] : [],
                        stroke: app.helper.shadeColor(app.config.colors.measurementTopLine, 50),
                        selectable: false
                    }));

                app.canvas.canvasObject.add(new fabric.Group(lines,
                    {
                        selectable: false,
                        objectCaching: false,
                        opacity: 1
                    }));

                app.canvas.plotText(` ${measurementText} `, "white", cord.x1 + ((cord.x2 - cord.x1) / 2), cord.y1, false, true, true, "black");
            }
        },

        plotControlPoints: function (points, thickness, fillColor, isDashed) {
            var i;
            for (i = 0; i < points.length; i++) {
                const line = new fabric.Line([points[i].x1, points[i].y1, points[i].x2, points[i].y2], {
                    strokeWidth: thickness,
                    strokeDashArray: isDashed ? [thickness * 4, thickness * 2] : [],
                    stroke: fillColor,
                    selectable: false,
                    id: i
                });

                app.sketch.sketchObject.service.sub.customLines.push(line);
                this.canvasObject.add(line);
            };

            for (i = 0; i < points.length; i++) {
                app.canvas.plotControlCircle(points[i].x2, points[i].y2, app.sketch.sketchObject.service.sub.customLines[i], app.sketch.sketchObject.service.sub.customLines[i + 1], i);
            }
        },
        plotControlCircle: function (left, top, line1, line2, i) {
            this.canvasObject.add(new fabric.Circle({
                left: left - app.sketch.sketchObject.service.sub.customRadious,
                top: top - app.sketch.sketchObject.service.sub.customRadious,
                strokeWidth: app.sketch.sketchObject.streets.borderThickness,
                radius: app.sketch.sketchObject.service.sub.customRadious,
                fill: app.config.colors.controlPointFill,
                stroke: app.config.colors.controlPointStroke,
                hasControls: false,
                hasBorders: false,
                line1: line1,
                line2: line2,
                id: i
            }));
        },

        // Canvas operations
        clearCanvas: function () {
            this.canvasObject.clear();
            this.canvasObject.backgroundColor = app.config.colors.backColor;
            this.plotGrid();
            app.canvas.finalizeRendering();
        },
        clearPaths: function () {
            var i = app.canvas.canvasObject._objects.length;
            while (i--) {
                const path = app.canvas.canvasObject._objects[i];
                if (path && path.type && path.type === "path")
                    app.canvas.canvasObject._objects[i].remove();
            }

            app.canvas.finalizeRendering();
        },
        eraseSelectedPath: function () {
            if (app.canvas.canvasObject.getActiveObject() && app.canvas.canvasObject.getActiveObject().type === "path") {
                app.sketch.sketchObject.paths.forEach(function (item, index, list) {
                    if (item.id === app.canvas.canvasObject.getActiveObject().id)
                        list.splice(index, 1);
                });
                app.canvas.canvasObject.getActiveObject().remove();
                app.canvas.finalizeRendering();
            }
        },
        toggleFreeDrawing: function (isEnabled) {
            app.canvas.canvasObject.discardActiveObject();
            app.canvas.canvasObject.isDrawingMode = isEnabled;
            app.canvas.changeGridMode(isEnabled);
            app.canvas.finalizeRendering();
        },
        changeGridMode: function (isFreeDrawingMode) {
            app.canvas.canvasObject._objects.forEach(function (item) {
                if (item.type === "group" && item.id === "grid")
                    item._objects.forEach(function (line) {
                        line.stroke = isFreeDrawingMode ? app.config.colors.gridDrawingColor : app.config.colors.gridColor;
                    });
            });
        },
        toggleGrid: function (isVisible) {
            app.canvas.canvasObject._objects.forEach(function (item) {
                if (item.type === "group" && item.id === "grid")
                    item.opacity = isVisible ? 1 : 0;
            });
        },
        finalizeRendering: function () {
            app.ui.updateSkecthCalcPanel();
            app.canvas.canvasObject.renderAll();
            app.canvas.canvasObject.renderAll.bind(app.canvas.canvasObject)();
        }
    },
    sketch: {
        // ## Sketch Object: contains all measurements and dimensions of objects to be plotted.
        sketchObject: {
            isImported: false,
            isFreeDrawing: false,
            input: { params: {}, customer: {}, site: {}, main: {}, sideMain: {} },
            canvas: {},
            streets: { mainStreet: {}, sideStreet: {} },
            building: { main: {}, garage: {} },
            service: { main: { tap: {} }, sub: { extension: {}, customCoords: [], customLines: [] } },
            paths: []
        },

        // ## Render Sketch: clear the canvas and draw all objects.
        plotSketchElements: function () { // Plot sketch elements on the canvas, such as streets and buildings
            this.sketchStreets();
            this.sketchBuilding();
            this.sketchMainServiceLine();
            this.sketchSubServiceLine();
            this.sketchMeasurements();
            this.sketchHandDrawing();
            app.canvas.finalizeRendering();
        },
        // ## Recalculate Skitch: determine the port size and recalculate all objects coordinates and dimensions.
        recalculateSkitch: function (isImporting) {
            if (!isImporting) { // If we are loading a sketch JSON, preserve the dimensions to generate that JSON and use it dispite the current dimensions.
                // Canvas dimensions
                this.sketchObject.canvas.width = ($(app.config.sketchContainerSelector).width() * 80 / 100);    // Set the canvas width to 80% of the parent container
                this.sketchObject.canvas.width = this.sketchObject.canvas.width > app.config.maxCanvasSize      // Max canvas size can be 1024
                    ? app.config.maxCanvasSize
                    : this.sketchObject.canvas.width;
                this.sketchObject.canvas.width = this.sketchObject.canvas.width < app.config.minCanvasSize      // Minimum canvas size is 450
                    ? app.config.minCanvasSize
                    : this.sketchObject.canvas.width;

                this.sketchObject.canvas.height = this.sketchObject.canvas.width / 4 * 3;                       // Calculate the height based on width using 4:3 aspect ration
                this.sketchObject.canvas.margin = this.sketchObject.canvas.width * 3 / 100;                     // Margin space on each edge to leave blank before draw objects. Percentage is 3%
            }

            // Streets dimensions
            this.sketchObject.streets.horizontalWidth = this.sketchObject.canvas.width * 18 / 100;              // The width of main street. Percentage is 18% of canvas width
            this.sketchObject.streets.verticalWidth = this.sketchObject.canvas.width * 15 / 100;                // The width of side street. Percentage is 15%  of canvas width
            this.sketchObject.streets.borderThickness = this.sketchObject.canvas.width * 0.15 / 100;            // The width of side street. Percentage is 0.15%  of canvas width

            // Building dimensions
            this.sketchObject.building.main.width = this.sketchObject.canvas.width * 20 / 100;
            this.sketchObject.building.main.height = this.sketchObject.canvas.height * 22 / 100;
            this.sketchObject.building.garage.width = this.sketchObject.building.main.width / 2;
            this.sketchObject.building.garage.height = this.sketchObject.building.main.height / 2;

            // Service Lines dimensions
            this.sketchObject.service.main.thickness = this.sketchObject.canvas.width * 0.3 / 100;
            this.sketchObject.service.sub.thickness = this.sketchObject.canvas.width * 0.2 / 100;
            this.sketchObject.service.sub.customRadious = this.sketchObject.canvas.width * 0.5 / 100;

            // Measurement line
            this.sketchObject.service.main.measurementThickness = this.sketchObject.canvas.width * 0.15 / 100;
        },
        // ## Resize Skitch: Resize canvas area based on container size.
        resizeSkitch: function () {
            app.canvas.canvasObject.setDimensions({ width: this.sketchObject.canvas.width, height: this.sketchObject.canvas.height });
        },
        // ## Clear canvas, custom objects array, and plot sketch elements from scratch
        resetSketch: function () {
            app.canvas.clearCanvas();
            app.ui.toggleFreeDrawingUI(false);
            app.sketch.sketchObject.paths = [];
            app.sketch.sketchObject.service.sub.customCoords = [];
        },

        // ## Skitch Streets: Based on parameters, determine streets coordinates and dimension
        sketchStreets: function () {
            this.sketchObject.streets.mainStreet = {
                top: this.sketchObject.canvas.height - (this.sketchObject.canvas.margin * 2) - this.sketchObject.streets.horizontalWidth,
                height: this.sketchObject.streets.horizontalWidth
            };

            this.sketchObject.streets.sideStreet = {
                top: this.sketchObject.canvas.margin,
                height: this.sketchObject.canvas.height - (this.sketchObject.canvas.margin * 2),
                width: this.sketchObject.streets.verticalWidth
            };

            // Switch on the street template to calculate street position (Top, Left, Wdith, Height)
            switch (this.sketchObject.input.params.streetTemplate) {
                case 1: // Standard Right -> Main street bottom and side street on the right
                    this.sketchObject.streets.sideStreet.left = this.sketchObject.canvas.width - this.sketchObject.streets.sideStreet.width - (this.sketchObject.canvas.margin * 2);

                    this.sketchObject.streets.mainStreet.left = this.sketchObject.canvas.margin;
                    this.sketchObject.streets.mainStreet.width = this.sketchObject.canvas.width - this.sketchObject.streets.sideStreet.width - (this.sketchObject.canvas.margin * 3);
                    break;
                case 2: // Standard Left -> Main street bottom and side street on the left
                    this.sketchObject.streets.sideStreet.left = (this.sketchObject.canvas.margin * 2);

                    this.sketchObject.streets.mainStreet.left = this.sketchObject.streets.sideStreet.left + this.sketchObject.streets.sideStreet.width;
                    this.sketchObject.streets.mainStreet.width = this.sketchObject.canvas.width - this.sketchObject.streets.sideStreet.left - this.sketchObject.streets.sideStreet.width - this.sketchObject.canvas.margin;
                    break;
                case 3: // Other -> Main street bottom and no side streets
                    this.sketchObject.streets.mainStreet.left = this.sketchObject.canvas.margin;
                    this.sketchObject.streets.mainStreet.width = this.sketchObject.canvas.width - this.sketchObject.streets.mainStreet.left - this.sketchObject.canvas.margin;
                    break;
                default:
            };

            if (this.sketchObject.input.params.streetTemplate === 1 || this.sketchObject.input.params.streetTemplate === 2) {

                app.canvas.plotRectangle(this.sketchObject.streets.sideStreet, this.sketchObject.streets.borderThickness, app.config.colors.streetColor, 1, app.config.colors.streetBorder, true);
                app.canvas.plotText(app.helper.parseAddress(app.sketch.sketchObject.input.site.nearestStreetName).street, "white",
                    (this.sketchObject.streets.sideStreet.left + (this.sketchObject.streets.sideStreet.width / 2) + (app.sketch.sketchObject.canvas.margin / 1.5)).toFixed(1) / 1,
                    (this.sketchObject.streets.sideStreet.top + (this.sketchObject.streets.sideStreet.height / 2)).toFixed(1) / 1, true, true);
            }

            app.canvas.plotRectangle(this.sketchObject.streets.mainStreet, this.sketchObject.streets.borderThickness, app.config.colors.streetColor, 1, app.config.colors.streetBorder, true);
            app.canvas.plotText(app.helper.parseAddress(app.sketch.sketchObject.input.customer.streetAddress).street, "white",
                (this.sketchObject.streets.mainStreet.left + this.sketchObject.canvas.margin).toFixed(1) / 1,
                (this.sketchObject.streets.mainStreet.top + (this.sketchObject.streets.mainStreet.height / 2) - (app.sketch.sketchObject.canvas.margin / 1.5)).toFixed(1) / 1, false, false);
        },
        // ## Skitch Building: Based on parameters, determine building coordinates and dimensions
        sketchBuilding: function () {
            switch (this.sketchObject.input.params.streetTemplate) {
                case 1: // Standard Right -> Main street bottom and side street on the right
                    this.sketchObject.building.main.left = (this.sketchObject.canvas.width / 2) - this.sketchObject.streets.verticalWidth - this.sketchObject.building.main.width / 2;
                    break;
                case 2: // Standard Left -> Main street bottom and side street on the left
                    this.sketchObject.building.main.left = (this.sketchObject.canvas.width / 2) + this.sketchObject.streets.verticalWidth / 2;
                    break;
                case 3: // Other -> Main street bottom and no side streets
                    this.sketchObject.building.main.left = (this.sketchObject.canvas.width / 2) - this.sketchObject.building.main.width / 2;
                    break;
                default:
            }

            switch (this.sketchObject.input.params.buildingTemplate) {
                case 2: // Garage Left -> Garage is to the left side of main building
                    this.sketchObject.building.garage.left = this.sketchObject.building.main.left - this.sketchObject.building.garage.width;
                    break;
                case 3: // Garage Right -> Garage is to the right side of main building
                    this.sketchObject.building.garage.left = this.sketchObject.building.main.left + this.sketchObject.building.main.width;
                    break;
                default:
            }

            this.sketchObject.building.main.top = (this.sketchObject.canvas.margin * 2.5);

            if (this.sketchObject.input.params.buildingTemplate === 2 || this.sketchObject.input.params.buildingTemplate === 3) {
                this.sketchObject.building.garage.top = this.sketchObject.building.main.top;
                app.canvas.plotRectangle(this.sketchObject.building.garage, this.sketchObject.streets.borderThickness, app.config.colors.buildingColor, 1, app.config.colors.objectBorder);

                app.canvas.plotText("Garage", "black",
                    this.sketchObject.building.garage.left + (this.sketchObject.building.garage.width / 2),
                    this.sketchObject.building.garage.top + (this.sketchObject.building.garage.height / 2), false, true, true);
            }

            app.canvas.plotRectangle(this.sketchObject.building.main, this.sketchObject.streets.borderThickness, app.config.colors.buildingColor, 1, app.config.colors.objectBorder);

            app.canvas.plotText(`Main Building\nPreferred Location\n${app.sketch.sketchObject.input.site.preferredLocation}`, "black",
                (this.sketchObject.building.main.left + (this.sketchObject.building.main.width / 2)).toFixed(1) / 1,
                (this.sketchObject.building.main.top + (this.sketchObject.building.main.height / 2)).toFixed(1) / 1, false, true, true);
        },
        // ## Skitch Main Service Line: Based on parameters, determine service lines coordinates and dimensions
        sketchMainServiceLine: function () {
            var curbLocation = (this.sketchObject.input.params.tapLocation === 1) ? (-(this.sketchObject.canvas.margin / 2)) : (this.sketchObject.canvas.margin / 2);
            const streetLocation = (this.sketchObject.input.params.streetTemplate === 1) ? 0 : -this.sketchObject.streets.sideStreet.width;

            switch (this.sketchObject.input.params.streetTemplate) {
                case 1: // Standard Right -> Main street bottom and side street on the right
                case 2: // Standard Left -> Main street bottom and side street on the left
                    this.sketchObject.service.main.y1 = this.sketchObject.streets.sideStreet.top + this.sketchObject.canvas.margin;
                    this.sketchObject.service.main.y2 = this.sketchObject.streets.sideStreet.height;
                    curbLocation = (this.sketchObject.input.params.streetTemplate === 1) ? curbLocation : -curbLocation;

                    switch (this.sketchObject.input.params.mainLocation) {
                        case 1: // Short Side -> Near to the building
                            this.sketchObject.service.main.x1 = this.sketchObject.streets.sideStreet.left + curbLocation - streetLocation;
                            this.sketchObject.service.main.x2 = this.sketchObject.service.main.x1;
                            break;
                        case 2: // Long Side -> Far from the building other side of street
                            this.sketchObject.service.main.x1 = this.sketchObject.streets.sideStreet.left + this.sketchObject.streets.sideStreet.width - curbLocation + streetLocation;
                            this.sketchObject.service.main.x2 = this.sketchObject.service.main.x1;
                            break;
                        default:
                    };

                    break;
                case 3: // Other -> Main street bottom and no side streets
                    this.sketchObject.service.main.x1 = this.sketchObject.streets.mainStreet.left + this.sketchObject.canvas.margin;
                    this.sketchObject.service.main.x2 = this.sketchObject.streets.mainStreet.width;

                    switch (this.sketchObject.input.params.mainLocation) {
                        case 1: // Short Side -> Near to the building
                            this.sketchObject.service.main.y1 = this.sketchObject.streets.mainStreet.top + curbLocation;
                            this.sketchObject.service.main.y2 = this.sketchObject.service.main.y1;
                            break;
                        case 2: // Long Side -> Far from the building other side of street
                            this.sketchObject.service.main.y1 = this.sketchObject.streets.mainStreet.top + this.sketchObject.streets.mainStreet.height - curbLocation;
                            this.sketchObject.service.main.y2 = this.sketchObject.service.main.y1;
                            break;
                        default:
                    };
                    break;
                default:
            };

            app.canvas.plotLine(this.sketchObject.service.main, this.sketchObject.service.main.thickness, app.config.colors.mainServiceLine, true);
        },
        // ## Skitch Sub-Service Line: Based on parameters, determine sub-service lines coordinates and dimensions
        sketchSubServiceLine: function () {
            var i;
            var subLineSuffexY = 0;
            var subLineSuffexX = 0;
            var multiplier;
            var pointStart;
            var buildingMeterCoords;

            this.sketchObject.service.sub.extension = {};
            //this.sketchObject.service.sub.customCoords = [];
            this.sketchObject.service.sub.customLines = [];
            this.sketchObject.service.sub.hasExtension = false;

            switch (this.sketchObject.input.params.streetTemplate) {
                case 1: // Standard Right -> Main street bottom and side street on the right
                    if (this.sketchObject.input.params.meterLocation === 1 ||
                        this.sketchObject.input.params.meterLocation === 2 ||
                        this.sketchObject.input.params.meterLocation === 3) {
                        subLineSuffexY = this.sketchObject.canvas.margin;
                        subLineSuffexX = this.sketchObject.building.garage.width;
                    }
                    else if (this.sketchObject.input.params.meterLocation === 4 ||
                        this.sketchObject.input.params.meterLocation === 5 ||
                        this.sketchObject.input.params.meterLocation === 6) {
                        subLineSuffexY = this.sketchObject.building.main.height - this.sketchObject.canvas.margin;
                        subLineSuffexX = 0;
                    }

                    this.sketchObject.service.sub.x1 = this.sketchObject.service.main.x1;
                    this.sketchObject.service.sub.x2 = this.sketchObject.building.main.left + this.sketchObject.building.main.width + ((this.sketchObject.input.params.buildingTemplate === 3) ? subLineSuffexX : 0);
                    this.sketchObject.service.sub.y1 = this.sketchObject.building.main.top + subLineSuffexY;
                    this.sketchObject.service.sub.y2 = this.sketchObject.service.sub.y1;

                    // If custom service line requested, use the above calculations but also add the requested number of extension lines
                    if (this.sketchObject.input.params.meterLocation === 6) {
                        multiplier = 1.5;
                        pointStart = 0;
                        buildingMeterCoords = this.sketchObject.service.sub.x2;
                        this.sketchObject.service.sub.x2 = this.sketchObject.service.sub.x1 - (this.sketchObject.canvas.margin * multiplier);
                        if (this.sketchObject.input.params.mainLocation === 2) // Long side
                            this.sketchObject.service.sub.x2 -= this.sketchObject.streets.verticalWidth;

                        pointStart = this.sketchObject.service.sub.x2;

                        if (app.sketch.sketchObject.service.sub.customCoords.length < 1)
                            for (i = 0; i < this.sketchObject.input.params.controlPoints; i++) {
                                this.sketchObject.service.sub.customCoords.push({
                                    x1: pointStart,
                                    x2: (i === this.sketchObject.input.params.controlPoints - 1) ? buildingMeterCoords : pointStart - (this.sketchObject.canvas.margin * multiplier),
                                    y1: this.sketchObject.service.sub.y1,
                                    y2: this.sketchObject.service.sub.y1
                                });

                                pointStart -= (this.sketchObject.canvas.margin * multiplier);
                            }
                        else {
                            this.sketchObject.service.sub.customCoords[0].x1 = pointStart;
                            this.sketchObject.service.sub.customCoords[0].y1 = this.sketchObject.service.sub.y1;

                            this.sketchObject.service.sub.customCoords[this.sketchObject.input.params.controlPoints - 1].x2 = buildingMeterCoords;
                            this.sketchObject.service.sub.customCoords[this.sketchObject.input.params.controlPoints - 1].y2 = this.sketchObject.service.sub.y1;
                        }

                        app.canvas.plotControlPoints(this.sketchObject.service.sub.customCoords, this.sketchObject.service.main.thickness, app.config.colors.mainServiceLine, false);
                    }
                    break;
                case 2: // Standard Left -> Main street bottom and side street on the left
                    if (this.sketchObject.input.params.meterLocation === 1 ||
                        this.sketchObject.input.params.meterLocation === 2 ||
                        this.sketchObject.input.params.meterLocation === 3) {
                        subLineSuffexY = this.sketchObject.canvas.margin;
                        subLineSuffexX = this.sketchObject.building.garage.width;
                    }
                    else if (this.sketchObject.input.params.meterLocation === 4 ||
                        this.sketchObject.input.params.meterLocation === 5 ||
                        this.sketchObject.input.params.meterLocation === 6) {
                        subLineSuffexY = this.sketchObject.building.main.height - this.sketchObject.canvas.margin;
                        subLineSuffexX = 0;
                    }

                    this.sketchObject.service.sub.x1 = this.sketchObject.service.main.x1;
                    this.sketchObject.service.sub.x2 = this.sketchObject.building.main.left - ((this.sketchObject.input.params.buildingTemplate === 2) ? subLineSuffexX : 0);
                    this.sketchObject.service.sub.y1 = this.sketchObject.building.main.top + subLineSuffexY;
                    this.sketchObject.service.sub.y2 = this.sketchObject.service.sub.y1;

                    // If custom service line requested, use the above calculations but also add the requested number of extension lines
                    if (this.sketchObject.input.params.meterLocation === 6) {
                        multiplier = 1.5;
                        pointStart = 0;
                        buildingMeterCoords = this.sketchObject.service.sub.x2;
                        this.sketchObject.service.sub.x2 = this.sketchObject.service.sub.x1 + (this.sketchObject.canvas.margin * multiplier);
                        if (this.sketchObject.input.params.mainLocation === 2) // Long side
                            this.sketchObject.service.sub.x2 += this.sketchObject.streets.verticalWidth;

                        pointStart = this.sketchObject.service.sub.x2;
                        if (app.sketch.sketchObject.service.sub.customCoords.length < 1)
                            for (i = 0; i < this.sketchObject.input.params.controlPoints; i++) {
                                this.sketchObject.service.sub.customCoords.push({
                                    x1: pointStart,
                                    x2: (i === this.sketchObject.input.params.controlPoints - 1)
                                        ? buildingMeterCoords
                                        : pointStart + (this.sketchObject.canvas.margin * multiplier),
                                    y1: this.sketchObject.service.sub.y1,
                                    y2: this.sketchObject.service.sub.y1
                                });

                                pointStart += (this.sketchObject.canvas.margin * multiplier);
                            }
                        else {
                            this.sketchObject.service.sub.customCoords[0].x1 = pointStart;
                            this.sketchObject.service.sub.customCoords[0].y1 = this.sketchObject.service.sub.y1;

                            this.sketchObject.service.sub.customCoords[this.sketchObject.input.params.controlPoints - 1].x2 = buildingMeterCoords;
                            this.sketchObject.service.sub.customCoords[this.sketchObject.input.params.controlPoints - 1].y2 = this.sketchObject.service.sub.y1;
                        }

                        app.canvas.plotControlPoints(this.sketchObject.service.sub.customCoords, this.sketchObject.service.main.thickness, app.config.colors.mainServiceLine, false);
                    }
                    break;
                case 3: // Other -> Main street bottom and no side streets
                    this.sketchObject.service.sub.y2 = this.sketchObject.service.main.y2;
                    if (this.sketchObject.input.params.buildingTemplate === 1)
                        this.sketchObject.building.garage = { top: 0, left: 0, width: 0, height: 0 };

                    this.sketchObject.service.sub.hasExtension = true;
                    switch (this.sketchObject.input.params.meterLocation) {
                        case 1: // Front Side -> Meter at the front side
                            this.sketchObject.service.sub.x1 = this.sketchObject.building.main.left + (this.sketchObject.building.main.width / 2);
                            this.sketchObject.service.sub.x2 = this.sketchObject.service.sub.x1;
                            this.sketchObject.service.sub.y1 = this.sketchObject.building.main.top + this.sketchObject.building.main.height;
                            this.sketchObject.service.sub.hasExtension = false;
                            break;
                        case 2: // Left Side -> Meter at the left side
                            this.sketchObject.service.sub.x1 = this.sketchObject.building.main.left
                                - ((this.sketchObject.input.params.buildingTemplate === 2) ? this.sketchObject.building.garage.width : 0)
                                - this.sketchObject.canvas.margin;
                            this.sketchObject.service.sub.x2 = this.sketchObject.service.sub.x1;
                            this.sketchObject.service.sub.y1 = this.sketchObject.building.main.top + this.sketchObject.canvas.margin;

                            this.sketchObject.service.sub.extension.x2 = this.sketchObject.service.sub.x1 + this.sketchObject.canvas.margin;
                            break;
                        case 3: // Right Side -> Meter at the right side
                            this.sketchObject.service.sub.x1 = this.sketchObject.building.main.left
                                + this.sketchObject.building.main.width
                                + ((this.sketchObject.input.params.buildingTemplate === 3) ? this.sketchObject.building.garage.width : 0)
                                + this.sketchObject.canvas.margin;
                            this.sketchObject.service.sub.x2 = this.sketchObject.service.sub.x1;
                            this.sketchObject.service.sub.y1 = this.sketchObject.building.main.top + this.sketchObject.canvas.margin;

                            this.sketchObject.service.sub.extension.x2 = this.sketchObject.service.sub.x1 - this.sketchObject.canvas.margin;
                            break;
                        case 4: // Front Left Side -> Meter at the front left side
                            this.sketchObject.service.sub.x1 = this.sketchObject.building.main.left - this.sketchObject.canvas.margin;
                            this.sketchObject.service.sub.x2 = this.sketchObject.service.sub.x1;
                            this.sketchObject.service.sub.y1 = this.sketchObject.building.main.top + this.sketchObject.building.main.height - this.sketchObject.canvas.margin;

                            this.sketchObject.service.sub.extension.x2 = this.sketchObject.service.sub.x1 + this.sketchObject.canvas.margin;
                            break;
                        case 5: // Front Right Side -> Meter at the front right side
                            this.sketchObject.service.sub.x1 = this.sketchObject.building.main.left + this.sketchObject.building.main.width + this.sketchObject.canvas.margin;
                            this.sketchObject.service.sub.x2 = this.sketchObject.service.sub.x1;
                            this.sketchObject.service.sub.y1 = this.sketchObject.building.main.top + this.sketchObject.building.main.height - this.sketchObject.canvas.margin;

                            this.sketchObject.service.sub.extension.x2 = this.sketchObject.service.sub.x1 - this.sketchObject.canvas.margin;
                            break;
                        case 6: // Custom service line requested.
                            multiplier = 1.25;
                            pointStart = 0;
                            buildingMeterCoords = this.sketchObject.building.main.top + this.sketchObject.building.main.height;
                            this.sketchObject.service.sub.x1 = this.sketchObject.building.main.left + (this.sketchObject.building.main.width / 2);
                            this.sketchObject.service.sub.x2 = this.sketchObject.service.sub.x1;
                            this.sketchObject.service.sub.y1 = this.sketchObject.service.sub.y2 - (this.sketchObject.canvas.margin * multiplier);
                            this.sketchObject.service.sub.hasExtension = false;

                            if (this.sketchObject.input.params.mainLocation === 2) // Long side
                            {
                                this.sketchObject.service.sub.y1 -= this.sketchObject.streets.verticalWidth;
                                if (this.sketchObject.input.params.tapLocation === 1)
                                    this.sketchObject.service.sub.y1 -= this.sketchObject.canvas.margin;
                            }

                            pointStart = this.sketchObject.service.sub.y1;

                            if (app.sketch.sketchObject.service.sub.customCoords.length < 1)
                                for (i = 0; i < this.sketchObject.input.params.controlPoints; i++) {
                                    this.sketchObject.service.sub.customCoords.push({
                                        x1: this.sketchObject.service.sub.x1,
                                        x2: this.sketchObject.service.sub.x1,
                                        y1: pointStart,
                                        y2: (i === this.sketchObject.input.params.controlPoints - 1) ? buildingMeterCoords : pointStart - (this.sketchObject.canvas.margin * multiplier)
                                    });

                                    pointStart -= (this.sketchObject.canvas.margin * multiplier);
                                }
                            else {
                                this.sketchObject.service.sub.customCoords[0].x1 = this.sketchObject.service.sub.x1;
                                this.sketchObject.service.sub.customCoords[0].y1 = pointStart;

                                this.sketchObject.service.sub.customCoords[this.sketchObject.input.params.controlPoints - 1].x2 = this.sketchObject.service.sub.x1;
                                this.sketchObject.service.sub.customCoords[this.sketchObject.input.params.controlPoints - 1].y2 = buildingMeterCoords;
                            }

                            app.canvas.plotControlPoints(this.sketchObject.service.sub.customCoords, this.sketchObject.service.main.thickness, app.config.colors.mainServiceLine, false);
                            break;
                        default:
                    };

                    break;
                default:
            };

            // Draw the tab rectangle
            if (this.sketchObject.input.params.streetTemplate === 3) {
                this.sketchObject.service.main.tap.top = this.sketchObject.service.sub.y2 - (this.sketchObject.canvas.margin / 2);
                this.sketchObject.service.main.tap.left = this.sketchObject.service.sub.x1 - (this.sketchObject.canvas.margin);
            }
            else if (this.sketchObject.input.params.streetTemplate === 1 || this.sketchObject.input.params.streetTemplate === 2) {
                this.sketchObject.service.main.tap.top = this.sketchObject.service.sub.y2 - (this.sketchObject.canvas.margin);
                this.sketchObject.service.main.tap.left = this.sketchObject.service.sub.x1 - (this.sketchObject.canvas.margin / 2);
            }

            this.sketchObject.service.main.tap.width = (this.sketchObject.service.sub.x1 - this.sketchObject.service.main.tap.left) * 2;
            this.sketchObject.service.main.tap.height = (this.sketchObject.service.sub.y2 - this.sketchObject.service.main.tap.top) * 2;

            // Identify and draw the sub-extension line to the building
            if (this.sketchObject.service.sub.hasExtension) {
                this.sketchObject.service.sub.extension.x1 = this.sketchObject.service.sub.x1;
                this.sketchObject.service.sub.extension.y1 = this.sketchObject.service.sub.y1;
                this.sketchObject.service.sub.extension.y2 = this.sketchObject.service.sub.extension.y1;

                app.canvas.plotLine(this.sketchObject.service.sub.extension, this.sketchObject.service.main.thickness, app.config.colors.mainServiceLine, false);
            }

            app.canvas.plotLine(this.sketchObject.service.sub, this.sketchObject.service.main.thickness, app.config.colors.mainServiceLine, false);
            app.canvas.plotRectangle(this.sketchObject.service.main.tap, this.sketchObject.service.sub.thickness, "white", 0.75, app.config.colors.objectBorder);
        },
        // ## Skitch Measurments: Based on parameters, determine measurements lines coordinates and dimensions
        sketchMeasurements: function () {
            var sideStreets = false;
            var measurementsCoords = { mainStreet: {}, sideStreet: {}, curbToHouse: {}, meterSetBack: {} };

            switch (this.sketchObject.input.params.streetTemplate) {
                case 1: // Standard Right -> Main street bottom and side street on the right
                    sideStreets = true;
                    measurementsCoords.mainStreet.x = this.sketchObject.streets.mainStreet.left + (this.sketchObject.streets.mainStreet.width / 2);
                    measurementsCoords.sideStreet.y = this.sketchObject.service.sub.y1 + (this.sketchObject.canvas.margin * 3);

                    measurementsCoords.curbToHouse = {
                        x1: this.sketchObject.service.sub.x2 + app.sketch.sketchObject.canvas.margin * 2,
                        x2: this.sketchObject.streets.sideStreet.left,
                        y1: measurementsCoords.sideStreet.y,
                        y2: measurementsCoords.sideStreet.y
                    };

                    // Include the meter setback!
                    measurementsCoords.meterSetBack = {
                        x1: this.sketchObject.service.sub.x2,
                        x2: measurementsCoords.curbToHouse.x1,
                        y1: measurementsCoords.sideStreet.y,
                        y2: measurementsCoords.sideStreet.y
                    };

                    // Adjust meter setback to custom service line, to the front of the house
                    if (this.sketchObject.input.params.meterLocation === 6) {
                        measurementsCoords.curbToHouse.x1 = this.sketchObject.building.main.left + this.sketchObject.building.main.width + app.sketch.sketchObject.canvas.margin * 2;
                        measurementsCoords.meterSetBack.x1 = this.sketchObject.building.main.left + this.sketchObject.building.main.width;
                        measurementsCoords.meterSetBack.x2 = measurementsCoords.curbToHouse.x1;
                    }

                    app.canvas.plotMeasurementLine(measurementsCoords.meterSetBack, this.sketchObject.service.main.measurementThickness, app.config.colors.measurementLine, false, `${app.sketch.sketchObject.input.site.meterSetback} ft`, !sideStreets);

                    break;
                case 2: // Standard Left -> Main street bottom and side street on the left
                    sideStreets = true;
                    measurementsCoords.mainStreet.x = this.sketchObject.streets.mainStreet.left + (this.sketchObject.streets.mainStreet.width / 2);
                    measurementsCoords.sideStreet.y = this.sketchObject.service.sub.y1 + (this.sketchObject.canvas.margin * 3);

                    measurementsCoords.curbToHouse = {
                        x1: this.sketchObject.streets.sideStreet.left + this.sketchObject.streets.sideStreet.width,
                        x2: this.sketchObject.service.sub.x2 - app.sketch.sketchObject.canvas.margin * 2,
                        y1: measurementsCoords.sideStreet.y,
                        y2: measurementsCoords.sideStreet.y
                    };

                    // Include the meter setback!
                    measurementsCoords.meterSetBack = {
                        x1: this.sketchObject.service.sub.x2,
                        x2: measurementsCoords.curbToHouse.x2,
                        y1: measurementsCoords.sideStreet.y,
                        y2: measurementsCoords.sideStreet.y
                    };

                    // Adjust meter setback to custom service line, to the front of the house
                    if (this.sketchObject.input.params.meterLocation === 6) {
                        measurementsCoords.curbToHouse.x2 = this.sketchObject.building.main.left - app.sketch.sketchObject.canvas.margin * 2;
                        measurementsCoords.meterSetBack.x1 = this.sketchObject.building.main.left;
                        measurementsCoords.meterSetBack.x2 = measurementsCoords.curbToHouse.x2;
                    }

                    app.canvas.plotMeasurementLine(measurementsCoords.meterSetBack, this.sketchObject.service.main.measurementThickness, app.config.colors.measurementLine, false, `${app.sketch.sketchObject.input.site.meterSetback} ft`, !sideStreets);
                    break;
                case 3: // Other -> Main street bottom and no side streets
                    sideStreets = false;

                    if (this.sketchObject.input.params.meterLocation === 1 ||
                        this.sketchObject.input.params.meterLocation === 3 ||
                        this.sketchObject.input.params.meterLocation === 5 ||
                        this.sketchObject.input.params.meterLocation === 6) {
                        measurementsCoords.mainStreet = { x: this.sketchObject.service.sub.x1 + (this.sketchObject.canvas.margin * 2) };
                    }
                    else if (this.sketchObject.input.params.meterLocation === 2 ||
                        this.sketchObject.input.params.meterLocation === 4) {
                        measurementsCoords.mainStreet = { x: this.sketchObject.service.sub.x1 - (this.sketchObject.canvas.margin * 2) };
                    };

                    measurementsCoords.curbToHouse = {
                        x1: measurementsCoords.mainStreet.x,
                        x2: measurementsCoords.mainStreet.x,
                        y1: this.sketchObject.service.sub.y1 + app.sketch.sketchObject.canvas.margin,
                        y2: this.sketchObject.streets.mainStreet.top
                    };

                    if (this.sketchObject.input.params.meterLocation === 1)
                        // if custom service line or front meter is requested then just show the line from street to front of house.
                        measurementsCoords.curbToHouse.y1 = this.sketchObject.building.main.top + this.sketchObject.building.main.height;
                    else {
                        // Include the meter setback!
                        measurementsCoords.meterSetBack = {
                            x1: measurementsCoords.mainStreet.x,
                            x2: measurementsCoords.mainStreet.x,
                            y1: this.sketchObject.service.sub.y1,
                            y2: measurementsCoords.curbToHouse.y1
                        };

                        // Adjust meter setback to custom service line, to the front of the house
                        if (this.sketchObject.input.params.meterLocation === 6) {
                            measurementsCoords.curbToHouse.y1 = this.sketchObject.building.main.top + this.sketchObject.building.main.height + app.sketch.sketchObject.canvas.margin;
                            measurementsCoords.meterSetBack.y1 = this.sketchObject.building.main.top + this.sketchObject.building.main.height;
                            measurementsCoords.meterSetBack.y2 = measurementsCoords.curbToHouse.y1;
                        }

                        app.canvas.plotMeasurementLine(measurementsCoords.meterSetBack, this.sketchObject.service.main.measurementThickness, app.config.colors.measurementLine, false, `${app.sketch.sketchObject.input.site.meterSetback} ft`, !sideStreets);
                    }
                default:
                    break;
            };

            // Curb to house line
            app.canvas.plotMeasurementLine(measurementsCoords.curbToHouse, this.sketchObject.service.main.measurementThickness, app.config.colors.measurementLine, false, `${app.sketch.sketchObject.input.site.houseToCurb} ft`, !sideStreets);

            // Side Street Width
            if (this.sketchObject.input.params.streetTemplate === 1 || this.sketchObject.input.params.streetTemplate === 2) {
                app.canvas.plotMeasurementLine({
                    x1: this.sketchObject.streets.sideStreet.left,
                    x2: this.sketchObject.streets.sideStreet.left + this.sketchObject.streets.sideStreet.width,
                    y1: measurementsCoords.sideStreet.y,
                    y2: measurementsCoords.sideStreet.y
                }, this.sketchObject.service.main.measurementThickness, app.config.colors.measurementLine, false, `${app.sketch.sketchObject.input.site.streetWidth} ft`, !sideStreets);
            }

            // Main Street Width
            app.canvas.plotMeasurementLine({
                x1: measurementsCoords.mainStreet.x,
                x2: measurementsCoords.mainStreet.x,
                y1: this.sketchObject.streets.mainStreet.top,
                y2: this.sketchObject.streets.mainStreet.top + this.sketchObject.streets.mainStreet.height
            }, this.sketchObject.service.main.measurementThickness, app.config.colors.measurementLine, false, `${app.sketch.sketchObject.input.site.streetWidth} ft`, true);
        },
        // ## Add loaded free drawing objects to the canvas
        sketchHandDrawing: function () {
            app.canvas.clearPaths();
            for (let j = 0; j < app.sketch.sketchObject.paths.length; j++) {
                app.sketch.sketchObject.paths[j].selectable = false;
                app.canvas.canvasObject.add(fabric.Path.fromObject(app.sketch.sketchObject.paths[j]));
            }
            app.canvas.finalizeRendering();
        }
    },

    // |-> ## App UI, IO and Helper Operations
    ui: {
        bindUIComponents: function () {
            // Bind UI Compnents Events
            $("#menuToggler").on("click", function () {
                app.ui.resizeSequence();
            });

            $("#generateSketch").on("click", function () {
                $("#sketchInputPanel").removeClass("activePanel").addClass("inactivePanel");
                $("#sketchOutputPanel").removeClass("inactivePanel").addClass("activePanel");

                $("#generateSketchLinkMenu").addClass("active");
                $("#editSketchLinkMenu").removeClass("active");

                app.main.generate();
            });
            $("#editSketch").on("click", function () {
                $("#sketchInputPanel").removeClass("inactivePanel").addClass("activePanel");
                $("#sketchOutputPanel").removeClass("activePanel").addClass("inactivePanel");

                $("#editSketchLinkMenu").addClass("active");
                $("#generateSketchLinkMenu").removeClass("active");

                app.canvas.clearCanvas();
            });
            $("#generateSketchLink").on("click", function () {
                $("#sketchInputPanel").removeClass("activePanel").addClass("inactivePanel");
                $("#sketchOutputPanel").removeClass("inactivePanel").addClass("activePanel");
                $("#generateSketchLinkMenu").addClass("active");
                $("#editSketchLinkMenu").removeClass("active");
                app.main.generate();
            });
            $("#editSketchLink").on("click", function () {
                $("#sketchInputPanel").removeClass("inactivePanel").addClass("activePanel");
                $("#sketchOutputPanel").removeClass("activePanel").addClass("inactivePanel");
                $("#editSketchLinkMenu").addClass("active");
                $("#generateSketchLinkMenu").removeClass("active");
                app.canvas.clearCanvas();
            });
            $("#freeDrawing").on("click", function () {
                app.ui.toggleFreeDrawingUI(!app.sketch.sketchObject.isFreeDrawing);
            });

            // Sketch IO Operations
            $("#exportSketchImage").on("click", function () {
                app.ui.toggleBusyIndicator(true);
                app.io.exportImage();
                app.ui.toggleBusyIndicator(false);
            });
            $("#exportSketchJSON").on("click", function () {
                app.ui.toggleBusyIndicator(true);
                app.io.exportJSON();
                app.ui.toggleBusyIndicator(false);
            });
            $("#importSketch").on("click", function () {
                app.io.importJSON();
            });

            // Sketch Free Drawing Operations
            $("#clearFreeDrawing").on("click", function () {
                app.sketch.sketchObject.paths = [];
                app.canvas.clearPaths();
            });
            $("#eraseSelectedFreeDrawing").on("click", function () {
                app.canvas.eraseSelectedPath();
            });

            $(".touchspin-postfix").TouchSpin({
                min: 1,
                max: 25,
                step: 1,
                decimals: 0,
                prefix: "Strok"
            }).on("touchspin.on.startspin", function () {
                app.canvas.canvasObject.freeDrawingBrush.width = parseInt($(this).val());
            });

            $(".colorpicker-show-alpha").spectrum({
                showAlpha: true,
                change: function (color) {
                    app.canvas.canvasObject.freeDrawingBrush.color = color.toRgbString();
                },
                hide: function (color) {
                    app.canvas.canvasObject.freeDrawingBrush.color = color.toRgbString();
                },
                move: function (color) {
                    app.canvas.canvasObject.freeDrawingBrush.color = color.toRgbString();
                }
            });
        },
        bindUIResizeEvent: function () {
            $(window).resize(function () {
                app.ui.resizeSequence();
            }).resize();
        },
        resizeSequence: function () {
            let resizeTimeout;
            const containerSize = ($(app.config.sketchContainerSelector).width() * 80 / 100);

            if (containerSize > 1024 && app.sketch.sketchObject.canvas.width === 1024) return;   // the container is larger than 1024, no need to resize
            if (app.sketch.sketchObject.canvas.width === containerSize) return;                  // the canvas and container size are equal, no need to resize
            if (app.sketch.sketchObject.input.params.meterLocation === 6) return;                // the meter location is custom
            if (app.canvas.canvasObject.isDrawingMode) return;
            if (app.sketch.sketchObject.isImported) return;

            // ReSharper disable once UsageOfPossiblyUnassignedValue
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(function () {
                app.main.generate();
            }, 250);
        },
        fetchSketchParams: function () {
            app.sketch.sketchObject.input = {
                customer: {
                    bcaNumber: $("#bcaNumber").val(),
                    requestDate: $("#requestDate").val(),
                    accountExecutive: $("#buildingTemplates option:selected").text(),
                    customerName: $("#customerName").val(),
                    contactNumber: $("#contactNumber").val(),
                    customerEmail: $("#customerEmail").val(),
                    streetAddress: $("#streetAddress").val(),
                    county: $("#countyList option:selected").text(),
                    twon: $("#townList option:selected").text(),
                    zipCode: $("#zipCode").val()
                },
                params: {
                    streetTemplate: parseInt($("#streetTemplates").val()),
                    buildingTemplate: parseInt($("#buildingTemplates").val()),
                    meterLocation: parseInt($("#meterLocation").val()),
                    controlPoints: parseInt($("#controlPoints").val()),
                    tapLocation: parseInt($("#tapLocation").val()),
                    mainLocation: parseInt($("#mainLocation").val())
                },
                site: {
                    nearestStreetName: $("#nearestStreetName").val(),
                    preferredLocation: $("#preferredLocation option:selected").text(),
                    meterSetback: parseInt($("#meterSetback").val()),
                    houseToCurb: parseInt($("#houseToCurb").val()),
                    streetWidth: parseInt($("#streetWidth").val()),
                    distanceToNearesrStreet: parseInt($("#distanceToNearesrStreet").val())
                },
                main: {
                    mainType: $("#mainType option:selected").text(),
                    mainSize: $("#mainSize option:selected").text(),
                    systemNOP: $("#systemNOP option:selected").text(),
                    mainToCurb: parseInt($("#mainToCurb").val())
                },
                sideMain: {
                    sideMainType: $("#sideMainType option:selected").text(),
                    sideMainSize: $("#sideMainSize option:selected").text(),
                    sideSystemNOP: $("#sideSystemNOP option:selected").text(),
                    sideMainToCurb: parseInt($("#sideMainToCurb").val())
                }
            };
            app.ui.fetchSketchCode();

            $("#bcaNumberLabel").text($("#bcaNumber").val());
            $("#customerNameLabel").text($("#customerName").val());
            $("#contactNumberLabel").text($("#contactNumber").val());
            $("#streetAddressLabel").text($("#streetAddress").val());
            $("#mainToCurbLabel").text($("#mainToCurb").val());
            $("#nearestStreetNameLabel").text($("#nearestStreetName").val());
        },
        fetchSketchCode: function () {
            var sketchCode = $("#streetTemplates option:selected").text().split("-")[0] + "-";
            sketchCode += $("#buildingTemplates option:selected").text().split("-")[0] + "-";
            sketchCode += $("#meterLocation option:selected").text().split("-")[0] + "-";
            sketchCode += $("#tapLocation option:selected").text().split("-")[0] + "-";
            sketchCode += $("#mainLocation option:selected").text().split("-")[0];
            $("#templateCodeLabel").text(sketchCode);
        },
        toggleFreeDrawingUI: function (isEnabled) {
            if (isEnabled) {
                $("#freeDrawing").removeClass("bg-grey-300").addClass("btn-warning");
                $("#freeDrawingToolPanel").removeClass("inactivePanel").addClass("activePanel");

            } else {
                $("#freeDrawing").removeClass("btn-warning").addClass("bg-grey-300");
                $("#freeDrawingToolPanel").removeClass("activePanel").addClass("inactivePanel");
            }

            app.sketch.sketchObject.isFreeDrawing = isEnabled;
            app.canvas.toggleFreeDrawing(isEnabled);
        },
        updateSkecthCalcPanel: function () {
            const editor = ace.edit("sketchCalcEditor");
            const aceSession = editor.getSession();
            editor.setValue(JSON.stringify(app.sketch.sketchObject), -1);
            editor.setTheme("ace/theme/monokai");
            editor.setShowPrintMargin(false);
            editor.setOptions({
                readOnly: true,
                maxLines: Infinity
            });
            aceSession.setMode("ace/mode/json");
            aceSession.setValue(window.js_beautify(aceSession.getValue(), { indent_size: 2 }));

            // Fold Code
            window.setTimeout(function () {
                aceSession.foldAll(1, aceSession.getLength());
            }, 500);
        },
        toggleBusyIndicator: function (getBusy) {
            var options = {
                message: '<mark style="padding: 20px; background: black"><i style="color: white" class="icon-spinner2 spinner"></i> &nbsp;&nbsp;' + appLoader.getRandomLoading() + "...</mark>",
                overlayCSS: {
                    backgroundColor: "#000",
                    opacity: 0.40,
                    cursor: "wait",
                },
                css: {
                    border: 0,
                    padding: 0,
                    backgroundColor: "none",
                }
            };

            if (getBusy && !app.config.isBusy) {
                app.config.isBusy = true;
                $.blockUI(options);
            } else if (!getBusy) {
                app.config.isBusy = false;
                window.setTimeout(function () { $.unblockUI(); }, 100);
            }
        }
    },
    io: {
        exportImage: function () {
            const img = app.canvas.canvasObject.toDataURL("image/png");
            const a = document.createElement("a");
            const file = app.helper.dataURItoBlob(img);

            a.href = URL.createObjectURL(file);
            a.download = "sketch.png";
            a.click();
        },
        exportJSON: function () {
            const a = document.createElement("a");
            //const file = new Blob([JSON.stringify(app.canvas.canvasObject.toDatalessJSON())], { type: "text/json" });
            const file = new Blob([JSON.stringify(app.sketch.sketchObject)], { type: "text/json" });
            a.href = URL.createObjectURL(file);
            a.download = "sketch.json";
            a.click();
        },
        importJSON: function () {
            const element = document.createElement("div");
            element.innerHTML = '<input type="file">';
            var fileInput = element.firstChild;

            fileInput.addEventListener("change", function () {
                const file = fileInput.files[0];
                if (file.name.match(/\.(json)$/)) {
                    const reader = new FileReader();
                    reader.onload = function () {
                        app.ui.toggleBusyIndicator(true);
                        window.setTimeout(function () { app.main.load(reader.result); }, 500);
                    };
                    reader.readAsText(file);
                } else {
                    alert("File not supported, *.json files only");
                }
            });

            fileInput.click();
        }
    },
    helper: {
        dataURItoBlob: function (dataUri) {
            // convert base64 to raw binary data held in a string
            // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
            const byteString = atob(dataUri.split(",")[1]);

            // write the bytes of the string to an ArrayBuffer
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++)
                ia[i] = byteString.charCodeAt(i);

            return new Blob([ab]);
        },
        shadeColor: function (color, percent) {
            var r = parseInt(color.substring(1, 3), 16);
            var g = parseInt(color.substring(3, 5), 16);
            var b = parseInt(color.substring(5, 7), 16);

            r = parseInt(r * (100 + percent) / 100);
            g = parseInt(g * (100 + percent) / 100);
            b = parseInt(b * (100 + percent) / 100);

            r = (r < 255) ? r : 255;
            g = (g < 255) ? g : 255;
            b = (b < 255) ? b : 255;

            const rr = ((r.toString(16).length === 1) ? `0${r.toString(16)}` : r.toString(16));
            const gg = ((g.toString(16).length === 1) ? `0${g.toString(16)}` : g.toString(16));
            const bb = ((b.toString(16).length === 1) ? `0${b.toString(16)}` : b.toString(16));

            return "#" + rr + gg + bb;
        },

        isNumber: function (n) {
            return !isNaN(parseFloat(n)) && isFinite(n);
        },
        isFractionalChar: function (n) {
            var c = n.charCodeAt();
            return (c >= 188 && c <= 190) || (c >= 8531 && c <= 8542);
        },
        indexFractionalChar: function (m) {
            var a = m.split(''), i;
            for (i in a)
                if (app.helper.isFractionalChar(a[i]))
                    return i;

            return false;
        },
        parseAddress: function (addr) {
            var a = addr.trim().split(' '), number, street;

            if (a.length <= 1)
                return { number: '', space: '', street: a.join('') };

            if (app.helper.isNumber(a[0].substr(0, 1)) || app.helper.isFractionalChar(a[0].substr(0, 1))) {
                number = a.shift();
            } else {
                // If there isn't a leading number, just return the trimmed input as the street
                return { number: '', space: '', street: addr.trim() }
            }
            if (/[0-9]\/[0-9]/.exec(a[0]) || app.helper.indexFractionalChar(a[0]) !== false)
                number += ' ' + a.shift();

            return { number: number, space: ' ', street: a.join(' ') };
        }
    },

    // |-> ## App Main operations
    main: {
        init: function () {
            app.canvas.initCanvas();
            app.ui.bindUIComponents();
            app.ui.bindUIResizeEvent();
        },
        generate: function () {
            app.ui.toggleBusyIndicator(true);
            app.ui.fetchSketchParams();                     // Get user paramaters
            app.sketch.sketchObject.isImported = false;     // Generated and not imported from JSON
            app.sketch.recalculateSkitch();                 // Recalculate dimensions based on the client size
            app.sketch.resizeSkitch();                      // Resize canvas based on client size
            app.sketch.resetSketch();                       // Reset canvas and any custom elements arrays
            app.sketch.plotSketchElements();                // Plot sketch elements such as streets and buildings
            app.ui.updateSkecthCalcPanel();                 // Update the clac JSON panel
            app.ui.toggleBusyIndicator(false);
        },
        resize: function () { // TODO: Find a way to resize the hand drawing paths, DONT USE!!
            app.ui.toggleBusyIndicator(true);
            app.sketch.resetSketch();                       // Reset canvas and any custom elements arrays
            app.sketch.sketchObject = JSON.parse(JSON.stringify(app.sketch.sketchObject));// Read the sketch object from loaded JSON and replace the current object
            app.sketch.recalculateSkitch();                 // Recalculate dimensions based on the client size
            app.sketch.resizeSkitch();                      // Resize canvas based on client size
            app.sketch.plotSketchElements();                // Plot sketch elements such as streets and buildings
            app.ui.updateSkecthCalcPanel();                 // Update the clac JSON panel
            //app.ui.toggleFreeDrawingUI(false);            // Disable free mode, untill user enable it.
            app.ui.toggleBusyIndicator(false);
        },
        load: function (sketchObj) {
            app.ui.toggleBusyIndicator(true);
            app.sketch.resetSketch();                       // Reset canvas and any custom elements arrays
            app.sketch.sketchObject = JSON.parse(sketchObj);// Read the sketch object from loaded JSON and replace the current object
            app.sketch.sketchObject.isImported = true;      // This is a loaded sketch not generated
            app.sketch.recalculateSkitch(true);             // Recalculate dimensions based on the client size
            app.sketch.resizeSkitch();                      // Resize canvas based on client size
            app.sketch.plotSketchElements();                // Plot sketch elements such as streets and buildings
            app.ui.updateSkecthCalcPanel();                 // Update the clac JSON panel
            app.ui.toggleFreeDrawingUI(false);              // Disable free mode, untill user enable it.
            app.ui.toggleBusyIndicator(false);
        }
    }
};

$(function () {
    appLoader.buildLoadingMessagesArray();
    appJs.main.init();
});