import { Vector3, Mesh } from "@babylonjs/core";

export interface IView {
    onButtonMenuStartA(callback: () => void): void;
    onButtonMenuStartB(callback: () => void): void;
    onButtonMenuStartC(callback: () => void): void;
    onButtonMenu(callback: () => void): void;
    onButtonMenuContinuar(callback: () => void): void;
    onToggleMusic(callback: () => void): void;
    onButtonLang(callback: () => void): void;

    // --- Novos métodos para a Seleção de Fases ---
    onLevelSelect(callback: (levelIndex: number) => void): void;
    updateLevelButtons(unlockedLevels: number, scores: number[]): void;
    hideLevelSelectionPanel(): void;
    // ---------------------------------------------

    setButtonUpUpCallback(callback: () => void): void;
    buttonDownUp(callback: () => void): void;
    buttonRightUp(callback: () => void): void;
    buttonLeftUp(callback: () => void): void;
    
    buttonUpDown(callback: () => void): void;
    buttonDownDown(callback: () => void): void;
    buttonRightDown(callback: () => void): void;
    buttonLeftDown(callback: () => void): void;

    onButtonEfeitoIntenso(callback: () => void): void;
    onButtonEfeitoSuave(callback: () => void): void;
    
    updateMainMenuVisibility(isVisible: boolean): void;
    changeLanguage(): void;

    updateScoreText(score: number, reflections: number, refractions: number, internalReflections: number): void;
    showEndGamePanel(isVisible: boolean): void;
    changeButtonUPSymbol(string: string, coins: number): void;
}