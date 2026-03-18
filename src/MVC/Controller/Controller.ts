import { Scene, KeyboardEventTypes, TransformNode, UniversalCamera } from "@babylonjs/core";
import { IModel } from "../Model/IModel";
import { IView } from "../View/IView";
import { InputKeyboardController } from "./InputKeyboardController";
import { CameraController } from "./CameraController";

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

    // Flags para controle contínuo de rotação via botões GUI (Touch)
    private isLeftPressed: boolean = false;
    private isRightPressed: boolean = false;

    constructor(scene: Scene, model: IModel, view: IView) {
        this.scene = scene;
        this.model = model;
        this.view = view;

        this.inputKeyboardControllers = new InputKeyboardController(scene);
        this.inputKeyboardControllerSetup();
        this.inputTouchControllerSetup();

        this.model.setScoreUpdateCallback((score: number, reflections: number, refractions: number, internalReflections: number) => {
            this.view.updateScoreText(score, reflections, refractions, internalReflections);
        });

        // Quando o jogador vence o nível (atinge todos os alvos)
        this.model.setEndGameCallback((isVisible: boolean) => {
            this.view.showEndGamePanel(isVisible);
            
            // Opcional: Aqui você pode colocar um setTimeout para voltar
            // automaticamente para a Seleção de Nível após alguns segundos de vitória!
        });

        this.highlightActiveElement();

        // Inicia o loop contínuo de checagens (câmera suave e rotação contínua)
        this.update();
    }

    private getInteractables(): InteractableElement[] {
        // Agora os Blocos de Vidro também podem ser selecionados e girados!
        return[
            ...this.model.getMirrors(), 
            ...this.model.getSplitters(),
            ...this.model.getGlasses() 
        ];
    }

    // ══════════════════════════════════════════════════════════════════════
    //  CONTROLES DE TECLADO (PC)
    // ══════════════════════════════════════════════════════════════════════
    private inputKeyboardControllerSetup() {
        this.inputKeyboardControllers.bindKeyboardEvents({
            "arrowup": (eventType) => { this.handleKeyboardSelection(eventType, 1); },
            "arrowdown": (eventType) => { this.handleKeyboardSelection(eventType, -1); },
            "w": (eventType) => { this.handleKeyboardSelection(eventType, 1); },
            "s": (eventType) => { this.handleKeyboardSelection(eventType, -1); },

            "arrowleft": (eventType) => { this.handleKeyboardRotation(eventType, -1); },
            "arrowright": (eventType) => { this.handleKeyboardRotation(eventType, 1); },
            "a": (eventType) => { this.handleKeyboardRotation(eventType, -1); },
            "d": (eventType) => { this.handleKeyboardRotation(eventType, 1); },
        });
    }

    private handleKeyboardSelection(eventType: KeyboardEventTypes, direction: number) {
        if (eventType === KeyboardEventTypes.KEYDOWN) {
            this.handleSelectionTap(direction);
        }
    }

    private handleKeyboardRotation(eventType: KeyboardEventTypes, direction: number) {
        if (eventType === KeyboardEventTypes.KEYDOWN) {
            const interactables = this.getInteractables();
            if (interactables.length > 0) {
                const active = interactables[this.activeElementIndex];
                active.rotationY += direction * 0.024;
                this.model.triggerRecalculation();
            }
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    //  LÓGICA CENTRAL DE AÇÕES (Usada pelo PC e Mobile)
    // ══════════════════════════════════════════════════════════════════════
    private handleSelectionTap(direction: number) {
        const interactables = this.getInteractables();
        if (interactables.length === 0) return;

        // Desmarca atual
        interactables[this.activeElementIndex].setHighlight(false);

        // Pula pro próximo com loop
        const total = interactables.length;
        this.activeElementIndex = (this.activeElementIndex + direction + total) % total;

        // Destaca novo alvo
        this.highlightActiveElement();
    }

    private highlightActiveElement() {
        const interactables = this.getInteractables();
        if (interactables.length > 0) {
            interactables[this.activeElementIndex].setHighlight(true);
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    //  ATUALIZAÇÃO POR FRAME (LOOP)
    // ══════════════════════════════════════════════════════════════════════
    private update() {
        this.scene.onBeforeRenderObservable.add(() => {
            this.updateCameraPosition();
            this.handleContinuousTouchRotation(); // Verifica os botões GUI sendo segurados
        });
    }

    private handleContinuousTouchRotation() {
        if (this.isLeftPressed || this.isRightPressed) {
            const interactables = this.getInteractables();
            if (interactables.length > 0) {
                const active = interactables[this.activeElementIndex];

                // Determina o sentido do giro com base em qual botão está sendo segurado
                const direction = this.isLeftPressed ? 1 : -1;

                active.rotationY += direction * 0.012;
                this.model.triggerRecalculation();
            }
        }
    }

    private updateCameraPosition(): void {
        const interactables = this.getInteractables();
        if (interactables.length === 0) return;

        const activeElement = interactables[this.activeElementIndex];
        const targets = this.model.getTargets();

        const mainTarget = targets.length > 0 ? targets[0].root : null;
        const camera = this.scene.activeCamera as UniversalCamera;

        if (camera && activeElement) {
            CameraController.updatePosition(camera, activeElement.root, mainTarget);
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    //  MÉTODOS DE UI E FLUXO DO JOGO
    // ══════════════════════════════════════════════════════════════════════
    private inputTouchControllerSetup() {
        // --- CONTROLES DE JOGO (Mobile GUI) ---

        // SELEÇÃO: Apenas 1 pulo por toque
        this.view.buttonUpDown(() => this.handleSelectionTap(1));
        this.view.buttonDownDown(() => this.handleSelectionTap(-1));

        // ROTAÇÃO: Modifica as flags para girar continuamente no loop de update
        this.view.buttonLeftDown(() => { this.isLeftPressed = true; });
        this.view.buttonLeftUp(() => { this.isLeftPressed = false; });

        this.view.buttonRightDown(() => { this.isRightPressed = true; });
        this.view.buttonRightUp(() => { this.isRightPressed = false; });

        // --- MENUS ---
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