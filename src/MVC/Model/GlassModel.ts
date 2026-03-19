import { Scene, MeshBuilder, StandardMaterial, Color3, TransformNode, Mesh } from "@babylonjs/core";
import { AdvancedDynamicTexture, TextBlock } from "@babylonjs/gui";

export class GlassModel {
    private scene: Scene;
    public root: TransformNode;
    private rotator: TransformNode;
    public mesh: Mesh;
    
    public width: number;
    public depth: number;
    public refractionIndex: number;

    constructor(scene: Scene, id: number, x: number, z: number, rotationY: number, width: number, depth: number, refractionIndex: number = 1.5) {
        this.scene = scene;
        this.width = width;
        this.depth = depth;
        this.refractionIndex = refractionIndex;
        
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
        mesh.parent = this.rotator; // Atrelado ao nó rotativo
        mesh.isPickable = false;

        const mat = new StandardMaterial("glsm" + id, this.scene);
        mat.diffuseColor = new Color3(0.35, 0.72, 1);
        mat.emissiveColor = new Color3(0.04, 0.18, 0.42);
        mat.alpha = 0.48; 
        mat.backFaceCulling = false;
        mesh.material = mat;

        // Rótulo Flutuante (Fica no Root, não gira)
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

    // Acesso e modificação da rotação para o Controller
    public get rotationY(): number { return this.rotator.rotation.y; }
    public set rotationY(value: number) { this.rotator.rotation.y = value; }

    // Cor ao ser selecionado pelo Controller
    public setHighlight(isHighlighted: boolean): void {
        const mat = this.mesh.material as StandardMaterial;
        if (mat) {
            // Fica com azul neon/brilhante quando selecionado
            mat.emissiveColor = isHighlighted ? new Color3(0.08, 0.4, 0.8) : new Color3(0.04, 0.18, 0.42);
        }
    }

    // Retorna os dados da Caixa Orientada (Oriented Bounding Box) para a Física
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