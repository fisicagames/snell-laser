import { Scene, HavokPlugin } from "@babylonjs/core";
import { IModel } from "./IModel";
import { SoundModel } from "./SoundModel";
import { GroundModel } from "./GroundModel";
import { MirrorModel } from "./MirrorModel";

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
    private mirrors: MirrorModel[] =[];

    constructor(scene: Scene, physicsPlugin?: HavokPlugin | null) {
        this.scene = scene;
        this.physicsPlugin = physicsPlugin || null;

        this.startMusic();

        //Start scene construction:
        this.groundModel = new GroundModel(this.scene, 16, 32);
        this.createMirrors();

        this.updateSceneModels();
      
    }

    private createMirrors(): void {
        const defs =[
            { x: -1, z: 0, ry: Math.PI / 5 },
            { x: -1, z: 5, ry: Math.PI / 5 },
            { x:  5, z: 2, ry: Math.PI / 3 },
        ];
        defs.forEach((def, index) => {
            this.mirrors.push(new MirrorModel(this.scene, index, def.x, def.z, def.ry));
        });
    }
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

    private updateSceneModels() {
        this.scene.onBeforeRenderObservable.add(() => {
            //console.log("updateSceneModels");
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
