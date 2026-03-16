import { Scene, MeshBuilder, StandardMaterial, Color3, TransformNode, Mesh } from "@babylonjs/core";
import { AdvancedDynamicTexture, TextBlock } from "@babylonjs/gui";

export class SplitterModel {
    private scene: Scene;
    
    public root: TransformNode; 
    private rotator: TransformNode; 
    public mesh: Mesh; 
    public length: number;

    constructor(scene: Scene, id: number, x: number, z: number, rotationY: number, length: number = 3.0) {
        this.scene = scene;
        this.length = length;
        
        this.root = new TransformNode("splitterRoot_" + id, this.scene);
        this.root.position.set(x, 0, z);

        this.rotator = new TransformNode("splitterRotator_" + id, this.scene);
        this.rotator.parent = this.root;
        this.rotator.rotation.y = rotationY;

        this.mesh = this.createSplitter(id);
    }

    private createSplitter(id: number): Mesh {
        // --- FACE SEMI-TRANSPARENTE DOURADA ---
        const face = MeshBuilder.CreateBox("spl" + id, { width: 0.08, height: 0.52, depth: this.length }, this.scene);
        face.position.set(0, 0.26, 0);
        face.parent = this.rotator; 
        
        const sMat = new StandardMaterial("sFace" + id, this.scene);
        sMat.diffuseColor = new Color3(1.0, 0.88, 0.4);
        sMat.emissiveColor = new Color3(0.3, 0.22, 0.04); // Cor dourada base
        sMat.alpha = 0.68; 
        sMat.backFaceCulling = false; // Importante para ver o outro lado
        sMat.specularColor = Color3.White(); 
        sMat.specularPower = 512;
        face.material = sMat;

        // --- RÓTULO FLUTUANTE ---
        const lp = MeshBuilder.CreatePlane("sLP" + id, { width: 1.6, height: 0.38 }, this.scene);
        lp.position.set(0, 0.96, 0);
        lp.billboardMode = Mesh.BILLBOARDMODE_ALL;
        lp.parent = this.root; 
        
        const lDT = AdvancedDynamicTexture.CreateForMesh(lp, 240, 56);
        const lTx = new TextBlock();
        lTx.text = "⊟ SPLITTER"; 
        lTx.color = "#ffcc44"; 
        lTx.fontSize = 36; 
        lTx.fontWeight = "bold";
        lDT.addControl(lTx);

        return face;
    }

    public get rotationY(): number { return this.rotator.rotation.y; }
    public set rotationY(value: number) { this.rotator.rotation.y = value; }

    public setHighlight(isHighlighted: boolean): void {
        const mat = this.mesh.material as StandardMaterial;
        if (mat) {
            // Usa o mesmo amarelo vibrante/laranja do MirrorModel quando selecionado
            mat.emissiveColor = isHighlighted ? new Color3(1, 0.75, 0.05) : new Color3(0.3, 0.22, 0.04);
        }
    }
}