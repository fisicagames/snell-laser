import { Scene, MeshBuilder, StandardMaterial, Color3, TransformNode, Mesh } from "@babylonjs/core";
import { AdvancedDynamicTexture, TextBlock } from "@babylonjs/gui";

export class MirrorModel {
    private scene: Scene;
    
    public root: TransformNode; // Nó principal para posicionamento
    private rotator: TransformNode; // Nó interno para rotacionar a face do espelho
    public mesh: Mesh; // A face do espelho
    public length: number;

    constructor(scene: Scene, id: number, x: number, z: number, rotationY: number, length: number = 3.0) {
        this.scene = scene;
        this.length = length;
        
        // Root mantém o texto e o espelho na posição correta da cena
        this.root = new TransformNode("mirrorRoot_" + id, this.scene);
        this.root.position.set(x, 0, z);

        // Rotator aplica o giro apenas no espelho
        this.rotator = new TransformNode("mirrorRotator_" + id, this.scene);
        this.rotator.parent = this.root;
        this.rotator.rotation.y = rotationY;

        this.mesh = this.createMirror(id);
    }

    private createMirror(id: number): Mesh {
        // --- FACE DO ESPELHO EXATAMENTE IGUAL AO SEU CÓDIGO ---
        const mesh = MeshBuilder.CreateBox("mir" + id, { width: 0.1, height: 0.52, depth: this.length }, this.scene);
        mesh.position.set(0, 0.26, 0); // Posição Y relativa ao root
        mesh.parent = this.rotator; // Atrelado ao nó rotativo
        
        const mat = new StandardMaterial("mm" + id, this.scene);
        mat.diffuseColor = new Color3(0.78, 0.92, 1);
        mat.emissiveColor = new Color3(0.15, 0.25, 0.45); // Cor base
        mat.specularColor = Color3.White();
        mat.specularPower = 512;
        mesh.material = mat;

        // --- RÓTULO FLUTUANTE ---
        const lp = MeshBuilder.CreatePlane("mLP" + id, { width: 0.8, height: 0.34 }, this.scene);
        lp.position.set(0, 0.96, 0);
        lp.billboardMode = Mesh.BILLBOARDMODE_ALL; // Texto sempre olha para a câmera
        lp.parent = this.root; // Preso no root, não gira com o rotator!
        
        const lDT = AdvancedDynamicTexture.CreateForMesh(lp, 128, 56);
        const lTx = new TextBlock();
        lTx.text = "M" + (id + 1); 
        lTx.color = "#aaddff"; 
        lTx.fontSize = 40; 
        lTx.fontWeight = "bold";
        lDT.addControl(lTx);

        return mesh;
    }

    // Acesso à rotação pelo Controller
    public get rotationY(): number {
        return this.rotator.rotation.y;
    }

    public set rotationY(value: number) {
        this.rotator.rotation.y = value;
    }

    public setHighlight(isHighlighted: boolean): void {
        const mat = this.mesh.material as StandardMaterial;
        if (mat) {
            // Emite a cor laranja original quando selecionado
            mat.emissiveColor = isHighlighted ? new Color3(1, 0.75, 0.05) : new Color3(0.15, 0.25, 0.45);
        }
    }
}