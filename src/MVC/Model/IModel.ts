// Adicione estas importações se não estiverem lá:
import { MirrorModel } from "./MirrorModel";
import { TargetModel } from "./TargetModel";
import { SplitterModel } from "./SplitterModel";
import { GlassModel } from "./GlassModel";
import { LaserModel } from "./LaserModel";

export interface IModel {
    toggleMusicPlayback(): void;
    setScoreUpdateCallback(callback: (newScore: number, state: string, work: number) => void): void;
    setEndGameCallback(callback: (isVisible: boolean) => void): void;  
    resetGame(): void;
    updateModels: boolean;

    // Acesso aos modelos para o Motor e o Controller
    getTargets(): TargetModel[];
    getMirrors(): MirrorModel[];
    getSplitters(): SplitterModel[];
    getGlasses(): GlassModel[];
    getLaser(): LaserModel;

    // Novo: Solicita recálculo do raio quando uma peça se move
    triggerRecalculation(): void;

    // --- NOVOS MÉTODOS DE PROGRESSÃO ---
    getUnlockedLevels(): number;
    getLevelScores(): number[];
    loadLevel(levelIndex: number): void;
}