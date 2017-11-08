export class CanvasUIModel {
  private minimumWidth: number = 450;
  private maximumWidth: number = 1024;

  canvasSelector: string = "sketchCanv";
  sketchContainerSelector: string = "#sketchContainer";
  customImagesListSelector: string = "#customImagesList";
  sketchCalcEditor: string = "sketchCalcEditor";
  sketchStreetPattern = "assets/images/tile.jpg";
  gridSize: number = 16;

  colors: any = {
    whiteColor: "#fff",
    blackColor: "#000",
    backColor: "#f8f8f8",
    freeDrawBackColor: "#ccdddb",
    streetColor: "#3a3a42", //"#e6e6e6",
    streetBorder: "#3a3a42",
    buildingColor: "white",
    objectBorder: "#666666",
    mainServiceLine: "#ff00e1",
    measurementLine: "#47c1ff",
    measurementTopLine: "#ff00e1",
    measurementSubtractLine: "#ff0000",
    controlPointFill: "white",
    controlPointStroke: "#666",
    gridColor: "#e1e1e1",
    gridDrawingColor: "#ffcccc",

    customLine: "#26a499",
    customRectangle: "#9771cb",
    customCricle: "#ff7344",
    customTriangle: "#2aa4f4",

    mainExtensionLine: "#00ea00"
  };

  canvas: any;
  canvasSize: any;

  props: any = {
    canvasFill: "#ffffff",
    canvasImage: "",
    id: null,
    opacity: null,
    fill: null,
    fontSize: null,
    lineHeight: null,
    charSpacing: null,
    fontWeight: null,
    fontStyle: null,
    textAlign: null,
    fontFamily: null,
    TextDecoration: ""
  };

  textString: string;
  url: string = "";
  json: any;
  globalEditor: boolean = false;
  textEditor: boolean = false;
  imageEditor: boolean = false;
  figureEditor: boolean = false;
  selected: any;

  constructor() {
    //
    this.canvasSize = {
      width: 1024,
      height: 768,
      minWidth: this.minimumWidth,
      maxWidth: this.maximumWidth
    };
  }
}