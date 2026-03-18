import { Scene, HavokPlugin } from "@babylonjs/core";
import { IModel } from "./IModel";
import { SoundModel } from "./SoundModel";
import { GroundModel } from "./GroundModel";
import { MirrorModel } from "./MirrorModel";
import { LaserModel } from "./LaserModel";
import { TargetModel } from "./TargetModel";
import { SplitterModel } from "./SplitterModel";
import { GlassModel } from "./GlassModel";
import { BlockModel } from "./BlockModel";
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
    private blocks: BlockModel[] = [];
    private laserModel!: LaserModel;

    private opticsEngine!: OpticsEngine;
    private needsRecalculation: boolean = false;
    private recalcTimer: number = 0;

    private unlockedLevels: number = 1;
    private levelScores: number[] = new Array(12).fill(0);

    private currentLevelIndex: number = 0;
    private scoreUpdateCallback: ((score: number, ref: number, refr: number, intRef: number) => void) | null = null;

    // Cache dos dados das fases do JSON
    private levelsData: any[] = [];

    constructor(scene: Scene, physicsPlugin?: HavokPlugin | null) {
        const savedScores = localStorage.getItem('snell_laser_scores');
        if (savedScores) this.levelScores = JSON.parse(savedScores);

        const savedLevels = localStorage.getItem('snell_laser_unlocked');
        if (savedLevels) this.unlockedLevels = parseInt(savedLevels);

        this.scene = scene;
        this.physicsPlugin = physicsPlugin || null;

        this.startMusic();

        this.groundModel = new GroundModel(this.scene, 16, 32);
        this.opticsEngine = new OpticsEngine(this.scene, this);

        // Ao invés de instanciar peças soltas, mandamos carregar a Fase 1
        this.loadLevel(0);
        this.updateSceneModels();
    }

    public getUnlockedLevels(): number { return this.unlockedLevels; }
    public getLevelScores(): number[] { return this.levelScores; }

    public resetProgress(): void {
        // 1. Reseta variáveis locais
        this.unlockedLevels = 1;
        this.levelScores = new Array(12).fill(0);
        this.endGAme = false;

        // 2. Limpa o armazenamento do navegador
        localStorage.removeItem('snell_laser_scores');
        localStorage.removeItem('snell_laser_unlocked');

        // 3. Recarrega a fase 1 por segurança
        this.loadLevel(0);
    }
    // Limpa a tela antes de construir uma nova fase
    private clearCurrentLevel(): void {
        if (this.laserModel) {
            this.laserModel.root.dispose();
        }

        this.targets.forEach(t => t.dispose());

        this.mirrors.forEach(m => m.root.dispose());
        this.splitters.forEach(s => s.root.dispose());
        this.glasses.forEach(g => g.root.dispose());
        this.blocks.forEach(b => b.root.dispose());

        this.targets = [];
        this.mirrors = [];
        this.splitters = [];
        this.glasses = [];
        this.blocks = [];
    }

    // Assíncrono: Baixa o JSON e constrói a fase lendo ele
    public async loadLevel(levelIndex: number): Promise<void> {
        this.currentLevelIndex = levelIndex;
        console.log(`Carregando a Fase ${levelIndex + 1}...`);

        try {
            // Só baixa o arquivo na primeira vez
            if (this.levelsData.length === 0) {
                // ATUALIZADO: Adicionamos o getTime() para forçar o celular a ignorar o cache!
                const cacheBuster = new Date().getTime();
                const response = await fetch(`./assets/levels.json?v=${cacheBuster}`);
                this.levelsData = await response.json();
            }

            const levelData = this.levelsData[levelIndex];
            if (!levelData) {
                console.warn(`Fase ${levelIndex + 1} ainda não existe no levels.json!`);
                return;
            }

            this.clearCurrentLevel();

            // 1. Cria o Laser
            if (levelData.emitter) {
                this.laserModel = new LaserModel(this.scene, levelData.emitter.x, levelData.emitter.z, levelData.emitter.rotationY);
            }

            // 2. Cria os Alvos
            levelData.targets?.forEach((t: any, i: number) => {
                this.targets.push(new TargetModel(this.scene, i, t.x, t.z, t.radius || 0.65));
            });

            // 3. Cria os Espelhos
            levelData.mirrors?.forEach((m: any, i: number) => {
                this.mirrors.push(new MirrorModel(this.scene, i, m.x, m.z, m.ry, m.length || 3.0));
            });

            // 4. Cria os Splitters
            levelData.splitters?.forEach((s: any, i: number) => {
                this.splitters.push(new SplitterModel(this.scene, i, s.x, s.z, s.ry, s.length || 3.0));
            });

            // 5. Cria os Vidros
            levelData.glasses?.forEach((g: any, i: number) => {
                this.glasses.push(new GlassModel(this.scene, i, g.x, g.z, g.rotationY || 0, g.width, g.depth, g.refractionIndex || 1.5));
            });

            // 6. NOVO: Cria os Obstáculos Opacos (Blocos)
            levelData.blocks?.forEach((b: any, i: number) => {
                this.blocks.push(new BlockModel(this.scene, i, b.x, b.z, b.rotationY || 0, b.width, b.depth));
            });

            // Força a Óptica a desenhar os raios da nova fase
            this.triggerRecalculation();

        } catch (error) {
            console.error("Erro ao ler levels.json:", error);
        }
    }

    public getTotalBestScore(): number {
        return this.levelScores.reduce((acumulador, valorAtual) => acumulador + valorAtual, 0);
    }

    public setScoreUpdateCallback(callback: (score: number, reflections: number, refractions: number, intRef: number) => void): void {
        this.scoreUpdateCallback = callback;
    }

    public updateGameState(isWin: boolean, reflections: number, refractions: number, internalReflections: number): void {
        const currentScore = (reflections * 10) + (refractions * 20) + (internalReflections * 50);

        if (this.scoreUpdateCallback) {
            this.scoreUpdateCallback(currentScore, reflections, refractions, internalReflections);
        }

        if (isWin && !this.endGAme) {
            this.endGAme = true;

            this.levelScores[this.currentLevelIndex] = Math.max(this.levelScores[this.currentLevelIndex], currentScore);

            localStorage.setItem('snell_laser_scores', JSON.stringify(this.levelScores));
            localStorage.setItem('snell_laser_unlocked', this.unlockedLevels.toString());

            if (this.currentLevelIndex + 1 >= this.unlockedLevels && this.unlockedLevels < 12) {
                this.unlockedLevels = this.currentLevelIndex + 2;
            }

            if (this.endGameCallback) {
                this.endGameCallback(true);
            }
        }
        else if (!isWin && this.endGAme) {
            this.endGAme = false;
            if (this.endGameCallback) {
                this.endGameCallback(false);
            }
        }
    }

    public getTargets(): TargetModel[] { return this.targets; }
    public getMirrors(): MirrorModel[] { return this.mirrors; }
    public getSplitters(): SplitterModel[] { return this.splitters; }
    public getGlasses(): GlassModel[] { return this.glasses; }
    public getBlocks(): BlockModel[] { return this.blocks; }
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

    public resetGame() {
        this.updateModels = false;
        console.log("reset Game");
    }
}
