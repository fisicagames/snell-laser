import { Scene } from "@babylonjs/core";
import { AdvancedDynamicTexture } from "@babylonjs/gui";

export class GUILoader {
    public static async loadGUI(scene: Scene, url: string): Promise<AdvancedDynamicTexture> {
        const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("GUI", true, scene);
        await advancedTexture.parseFromURLAsync(url);
        return advancedTexture;
    }
}