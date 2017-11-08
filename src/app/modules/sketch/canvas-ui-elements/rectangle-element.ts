import { ShapeCoordinate } from "app/modules/sketch/data-models/shape-coordinate.model";
import { CanvasUiElementsEnum } from "app/modules/sketch/canvas-ui-elements/canvas-ui-elements.enum";

export class RectangleElement {
  public coordinate: ShapeCoordinate;
  public borderThickness: number;
  public borderColor: string;
  public fillColor: string;
  public fillOpacity: number;
  public fillPatternImagePath: string;
  public isSelectable: boolean;
  public layer: string;
  public xScale: number;
  public readonly type: string;

  constructor() {
    this.coordinate = new ShapeCoordinate();
    this.type = CanvasUiElementsEnum.rectangle;
  }
}