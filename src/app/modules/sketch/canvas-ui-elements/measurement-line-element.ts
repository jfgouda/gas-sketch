import { LineCoordinate } from "app/modules/sketch/data-models/line-coordinate.model";
import { TextElement } from "app/modules/sketch/canvas-ui-elements/text-element";
import { CanvasUiElementsEnum } from "app/modules/sketch/canvas-ui-elements/canvas-ui-elements.enum";

export class MeasurementLineElement {
  public coordinate: LineCoordinate;
  public thickness: number;
  public strokeColor: string;
  public strokeDashSegmant1: number;
  public strokeDashSegmant2: number; 
  public isDashed: boolean;
  public measurementText: TextElement;
  public measurementTextPosition: number;  
  public isHorizontal: boolean;
  public isSelectable: boolean;
  public layer: string;
  public readonly type: string;

  constructor() {
    this.coordinate = new LineCoordinate();
    this.measurementText = new TextElement();
    this.type = CanvasUiElementsEnum.measurementLine;
  }
}