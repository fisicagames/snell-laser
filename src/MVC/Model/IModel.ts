import { MirrorModel } from "./MirrorModel";
import { TargetModel } from "./TargetModel";
import { SplitterModel } from "./SplitterModel";
import { GlassModel } from "./GlassModel";
import { LaserModel } from "./LaserModel";
import { BlockModel } from "./BlockModel";

export interface IModel {
    toggleMusicPlayback(): void;
    // Assinatura garantindo os 4 parâmetros
    setScoreUpdateCallback(callback: (score: number, reflections: number, refractions: number, internalReflections: number) => void): void;
    updateGameState(isWin: boolean, reflections: number, refractions: number, internalReflections: number): void;    
    
    setEndGameCallback(callback: (isVisible: boolean) => void): void;  
    resetGame(): void;
    updateModels: boolean;

    getTargets(): TargetModel[];
    getMirrors(): MirrorModel[];
    getSplitters(): SplitterModel[];
    getGlasses(): GlassModel[];
    getLaser(): LaserModel;
    getBlocks(): BlockModel[];

    triggerRecalculation(): void;

    getUnlockedLevels(): number;
    getLevelScores(): number[];
    loadLevel(levelIndex: number): Promise<void>;
    getTotalBestScore(): number;

    resetProgress(): void;

}