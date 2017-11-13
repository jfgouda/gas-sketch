// #region >> [Imports & Declarations]
import { Router } from '@angular/router';
import { SketchTemplateService } from 'app/services/sketch-template.service';
import { Component, OnInit, AfterViewInit, ElementRef } from '@angular/core';
import { ChangeDetectorRef, ViewRef } from '@angular/core';
import 'fabric';

import * as jQuery from 'jquery';
import * as JSModules from './sketch.component-ui-scripts';
import * as SketchData from 'app/modules/sketch/data-models/canvas-data.module';
import * as CanvasElements from 'app/modules/sketch/canvas-ui-elements/canvas-ui-elements.module';

declare const $: any;
declare const jquery: any;
declare const ace: any;
declare const js_beautify: any;
declare const fabric: any;
// #endregion

@Component({ selector: 'app-sketch', templateUrl: './sketch.component.html' })
export class SketchComponent implements OnInit, AfterViewInit {
  // #region |-> [Variables]
  // Main sketch data model, that hold all claculations, also will be exported to JSON to save sketch.
  public sketchObject: SketchData.SketchModel;     // Hold sketch calculations, to re-generate sketch
  public canvasObject: SketchData.CanvasUIModel;    // Hold canvas UI related data 
  // #endregion

  // #region |-> [Ctor & Initiation]
  constructor(
    private elementRef: ElementRef,
    private router: Router,
    private sketchTemplateService: SketchTemplateService) {

    this.sketchObject = new SketchData.SketchModel();
    this.canvasObject = new SketchData.CanvasUIModel();
    this.validateDataModel();
  }

  ngOnInit() {
    this.initializeCanvas();
  }

  ngAfterViewInit(): void {
    JSModules.bindUiElement();
    this.bindResizeEvent();
    this.bindES5ComponentsEvents();
    this.calculateCanvasSize();
    this.clearCanvas();
    this.plotSketchElements();
    this.appendCustomImages();
  }

  validateDataModel() {
    if (this.sketchTemplateService.getSketchTemplateUserInput() !== null) {
      this.sketchObject.input = this.sketchTemplateService.getSketchTemplateUserInput();
    } else {
      this.router.navigate(['template']);
    }
  }
  // #endregion

  // #region |-> [Canvas Operations]
  // ##########################################
  // #region |---> [Canvas Init and Bindings]
  initializeCanvas() {
    // Setup canvas
    this.canvasObject.canvas = new fabric.Canvas(this.canvasObject.canvasSelector, {
      imageSmoothingEnabled: true,
      renderOnAddRemove: true,
      stateful: false,
      isDrawingMode: false,
      hoverCursor: 'pointer',
      selectionBorderColor: 'rgba(100, 100, 100, 1)',
      selectionColor: 'rgba(100, 100, 100, 0.25)',
      selectionLineWidth: 0.5,
      freeDrawingBrush: {
        width: 5,
        color: 'rgba(255, 0, 0, 0.5)'
      }
    });

    // Fix Fabric.js blurriness issue.
    // Todo: need to be tested on other devices and retina display!! 
    fabric.devicePixelRatio = 2;

    this.bindCanvasEvents();

    // Init Free Drawing Values
    this.canvasObject.canvas.freeDrawingBrush.width = 5;
    this.canvasObject.canvas.freeDrawingBrush.color = 'rgba(255, 0, 0, 0.5)';
  }

  bindCanvasEvents() {
    this.canvasObject.canvas.on({
      'object:moving': (e) => {
        // if (e.target.xtype !== CanvasElements.CanvasUiElementsEnum.controlCircle)
        //   return;

        const target = e.target;
        const origin = this.sketchObject.subServiceLine.customLineControlRadious;

        target.line1 && target.line1.set({ 'x2': target.left + origin, 'y2': target.top + origin });
        target.line2 && target.line2.set({ 'x1': target.left + origin, 'y1': target.top + origin });

        if (target.line1) {
          this.sketchObject.subServiceLine.customLines.customCoords[e.target.lineIndex].x1 = target.line1.x1;
          this.sketchObject.subServiceLine.customLines.customCoords[e.target.lineIndex].y1 = target.line1.y1;
          this.sketchObject.subServiceLine.customLines.customCoords[e.target.lineIndex].x2 = target.line1.x2;
          this.sketchObject.subServiceLine.customLines.customCoords[e.target.lineIndex].y2 = target.line1.y2;

          this.canvasObject.canvas._objects.forEach(element => { // Find line label to move it
            if (element.type === "text" && element.associatedIndex === `CuMeLa-${e.target.lineIndex}`) {

              element.left = (target.line1.x1 + target.line1.x2) / 2;
              element.top = (target.line1.y1 + target.line1.y2) / 2;
              let lineLength = this.getLineLength(target.line1);

              // When service line located short side and behind curb, the service line is missing a piece that connect it to main, we adding it manually.
              if (this.sketchObject.input.params.mainLocation === 1 && this.sketchObject.input.params.tapLocation === 1 && e.target.lineIndex === 0)
                lineLength += (this.sketchObject.input.params.streetTemplate === 3)
                  ? this.sketchObject.mainServiceLine.coordinate.y1 - target.line1.y1
                  : this.sketchObject.mainServiceLine.coordinate.x1 - target.line1.x1;

              element.text = ` ${this.getLineLengthScaledToFeet(lineLength).toString()} ft `;
            }
          });
        }

        if (target.line2) {
          this.sketchObject.subServiceLine.customLines.customCoords[e.target.lineIndex + 1].x1 = target.line2.x1;
          this.sketchObject.subServiceLine.customLines.customCoords[e.target.lineIndex + 1].y1 = target.line2.y1;
          this.sketchObject.subServiceLine.customLines.customCoords[e.target.lineIndex + 1].x2 = target.line2.x2;
          this.sketchObject.subServiceLine.customLines.customCoords[e.target.lineIndex + 1].y2 = target.line2.y2;

          this.canvasObject.canvas._objects.forEach(element => { // Find line label to move it
            if (element.type === "text" && element.associatedIndex === `CuMeLa-${e.target.lineIndex + 1}`) {
              element.left = (target.line2.x1 + target.line2.x2) / 2;
              element.top = (target.line2.y1 + target.line2.y2) / 2;
              element.text = ` ${this.getLineLengthScaledToFeet(this.getLineLength(target.line2)).toString()} ft `;
            }
          });
        }
      },
      'object:modified': (e) => { },
      'selection:created': (e) => {
        e.target._objects.forEach(function (elm) {

        });
      },

      'object:selected': (e) => {
        const selectedObject = e.target;
        this.canvasObject.selected = selectedObject;
        selectedObject.hasRotatingPoint = true;
        selectedObject.transparentCorners = false;
        selectedObject.cornerColor = 'rgba(255, 87, 34, 0.7)';

        this.resetPanels();

        if (selectedObject.type !== 'group' && selectedObject) {
          this.getId();
          this.getOpacity();

          switch (selectedObject.type) {
            case 'rect':
            case 'circle':
            case 'triangle':
              this.canvasObject.figureEditor = true;
              break;
            case 'i-text':
              this.canvasObject.textEditor = true;
              this.getLineHeight();
              this.getCharSpacing();
              this.getBold();
              this.getFontStyle();
              this.getFill();
              this.getTextDecoration();
              this.getTextAlign();
              this.getFontFamily();
              break;
            case 'image':

              break;
          }
        }
      },
      'selection:cleared': (e) => {
        this.canvasObject.selected = null;
        this.resetPanels();
      },
      'mouse:down': (e) => {
        let canvasElement: any = document.getElementById('canvas');
      }
    });
  }
  //#endregion
  // #region |---> [Canvas Plotting Operations]
  plotText(elm: CanvasElements.TextElement, returnObject?: boolean) {
    let minSize = 9;
    let calcFontSize: number = parseInt((this.sketchObject.canvas.margin / (elm.isSmallerFont ? 2.5 : 1.5)).toFixed(2));
    calcFontSize = calcFontSize < minSize ? minSize : calcFontSize;

    let textOptions: any = {
      fontFamily: elm.fontFamily ? elm.fontFamily : 'Roboto',
      fill: elm.foregroundColor,
      opacity: elm.backgroundOpacity ? elm.backgroundOpacity : 1,
      fontSize: calcFontSize,
      textAlign: elm.textAlign ? elm.textAlign : 'center',
      left: elm.coordinate.x,
      top: elm.coordinate.y,
      angle: elm.isVertical ? 90 : 0,
      selectable: elm.isSelectable,
      associatedIndex: elm.associatedIndex,
      textBackgroundColor: elm.backgroundColor,
      objectCaching: false,
      originX: elm.originX ? elm.originX : 'center',
      originY: elm.originY ? elm.originY : 'center'
    };

    if (elm.isSmallerFont && calcFontSize === minSize) {
      textOptions.fontWeight = 600;
      textOptions.fontStyle = 'italic';
    }

    const text = elm.isEditable ? new fabric.IText(elm.text, textOptions) : new fabric.Text(elm.text, textOptions);
    // if (elm.isCentered) {
    //   text.left += elm.isVertical ? (text.height / 2) : -(text.width / 2);
    //   text.top -= text.height / 2;//elm.isVertical ? (text.height / 2) : ; //text.height / 2;
    // }

    if (returnObject)
      return text;
    else
      this.plotToCanvas(text, elm.type, elm.layer);
  }

  plotRectangle(elm: CanvasElements.RectangleElement) {
    let rect = new fabric.Rect({
      top: elm.coordinate.top,
      left: elm.coordinate.left,
      width: elm.coordinate.width,
      height: elm.coordinate.height,
      fill: elm.fillColor,
      stroke: elm.borderColor,
      strokeWidth: elm.borderThickness,
      opacity: elm.fillOpacity,
      selectable: elm.isSelectable,
      objectCaching: false
    });

    this.plotToCanvas(rect, elm.type, elm.layer, elm.xScale);

    if (elm.fillPatternImagePath) {
      let root = this;
      fabric.util.loadImage(elm.fillPatternImagePath, function (img) {
        rect.set('fill', new fabric.Pattern({ source: img, repeat: 'repeat' }));
        root.finalizeRendering();
      });
    };
  }

  plotTriangle(elm: CanvasElements.TriangleElement) {
    let triangle = new fabric.Triangle({
      top: elm.coordinate.top,
      left: elm.coordinate.left,
      width: elm.coordinate.width,
      height: elm.coordinate.height,
      fill: elm.fillColor,
      stroke: elm.strokeColor,
      strokeWidth: elm.strokeThickness,
      opacity: elm.fillOpacity,
      selectable: elm.isSelectable,
      objectCaching: false
    });

    this.plotToCanvas(triangle, elm.type, elm.layer);
  }

  plotCircle(elm: CanvasElements.CircleElement) {
    let circle = new fabric.Circle({
      left: elm.coordinate.x,
      top: elm.coordinate.y,
      strokeWidth: elm.strokeThickness,
      radius: elm.radius,
      fill: elm.fillColor,
      opacity: elm.fillOpacity,
      stroke: elm.strokeColor,
      hasControls: elm.hasControls,
      hasBorders: elm.hasBorders,
      isSelectable: elm.isSelectable,
      objectCaching: false
    });

    this.plotToCanvas(circle, elm.type, elm.layer);
  }

  plotLine(elm: CanvasElements.LineElement, returnObject?: boolean) {
    let line = new fabric.Line([
      elm.coordinate.x1,
      elm.coordinate.y1,
      elm.coordinate.x2,
      elm.coordinate.y2], {
        strokeWidth: elm.thickness,
        strokeDashArray: elm.isDashed ? [elm.thickness * 4, elm.thickness * 2] : [],
        stroke: elm.strokeColor,
        selectable: elm.isSelectable,
        objectCaching: false
      });

    if (returnObject)
      return line;
    else
      this.plotToCanvas(line, elm.type, elm.layer);
  }

