import { Scene, MeshBuilder, StandardMaterial, TransformNode, Mesh } from "@babylonjs/core";
import { AdvancedDynamicTexture, TextBlock } from "@babylonjs/gui";

export class SplitterModel {
    private scene: Scene;
    public root: TransformNode; 
    private rotator: TransformNode; 
    public mesh: Mesh; 
    public length: number;

    private matBase: StandardMaterial;
    private matSelected: StandardMaterial;

    constructor(
        scene: Scene, 
        id: number, 
        x: number, 
        z: number, 
        rotationY: number, 
        length: number, 
        matBase: StandardMaterial, 
        matSelected: StandardMaterial
    ) {
        this.scene = scene;
        this.length = length;
        this.matBase = matBase;
        this.matSelected = matSelected;
        
        this.root = new TransformNode("splitterRoot_" + id, this.scene);
        this.root.position.set(x, 0, z);

        this.rotator = new TransformNode("splitterRotator_" + id, this.scene);
        this.rotator.parent = this.root;
        this.rotator.rotation.y = rotationY;

        this.mesh = this.createSplitter(id);
    }

    private createSplitter(id: number): Mesh {
        const face = MeshBuilder.CreateBox("spl" + id, { width: 0.08, height: 0.52, depth: this.length }, this.scene);
        face.position.set(0, 0.26, 0);
        face.parent = this.rotator; 
        face.material = this.matBase; // USANDO FÁBRICA

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
        this.mesh.material = isHighlighted ? this.matSelected : this.matBase;
    }

    public getSegment() {
        const p = this.root.position;
        const ry = this.rotationY;
        const hl = this.length / 2;
        const sx = Math.sin(ry); 
        const cx = Math.cos(ry);
        return { 
            p1: { x: p.x - hl * sx, z: p.z - hl * cx }, 
            p2: { x: p.x + hl * sx, z: p.z + hl * cx }, 
            n: { x: cx, z: -sx } 
        };
    }
}