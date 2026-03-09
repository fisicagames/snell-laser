import { Scene, KeyboardEventTypes } from "@babylonjs/core";

export class InputKeyboardController {
    private scene: Scene;

    constructor(scene: Scene) {
        this.scene = scene;
    }

    public bindKeyboardEvents(callbacks: { [key: string]: (eventType: KeyboardEventTypes) => void }): void {
        this.scene.onKeyboardObservable.add((kbInfo) => {
            const key = kbInfo.event.key.toLowerCase();
            if (callbacks[key]) {
                callbacks[key](kbInfo.type);
            }
        });
    }
}