  plotMeasurementLine(elm: CanvasElements.MeasurementLineElement, removeLineLimiters?: boolean, returnObject?: boolean) {
    const groupElements = [];
    let lineStart = new SketchData.LineCoordinate();
    let lineEnd = new SketchData.LineCoordinate();
    let measurementTextCoord = new SketchData.PointCoordinate();
    let measurementText = new CanvasElements.TextElement();
    let measurementLineGroup: any;
    let factor = this.sketchObject.canvas.margin / 2;
    let lineOptions = {
      strokeWidth: elm.thickness,
      strokeDashArray: elm.isDashed ? [elm.thickness * elm.strokeDashSegmant1, elm.thickness * elm.strokeDashSegmant2] : [],
      stroke: elm.strokeColor,
      selectable: elm.isSelectable,
      objectCaching: false
    };

    lineStart.x1 = elm.isHorizontal ? elm.coordinate.x1 - factor : elm.coordinate.x1;
    lineStart.y1 = elm.isHorizontal ? elm.coordinate.y1 : elm.coordinate.y1 - factor;
    lineStart.x2 = elm.isHorizontal ? elm.coordinate.x2 + factor : elm.coordinate.x1;
    lineStart.y2 = elm.isHorizontal ? elm.coordinate.y1 : elm.coordinate.y1 + factor;

    lineEnd.x1 = elm.isHorizontal ? elm.coordinate.x1 - factor : elm.coordinate.x2;
    lineEnd.y1 = elm.isHorizontal ? elm.coordinate.y2 : elm.coordinate.y2 - factor;
    lineEnd.x2 = elm.isHorizontal ? elm.coordinate.x2 + factor : elm.coordinate.x2;
    lineEnd.y2 = elm.isHorizontal ? elm.coordinate.y2 : elm.coordinate.y2 + factor;

    elm.measurementTextPosition = (!elm.measurementTextPosition) ? 50 : elm.measurementTextPosition;
    measurementTextCoord.x = elm.isHorizontal ? elm.coordinate.x1 : elm.coordinate.x1 + (((elm.coordinate.x2 - elm.coordinate.x1) * elm.measurementTextPosition) / 100);
    measurementTextCoord.y = elm.isHorizontal ? elm.coordinate.y1 + (((elm.coordinate.y2 - elm.coordinate.y1) * elm.measurementTextPosition) / 100) : elm.coordinate.y1;

    // Main line
    groupElements.push(new fabric.Line([elm.coordinate.x1, elm.coordinate.y1, elm.coordinate.x2, elm.coordinate.y2], lineOptions));

    // Line start abd end limiter
    lineOptions.stroke = this.shadeColor(this.canvasObject.colors.measurementTopLine, 50);
    lineOptions.strokeDashArray = [];

    if (removeLineLimiters === undefined || removeLineLimiters === false) {
      groupElements.push(new fabric.Line([lineStart.x1, lineStart.y1, lineStart.x2, lineStart.y2], lineOptions));
      groupElements.push(new fabric.Line([lineEnd.x1, lineEnd.y1, lineEnd.x2, lineEnd.y2], lineOptions));
    }

    // Measurement Line Text
    measurementText.text = `  ${elm.measurementText.text}  `;
    measurementText.foregroundColor = 'white';
    measurementText.backgroundColor = 'black';
    measurementText.coordinate = measurementTextCoord;
    measurementText.isVertical = elm.measurementText.isVertical;
    measurementText.isCentered = elm.measurementText.isCentered;
    measurementText.isSmallerFont = elm.measurementText.isSmallerFont;
    measurementText.isSelectable = elm.isSelectable;
    measurementText.layer = CanvasElements.CanvasLayersEnum.generatedSketchLayer;

    if (returnObject === undefined || returnObject === false) {
      // Create a group of all ui elements defined above.
      measurementLineGroup = new fabric.Group(groupElements, { selectable: false, objectCaching: false });

      this.plotToCanvas(measurementLineGroup, elm.type, elm.layer);
      this.plotText(measurementText);
    } else {
      groupElements.push(this.plotText(measurementText, true));
      return groupElements;
    }
  }

  plotControlPoints(elm: CanvasElements.ControlPointElement) {
    const text = new CanvasElements.TextElement();
    text.foregroundColor = this.canvasObject.colors.whiteColor;
    text.backgroundColor = this.canvasObject.colors.blackColor;
    text.isSelectable = false;
    text.isEditable = false;
    text.isCentered = true;
    text.isSmallerFont = true;
    text.isVertical = false;
    text.backgroundOpacity = 0.8;
    text.layer = CanvasElements.CanvasLayersEnum.generatedSketchLayer;

    for (let i = 0; i < elm.pointsCoordinate.length; i++) {
      const line = new fabric.Line([elm.pointsCoordinate[i].x1, elm.pointsCoordinate[i].y1, elm.pointsCoordinate[i].x2, elm.pointsCoordinate[i].y2], {
        strokeWidth: elm.thickness,
        strokeDashArray: elm.isDashed ? [elm.thickness * 4, elm.thickness * 2] : [],
        stroke: elm.strokeColor,
        selectable: elm.isSelectable,
        objectCaching: false
      });

      this.sketchObject.subServiceLine.customLines.customLines.push(line);
      this.plotToCanvas(line, elm.type, elm.layer);

      let lineLength = this.getLineLength(line);
      if (this.sketchObject.input.params.mainLocation === 1 && this.sketchObject.input.params.tapLocation === 1 && i === 0)
        lineLength += (this.sketchObject.input.params.streetTemplate === 3)
          ? this.sketchObject.mainServiceLine.coordinate.y1 - line.y1
          : this.sketchObject.mainServiceLine.coordinate.x1 - line.x1;

      text.text = ` ${this.getLineLengthScaledToFeet(lineLength).toString()} ft `;
      text.associatedIndex = `CuMeLa-${i}`;
      text.coordinate.x = (line.x1 + line.x2) / 2;
      text.coordinate.y = (line.y1 + line.y2) / 2;
      this.plotText(text);
    };

    const controlCircle = new CanvasElements.ControlCircleElement();
    controlCircle.strokeThickness = this.sketchObject.streets.borderThickness;
    controlCircle.radius = this.sketchObject.subServiceLine.customLineControlRadious;
    controlCircle.fillColor = this.canvasObject.colors.controlPointFill;
    controlCircle.strokeColor = this.canvasObject.colors.controlPointStroke;
    controlCircle.hasBorders = false;
    controlCircle.hasControls = false;
    controlCircle.isSelectable = true;
    controlCircle.layer = CanvasElements.CanvasLayersEnum.generatedSketchLayer;

    for (let i = 0; i < elm.pointsCoordinate.length; i++) {
      controlCircle.coordinate.x = elm.pointsCoordinate[i].x2;
      controlCircle.coordinate.y = elm.pointsCoordinate[i].y2;
      controlCircle.line1 = this.sketchObject.subServiceLine.customLines.customLines[i];
      controlCircle.line2 = this.sketchObject.subServiceLine.customLines.customLines[i + 1];
      controlCircle.lineIndex = i;
      this.plotControlCircle(controlCircle);
    }
  }

  plotControlCircle(elm: CanvasElements.ControlCircleElement) {
    const controlCircle = new fabric.Circle({
      left: elm.coordinate.x - elm.radius,
      top: elm.coordinate.y - elm.radius,
      strokeWidth: elm.strokeThickness,
      radius: elm.radius,
      fill: elm.fillColor,
      stroke: elm.strokeColor,
      hasControls: elm.hasControls,
      hasBorders: elm.hasBorders,
      isSelectable: elm.isSelectable,
      selectable: elm.isSelectable,
      line1: elm.line1,
      line2: elm.line2,
      lineIndex: elm.lineIndex,
      objectCaching: false
    });

    this.plotToCanvas(controlCircle, elm.type, elm.layer);
  }

  plotCustomImage(event: any) {
    let el = event.target;
    fabric.Image.fromURL(el.src, (image) => {
      image.set({
        left: 10,
        top: 10,
        angle: 0,
        padding: 10,
        cornersize: 10,
        hasRotatingPoint: true,
        peloas: 12
      });
      image.scaleToWidth(this.canvasObject.canvas.width / 10);

      this.plotToCanvas(image, CanvasElements.CanvasUiElementsEnum.image, CanvasElements.CanvasLayersEnum.userShapesLayer);
      this.selectItemAfterAdded(image);
    });
  }

  plotGrid() {
    const grid: number = this.canvasObject.gridSize;
    const gridArray: any = [];
    this.canvasObject.canvas.renderOnAddRemove = false;

    for (let i = 1; i < (this.canvasObject.canvas.width / grid); i++)
      gridArray.push(new fabric.Line([i * grid, 0, i * grid, this.canvasObject.canvas.height], { stroke: this.canvasObject.colors.gridColor, strokeWidth: 1, selectable: false, objectCaching: false }));

    for (let i = 1; i < (this.canvasObject.canvas.height / grid); i++)
      gridArray.push(new fabric.Line([0, i * grid, this.canvasObject.canvas.width, i * grid], { stroke: this.canvasObject.colors.gridColor, strokeWidth: 1, selectable: false, objectCaching: false }));

    const gridGroup = new fabric.Group(gridArray, {
      id: 'grid',
      selectable: false,
      objectCaching: false
    });

    this.canvasObject.canvas.add(gridGroup);
    this.canvasObject.canvas.renderOnAddRemove = true;
    this.finalizeRendering();
  }

  plotSketchLegend() {
    const margin = this.sketchObject.canvas.margin / 2;
    const lineHeight = 25;
    const legendArray: any = [];
    const line = new CanvasElements.MeasurementLineElement();
    const text = new CanvasElements.TextElement();
    let legendLineCoords = new SketchData.PointCoordinate();
    let legendCoordinate = new SketchData.ShapeCoordinate();

    line.thickness = this.sketchObject.mainServiceLine.thickness;
    line.layer = CanvasElements.CanvasLayersEnum.generatedSketchLayer;
    line.isSelectable = false;
    line.strokeColor = this.canvasObject.colors.mainServiceLine;
    line.isDashed = true;
    line.strokeDashSegmant1 = 2;
    line.strokeDashSegmant2 = 1;

    text.foregroundColor = this.canvasObject.colors.whiteColor;
    text.isSelectable = false;
    text.isEditable = false;
    text.isCentered = true;
    text.isSmallerFont = true;
    text.isVertical = false;
    text.layer = CanvasElements.CanvasLayersEnum.generatedSketchLayer;

    legendCoordinate.top = 10;
    legendCoordinate.width = this.sketchObject.canvas.width * 20 / 100;
    legendCoordinate.height = this.sketchObject.canvas.height * 18 / 100;

    switch (this.sketchObject.input.params.streetTemplate) {
      case 1: // Standard Right -> Main street bottom and side street on the right
        legendCoordinate.left = 10;
        break;
      case 2: // Standard Left -> Main street bottom and side street on the left
      case 3: // Other -> Main street bottom and no side streets
        legendCoordinate.left = this.sketchObject.canvas.width - legendCoordinate.width - 10;
        break;
      default:
        break;
    }

    let container = new fabric.Rect({
      top: legendCoordinate.top,
      left: legendCoordinate.left,
      width: legendCoordinate.width,
      height: legendCoordinate.height,
      fill: "black",
      opacity: 0.7,
      selectable: false,
      objectCaching: false
    });

    legendLineCoords.x = legendCoordinate.left + margin;
    legendLineCoords.y = legendCoordinate.top + margin;
    line.coordinate.x1 = legendLineCoords.x;
    line.coordinate.x2 = legendCoordinate.left + legendCoordinate.width - margin;

    // Main Legend
    line.coordinate.y1 = legendLineCoords.y;
    line.coordinate.y2 = legendLineCoords.y;
    text.text = "Main";
    line.measurementText = text;
    let mainGasLine = this.plotMeasurementLine(line, true, true);

    // Main Extension Legend
    legendLineCoords.y += lineHeight;
    line.strokeColor = this.canvasObject.colors.mainExtensionLine;
    line.coordinate.y1 = legendLineCoords.y;
    line.coordinate.y2 = legendLineCoords.y;
    text.text = "Main Extension";
    line.measurementText = text;
    let mainGasLineExtension = this.plotMeasurementLine(line, true, true);

    // Service Legend
    legendLineCoords.y += lineHeight;
    line.strokeColor = this.canvasObject.colors.mainServiceLine;
    line.coordinate.y1 = legendLineCoords.y;
    line.coordinate.y2 = legendLineCoords.y;
    line.isDashed = false;
    text.text = "Service";
    line.measurementText = text;
    let serviceGasLine = this.plotMeasurementLine(line, true, true);

    // Measurement Legend
    legendLineCoords.y += lineHeight;
    line.strokeColor = this.canvasObject.colors.measurementLine;
    line.coordinate.y1 = legendLineCoords.y;
    line.coordinate.y2 = legendLineCoords.y;
    text.text = "Measurement";
    line.measurementText = text;
    let measurementLine = this.plotMeasurementLine(line, true, true);

    // Execluded Measurement Legend
    legendLineCoords.y += lineHeight;
    line.strokeColor = this.canvasObject.colors.measurementSubtractLine;
    line.coordinate.y1 = legendLineCoords.y;
    line.coordinate.y2 = legendLineCoords.y;
    line.isDashed = true;
    line.strokeDashSegmant1 = 1;
    line.strokeDashSegmant2 = 1;
    text.text = "Omitted Measurement";
    line.measurementText = text;
    let OmitMeasurementLine = this.plotMeasurementLine(line, true, true);

    // Push Legend elements into a Fabric group
    legendArray.push(container);
    legendArray.push(mainGasLine[0]); // Line
    legendArray.push(mainGasLine[1]); // Text
    legendArray.push(mainGasLineExtension[0]); // Line
    legendArray.push(mainGasLineExtension[1]); // Text
    legendArray.push(serviceGasLine[0]); // Line
    legendArray.push(serviceGasLine[1]); // Text
    legendArray.push(measurementLine[0]); // Line
    legendArray.push(measurementLine[1]); // Text
    legendArray.push(OmitMeasurementLine[0]); // Line
    legendArray.push(OmitMeasurementLine[1]); // Text

    // Construct fabric group
    const gridGroup = new fabric.Group(legendArray, {
      id: 'legend',
      selectable: false,
      objectCaching: false
    });

    // Plot the group
    this.canvasObject.canvas.add(gridGroup);
    this.canvasObject.canvas.renderOnAddRemove = true;
    this.finalizeRendering();
  }

