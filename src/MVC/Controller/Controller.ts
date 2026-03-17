import { Scene, KeyboardEventTypes, TransformNode, UniversalCamera } from "@babylonjs/core";
import { IModel } from "../Model/IModel";
import { IView } from "../View/IView";
import { InputKeyboardController } from "./InputKeyboardController";
import { CameraController } from "./CameraController";

// Adicionamos o 'root' para a câmera poder ler a posição do elemento
type InteractableElement = {
    root: TransformNode;
    rotationY: number;
    setHighlight(isHighlighted: boolean): void;
};

export class Controller {
    private scene: Scene;
    private model: IModel;
    private view: IView;
    private inputKeyboardControllers: InputKeyboardController;

    private activeElementIndex: number = 0;

    constructor(scene: Scene, model: IModel, view: IView) {
        this.scene = scene;
        this.model = model;
        this.view = view;

        this.inputKeyboardControllers = new InputKeyboardController(scene);
        this.inputKeyboardControllerSetup();
        this.inputTouchControllerSetup();

        this.highlightActiveElement();

        // Inicia o loop contínuo de checagens (ex: câmera suave)
        this.update();
    }

    private getInteractables(): InteractableElement[] {
        return [...this.model.getMirrors(), ...this.model.getSplitters()];
    }

    private inputKeyboardControllerSetup() {
        this.inputKeyboardControllers.bindKeyboardEvents({
            "arrowup":   (eventType) => { this.handleSelection(eventType, 1); },
            "arrowdown": (eventType) => { this.handleSelection(eventType, -1); },
            "w":         (eventType) => { this.handleSelection(eventType, 1); },
            "s":         (eventType) => { this.handleSelection(eventType, -1); },
            "arrowleft":  (eventType) => { this.handleRotation(eventType, -1); },
            "arrowright": (eventType) => { this.handleRotation(eventType, 1); },
            "q":          (eventType) => { this.handleRotation(eventType, -1); },
            "e":          (eventType) => { this.handleRotation(eventType, 1); },
        });
    }

    private handleSelection(eventType: KeyboardEventTypes, direction: number) {
        if (eventType === KeyboardEventTypes.KEYDOWN) {
            const interactables = this.getInteractables();
            if (interactables.length === 0) return;

            interactables[this.activeElementIndex].setHighlight(false);
            const total = interactables.length;
            this.activeElementIndex = (this.activeElementIndex + direction + total) % total;
            this.highlightActiveElement();
        }
    }

    private handleRotation(eventType: KeyboardEventTypes, direction: number) {
        if (eventType === KeyboardEventTypes.KEYDOWN) {
            const interactables = this.getInteractables();
            if (interactables.length > 0) {
                const active = interactables[this.activeElementIndex];
                active.rotationY += direction * 0.024; 
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
    //  ATUALIZAÇÃO DE CÂMERA (LOOP)
    // ══════════════════════════════════════════════════════════════════════
    private update() {
        this.scene.onBeforeRenderObservable.add(() => {
            this.updateCameraPosition();
        });
    }

    private updateCameraPosition(): void {
        const interactables = this.getInteractables();
        if (interactables.length === 0) return;

        const activeElement = interactables[this.activeElementIndex];
        const targets = this.model.getTargets();
        
        // Pega o nó principal (root) do Target para focar, se existir.
        const mainTarget = targets.length > 0 ? targets[0].root : null;

        // Como criamos uma UniversalCamera no SceneInitializer, fazemos o cast
        const camera = this.scene.activeCamera as UniversalCamera;
        
        if (camera && activeElement) {
            CameraController.updatePosition(camera, activeElement.root, mainTarget);
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    //  MÉTODOS DE UI E FLUXO DO JOGO
    // ══════════════════════════════════════════════════════════════════════
    private inputTouchControllerSetup() {
        this.view.onButtonMenuStartA(() => {
            this.view.updateMainMenuVisibility(false); 
            this.view.updateLevelButtons(this.model.getUnlockedLevels(), this.model.getLevelScores());
        });

        this.view.onLevelSelect((levelIndex: number) => {
            this.startGame(levelIndex);
        });

        this.view.onButtonMenuStartB(() => this.startGame(0));
        this.view.onButtonMenuStartC(() => this.startGame(0));
        this.view.onButtonMenuContinuar(() => this.continueGame());
        
        this.view.onButtonMenu(() => this.showMenu());
        this.view.onToggleMusic(() => this.toggleMusic());
        this.view.onButtonLang(() => this.changeLanguage());
        
        this.view.buttonUpDown(() => {});
        this.view.setButtonUpUpCallback(() => null);
    }

    private startGame(levelIndex: number): void {
        this.model.loadLevel(levelIndex);
        this.view.hideLevelSelectionPanel();
        this.continueGame();
        
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