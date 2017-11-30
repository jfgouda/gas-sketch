import { PointCoordinate } from "app/modules/sketch/data-models/point-coordinate.model";
import { CanvasUiElementsEnum } from "app/modules/sketch/canvas-ui-elements/canvas-ui-elements.enum";

export class ControlCircleElement {
  public coordinate: PointCoordinate;
  public strokeThickness: number;
  public strokeColor: string;
  public fillColor: string;
  public radius: number;
  public hasControls: boolean;
  public hasBorders: boolean;
  public isSelectable: boolean;
  public line1: any;
  public line2: any;
  public layer: string;
  public lineIndex: number;
  public associatedIndex: string;
  public associatedIndexInt: number;
  public readonly type: string;

  constructor() {
    this.coordinate = new PointCoordinate();
    this.type = CanvasUiElementsEnum.controlCircle;
  }
}