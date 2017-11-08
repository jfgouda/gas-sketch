import { CanvasSettings } from "app/modules/sketch/data-models/canvas-settings.model";
import { Streets } from "app/modules/sketch/data-models/streets.model";
import { Buildings } from "app/modules/sketch/data-models/buildings.model";
import { MainServiceLine } from "app/modules/sketch/data-models/main-service-line.model";
import { SubServiceLine } from "app/modules/sketch/data-models/sub-service-line.model";
import { UserInput } from "app/modules/sketch/data-models/user-input.model";

export class SketchModel {
  originalWidth: number;
  zoomLevel: number;
  
  isImported: boolean;
  isFreeDrawing: boolean;

  canvas: CanvasSettings;
  streets: Streets;
  buildings: Buildings;

  mainServiceLine: MainServiceLine;
  subServiceLine: SubServiceLine;

  freeDrawingPaths: any[];
  userCustomShapes: any[];
  input: UserInput; // Hold template selection data entered by user to be replaced in future.

  constructor() {
    this.canvas = new CanvasSettings();
    this.streets = new Streets();
    this.buildings = new Buildings();
    this.mainServiceLine = new MainServiceLine();
    this.subServiceLine = new SubServiceLine();
    this.freeDrawingPaths = new Array<any>();
    this.userCustomShapes = new Array<any>();
  }
}