  plotToCanvas(obj: any, xtype: string, xlayer: string, xscale?: number) {
    this.extend(obj, xtype, xlayer, xscale);
    this.canvasObject.canvas.add(obj);
    this.finalizeRendering();
  }
  //#endregion
  // #region |---> [Canvas Operations]
  calculateCanvasSize() {
    // Set the canvas width to 80% of the parent container
    this.canvasObject.canvasSize.width = ($(this.canvasObject.sketchContainerSelector).width() * 100 / 100);

    // If canvas size is more than the defined max-size, resize.
    this.canvasObject.canvasSize.width =
      this.canvasObject.canvasSize.width > this.canvasObject.canvasSize.maxWidth
        ? this.canvasObject.canvasSize.maxWidth
        : this.canvasObject.canvasSize.width;

    // If canvas size is less than the defined min-size, resize.
    this.canvasObject.canvasSize.width =
      this.canvasObject.canvasSize.width < this.canvasObject.canvasSize.minWidth
        ? this.canvasObject.canvasSize.minWidth
        : this.canvasObject.canvasSize.width;

    // Using 4:3 aspect ration to set the canvas height.
    this.canvasObject.canvasSize.height = this.canvasObject.canvasSize.width / 4 * 3;

    // Sync canvas (UI) object with sketch (data) object
    this.sketchObject.canvas.width = this.canvasObject.canvasSize.width;
    this.sketchObject.canvas.height = this.canvasObject.canvasSize.height;

    // Sketch margin, is an edges spacing value to leave blank before draw objects also used in many calculations. 3% of the canvas size.
    this.sketchObject.canvas.margin = this.canvasObject.canvasSize.width * 3 / 100;
    this.canvasObject.gridSize = this.canvasObject.canvasSize.width * 2 / 100;

    this.canvasObject.canvas.setWidth(this.sketchObject.canvas.width);
    this.canvasObject.canvas.setHeight(this.sketchObject.canvas.height);

    // Streets dimensions
    this.sketchObject.streets.horizontalWidth = this.sketchObject.canvas.width * 18 / 100;    // Main Street
    this.sketchObject.streets.verticalWidth = this.sketchObject.canvas.width * 15 / 100;      // Side Street
    this.sketchObject.streets.borderThickness = this.sketchObject.canvas.width * 0.15 / 100;  // Street border thickness

    // Building dimensions
    this.sketchObject.buildings.main.width = this.sketchObject.canvas.width * 20 / 100;
    this.sketchObject.buildings.main.height = this.sketchObject.canvas.height * 22 / 100;
    this.sketchObject.buildings.garage.width = this.sketchObject.buildings.main.width / 2;
    this.sketchObject.buildings.garage.height = this.sketchObject.buildings.main.height / 2;

    // Service Lines dimensions
    this.sketchObject.mainServiceLine.thickness = this.sketchObject.canvas.width * 0.3 / 100;
    this.sketchObject.mainServiceLine.measurementLineThickness = this.sketchObject.canvas.width * 0.15 / 100;
    this.sketchObject.subServiceLine.thickness = this.sketchObject.canvas.width * 0.2 / 100;
    this.sketchObject.subServiceLine.customLineControlRadious = this.sketchObject.canvas.width * 0.5 / 100;
  }

  changeGridMode(isFreeDrawingMode: boolean) {
    const root = this;
    this.canvasObject.canvas._objects.forEach(function (element) {
      if (element.type === 'group' && element.id === 'grid')
        element._objects.forEach(function (line) {
          line.stroke = isFreeDrawingMode ? root.canvasObject.colors.gridDrawingColor : root.canvasObject.colors.gridColor;
        });
    });
    this.finalizeRendering();
  }

  toggleGrid(isVisible: boolean) {
    this.canvasObject.canvas._objects.forEach(function (element) {
      if (element.type === 'group' && element.id === 'grid')
        element.opacity = isVisible ? 1 : 0;
    });
  }

  toggleLegendPanel(isVisible: boolean) {
    let root = this;
    this.canvasObject.canvas._objects.forEach(function (element) {
      if (element.type === 'group' && element.id === 'legend') {
        element.opacity = isVisible ? 1 : 0;
        root.finalizeRendering();
        if (isVisible)
          element.bringToFront();
        else
          element.sendToBack();
      }
    });
  }

  toggleFreeDrawing(isEnabled: boolean) {
    this.canvasObject.canvas.discardActiveObject();
    this.canvasObject.canvas.isDrawingMode = isEnabled;
    this.changeGridMode(isEnabled);
    this.finalizeRendering();
  }

  clearCanvas() {
    this.canvasObject.canvas.clear();
    this.canvasObject.canvas.backgroundColor = this.canvasObject.colors.backColor;
    this.plotGrid();
    this.plotSketchLegend();
    this.toggleLegendPanel(false);
    this.finalizeRendering();
  }

  clearPaths() {
    var i = this.canvasObject.canvas._objects.length;
    while (i--) {
      const path = this.canvasObject.canvas._objects[i];
      if (path && path.type && path.type === 'path')
        this.canvasObject.canvas._objects[i].remove();
    }
    this.finalizeRendering();
  }

  selectItemAfterAdded(obj) {
    this.canvasObject.canvas.deactivateAllWithDispatch().renderAll();
    this.canvasObject.canvas.setActiveObject(obj);
  }

  finalizeRendering() {
    this.updateSkecthCalcPanel();
    this.canvasObject.canvas.renderAll();
    this.canvasObject.canvas.renderAll.bind(this.canvasObject.canvas)();
  }
  //#endregion
  // ##########################################
  // #endregion

  // #region |-> [Sketch Calculations]
  // ## Render Sketch: clear the canvas and draw all objects.
  plotSketchElements() { // Plot sketch elements on the canvas, such as streets and buildings
    this.sketchStreets();
    this.sketchBuilding();
    this.sketchMainServiceLine();
    this.sketchSubServiceLine();
    this.sketchMeasurements();
    this.finalizeRendering();
  }

  // ## Skitch Streets: Based on parameters, determine streets coordinates and dimension
  sketchStreets() {
    this.sketchObject.streets.mainStreet.top = this.sketchObject.canvas.height - (this.sketchObject.canvas.margin * 2) - this.sketchObject.streets.horizontalWidth;
    this.sketchObject.streets.mainStreet.height = this.sketchObject.streets.horizontalWidth;

    this.sketchObject.streets.sideStreet.top = this.sketchObject.canvas.margin;
    this.sketchObject.streets.sideStreet.height = this.sketchObject.canvas.height - (this.sketchObject.canvas.margin * 2);
    this.sketchObject.streets.sideStreet.width = this.sketchObject.streets.verticalWidth;

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

    // Define a rectangle, to be used by both main and side streets.
    let rect = new CanvasElements.RectangleElement();
    rect.borderThickness = 1;
    rect.borderColor = this.canvasObject.colors.streetBorder;
    rect.fillColor = this.canvasObject.colors.streetColor;
    rect.fillOpacity = 1;
    rect.isSelectable = false;
    rect.layer = CanvasElements.CanvasLayersEnum.generatedSketchLayer;
    rect.fillPatternImagePath = this.canvasObject.sketchStreetPattern;

    let text = new CanvasElements.TextElement();
    text.foregroundColor = this.canvasObject.colors.whiteColor;
    text.isSelectable = false;
    text.isEditable = false;
    text.isCentered = false;
    rect.layer = CanvasElements.CanvasLayersEnum.generatedSketchLayer;

    if (this.sketchObject.input.params.streetTemplate === 1 || this.sketchObject.input.params.streetTemplate === 2) {
      rect.coordinate = this.sketchObject.streets.sideStreet;
      text.text = this.parseAddress(this.sketchObject.input.site.nearestStreetName).street;
      text.coordinate.x = (this.sketchObject.streets.sideStreet.left + (this.sketchObject.streets.sideStreet.width / 2) + (this.sketchObject.canvas.margin / 1.5));
      text.coordinate.y = (this.sketchObject.streets.sideStreet.top + (this.sketchObject.streets.sideStreet.height / 2));
      text.isVertical = true;

      this.plotRectangle(rect);
      this.plotText(text);
    }

    rect.coordinate = this.sketchObject.streets.mainStreet;
    text.text = this.parseAddress(this.sketchObject.input.customer.streetAddress).street;
    text.coordinate.x = (this.sketchObject.streets.mainStreet.left + this.sketchObject.canvas.margin * 1.5);
    text.coordinate.y = (this.sketchObject.streets.mainStreet.top + (this.sketchObject.streets.mainStreet.height / 2) - (this.sketchObject.canvas.margin / 1.5));
    text.isVertical = false;
    this.plotRectangle(rect);
    this.plotText(text);
  }

  // ## Skitch Building: Based on parameters, determine building coordinates and dimensions
  sketchBuilding() {
    switch (this.sketchObject.input.params.streetTemplate) {
      case 1: // Standard Right -> Main street bottom and side street on the right
        this.sketchObject.buildings.main.left = (this.sketchObject.canvas.width / 2) - this.sketchObject.streets.verticalWidth - this.sketchObject.buildings.main.width / 2;
        break;
      case 2: // Standard Left -> Main street bottom and side street on the left
        this.sketchObject.buildings.main.left = (this.sketchObject.canvas.width / 2) + this.sketchObject.streets.verticalWidth / 2;
        break;
      case 3: // Other -> Main street bottom and no side streets
        this.sketchObject.buildings.main.left = (this.sketchObject.canvas.width / 2) - this.sketchObject.buildings.main.width / 2;
        break;
      default:
    }

    switch (this.sketchObject.input.params.buildingTemplate) {
      case 2: // Garage Left -> Garage is to the left side of main building
        this.sketchObject.buildings.garage.left = this.sketchObject.buildings.main.left - this.sketchObject.buildings.garage.width;
        break;
      case 3: // Garage Right -> Garage is to the right side of main building
        this.sketchObject.buildings.garage.left = this.sketchObject.buildings.main.left + this.sketchObject.buildings.main.width;
        break;
      default:
    }

    this.sketchObject.buildings.main.top = (this.sketchObject.canvas.margin * 2.5);

    // Define a rectangle, to be used by both main building and garage.
    let rect = new CanvasElements.RectangleElement();
    rect.borderThickness = 1;
    rect.borderColor = this.canvasObject.colors.objectBorder;
    rect.fillColor = this.canvasObject.colors.buildingColor;
    rect.fillOpacity = 1;
    rect.isSelectable = false;
    rect.layer = CanvasElements.CanvasLayersEnum.generatedSketchLayer;

    let text = new CanvasElements.TextElement();
    text.foregroundColor = this.canvasObject.colors.blackColor;
    text.isSelectable = false;
    text.isEditable = false;
    text.isCentered = true;
    text.isSmallerFont = true;
    text.isVertical = false;
    text.layer = CanvasElements.CanvasLayersEnum.generatedSketchLayer;

    if (this.sketchObject.input.params.buildingTemplate === 2 || this.sketchObject.input.params.buildingTemplate === 3) {
      this.sketchObject.buildings.garage.top = this.sketchObject.buildings.main.top;

      rect.coordinate = this.sketchObject.buildings.garage;
      text.text = 'Garage';
      text.coordinate.x = this.sketchObject.buildings.garage.left + (this.sketchObject.buildings.garage.width / 2);
      text.coordinate.y = this.sketchObject.buildings.garage.top + (this.sketchObject.buildings.garage.height / 2);

      this.plotRectangle(rect);
      this.plotText(text);
    }

    rect.coordinate = this.sketchObject.buildings.main;
    text.text = `Main Building ${this.sketchObject.input.site.preferredLocation ? '\nPreferred Location' : ''}`;
    text.coordinate.x = (this.sketchObject.buildings.main.left + (this.sketchObject.buildings.main.width / 2));
    text.coordinate.y = (this.sketchObject.buildings.main.top + (this.sketchObject.buildings.main.height / 2));

    this.plotRectangle(rect);
    this.plotText(text);
  }

