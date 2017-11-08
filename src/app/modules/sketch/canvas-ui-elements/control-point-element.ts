import { LineCoordinate } from "app/modules/sketch/data-models/line-coordinate.model";
import { CanvasUiElementsEnum } from "app/modules/sketch/canvas-ui-elements/canvas-ui-elements.enum";

export class ControlPointElement {
  public pointsCoordinate: LineCoordinate[];
  public thickness: number;
  public strokeColor: string;
  public isDashed: boolean;
  public isSelectable: boolean;
  public layer: string;
  public readonly type: string;

  constructor() {
    this.pointsCoordinate = new Array<LineCoordinate>();
    this.type = CanvasUiElementsEnum.controlPoint;
  }
}