import { Scene, KeyboardEventTypes } from "@babylonjs/core";
import { IModel } from "../Model/IModel";
import { IView } from "../View/IView";
import { InputKeyboardController } from "./InputKeyboardController";

// Tipagem auxiliar para garantir que o Controller possa interagir com qualquer peça que gire e brilhe
type InteractableElement = {
    rotationY: number;
    setHighlight(isHighlighted: boolean): void;
};

export class Controller {
    private scene: Scene;
    private model: IModel;
    private view: IView;
    private inputKeyboardControllers: InputKeyboardController;

    // Índice da peça atualmente selecionada (Espelho ou Splitter)
    private activeElementIndex: number = 0;

    constructor(scene: Scene, model: IModel, view: IView) {
        this.scene = scene;
        this.model = model;
        this.view = view;

        this.inputKeyboardControllers = new InputKeyboardController(scene);
        this.inputKeyboardControllerSetup();
        
        // Mantém os eventos de UI amarrados para não quebrar a compilação
        this.inputTouchControllerSetup();

        // Destaca a primeira peça assim que o jogo começa
        this.highlightActiveElement();
    }

    // Pega todos os espelhos e divisores do Model e os junta numa lista única
    private getInteractables(): InteractableElement[] {
        return [...this.model.getMirrors(), ...this.model.getSplitters()];
    }

    private inputKeyboardControllerSetup() {
        this.inputKeyboardControllers.bindKeyboardEvents({
            // Seleção de Peças
            "arrowup":   (eventType) => { this.handleSelection(eventType, 1); },
            "arrowdown": (eventType) => { this.handleSelection(eventType, -1); },
            "w":         (eventType) => { this.handleSelection(eventType, 1); },
            "s":         (eventType) => { this.handleSelection(eventType, -1); },

            // Rotação de Peças
            "arrowleft":  (eventType) => { this.handleRotation(eventType, -1); },
            "arrowright": (eventType) => { this.handleRotation(eventType, 1); },
            "q":          (eventType) => { this.handleRotation(eventType, -1); },
            "e":          (eventType) => { this.handleRotation(eventType, 1); },
        });
    }

    private handleSelection(eventType: KeyboardEventTypes, direction: number) {
        // Dispara apenas quando a tecla é pressionada (evita pular várias vezes rápido demais)
        if (eventType === KeyboardEventTypes.KEYDOWN) {
            const interactables = this.getInteractables();
            if (interactables.length === 0) return;

            // Remove o brilho da peça atual
            interactables[this.activeElementIndex].setHighlight(false);

            // Calcula o novo índice fazendo um loop (se passar do último, volta pro primeiro)
            const total = interactables.length;
            this.activeElementIndex = (this.activeElementIndex + direction + total) % total;

            // Adiciona o brilho na nova peça selecionada
            this.highlightActiveElement();
        }
    }

    private handleRotation(eventType: KeyboardEventTypes, direction: number) {
        // Permitimos girar continuamente enquanto a tecla estiver sendo segurada
        if (eventType === KeyboardEventTypes.KEYDOWN) {
            const interactables = this.getInteractables();
            if (interactables.length > 0) {
                const active = interactables[this.activeElementIndex];
                
                // Rotaciona (0.024 é uma velocidade suave por frame)
                active.rotationY += direction * 0.024; 
                
                // Avisa o Model que a peça moveu para que a OpticsEngine recalcule os lasers!
                this.model.triggerRecalculation();
            }
        }
    }

    private highlightActiveElement() {
        const interactables = this.getInteractables();
        if (interactables.length > 0) {
            interactables[this.activeElementIndex].setHighlight(true);
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    //  MÉTODOS DE UI / CONTROLE DE FLUXO E FASES
    // ══════════════════════════════════════════════════════════════════════
    private inputTouchControllerSetup() {
        // 1. Clicou em "Iniciar" no Menu Principal
        this.view.onButtonMenuStartA(() => {
            // A View já fez o RectangleAviso (Fases) ficar visível.
            // Escondemos o Menu Principal para o painel de fases aparecer limpo.
            this.view.updateMainMenuVisibility(false); 
            // Atualizamos a grade pintando a Fase 1 de azul e as demais de cinza.
            this.view.updateLevelButtons(this.model.getUnlockedLevels(), this.model.getLevelScores());
        });

        // 2. Clicou em um dos botões da Grade de Fases
        this.view.onLevelSelect((levelIndex: number) => {
            this.startGame(levelIndex);
        });

        // Demais botões UI
        this.view.onButtonMenuStartB(() => this.startGame(0));
        this.view.onButtonMenuStartC(() => this.startGame(0));
        this.view.onButtonMenuContinuar(() => this.continueGame());
        
        this.view.onButtonMenu(() => this.showMenu());
        this.view.onToggleMusic(() => this.toggleMusic());
        this.view.onButtonLang(() => this.changeLanguage());
        
        this.view.buttonUpDown(() => {});
        this.view.setButtonUpUpCallback(() => null);
    }

    // Método responsável por iniciar a cena 3D e esconder toda a UI que cobre a tela
    private startGame(levelIndex: number): void {
        // Carrega a fase no modelo 3D
        this.model.loadLevel(levelIndex);
        
        // Esconde o painel de Seleção de Fases (RectangleAviso)
        this.view.hideLevelSelectionPanel();
        
        // Garante que menus de Pause/EndGame não estão na frente da tela
        this.continueGame();
        
        // Seleciona e destaca o primeiro espelho automaticamente para o jogador
        this.activeElementIndex = 0;
        this.highlightActiveElement();
    }
    
    private continueGame() {
        this.view.updateMainMenuVisibility(false);
        this.view.showEndGamePanel(false);
    }

    private showMenu(): void {
        this.view.updateMainMenuVisibility(true);
    }

    private toggleMusic(): void {
        this.model.toggleMusicPlayback();
    }

    private changeLanguage(): void {
        this.view.changeLanguage();
    }
}