  // ## Skitch Main Service Line: Based on parameters, determine service lines coordinates and dimensions
  sketchMainServiceLine() {
    let curbLocation = ((this.sketchObject.input.params.tapLocation === 1) ? (-this.sketchObject.canvas.margin) : this.sketchObject.canvas.margin);
    const streetLocation = (this.sketchObject.input.params.streetTemplate === 1) ? 0 : -this.sketchObject.streets.sideStreet.width;

    switch (this.sketchObject.input.params.streetTemplate) {
      case 1: // Standard Right -> Main street bottom and side street on the right
      case 2: // Standard Left -> Main street bottom and side street on the left
        this.sketchObject.mainServiceLine.coordinate.y1 = this.sketchObject.streets.sideStreet.top + this.sketchObject.canvas.margin;
        this.sketchObject.mainServiceLine.coordinate.y2 = this.sketchObject.streets.sideStreet.height / (this.sketchObject.input.site.mainExtensionRequired ? 8 : 1);
        curbLocation = ((this.sketchObject.input.params.streetTemplate === 1) ? curbLocation : -curbLocation);

        switch (this.sketchObject.input.params.mainLocation) {
          case 1: // Short Side -> Near to the building
            this.sketchObject.mainServiceLine.coordinate.x1 = this.sketchObject.streets.sideStreet.left + curbLocation - streetLocation;
            this.sketchObject.mainServiceLine.coordinate.x2 = this.sketchObject.mainServiceLine.coordinate.x1;
            break;
          case 2: // Long Side -> Far from the building other side of street
            this.sketchObject.mainServiceLine.coordinate.x1 = this.sketchObject.streets.sideStreet.left + this.sketchObject.streets.sideStreet.width - curbLocation + streetLocation;
            this.sketchObject.mainServiceLine.coordinate.x2 = this.sketchObject.mainServiceLine.coordinate.x1;
            break;
          default:
        };

        break;
      case 3: // Other -> Main street bottom and no side streets
        this.sketchObject.mainServiceLine.coordinate.x1 = this.sketchObject.streets.mainStreet.left + this.sketchObject.canvas.margin;
        this.sketchObject.mainServiceLine.coordinate.x2 = this.sketchObject.streets.mainStreet.width / (this.sketchObject.input.site.mainExtensionRequired ? 10 : 1);

        switch (this.sketchObject.input.params.mainLocation) {
          case 1: // Short Side -> Near to the building
            this.sketchObject.mainServiceLine.coordinate.y1 = this.sketchObject.streets.mainStreet.top + curbLocation;
            this.sketchObject.mainServiceLine.coordinate.y2 = this.sketchObject.mainServiceLine.coordinate.y1;
            break;
          case 2: // Long Side -> Far from the building other side of street
            this.sketchObject.mainServiceLine.coordinate.y1 = this.sketchObject.streets.mainStreet.top + this.sketchObject.streets.mainStreet.height - curbLocation;
            this.sketchObject.mainServiceLine.coordinate.y2 = this.sketchObject.mainServiceLine.coordinate.y1;
            break;
          default:
        };
        break;
      default:
    };

    let serviceLine = new CanvasElements.LineElement();
    serviceLine.coordinate = this.sketchObject.mainServiceLine.coordinate;
    serviceLine.thickness = this.sketchObject.mainServiceLine.thickness;
    serviceLine.strokeColor = this.canvasObject.colors.mainServiceLine;
    serviceLine.isSelectable = false;
    serviceLine.isDashed = true;
    serviceLine.layer = CanvasElements.CanvasLayersEnum.generatedSketchLayer;

    this.plotLine(serviceLine);
  }

