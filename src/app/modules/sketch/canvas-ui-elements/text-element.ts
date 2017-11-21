import { PointCoordinate } from "app/modules/sketch/data-models/point-coordinate.model";
import { CanvasUiElementsEnum } from "app/modules/sketch/canvas-ui-elements/canvas-ui-elements.enum";

export class TextElement {
  public text: string;
  public foregroundColor: string;
  public backgroundColor: string;
  public backgroundOpacity: number;  
  public coordinate: PointCoordinate;
  public fontFamily: string;
  public textAlign: string;
  public associatedIndex: string;
  public associatedIndexInt: number;
  public isVertical: boolean;
  public isCentered: boolean;
  public isSmallerFont: boolean;
  public isSelectable: boolean;
  public isEditable: boolean;
  public layer: string;
  public originX: string;
  public originY: string;
  public readonly type: string;

  constructor() {
    this.coordinate = new PointCoordinate();
    this.type = CanvasUiElementsEnum.text;
  }
}