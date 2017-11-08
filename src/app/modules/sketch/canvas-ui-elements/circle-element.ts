import { PointCoordinate } from "app/modules/sketch/data-models/point-coordinate.model";
import { CanvasUiElementsEnum } from "app/modules/sketch/canvas-ui-elements/canvas-ui-elements.enum";

export class CircleElement {
  public coordinate: PointCoordinate;
  public strokeThickness: number;
  public strokeColor: string;
  public fillColor: string;
  public fillOpacity: number;
  public radius: number;
  public hasControls: boolean;
  public hasBorders: boolean;
  public isSelectable: boolean;
  public layer: string;
  public readonly type: string;

  constructor() {
    this.coordinate = new PointCoordinate();
    this.type = CanvasUiElementsEnum.controlCircle;
  }
}