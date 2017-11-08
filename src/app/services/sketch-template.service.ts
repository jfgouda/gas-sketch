import { Injectable } from '@angular/core';
import { UserInput } from '../modules/sketch/data-models/user-input.model';

@Injectable()
export class SketchTemplateService {
    private userInput: UserInput;
    // private isUserInputAvilable: boolean;

    constructor() {
        // this.isUserInputAvilable = false;
        this.userInput = null;
    }

    public setSketchTemplateUserInput(userInput: UserInput): void {
        this.userInput = userInput;
        // this.isUserInputAvilable = true;
    }

    public getSketchTemplateUserInput(): UserInput {
        // this.isUserInputAvilable = false;
        return this.userInput;
    }

    // get IsUserInputAvilable(): boolean {
    //     return this.isUserInputAvilable && this.userInput !== null;
    // }
}
