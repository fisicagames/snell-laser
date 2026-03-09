export interface IModel {
    toggleMusicPlayback(): void;
    setScoreUpdateCallback(callback: (newScore: number, state: string, work: number) => void): void;
    setEndGameCallback(callback: (isVisible: boolean) => void): void;  
    resetGame(): void;
    updateModels: boolean;
}
