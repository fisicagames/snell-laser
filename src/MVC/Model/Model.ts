import { Scene, HavokPlugin } from "@babylonjs/core";
import { IModel } from "./IModel";
import { SoundModel } from "./SoundModel";
import { GroundModel } from "./GroundModel";
import { MirrorModel } from "./MirrorModel";
import { LaserModel } from "./LaserModel";
import { TargetModel } from "./TargetModel";
import { SplitterModel } from "./SplitterModel";
import { GlassModel } from "./GlassModel";
import { OpticsEngine } from "./OpticsEngine";

export class Model implements IModel {
    private scene: Scene;
    private backgroundMusic?: SoundModel;
    private explosionSound?: SoundModel;
    private allSounds: SoundModel[] = [];
    private physicsPlugin: HavokPlugin | null;
    private endGameCallback: ((isVisible: boolean) => void) | null = null;
    public endGAme: boolean = false;

    public updateModels: boolean = false;

    private groundModel!: GroundModel;
    private mirrors: MirrorModel[] = [];
    private targets: TargetModel[] = [];
    private splitters: SplitterModel[] = [];
    private glasses: GlassModel[] = [];
    private laserModel!: LaserModel;

    private opticsEngine!: OpticsEngine; // <-- O Motor
    
    // Controle de Recálculo
    private needsRecalculation: boolean = false;
    private recalcTimer: number = 0;

    constructor(scene: Scene, physicsPlugin?: HavokPlugin | null) {
        this.scene = scene;
        this.physicsPlugin = physicsPlugin || null;

        this.startMusic();

        // 1. Instancia elementos da cena
        this.groundModel = new GroundModel(this.scene, 16, 32);
        this.laserModel = new LaserModel(this.scene, 0, -12, -Math.PI / 2);
        this.targets.push(new TargetModel(this.scene, 0, 0, 12));
        this.splitters.push(new SplitterModel(this.scene, 0, 0, 0, Math.PI / 4));
        this.glasses.push(new GlassModel(this.scene, 0, { x0: -3, x1: 3, z0: 4, z1: 6 }, 1.5));
        this.createMirrors();

        // 2. Instancia o Motor passando o Model (this) para que ele leia as peças
        this.opticsEngine = new OpticsEngine(this.scene, this);

        // 3. Roda o motor pela primeira vez para exibir o laser inicial
        this.opticsEngine.calculateRays();

        this.updateSceneModels();
    }

    private createMirrors(): void {
        const defs = [
            { x: 0, z: -4, ry: Math.PI / 4 },
            { x: -5, z: -4, ry: -Math.PI / 4 },
            { x: -5, z: 6, ry: -Math.PI / 4 },
        ];

        defs.forEach((def, index) => {
            this.mirrors.push(new MirrorModel(this.scene, index, def.x, def.z, def.ry));
        });
    }

    public getTargets(): TargetModel[] { return this.targets; }
    public getMirrors(): MirrorModel[] { return this.mirrors; }
    public getSplitters(): SplitterModel[] { return this.splitters; }
    public getGlasses(): GlassModel[] { return this.glasses; }
    public getLaser(): LaserModel { return this.laserModel; }




    private startMusic() {
        //TODO: [X]: Setup the music soundtrack:
        //https://pixabay.com/music/video-games-8-bit-arcade-mode-158814/
        //Music by Dimitrios Gkorilas from Pixabay
        this.backgroundMusic = new SoundModel(
            this.scene,
            "backgroundSound",
            "./assets/sounds/moodmode-8-bit-arcade-mode-158814.mp3",
            true
        );
        this.backgroundMusic.setVolume(1.0);
        this.allSounds.push(this.backgroundMusic);


        //https://pixabay.com/sound-effects/nuclear-explosion-63470/
        //Artistunfa (Freesound)
        this.explosionSound = new SoundModel(
            this.scene,
            "explosionSound",
            "./assets/sounds/timelapse-164084-compress.mp3",
            false
        );
        this.explosionSound.setVolume(1.2);
        this.explosionSound?.setLoop(false);
        this.allSounds.push(this.explosionSound);
    }

public triggerRecalculation(): void {
        this.needsRecalculation = true;
    }

    private updateSceneModels() {
        this.scene.onBeforeRenderObservable.add(() => {
            const dt = this.scene.getEngine().getDeltaTime() / 1000;

            // Anima os fótons (luzes que caminham pela reta)
            this.opticsEngine.updatePhotons(dt);

            // Throttle: Recalcula os raios apenas a cada ~40ms se a peça foi movida
            if (this.needsRecalculation) {
                this.recalcTimer += dt;
                if (this.recalcTimer > 0.04) {
                    this.opticsEngine.calculateRays();
                    this.needsRecalculation = false;
                    this.recalcTimer = 0;
                }
            }
        });
    }


    public toggleMusicPlayback(): void {
        if (this.backgroundMusic) {
            this.backgroundMusic.togglePlayback();
        }
    }

    public setEndGameCallback(callback: (isVisible: boolean) => void): void {
        this.endGameCallback = callback;
    }

    public setScoreUpdateCallback(callback: (newScore: number, state: string, work: number) => void): void {
        console.log("this.someModel.setUpdateScoreCallback(callback);", callback);

    }


    public resetGame() {
        this.updateModels = false;
        console.log("reset Game");
    }
}