  // ## Skitch Sub-Service Line: Based on parameters, determine sub-service lines coordinates and dimensions
  sketchSubServiceLine() {
    let i;
    let subLineSuffexY = 0;
    let subLineSuffexX = 0;
    let multiplier;
    let pointStart;
    let buildingMeterCoords;
    const controlPoints = new CanvasElements.ControlPointElement();
    const subLine = new CanvasElements.LineElement();
    const tapRect = new CanvasElements.RectangleElement();
    const mainExtension = new CanvasElements.MeasurementLineElement();
    const mainExtensionText = new CanvasElements.TextElement();

    // Define the main line extension if needed
    mainExtension.thickness = this.sketchObject.mainServiceLine.thickness;
    mainExtension.strokeColor = this.canvasObject.colors.mainExtensionLine;
    mainExtension.isDashed = true;
    mainExtension.strokeDashSegmant1 = 4;
    mainExtension.strokeDashSegmant2 = 2;
    mainExtension.measurementTextPosition = 10;
    mainExtension.isSelectable = false;
    mainExtension.isHorizontal = false;
    mainExtension.layer = CanvasElements.CanvasLayersEnum.generatedSketchLayer;

    mainExtensionText.foregroundColor = this.canvasObject.colors.whiteColor;
    mainExtensionText.isSelectable = false;
    mainExtensionText.isEditable = false;
    mainExtensionText.isCentered = true;
    mainExtensionText.isSmallerFont = true;
    mainExtensionText.layer = CanvasElements.CanvasLayersEnum.generatedSketchLayer;

    // Define control points option for all scenarios
    controlPoints.thickness = this.sketchObject.mainServiceLine.thickness;
    controlPoints.strokeColor = this.canvasObject.colors.mainServiceLine;
    controlPoints.isDashed = false;
    controlPoints.isSelectable = false;
    controlPoints.layer = CanvasElements.CanvasLayersEnum.generatedSketchLayer;

    // Define extension line for all scenarios
    subLine.thickness = this.sketchObject.mainServiceLine.thickness;
    subLine.strokeColor = this.canvasObject.colors.mainServiceLine;
    subLine.isSelectable = false;
    subLine.isDashed = false;
    subLine.layer = CanvasElements.CanvasLayersEnum.generatedSketchLayer;

    // Define tap connection rectangle
    tapRect.borderThickness = this.sketchObject.subServiceLine.thickness;
    tapRect.borderColor = this.canvasObject.colors.streetBorder;
    tapRect.fillColor = this.canvasObject.colors.mainServiceLine;
    tapRect.fillOpacity = 0.60;
    tapRect.isSelectable = false;
    tapRect.layer = CanvasElements.CanvasLayersEnum.generatedSketchLayer;

    this.sketchObject.subServiceLine.extension = new SketchData.LineCoordinate();
    this.sketchObject.subServiceLine.customLines.customCoords = [];
    this.sketchObject.subServiceLine.customLines.customLines = [];
    this.sketchObject.subServiceLine.hasExtension = false;

    switch (this.sketchObject.input.params.streetTemplate) {
      case 1: // Standard Right -> Main street bottom and side street on the right
        if (this.sketchObject.input.params.meterLocation === 1 ||
          this.sketchObject.input.params.meterLocation === 2 ||
          this.sketchObject.input.params.meterLocation === 3) {
          subLineSuffexY = this.sketchObject.canvas.margin;
          subLineSuffexX = this.sketchObject.buildings.garage.width;
        }
        else if (this.sketchObject.input.params.meterLocation === 4 ||
          this.sketchObject.input.params.meterLocation === 5 ||
          this.sketchObject.input.params.meterLocation === 6) {
          subLineSuffexY = this.sketchObject.buildings.main.height - this.sketchObject.canvas.margin;
          subLineSuffexX = 0;
        }

        this.sketchObject.subServiceLine.coordinate.x1 = this.sketchObject.mainServiceLine.coordinate.x1;
        this.sketchObject.subServiceLine.coordinate.x2 = this.sketchObject.buildings.main.left + this.sketchObject.buildings.main.width + ((this.sketchObject.input.params.buildingTemplate === 3) ? subLineSuffexX : 0);
        this.sketchObject.subServiceLine.coordinate.y1 = this.sketchObject.buildings.main.top + subLineSuffexY;
        this.sketchObject.subServiceLine.coordinate.y2 = this.sketchObject.subServiceLine.coordinate.y1;

        // If custom service line requested, use the above calculations but also add the requested number of extension lines
        if (this.sketchObject.input.params.meterLocation === 6) {
          multiplier = 1.5;
          pointStart = 0;
          buildingMeterCoords = this.sketchObject.subServiceLine.coordinate.x2;
          this.sketchObject.subServiceLine.coordinate.x2 = this.sketchObject.subServiceLine.coordinate.x1 - this.sketchObject.canvas.margin;
          if (this.sketchObject.input.params.mainLocation === 2) { // Long side
            this.sketchObject.subServiceLine.coordinate.x2 -= this.sketchObject.streets.verticalWidth;

            if (this.sketchObject.input.params.tapLocation === 2) {
              this.sketchObject.subServiceLine.coordinate.x2 += this.sketchObject.canvas.margin * 2;
            }
          }
          pointStart = this.sketchObject.subServiceLine.coordinate.x2;

          if (this.sketchObject.subServiceLine.customLines.customCoords.length < 1) {
            for (i = 0; i < this.sketchObject.input.params.controlPoints; i++) {
              this.sketchObject.subServiceLine.customLines.customCoords.push({
                x1: pointStart,
                x2: (i === this.sketchObject.input.params.controlPoints - 1) ? buildingMeterCoords : pointStart - (this.sketchObject.canvas.margin * multiplier),
                y1: this.sketchObject.subServiceLine.coordinate.y1,
                y2: this.sketchObject.subServiceLine.coordinate.y1
              });

              pointStart -= (this.sketchObject.canvas.margin * multiplier);
            }
          }
          else {
            this.sketchObject.subServiceLine.customLines.customCoords[0].x1 = pointStart;
            this.sketchObject.subServiceLine.customLines.customCoords[0].y1 = this.sketchObject.subServiceLine.coordinate.y1;

            this.sketchObject.subServiceLine.customLines.customCoords[this.sketchObject.input.params.controlPoints - 1].x2 = buildingMeterCoords;
            this.sketchObject.subServiceLine.customLines.customCoords[this.sketchObject.input.params.controlPoints - 1].y2 = this.sketchObject.subServiceLine.coordinate.y1;
          }

          controlPoints.pointsCoordinate = this.sketchObject.subServiceLine.customLines.customCoords;
          this.plotControlPoints(controlPoints);
        }

        // Set the main extension coordinate
        if (this.sketchObject.input.site.mainExtensionRequired) {
          mainExtension.coordinate.x1 = this.sketchObject.mainServiceLine.coordinate.x1;
          mainExtension.coordinate.x2 = this.sketchObject.mainServiceLine.coordinate.x2;
          mainExtension.coordinate.y1 = this.sketchObject.mainServiceLine.coordinate.y2;
          mainExtension.coordinate.y2 = this.sketchObject.subServiceLine.coordinate.y1 + (this.sketchObject.canvas.margin); //this.sketchObject.streets.sideStreet.height;
          mainExtension.isHorizontal = true;
        }
        break;
      case 2: // Standard Left -> Main street bottom and side street on the left
        if (this.sketchObject.input.params.meterLocation === 1 ||
          this.sketchObject.input.params.meterLocation === 2 ||
          this.sketchObject.input.params.meterLocation === 3) {
          subLineSuffexY = this.sketchObject.canvas.margin;
          subLineSuffexX = this.sketchObject.buildings.garage.width;
        }
        else if (this.sketchObject.input.params.meterLocation === 4 ||
          this.sketchObject.input.params.meterLocation === 5 ||
          this.sketchObject.input.params.meterLocation === 6) {
          subLineSuffexY = this.sketchObject.buildings.main.height - this.sketchObject.canvas.margin;
          subLineSuffexX = 0;
        }

        this.sketchObject.subServiceLine.coordinate.x1 = this.sketchObject.mainServiceLine.coordinate.x1;
        this.sketchObject.subServiceLine.coordinate.x2 = this.sketchObject.buildings.main.left - ((this.sketchObject.input.params.buildingTemplate === 2) ? subLineSuffexX : 0);
        this.sketchObject.subServiceLine.coordinate.y1 = this.sketchObject.buildings.main.top + subLineSuffexY;
        this.sketchObject.subServiceLine.coordinate.y2 = this.sketchObject.subServiceLine.coordinate.y1;

        // If custom service line requested, use the above calculations but also add the requested number of extension lines
        if (this.sketchObject.input.params.meterLocation === 6) {
          multiplier = 1.5;
          pointStart = 0;
          buildingMeterCoords = this.sketchObject.subServiceLine.coordinate.x2;
          this.sketchObject.subServiceLine.coordinate.x2 = this.sketchObject.subServiceLine.coordinate.x1 + this.sketchObject.canvas.margin;

          if (this.sketchObject.input.params.mainLocation === 2) { // Long side
            this.sketchObject.subServiceLine.coordinate.x2 += this.sketchObject.streets.verticalWidth;

            if (this.sketchObject.input.params.tapLocation === 2) {
              this.sketchObject.subServiceLine.coordinate.x2 -= this.sketchObject.canvas.margin * 2;
            }
          }

          pointStart = this.sketchObject.subServiceLine.coordinate.x2;
          if (this.sketchObject.subServiceLine.customLines.customCoords.length < 1) {
            for (i = 0; i < this.sketchObject.input.params.controlPoints; i++) {
              this.sketchObject.subServiceLine.customLines.customCoords.push({
                x1: pointStart,
                x2: (i === this.sketchObject.input.params.controlPoints - 1)
                  ? buildingMeterCoords
                  : pointStart + (this.sketchObject.canvas.margin * multiplier),
                y1: this.sketchObject.subServiceLine.coordinate.y1,
                y2: this.sketchObject.subServiceLine.coordinate.y1
              });

              pointStart += (this.sketchObject.canvas.margin * multiplier);
            }
          }
          else {
            this.sketchObject.subServiceLine.customLines.customCoords[0].x1 = pointStart;
            this.sketchObject.subServiceLine.customLines.customCoords[0].y1 = this.sketchObject.subServiceLine.coordinate.y1;

            this.sketchObject.subServiceLine.customLines.customCoords[this.sketchObject.input.params.controlPoints - 1].x2 = buildingMeterCoords;
            this.sketchObject.subServiceLine.customLines.customCoords[this.sketchObject.input.params.controlPoints - 1].y2 = this.sketchObject.subServiceLine.coordinate.y1;
          }

          controlPoints.pointsCoordinate = this.sketchObject.subServiceLine.customLines.customCoords;
          this.plotControlPoints(controlPoints);
        }

        // Set the main extension coordinate
        if (this.sketchObject.input.site.mainExtensionRequired) {
          mainExtension.coordinate.x1 = this.sketchObject.mainServiceLine.coordinate.x1;
          mainExtension.coordinate.x2 = this.sketchObject.mainServiceLine.coordinate.x2;
          mainExtension.coordinate.y1 = this.sketchObject.mainServiceLine.coordinate.y2;
          mainExtension.coordinate.y2 = this.sketchObject.subServiceLine.coordinate.y1 + (this.sketchObject.canvas.margin); //this.sketchObject.streets.sideStreet.height;
          mainExtension.isHorizontal = true;
        }
        break;
      case 3: // Other -> Main street bottom and no side streets
        this.sketchObject.subServiceLine.coordinate.y2 = this.sketchObject.mainServiceLine.coordinate.y2;
        if (this.sketchObject.input.params.buildingTemplate === 1)
          this.sketchObject.buildings.garage = { top: 0, left: 0, width: 0, height: 0 };

        this.sketchObject.subServiceLine.hasExtension = true;
        switch (this.sketchObject.input.params.meterLocation) {
          case 1: // Front Side -> Meter at the front side
            this.sketchObject.subServiceLine.coordinate.x1 = this.sketchObject.buildings.main.left + (this.sketchObject.buildings.main.width / 2);
            this.sketchObject.subServiceLine.coordinate.x2 = this.sketchObject.subServiceLine.coordinate.x1;
            this.sketchObject.subServiceLine.coordinate.y1 = this.sketchObject.buildings.main.top + this.sketchObject.buildings.main.height;
            this.sketchObject.subServiceLine.hasExtension = false;
            break;
          case 2: // Left Side -> Meter at the left side
            this.sketchObject.subServiceLine.coordinate.x1 = this.sketchObject.buildings.main.left
              - ((this.sketchObject.input.params.buildingTemplate === 2) ? this.sketchObject.buildings.garage.width : 0)
              - this.sketchObject.canvas.margin;
            this.sketchObject.subServiceLine.coordinate.x2 = this.sketchObject.subServiceLine.coordinate.x1;
            this.sketchObject.subServiceLine.coordinate.y1 = this.sketchObject.buildings.main.top + this.sketchObject.canvas.margin;

            this.sketchObject.subServiceLine.extension.x2 = this.sketchObject.subServiceLine.coordinate.x1 + this.sketchObject.canvas.margin;
            break;
          case 3: // Right Side -> Meter at the right side
            this.sketchObject.subServiceLine.coordinate.x1 = this.sketchObject.buildings.main.left
              + this.sketchObject.buildings.main.width
              + ((this.sketchObject.input.params.buildingTemplate === 3) ? this.sketchObject.buildings.garage.width : 0)
              + this.sketchObject.canvas.margin;
            this.sketchObject.subServiceLine.coordinate.x2 = this.sketchObject.subServiceLine.coordinate.x1;
            this.sketchObject.subServiceLine.coordinate.y1 = this.sketchObject.buildings.main.top + this.sketchObject.canvas.margin;

            this.sketchObject.subServiceLine.extension.x2 = this.sketchObject.subServiceLine.coordinate.x1 - this.sketchObject.canvas.margin;
            break;
          case 4: // Front Left Side -> Meter at the front left side
            this.sketchObject.subServiceLine.coordinate.x1 = this.sketchObject.buildings.main.left - this.sketchObject.canvas.margin;
            this.sketchObject.subServiceLine.coordinate.x2 = this.sketchObject.subServiceLine.coordinate.x1;
            this.sketchObject.subServiceLine.coordinate.y1 = this.sketchObject.buildings.main.top + this.sketchObject.buildings.main.height - this.sketchObject.canvas.margin;

            this.sketchObject.subServiceLine.extension.x2 = this.sketchObject.subServiceLine.coordinate.x1 + this.sketchObject.canvas.margin;
            break;
          case 5: // Front Right Side -> Meter at the front right side
            this.sketchObject.subServiceLine.coordinate.x1 = this.sketchObject.buildings.main.left + this.sketchObject.buildings.main.width + this.sketchObject.canvas.margin;
            this.sketchObject.subServiceLine.coordinate.x2 = this.sketchObject.subServiceLine.coordinate.x1;
            this.sketchObject.subServiceLine.coordinate.y1 = this.sketchObject.buildings.main.top + this.sketchObject.buildings.main.height - this.sketchObject.canvas.margin;

            this.sketchObject.subServiceLine.extension.x2 = this.sketchObject.subServiceLine.coordinate.x1 - this.sketchObject.canvas.margin;
            break;
          case 6: // Custom service line requested.
            multiplier = 1.25;
            pointStart = 0;
            buildingMeterCoords = this.sketchObject.buildings.main.top + this.sketchObject.buildings.main.height;
            this.sketchObject.subServiceLine.coordinate.x1 = this.sketchObject.buildings.main.left + (this.sketchObject.buildings.main.width / 2);
            this.sketchObject.subServiceLine.coordinate.x2 = this.sketchObject.subServiceLine.coordinate.x1;
            this.sketchObject.subServiceLine.coordinate.y1 = this.sketchObject.subServiceLine.coordinate.y2 - this.sketchObject.canvas.margin;
            this.sketchObject.subServiceLine.hasExtension = false;

            if (this.sketchObject.input.params.mainLocation === 2) { // Long side
              this.sketchObject.subServiceLine.coordinate.y1 -= this.sketchObject.streets.verticalWidth + this.sketchObject.canvas.margin;

              if (this.sketchObject.input.params.tapLocation === 2) {
                this.sketchObject.subServiceLine.coordinate.y1 += this.sketchObject.canvas.margin * 2;
              }
            }

            pointStart = this.sketchObject.subServiceLine.coordinate.y1;

            if (this.sketchObject.subServiceLine.customLines.customCoords.length < 1) {
              for (i = 0; i < this.sketchObject.input.params.controlPoints; i++) {
                this.sketchObject.subServiceLine.customLines.customCoords.push({
                  x1: this.sketchObject.subServiceLine.coordinate.x1,
                  x2: this.sketchObject.subServiceLine.coordinate.x1,
                  y1: pointStart,
                  y2: (i === this.sketchObject.input.params.controlPoints - 1) ? buildingMeterCoords : pointStart - (this.sketchObject.canvas.margin * multiplier)
                });

                pointStart -= (this.sketchObject.canvas.margin * multiplier);
              }
            } else {
              this.sketchObject.subServiceLine.customLines.customCoords[0].x1 = this.sketchObject.subServiceLine.coordinate.x1;
              this.sketchObject.subServiceLine.customLines.customCoords[0].y1 = pointStart;

              this.sketchObject.subServiceLine.customLines.customCoords[this.sketchObject.input.params.controlPoints - 1].x2 = this.sketchObject.subServiceLine.coordinate.x1;
              this.sketchObject.subServiceLine.customLines.customCoords[this.sketchObject.input.params.controlPoints - 1].y2 = buildingMeterCoords;
            }

            controlPoints.pointsCoordinate = this.sketchObject.subServiceLine.customLines.customCoords;
            this.plotControlPoints(controlPoints);
            break;
          default:
        };

        // Set the main extension coordinate
        if (this.sketchObject.input.site.mainExtensionRequired) {
          mainExtension.coordinate.x1 = this.sketchObject.mainServiceLine.coordinate.x2;
          mainExtension.coordinate.x2 = this.sketchObject.subServiceLine.coordinate.x1 + (this.sketchObject.canvas.margin);//this.sketchObject.streets.mainStreet.width;
          mainExtension.coordinate.y1 = this.sketchObject.mainServiceLine.coordinate.y1;
          mainExtension.coordinate.y2 = this.sketchObject.mainServiceLine.coordinate.y2;
        }
        break;
      default:
    };

    // Plot the main extension if needed
    if (this.sketchObject.input.site.mainExtensionRequired) {
      mainExtension.measurementText = mainExtensionText;
      mainExtensionText.text = `${this.sketchObject.input.site.mainExtensionLength} ft`;
      mainExtension.measurementText = mainExtensionText;
      this.plotMeasurementLine(mainExtension);
    }

    // Draw the tab rectangle
    if (this.sketchObject.input.params.streetTemplate === 3) {
      this.sketchObject.mainServiceLine.tap.top = this.sketchObject.subServiceLine.coordinate.y2 - (this.sketchObject.canvas.margin / 2);
      this.sketchObject.mainServiceLine.tap.left = this.sketchObject.subServiceLine.coordinate.x1 - (this.sketchObject.canvas.margin);
    }
    else if (this.sketchObject.input.params.streetTemplate === 1 || this.sketchObject.input.params.streetTemplate === 2) {
      this.sketchObject.mainServiceLine.tap.top = this.sketchObject.subServiceLine.coordinate.y2 - (this.sketchObject.canvas.margin);
      this.sketchObject.mainServiceLine.tap.left = this.sketchObject.subServiceLine.coordinate.x1 - (this.sketchObject.canvas.margin / 2);
    }

    this.sketchObject.mainServiceLine.tap.width = (this.sketchObject.subServiceLine.coordinate.x1 - this.sketchObject.mainServiceLine.tap.left) * 2;
    this.sketchObject.mainServiceLine.tap.height = (this.sketchObject.subServiceLine.coordinate.y2 - this.sketchObject.mainServiceLine.tap.top) * 2;

    // Identify and draw the sub-extension line to the building
    if (this.sketchObject.subServiceLine.hasExtension) {
      this.sketchObject.subServiceLine.extension.x1 = this.sketchObject.subServiceLine.coordinate.x1;
      this.sketchObject.subServiceLine.extension.y1 = this.sketchObject.subServiceLine.coordinate.y1;
      this.sketchObject.subServiceLine.extension.y2 = this.sketchObject.subServiceLine.extension.y1;

      subLine.coordinate = this.sketchObject.subServiceLine.extension;
      this.plotLine(subLine);
    }

    subLine.coordinate = this.sketchObject.subServiceLine.coordinate;
    this.plotLine(subLine);

    tapRect.coordinate = this.sketchObject.mainServiceLine.tap;
    this.plotRectangle(tapRect);
  }

