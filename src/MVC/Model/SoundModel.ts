import { Sound, Scene, Engine } from "@babylonjs/core";
import { ISoundInterface } from "./ISoundInterface";

export class SoundModel implements ISoundInterface {
    private _sound: Sound;
    public static isMusicEnabled: boolean = true;
    private _autoPlay: boolean = false;

    public toggleAllMusicsEnabled(){
        SoundModel.isMusicEnabled = !SoundModel.isMusicEnabled;
        return SoundModel.isMusicEnabled;
    }

    constructor(scene: Scene, name: string, path: string, autoplay: boolean) {
        this._autoPlay = autoplay;
        
        this._sound = new Sound(name, path, scene, () => {
            // Em vez de dar play direto, verificamos se o áudio já está desbloqueado pelo navegador
            if (this._autoPlay) {
                this.handleInitialPlay();
            }
        }, {
            volume: 0.3,
            loop: true,
            autoplay: false, // Sempre começamos como false para gerenciar manualmente
        });

        this.setupVisibilityHandler();
    }

    private handleInitialPlay() {
        // Se o navegador já permitiu áudio, toca. 
        // Se não, espera o evento oficial de "Audio Unlocked" (primeiro clique do player)
        if (Engine.audioEngine && Engine.audioEngine.unlocked) {
            this.play();
        } else {
            Engine.audioEngine?.onAudioUnlockedObservable.addOnce(() => {
                this.play();
            });
        }
    }

    private setupVisibilityHandler(): void {
        const tryPlay = () => {
            // Só tenta tocar se for autoplay E se o usuário não tiver silenciado no ícone
            if (document.visibilityState === "visible" && this._autoPlay && SoundModel.isMusicEnabled) {
                this.play();
            }
        };

        const tryPause = () => {
            if (this._sound.isPlaying) {
                this._sound.pause();
            }
        };

        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "visible") tryPlay();
            else tryPause();
        });

        window.addEventListener("blur", () => tryPause());
        window.addEventListener("focus", () => tryPlay());
    }

    public pause(): void {
        if (this._sound && this._sound.isPlaying) {
            this._sound.pause();
        }
    }

    public play(): void {
        // SEGURANÇA: Só inicia se não estiver tocando e se o global permitir
        if (this._sound && !this._sound.isPlaying && SoundModel.isMusicEnabled) {
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