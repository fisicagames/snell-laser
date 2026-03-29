//TODO: Implement a conditionally import for HavokPlugin.
import "@babylonjs/loaders/glTF";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { ScenePerformancePriority } from "@babylonjs/core/scene";
import { Color4 } from "@babylonjs/core/Maths/math.color";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";
import { GlowLayer } from "@babylonjs/core/Layers/glowLayer";

import { CameraInitializer } from "./CameraInitializer";
import { optimizeMaterials } from "./MaterialOptimizer";
import { GUILoader } from "./GUILoader";
import { HavokPhysicsEngine } from "./physics/HavokPhysicsEngine";
import { MVC } from "../MVC/MVC";
//TODO: Create a variable for enable ModelsLoader;
import { ModelsLoader } from "./ModelsLoader";

export class SceneInitializer {
    private _canvas: HTMLCanvasElement;
    private _engine: Engine;
    private _scene: Scene;
    private useHavok: boolean;

    public get scene(): Scene {
        return this._scene;
    }

    constructor(canvas: HTMLCanvasElement, engine: Engine, useHavok = false) {
        this._canvas = canvas;
        this._engine = engine;
        this._scene = new Scene(this._engine);
        this.useHavok = useHavok; 
        this.initialize();
    }

    private async initialize(): Promise<void> {
        //TODO: [ ]: Update GUI content.        
        const advancedTexture = await GUILoader.loadGUI(this._scene, "./assets/gui/guiTexture.json");
        //TODO: [ ]: Update 3d models content.        
        //await ModelsLoader.loadModels(this._scene, "./assets/models/", "carnotBox.gltf", true, true);
        
        this.sceneOptimizer();
        this._scene.clearColor = new Color4(0.04, 0.04, 0.14, 1);//Color4.FromHexString("#87CEEB");

        const light1: HemisphericLight = new HemisphericLight("light1", new Vector3(0, 1, 0), this._scene);
        light1.intensity = 0.75;

        const glowLayer = new GlowLayer("glow", this._scene);
        glowLayer.intensity = 0.9;

        const universalCamera = CameraInitializer.createUniversalCamera(this._scene, this._canvas);
        const followCamera = CameraInitializer.createFollowCamera(this._scene);
        this._scene.activeCamera = universalCamera; // Or followCamera

        let physicsPlugin: HavokPlugin | null = null;
        
        if (this.useHavok) {
            const physicsEngine = new HavokPhysicsEngine();
            physicsPlugin = await physicsEngine.initialize(this._scene);
        }

        const mvc = new MVC(this._scene, advancedTexture, physicsPlugin);
        
        await this._scene.whenReadyAsync(); //optional
        this._engine.hideLoadingUI(); //optional
        this.sceneLoop();
    }

    private sceneLoop() {
        this._engine.runRenderLoop(() => {
            this._scene.render();
        });
    }

    private sceneOptimizer() {
        this._scene.skipPointerMovePicking = true;
        //this._scene.freezeActiveMeshes();
        this._scene.performancePriority = ScenePerformancePriority.BackwardCompatible;
       
    }
}