  // ## Skitch Measurments: Based on parameters, determine measurements lines coordinates and dimensions
  sketchMeasurements() {
    let sideStreets = false;
    let measurementsCoords: any = { mainStreet: {}, sideStreet: {}, curbToHouse: {}, meterSetBack: {}, preferredLocation: {}, maintToCurb: {} };
    const measurementsLine = new CanvasElements.MeasurementLineElement();
    const text = new CanvasElements.TextElement();

    // Define control points option for all scenarios
    measurementsLine.thickness = this.sketchObject.mainServiceLine.thickness;
    measurementsLine.strokeColor = this.canvasObject.colors.measurementLine;
    measurementsLine.isDashed = false;
    measurementsLine.isSelectable = false;
    measurementsLine.layer = CanvasElements.CanvasLayersEnum.generatedSketchLayer;

    text.foregroundColor = this.canvasObject.colors.whiteColor;
    text.isSelectable = false;
    text.isEditable = false;
    text.isCentered = true;
    text.isSmallerFont = true;
    text.isVertical = false;
    text.layer = CanvasElements.CanvasLayersEnum.generatedSketchLayer;

    switch (this.sketchObject.input.params.streetTemplate) {
      case 1: // Standard Right -> Main street bottom and side street on the right
        sideStreets = true;
        measurementsCoords.mainStreet.x = this.sketchObject.streets.mainStreet.left + (this.sketchObject.streets.mainStreet.width / 2);
        measurementsCoords.sideStreet.y = this.sketchObject.subServiceLine.coordinate.y1 + (this.sketchObject.canvas.margin * 3);

        measurementsCoords.curbToHouse = {
          x1: this.sketchObject.subServiceLine.coordinate.x2,
          x2: this.sketchObject.streets.sideStreet.left,
          y1: measurementsCoords.sideStreet.y,
          y2: measurementsCoords.sideStreet.y
        };

        // Adjust meter setback to custom service line, to the front of the house
        if (this.sketchObject.input.params.meterLocation === 6) {
          measurementsCoords.curbToHouse.x1 = this.sketchObject.buildings.main.left + this.sketchObject.buildings.main.width;
          measurementsCoords.meterSetBack.x1 = this.sketchObject.buildings.main.left + this.sketchObject.buildings.main.width;
          measurementsCoords.meterSetBack.x2 = measurementsCoords.curbToHouse.x1;
        }

        // ############################################################################
        // Determine the main to curb measurements
        measurementsCoords.maintToCurb = {
          x1: this.sketchObject.streets.sideStreet.left + ((this.sketchObject.input.params.mainLocation === 2) ? this.sketchObject.streets.sideStreet.width : 0),
          x2: this.sketchObject.mainServiceLine.coordinate.x1,
          y1: measurementsCoords.sideStreet.y,
          y2: measurementsCoords.sideStreet.y,
        };
        break;
      case 2: // Standard Left -> Main street bottom and side street on the left
        sideStreets = true;
        measurementsCoords.mainStreet.x = this.sketchObject.streets.mainStreet.left + (this.sketchObject.streets.mainStreet.width / 2);
        measurementsCoords.sideStreet.y = this.sketchObject.subServiceLine.coordinate.y1 + (this.sketchObject.canvas.margin * 3);

        measurementsCoords.curbToHouse = {
          x1: this.sketchObject.streets.sideStreet.left + this.sketchObject.streets.sideStreet.width,
          x2: this.sketchObject.subServiceLine.coordinate.x2,
          y1: measurementsCoords.sideStreet.y,
          y2: measurementsCoords.sideStreet.y
        };

        // Adjust meter setback to custom service line, to the front of the house
        if (this.sketchObject.input.params.meterLocation === 6) {
          measurementsCoords.curbToHouse.x2 = this.sketchObject.buildings.main.left - this.sketchObject.canvas.margin * 2;
          measurementsCoords.meterSetBack.x1 = this.sketchObject.buildings.main.left;
          measurementsCoords.meterSetBack.x2 = measurementsCoords.curbToHouse.x2;
        }

        // ############################################################################
        // Determine the main to curb measurements
        measurementsCoords.maintToCurb = {
          x1: this.sketchObject.streets.sideStreet.left + ((this.sketchObject.input.params.mainLocation === 1) ? this.sketchObject.streets.sideStreet.width : 0),
          x2: this.sketchObject.mainServiceLine.coordinate.x1,
          y1: measurementsCoords.sideStreet.y,
          y2: measurementsCoords.sideStreet.y,
        };
        break;
      case 3: // Other -> Main street bottom and no side streets
        sideStreets = false;

        // This block is determining where the measuerment line will be draw to the left or right of service line.
        if (this.sketchObject.input.params.meterLocation === 1 ||
          this.sketchObject.input.params.meterLocation === 3 ||
          this.sketchObject.input.params.meterLocation === 5 ||
          this.sketchObject.input.params.meterLocation === 6) {
          measurementsCoords.mainStreet = { x: this.sketchObject.subServiceLine.coordinate.x1 + (this.sketchObject.canvas.margin * 2) };
        }
        else if (this.sketchObject.input.params.meterLocation === 2 ||
          this.sketchObject.input.params.meterLocation === 4) {
          measurementsCoords.mainStreet = { x: this.sketchObject.subServiceLine.coordinate.x1 - (this.sketchObject.canvas.margin * 2) };
        };

        // ############################################################################
        // Determine the curb to house measurements
        measurementsCoords.curbToHouse = {
          x1: measurementsCoords.mainStreet.x,
          x2: measurementsCoords.mainStreet.x,
          y1: this.sketchObject.buildings.main.top + this.sketchObject.buildings.main.height, //this.sketchObject.service.sub.y1 + app.sketch.sketchObject.canvas.margin,
          y2: this.sketchObject.streets.mainStreet.top
        };

        // ############################################################################
        // Determine the meter setback and preferred meter location
        if (this.sketchObject.input.params.meterLocation === 1 || this.sketchObject.input.params.meterLocation === 6) {
          // if custom service line or front meter is requested then just show the line from street to front of house.
          measurementsCoords.curbToHouse.y1 = this.sketchObject.buildings.main.top + this.sketchObject.buildings.main.height;
        } else {
          // Determine the meter setback!
          measurementsCoords.meterSetBack = {
            x1: measurementsCoords.mainStreet.x,
            x2: measurementsCoords.mainStreet.x,
            y1: this.sketchObject.buildings.main.top + this.sketchObject.buildings.main.height - this.sketchObject.canvas.margin,
            y2: measurementsCoords.curbToHouse.y1
          };

          // Determine a preferred meter location which is a preferred left or right
          if (this.sketchObject.input.site.preferredLocation && ((this.sketchObject.input.params.meterLocation === 2 || this.sketchObject.input.params.meterLocation === 3))) {
            measurementsCoords.preferredLocation = {
              x1: measurementsCoords.mainStreet.x,
              x2: measurementsCoords.mainStreet.x,
              y1: this.sketchObject.subServiceLine.coordinate.y1,
              y2: measurementsCoords.curbToHouse.y1
            };

            // Preferred Meter Location
            measurementsLine.coordinate = measurementsCoords.preferredLocation;
            measurementsLine.isHorizontal = !sideStreets;
            text.text = `${this.sketchObject.input.site.preferredMeterSetback} ft`;
            measurementsLine.measurementText = text;
            this.plotMeasurementLine(measurementsLine);
          }

          // Meter Setback
          measurementsLine.coordinate = measurementsCoords.meterSetBack;
          measurementsLine.isHorizontal = !sideStreets;
          text.text = `${this.sketchObject.input.site.standardMeterSetback} ft`;
          measurementsLine.measurementText = text;
          this.plotMeasurementLine(measurementsLine);
        }

        // ############################################################################
        // Determine the main to curb measurements
        measurementsCoords.maintToCurb = {
          x1: measurementsCoords.mainStreet.x,
          x2: measurementsCoords.mainStreet.x,
          y1: this.sketchObject.streets.mainStreet.top + ((this.sketchObject.input.params.mainLocation === 2) ? this.sketchObject.streets.mainStreet.height : 0), // Short or long side?
          y2: this.sketchObject.mainServiceLine.coordinate.y1
        };
      default:
        break;
    };

    // ############################################################################
    // Curb to house Segmant
    measurementsLine.coordinate = measurementsCoords.curbToHouse;
    measurementsLine.isHorizontal = !sideStreets;
    text.text = `${this.sketchObject.input.site.houseToCurb} ft`;
    measurementsLine.measurementText = text;

    if (this.sketchObject.input.params.meterLocation !== 6)
      this.plotMeasurementLine(measurementsLine);

    // ############################################################################
    // Side Street Width Segmant
    if (this.sketchObject.input.params.streetTemplate === 1 || this.sketchObject.input.params.streetTemplate === 2) {
      measurementsLine.coordinate.x1 = this.sketchObject.streets.sideStreet.left;
      measurementsLine.coordinate.y1 = measurementsCoords.sideStreet.y;
      measurementsLine.coordinate.x2 = this.sketchObject.streets.sideStreet.left + this.sketchObject.streets.sideStreet.width;
      measurementsLine.coordinate.y2 = measurementsCoords.sideStreet.y;
      measurementsLine.isHorizontal = !sideStreets;
      if (this.sketchObject.input.params.mainLocation === 1) { // Short side, should draw street width as dashed line, as street width won't affect total service line. 
        measurementsLine.isDashed = true;
        measurementsLine.strokeDashSegmant1 = 1;
        measurementsLine.strokeDashSegmant2 = 0.5;
        measurementsLine.strokeColor = this.canvasObject.colors.measurementSubtractLine;
      }
      text.text = `${this.sketchObject.input.sideMain.sideStreetWidth} ft`;
      measurementsLine.measurementText = text;
      this.plotMeasurementLine(measurementsLine);
    }

    // ############################################################################
    // Main Street Width Segmant
    measurementsLine.strokeColor = this.canvasObject.colors.measurementLine; // Reset in case side street is being sketched.
    measurementsLine.isDashed = false; // Reset in case side street is being sketched.
    measurementsLine.coordinate.x1 = measurementsCoords.mainStreet.x;
    measurementsLine.coordinate.y1 = this.sketchObject.streets.mainStreet.top;
    measurementsLine.coordinate.x2 = measurementsCoords.mainStreet.x;
    measurementsLine.coordinate.y2 = this.sketchObject.streets.mainStreet.top + this.sketchObject.streets.mainStreet.height;
    measurementsLine.isHorizontal = true;
    if (this.sketchObject.input.params.mainLocation === 1 || this.sketchObject.input.params.streetTemplate !== 3) {
      // Short side, should draw street width as dashed line, as street width won't affect total service line measurements. Same if we tapping to side street. 
      measurementsLine.isDashed = true;
      measurementsLine.strokeDashSegmant1 = 1;
      measurementsLine.strokeDashSegmant2 = 0.5;
      measurementsLine.strokeColor = this.canvasObject.colors.measurementSubtractLine;
    }
    text.text = `${this.sketchObject.input.main.mainStreetWidth} ft`;
    measurementsLine.measurementText = text;
    this.plotMeasurementLine(measurementsLine);

    // ############################################################################
    // Main to Curb Segmant
    if ((this.sketchObject.input.params.mainLocation === 1 && this.sketchObject.input.params.tapLocation === 1)
      || (this.sketchObject.input.params.mainLocation === 2 && this.sketchObject.input.params.tapLocation === 2)
    ) {
      measurementsLine.strokeColor = this.canvasObject.colors.measurementSubtractLine;
      measurementsLine.isDashed = true;
      measurementsLine.strokeDashSegmant1 = 1;
      measurementsLine.strokeDashSegmant2 = 0.5;
    } else {
      measurementsLine.strokeColor = this.canvasObject.colors.measurementLine;
      measurementsLine.isDashed = false;
    }
    measurementsLine.coordinate = measurementsCoords.maintToCurb;
    measurementsLine.isHorizontal = !sideStreets;
    if (sideStreets)
      text.isVertical = true;
    text.isCentered = true;
    text.text = (this.sketchObject.input.params.streetTemplate === 3) ? `${this.sketchObject.input.main.mainToCurb} ft` : `${this.sketchObject.input.sideMain.sideMainToCurb} ft`;
    measurementsLine.measurementText = text;
    this.plotMeasurementLine(measurementsLine);
  }
  // #endregion

