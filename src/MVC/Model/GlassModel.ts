import { Scene, MeshBuilder, StandardMaterial, TransformNode, Mesh } from "@babylonjs/core";
import { AdvancedDynamicTexture, TextBlock } from "@babylonjs/gui";

export class GlassModel {
    private scene: Scene;
    public root: TransformNode;
    private rotator: TransformNode;
    public mesh: Mesh;
    
    public width: number;
    public depth: number;
    public refractionIndex: number;

    // Referências dos materiais compartilhados
    private matBase: StandardMaterial;
    private matSelected: StandardMaterial;

    constructor(
        scene: Scene, 
        id: number, 
        x: number, 
        z: number, 
        rotationY: number, 
        width: number, 
        depth: number, 
        matBase: StandardMaterial, 
        matSelected: StandardMaterial, 
        refractionIndex: number = 1.5
    ) {
        this.scene = scene;
        this.width = width;
        this.depth = depth;
        this.refractionIndex = refractionIndex;
        this.matBase = matBase;
        this.matSelected = matSelected;
        
        this.root = new TransformNode("glassRoot_" + id, this.scene);
        this.root.position.set(x, 0, z);

        this.rotator = new TransformNode("glassRotator_" + id, this.scene);
        this.rotator.parent = this.root;
        this.rotator.rotation.y = rotationY;

        this.mesh = this.createGlass(id);
    }

    private createGlass(id: number): Mesh {
        const mesh = MeshBuilder.CreateBox("gls" + id, { width: this.width, height: 0.44, depth: this.depth }, this.scene);
        mesh.position.set(0, 0.22, 0); 
        mesh.parent = this.rotator; 
        mesh.isPickable = false;

        // Atribui o material da fábrica
        mesh.material = this.matBase;

        // Rótulo Flutuante (Fica no Root, não gira com o bloco)
        const lp = MeshBuilder.CreatePlane("gp" + id, { width: this.width + 0.3, height: 0.5 }, this.scene);
        lp.position.set(0, 0.82, 0);
        lp.billboardMode = Mesh.BILLBOARDMODE_ALL;
        lp.parent = this.root;
        lp.isPickable = false;

        const lDT = AdvancedDynamicTexture.CreateForMesh(lp, 320, 64);
        const lTx = new TextBlock();
        lTx.text = `GLASS  n = ${this.refractionIndex}`; 
        lTx.color = "#88ddff"; 
        lTx.fontSize = 36;
        lDT.addControl(lTx);

        return mesh;
    }

    public get rotationY(): number { return this.rotator.rotation.y; }
    public set rotationY(value: number) { this.rotator.rotation.y = value; }

    // Otimizado: Troca o material inteiro em vez de mudar a cor
    public setHighlight(isHighlighted: boolean): void {
        this.mesh.material = isHighlighted ? this.matSelected : this.matBase;
    }

    public getOBB() {
        return {
            center: { x: this.root.position.x, z: this.root.position.z },
            angle: this.rotationY,
            halfW: this.width / 2,
            halfD: this.depth / 2,
            n: this.refractionIndex
        };
    }
}