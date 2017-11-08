import { ShapeCoordinate } from "app/modules/sketch/data-models/shape-coordinate.model";
import { CanvasUiElementsEnum } from "app/modules/sketch/canvas-ui-elements/canvas-ui-elements.enum";

export class TriangleElement {
  public coordinate: ShapeCoordinate;
  public strokeThickness: number;
  public strokeColor: string;
  public fillColor: string;
  public fillOpacity: number;
  public isSelectable: boolean;
  public layer: string;
  public readonly type: string;

  constructor() {
    this.coordinate = new ShapeCoordinate();
    this.type = CanvasUiElementsEnum.rectangle;
  }
}