  // #region |-> [UI Actions]
  // ##########################################
  // #region |---> [ES5 UI Event Binding]
  bindResizeEvent() {
    const root = this;
    $(window).resize(function () {
      root.resizeSequence();
    }).resize();
  }

  resizeSequence() {
    let resizeTimeout;
    const root = this;
    const containerSize = ($(root.canvasObject.sketchContainerSelector).width() * 80 / 100);

    if (containerSize > 1024 && root.sketchObject.canvas.width === 1024) return;    // the container is larger than 1024, and canvas is 1024
    if (root.sketchObject.canvas.width === containerSize) return;                   // the canvas and container size are equal, no need to resize
    if (root.sketchObject.canvas.width === 1024) return;

    let oldSize = (root.sketchObject.canvas.width) ? root.sketchObject.canvas.width : 1024;
    let newSize = containerSize;
    let zoomRation = Math.abs(((oldSize - newSize) / oldSize));
    //zoomRation = (oldSize > newSize) ? 1 - zoomRation : 1 + zoomRation;

    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function () {
      //  root.zoomIt(0.75);
    }, 250);
  }

  Resize() {
    //this.zoomIt(+this.canvasObject.textString);
    this.canvasObject.canvas.setZoom(+this.canvasObject.textString);
  }

  zoomIn() {
    //this.zoomIt(this.currentScale + (0.10 * this.savedScale));
    this.zoomIt(+this.canvasObject.textString);
  }

  zoomOut() {
    //this.zoomIt(this.currentScale - (0.10 * this.savedScale));
    this.zoomIt(+this.canvasObject.textString);
  }

  sizeCaptured = false;
  originalDimentions: any = {
    width: 0,
    height: 0
  }

  zoomIt(factor) {
    if (!this.sizeCaptured) {
      this.originalDimentions = {
        width: this.canvasObject.canvas.width,
        height: this.canvasObject.canvas.height
      }
    }

    this.canvasObject.canvas.setHeight(this.originalDimentions.height * factor);
    this.canvasObject.canvas.setWidth(this.originalDimentions.width * factor);

    var objects = this.canvasObject.canvas.getObjects();
    for (var i in objects) {
      var scaleX = objects[i].scaleX;
      var scaleY = objects[i].scaleY;
      var left = objects[i].left;
      var top = objects[i].top;

      if (!this.sizeCaptured) {
        objects[i].xtop = top;
        objects[i].xleft = left;
        objects[i].xscaleY = scaleY;
        objects[i].xscaleX = scaleX;
        objects[i].xScale = +this.canvasObject.textString;
      };

      // Items were not in the canvas during initial load
      if (!objects[i].xtop) {
        objects[i].xtop = top / objects[i].xScale;
        objects[i].xleft = left / objects[i].xScale;
        objects[i].xscaleY = scaleY / objects[i].xScale;
        objects[i].xscaleX = scaleX / objects[i].xScale;
      }

      var tempScaleX = objects[i].xscaleX * factor;
      var tempScaleY = objects[i].xscaleY * factor;
      var tempLeft = objects[i].xleft * factor;
      var tempTop = objects[i].xtop * factor;

      objects[i].scaleX = tempScaleX;
      objects[i].scaleY = tempScaleY;
      objects[i].left = tempLeft;
      objects[i].top = tempTop;

      objects[i].setCoords();
    }

    this.sizeCaptured = true;

    this.canvasObject.canvas.renderAll();
    this.canvasObject.canvas.calcOffset();
  }

  bindES5ComponentsEvents() {
    const root = this;
    // Bind Free Drawing Switch
    $("#freeDrawingToggle").on('switchChange.bootstrapSwitch', function (event, state) {
      root.sketchObject.isFreeDrawing = state;
      root.toggleFreeDrawing(state);
    });

    $("#legendToggle").on('switchChange.bootstrapSwitch', function (event, state) {
      root.toggleLegendPanel(state);
    });

    // Bind free drawing touch-spin
    $(".touchspin-postfix").TouchSpin({
      min: 1,
      max: 25,
      step: 1,
      decimals: 0,
      //prefix: "Strok"
    }).on("touchspin.on.startspin", function () {
      console.log();
      root.canvasObject.canvas.freeDrawingBrush.width = (parseInt($(this).val())); // Scaling * (+root.canvasObject.textString)
    }).on("touchspin.on.stopspin", function () {
      root.canvasObject.canvas.freeDrawingBrush.width = (parseInt($(this).val())); // Scaling * (+root.canvasObject.textString)
    });

    // Bind free drawing color picker
    $(".colorpicker-show-alpha").spectrum({
      showAlpha: true,
      change: function (color) {
        root.canvasObject.canvas.freeDrawingBrush.color = color.toRgbString();
      },
      hide: function (color) {
        root.canvasObject.canvas.freeDrawingBrush.color = color.toRgbString();
      },
      move: function (color) {
        root.canvasObject.canvas.freeDrawingBrush.color = color.toRgbString();
      }
    });
  }
  // #endregion 
  // #region |---> [User Shapes, Text and Image Ops]
  addCustomText() {
    const customText = new CanvasElements.TextElement();
    customText.text = this.canvasObject.textString;
    customText.coordinate.x = 10;
    customText.coordinate.y = 10;
    customText.isSelectable = true;
    customText.foregroundColor = 'black';
    customText.isEditable = true;
    customText.originX = 'left';
    customText.originY = 'top';

    this.plotText(customText);
    this.canvasObject.textString = '';
  }

  addCustomLine() {
    const customLine = new CanvasElements.LineElement();
    customLine.coordinate.x1 = 10;
    customLine.coordinate.y1 = 10;
    customLine.coordinate.x2 = 100;
    customLine.coordinate.y2 = 10;

    customLine.thickness = 2;
    customLine.strokeColor = this.canvasObject.colors.customLine;
    customLine.isSelectable = true;
    customLine.layer = CanvasElements.CanvasLayersEnum.userShapesLayer;

    this.plotLine(customLine);
  }

  addCustomCircle() {
    const customCircle = new CanvasElements.CircleElement();
    customCircle.coordinate.x = 10;
    customCircle.coordinate.y = 10;
    customCircle.radius = 50;

    customCircle.strokeThickness = 2;
    customCircle.strokeColor = this.canvasObject.colors.customCricle;
    customCircle.fillColor = this.canvasObject.colors.customCricle;
    customCircle.fillOpacity = 0.85;
    customCircle.isSelectable = true;
    customCircle.hasControls = true;
    customCircle.hasBorders = true;
    customCircle.layer = CanvasElements.CanvasLayersEnum.userShapesLayer;

    this.plotCircle(customCircle);
  }

  addCustomRectangle() {
    const customRectangle = new CanvasElements.RectangleElement();
    customRectangle.coordinate.top = 10;
    customRectangle.coordinate.left = 10;
    customRectangle.coordinate.width = 100;
    customRectangle.coordinate.height = 100;

    customRectangle.borderThickness = 2;
    customRectangle.borderColor = this.canvasObject.colors.customRectangle;
    customRectangle.fillOpacity = 0.85;
    customRectangle.fillColor = this.canvasObject.colors.customRectangle;
    customRectangle.isSelectable = true;
    customRectangle.layer = CanvasElements.CanvasLayersEnum.userShapesLayer;
    customRectangle.xScale = +this.canvasObject.textString;

    this.plotRectangle(customRectangle);
  }

  addCustomTriangle() {
    const customTriangle = new CanvasElements.TriangleElement();
    customTriangle.coordinate.top = 10;
    customTriangle.coordinate.left = 10;
    customTriangle.coordinate.width = 100;
    customTriangle.coordinate.height = 100;

    customTriangle.strokeThickness = 2;
    customTriangle.strokeColor = this.canvasObject.colors.customTriangle;
    customTriangle.fillColor = this.canvasObject.colors.customTriangle;
    customTriangle.fillOpacity = 0.85;
    customTriangle.isSelectable = true;
    customTriangle.layer = CanvasElements.CanvasLayersEnum.userShapesLayer;

    this.plotTriangle(customTriangle);
  }
  // #endregion
  // #region |---> [Custom Images List Ops]
  importCustomImage(event: any) {
    const root = this;
    const imagesList = $(this.canvasObject.customImagesListSelector);

    // Create a dynamic input file field and execute it.
    const element = document.createElement('div');
    element.innerHTML = '<input type="file">';
    const fileInput: any = element.firstChild;

    fileInput.addEventListener('change', function () {
      const file = fileInput.files[0];
      if (file.name.match(/\.(jpg|jpeg|svg|png)$/)) {
        const reader = new FileReader();
        const elementId = 'Img-' + root.randomId();

        reader.onload = function () {
          $('#customImagesList').append('<div class="img-wrap"><span class="close">&times;</span><img id="'
            + elementId + '" class="images-item" src="'
            + reader.result + '"></div>');

          const imageElement = root.elementRef.nativeElement.querySelector('#' + elementId);
          if (imageElement) {
            imageElement.addEventListener('click', root.plotCustomImage.bind(root));
          }
        };
        reader.readAsDataURL(file);
      } else {
        alert('File not supported, *.jpg, *.png, *.svg files only');
      }
    });

    fileInput.click();
  }

  resetCustomImage(event: any) {
    $('#customImagesList').empty();
  }

  appendCustomImages() {
    // This function should take as a parameter an array or Urls defined by system admin to be added dynamically to sketch
    const imagesList: any = [];
    const root = this;
    const baseUrl = window.location.origin;

    imagesList.push("assets/images/sketch/tree1.svg");
    imagesList.push("assets/images/sketch/tree2.svg");
    imagesList.push("assets/images/sketch/tree3.svg");
    imagesList.push("assets/images/sketch/tree4.svg");
    imagesList.push("assets/images/sketch/bushes.svg");

    imagesList.push("assets/images/sketch/pool1.png");
    imagesList.push("assets/images/sketch/pool2.png");
    imagesList.push("assets/images/sketch/pool3.png");

    imagesList.push("assets/images/sketch/fence1.svg");
    imagesList.push("assets/images/sketch/fence2.png");
    imagesList.push("assets/images/sketch/dog.svg");

    imagesList.push("assets/images/sketch/driveway1.png");
    imagesList.push("assets/images/sketch/driveway2.png");

    imagesList.push("assets/images/sketch/septic1.png");
    imagesList.push("assets/images/sketch/septic2.png");

    imagesList.push("assets/images/sketch/meter.png");
    imagesList.push("assets/images/sketch/gas-caution.png");
    imagesList.push("assets/images/sketch/gas-pipeline.png");

    imagesList.forEach(function (url) {
      root.getFileBlob(url, function (blob) {
        const reader = new FileReader();
        const elementId = 'Img-' + root.randomId();

        reader.onload = function () {
          $('#customImagesList').append('<div class="img-wrap"><span class="close">&times;</span><img id="'
            + elementId + '" class="images-item" src="'
            + reader.result + '"></div>');

          const imageElement = root.elementRef.nativeElement.querySelector('#' + elementId);
          if (imageElement) {
            imageElement.addEventListener('click', root.plotCustomImage.bind(root));
          }
        };

        reader.readAsDataURL(blob);
      });
    });
  }
  // #endregion
  // #region |---> [UI Elements Ops]
  clearSelection() {
    this.canvasObject.canvas.deactivateAllWithDispatch().renderAll();
  }

  removeSelected() {
    let activeObject = this.canvasObject.canvas.getActiveObject();
    let activeGroup = this.canvasObject.canvas.getActiveGroup();

    if (activeObject) {
      this.canvasObject.canvas.remove(activeObject);
    }
    else if (activeGroup) {
      let objectsInGroup = activeGroup.getObjects();
      this.canvasObject.canvas.discardActiveGroup();
      let self = this;
      objectsInGroup.forEach(function (object) {
        self.canvasObject.canvas.remove(object);
      });
    }
  }

  bringToFront() {
    let activeObject = this.canvasObject.canvas.getActiveObject(),
      activeGroup = this.canvasObject.canvas.getActiveGroup();

    if (activeObject) {
      activeObject.bringToFront();
      // activeObject.opacity = 1;
    }
    else if (activeGroup) {
      let objectsInGroup = activeGroup.getObjects();
      this.canvasObject.canvas.discardActiveGroup();
      objectsInGroup.forEach((object) => {
        object.bringToFront();
      });
    }
  }

  sendToBack() {
    let activeObject = this.canvasObject.canvas.getActiveObject(),
      activeGroup = this.canvasObject.canvas.getActiveGroup();

    if (activeObject) {
      activeObject.sendToBack();
      // activeObject.opacity = 1;
    }
    else if (activeGroup) {
      let objectsInGroup = activeGroup.getObjects();
      this.canvasObject.canvas.discardActiveGroup();
      objectsInGroup.forEach((object) => {
        object.sendToBack();
      });
    }
  }

  getActiveStyle(styleName, object) {
    object = object || this.canvasObject.canvas.getActiveObject();
    if (!object) return '';

    return (object.getSelectionStyles && object.isEditing)
      ? (object.getSelectionStyles()[styleName] || '')
      : (object[styleName] || '');
  }

  setActiveStyle(styleName, value, object) {
    object = object || this.canvasObject.canvas.getActiveObject();
    if (!object) return;

    if (object.setSelectionStyles && object.isEditing) {
      var style = {};
      style[styleName] = value;
      object.setSelectionStyles(style);
      object.setCoords();
    }
    else {
      object.set(styleName, value);
    }

    object.setCoords();
    this.canvasObject.canvas.renderAll();
  }

  getActiveProp(name) {
    var object = this.canvasObject.canvas.getActiveObject();
    if (!object) return '';

    return object[name] || '';
  }

  setActiveProp(name, value) {
    var object = this.canvasObject.canvas.getActiveObject();
    if (!object) return;
    object.set(name, value).setCoords();
    this.canvasObject.canvas.renderAll();
  }

  clone() {
    let activeObject = this.canvasObject.canvas.getActiveObject(),
      activeGroup = this.canvasObject.canvas.getActiveGroup();

    if (activeObject) {
      let clone;
      switch (activeObject.type) {
        case 'rect':
          clone = new fabric.Rect(activeObject.toObject());
          break;
        case 'circle':
          clone = new fabric.Circle(activeObject.toObject());
          break;
        case 'triangle':
          clone = new fabric.Triangle(activeObject.toObject());
          break;
        case 'i-text':
          clone = new fabric.IText('', activeObject.toObject());
          break;
        case 'image':
          clone = fabric.util.object.clone(activeObject);
          break;
      }
      if (clone) {
        clone.set({ left: activeObject.left + 10, top: activeObject.top + 10 });
        this.canvasObject.canvas.add(clone);
        this.selectItemAfterAdded(clone);
      }
    }
  }

  getId() {
    //debugger;
    this.canvasObject.props.id = this.canvasObject.canvas.getActiveObject().id;
  }

  setId() {
    let val = this.canvasObject.props.id;
    let complete = this.canvasObject.canvas.getActiveObject().toObject();

    this.canvasObject.canvas.getActiveObject().toObject = () => {
      complete.id = val;
      return complete;
    };
  }

  getOpacity() {
    this.canvasObject.props.opacity = this.getActiveStyle('opacity', null) * 100;
  }

  setOpacity() {
    this.setActiveStyle('opacity', parseInt(this.canvasObject.props.opacity) / 100, null);
  }

  getFill() {
    this.canvasObject.props.fill = this.getActiveStyle('fill', null);
  }

  setFill() {
    this.setActiveStyle('fill', this.canvasObject.props.fill, null);
  }

  getLineHeight() {
    this.canvasObject.props.lineHeight = this.getActiveStyle('lineHeight', null);
  }

  setLineHeight() {
    this.setActiveStyle('lineHeight', parseFloat(this.canvasObject.props.lineHeight), null);
  }

  getCharSpacing() {
    this.canvasObject.props.charSpacing = this.getActiveStyle('charSpacing', null);
  }

  setCharSpacing() {
    this.setActiveStyle('charSpacing', this.canvasObject.props.charSpacing, null);
  }

  getFontSize() {
    this.canvasObject.props.fontSize = this.getActiveStyle('fontSize', null);
  }

  setFontSize() {
    this.setActiveStyle('fontSize', parseInt(this.canvasObject.props.fontSize), null);
  }

  getBold() {
    this.canvasObject.props.fontWeight = this.getActiveStyle('fontWeight', null);
  }

  setBold() {
    this.canvasObject.props.fontWeight = !this.canvasObject.props.fontWeight;
    this.setActiveStyle('fontWeight', this.canvasObject.props.fontWeight ? 'bold' : '', null);
  }

  getFontStyle() {
    this.canvasObject.props.fontStyle = this.getActiveStyle('fontStyle', null);
  }

  setFontStyle() {
    this.canvasObject.props.fontStyle = !this.canvasObject.props.fontStyle;
    this.setActiveStyle('fontStyle', this.canvasObject.props.fontStyle ? 'italic' : '', null);
  }

  getTextDecoration() {
    this.canvasObject.props.TextDecoration = this.getActiveStyle('textDecoration', null);
  }

  setTextDecoration(value) {
    let iclass = this.canvasObject.props.TextDecoration;
    if (iclass.includes(value)) {
      iclass = iclass.replace(RegExp(value, "g"), "");
    } else {
      iclass += ` ${value}`
    }
    this.canvasObject.props.TextDecoration = iclass;
    this.setActiveStyle('textDecoration', this.canvasObject.props.TextDecoration, null);
  }

  hasTextDecoration(value) {
    return this.canvasObject.props.TextDecoration.includes(value);
  }

  getTextAlign() {
    this.canvasObject.props.textAlign = this.getActiveProp('textAlign');
  }

  setTextAlign(value) {
    this.canvasObject.props.textAlign = value;
    this.setActiveProp('textAlign', this.canvasObject.props.textAlign);
  }

  getFontFamily() {
    this.canvasObject.props.fontFamily = this.getActiveProp('fontFamily');
  }

  setFontFamily() {
    this.setActiveProp('fontFamily', this.canvasObject.props.fontFamily);
  }

  resetPanels() {
    this.canvasObject.textEditor = false;
    this.canvasObject.imageEditor = false;
    this.canvasObject.figureEditor = false;
  }
  // endregion
  // #region |---> [UI Debugging]
  updateSkecthCalcPanel() {
    const editor = ace.edit(this.canvasObject.sketchCalcEditor);
    const aceSession = editor.getSession();
    ace.config.set('workerPath', 'assets/js/plugins/editors/ace/');
    editor.setTheme('ace/theme/monokai');
    editor.setShowPrintMargin(false);
    editor.setOptions({ readOnly: true, maxLines: Infinity });
    aceSession.setMode('ace/mode/json');
    aceSession.setValue(js_beautify(JSON.stringify(this.sketchObject), { indent_size: 2 }));
    // Quick-fix that allows to omit ACE problem with loading workers
    ace.require('ace/edit_session').EditSession.prototype.$startWorker = function () { };

    // Fold Code
    window.setTimeout(function () {
      aceSession.foldAll(1, aceSession.getLength());
    }, 500);
  }
  // endregion
  // ##########################################
  // #endregion

  // #region |-> [IO Operations]
  exportPNG() {
    const img = this.canvasObject.canvas.toDataURL('image/png');
    const a = document.createElement('a');
    const file = this.dataURItoBlob(img);

    a.href = URL.createObjectURL(file);
    a.download = 'sketch.' + (new Date()).getTime() + '.png';
    a.click();
  }

  exportSVG() {
    const svg = this.canvasObject.canvas.toSVG();
    const a = document.createElement('a');
    const file = new Blob([svg], { type: 'image/svg+xml' });

    a.href = URL.createObjectURL(file);
    a.download = 'sketch.' + (new Date()).getTime() + '.svg';
    a.click();
  }

  exportJSON() {
    const a = document.createElement('a');
    const file = new Blob([JSON.stringify(this.sketchObject)], { type: 'text/json' });
    a.href = URL.createObjectURL(file);
    a.download = 'sketch.' + (new Date()).getTime() + '.json';
    a.click();
  }

  importJSON() {
    const root = this;
    const element = document.createElement('div');
    element.innerHTML = '<input type="file">';
    const fileInput: any = element.firstChild;

    fileInput.addEventListener('change', function () {
      const file = fileInput.files[0];
      if (file.name.match(/\.(json)$/)) {
        const reader = new FileReader();
        reader.onload = function () {
          window.setTimeout(function () { root.load(reader.result); }, 500);
        };
        reader.readAsText(file);
      } else {
        alert('File not supported, *.json files only');
      }
    });

    fileInput.click();
  }

  exportBrowser() {
    const json = JSON.stringify(this.canvasObject.canvas);
    localStorage.setItem('sketch-json', json);
  }

  importBrowser() {
    const json = localStorage.getItem('sketch-json');

    this.canvasObject.canvas.loadFromJSON(json, () => {
      this.canvasObject.canvas.renderAll();
    });
  };
  // #endregion

  // #region |-> [Helper Methods]
  getLineLength(line: any) {
    var dx = Math.abs(line.x2 - line.x1);
    var dy = Math.abs(line.y2 - line.y1);
    var dist = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
    return dist;
  }

  getLineLengthScaledToFeet(length: number) {
    const curbToHousePixels = this.sketchObject.streets.mainStreet.top - (this.sketchObject.buildings.main.top + this.sketchObject.buildings.main.height);
    const numberOfPixelsPerFoot = curbToHousePixels / this.sketchObject.input.site.houseToCurb;
    const lineLengthScaledToFeet = length / numberOfPixelsPerFoot;

    return Math.round(lineLengthScaledToFeet * 100) / 100;
  }

  extend(obj: any, xtype: string, xlayer: string, xscale?: number) {
    const id = this.randomId();
    const extensions = {
      id: id,
      xid: `${xtype}_${id}`,
      xtype: xtype,
      xlayer: xlayer,
      xScale: xscale ? xscale : undefined
    };

    $.extend(obj, extensions);
  }

  randomId() {
    return Math.floor(Math.random() * 999999) + 1;
  }

  dataURItoBlob(dataUri: string) {
    // convert base64 to raw binary data held in a string
    // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
    const byteString = atob(dataUri.split(',')[1]);

    // write the bytes of the string to an ArrayBuffer
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ab]);
  }

  getFileBlob(url, cb) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.responseType = "blob";
    xhr.addEventListener('load', function () {
      cb(xhr.response);
    });
    xhr.send();
  };

  blobToFile(blob, name) {
    blob.lastModifiedDate = new Date();
    blob.name = name;
    return blob;
  };

  shadeColor(color: string, percent: number) {
    let r = parseInt(color.substring(1, 3), 16);
    let g = parseInt(color.substring(3, 5), 16);
    let b = parseInt(color.substring(5, 7), 16);

    r = (r * (100 + percent) / 100);
    g = (g * (100 + percent) / 100);
    b = (b * (100 + percent) / 100);

    r = (r < 255) ? r : 255;
    g = (g < 255) ? g : 255;
    b = (b < 255) ? b : 255;

    const rr = ((r.toString(16).length === 1) ? `0${r.toString(16)}` : r.toString(16));
    const gg = ((g.toString(16).length === 1) ? `0${g.toString(16)}` : g.toString(16));
    const bb = ((b.toString(16).length === 1) ? `0${b.toString(16)}` : b.toString(16));

    return '#' + rr + gg + bb;
  }

  isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  }

  isFractionalChar(n) {
    const c = n.charCodeAt();
    return (c >= 188 && c <= 190) || (c >= 8531 && c <= 8542);
  }

  indexFractionalChar(m) {
    const a = m.split('');
    for (const i in a) {
      if (this.isFractionalChar(a[i])) {
        return i;
      }
    }

    return false;
  }

  parseAddress(addr) {
    const a = addr.trim().split(' ');
    let number: string;

    if (a.length <= 1) {
      return { number: '', space: '', street: a.join('') };
    }

    if (this.isNumber(a[0].substr(0, 1)) || this.isFractionalChar(a[0].substr(0, 1))) {
      number = a.shift();
    } else {
      // If there isn't a leading number, just return the trimmed input as the street
      return { number: '', space: '', street: addr.trim() };
    }
    if (/[0-9]\/[0-9]/.exec(a[0]) || this.indexFractionalChar(a[0]) !== false) {
      number += ' ' + a.shift();
    }

    return { number: number, space: ' ', street: a.join(' ') };
  }
  // #endregion

  // #region |-> [App Main Operations]
  init() {

  }

  generate() {

  }

  resize() {

  }

  load(data) {
    if (data) {
      alert(data);
    }
  }
  // #endregion
}
