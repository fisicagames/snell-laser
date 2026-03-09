import { Sound, Scene } from "@babylonjs/core";
import { ISoundInterface } from "./ISoundInterface";

export class SoundModel implements ISoundInterface {
    private _sound: Sound;
    public static isMusicEnabled: boolean = true;
    private _autoPlay: boolean = false;

    public toggleAllMusicsEnabled(){
        SoundModel.isMusicEnabled = !SoundModel.isMusicEnabled
        return SoundModel.isMusicEnabled;
    }

    constructor(scene: Scene, name: string, path: string, autoplay: boolean) {
        this._autoPlay = autoplay;
        this._sound = new Sound(name, path, scene, () => {
            if (this._autoPlay && SoundModel.isMusicEnabled) this.play();
        }, {
            volume: 0.3,
            loop: true,
            autoplay: false,
        });

        this.setupVisibilityHandler();
    }

    private setupVisibilityHandler(): void {
        const tryPlay = () => {
            if (document.visibilityState === "visible" && this._autoPlay && SoundModel.isMusicEnabled) {
                if (!this._sound.isPlaying) this._sound.play();
            }
        };

        const tryPause = () => {
            if (this._sound.isPlaying) {
                this._sound.pause();
            }
        };

        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "visible") {
                tryPlay();
            } else {
                tryPause();
            }
        });

        window.addEventListener("blur", () => {
            tryPause();
        });

        window.addEventListener("focus", () => {
            tryPlay();
        });
    }

    public pause(): void {
        if (this._sound.isPlaying) {
            this._sound.pause();
        }
    }

    public play(): void {
        if (!this._sound.isPlaying && document.visibilityState === "visible" && document.hasFocus() && SoundModel.isMusicEnabled) {
            this._sound.play();
        }
    }

    public togglePlayback(): void {
        if (this._sound.isPlaying) {
            this.pause();
            SoundModel.isMusicEnabled = false;
        } else {
            SoundModel.isMusicEnabled = true;
            this.play();
        }
    }

    public setVolume(volume: number): void {
        this._sound.setVolume(volume);
    }
    
    public getVolume(): number {
        return this._sound.getVolume();
    }

    public setLoop(loop: boolean): void {
        this._sound.loop = loop;
    }
}