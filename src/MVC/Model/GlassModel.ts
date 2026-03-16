import { Scene, MeshBuilder, StandardMaterial, Color3, TransformNode, Mesh } from "@babylonjs/core";
import { AdvancedDynamicTexture, TextBlock } from "@babylonjs/gui";

export interface BoundingBox2D {
    x0: number; x1: number;
    z0: number; z1: number;
}

export class GlassModel {
    private scene: Scene;
    public root: TransformNode;
    public bb: BoundingBox2D;
    public refractionIndex: number;

    constructor(scene: Scene, id: number, bb: BoundingBox2D, refractionIndex: number = 1.5) {
        this.scene = scene;
        this.bb = bb;
        this.refractionIndex = refractionIndex;
        
        // Calcula o centro e as dimensões baseado na Bounding Box
        const cx = (bb.x0 + bb.x1) / 2;
        const cz = (bb.z0 + bb.z1) / 2;
        const wx = bb.x1 - bb.x0;
        const wz = bb.z1 - bb.z0;

        this.root = new TransformNode("glassRoot_" + id, this.scene);
        this.root.position.set(cx, 0, cz);

        this.createGlass(id, wx, wz);
    }

    private createGlass(id: number, width: number, depth: number): void {
        // --- BLOCO DE VIDRO (Visual Clássico do Protótipo 1) ---
        const mesh = MeshBuilder.CreateBox("gls" + id, { width: width, height: 0.44, depth: depth }, this.scene);
        mesh.position.set(0, 0.22, 0); // Altura relativa ao root
        mesh.parent = this.root;
        mesh.isPickable = false;

        const mat = new StandardMaterial("glsm" + id, this.scene);
        mat.diffuseColor = new Color3(0.35, 0.72, 1);
        mat.emissiveColor = new Color3(0.04, 0.18, 0.42);
        mat.alpha = 0.48; 
        mat.backFaceCulling = false;
        mesh.material = mat;

        // --- RÓTULO FLUTUANTE ---
        const lp = MeshBuilder.CreatePlane("gp" + id, { width: 2.2, height: 0.5 }, this.scene);
        lp.position.set(0, 0.82, 0);
        lp.billboardMode = Mesh.BILLBOARDMODE_ALL; // Sempre olha para a câmera
        lp.parent = this.root;
        lp.isPickable = false;

        const lDT = AdvancedDynamicTexture.CreateForMesh(lp, 320, 64);
        const lTx = new TextBlock();
        lTx.text = `GLASS  n = ${this.refractionIndex}`; 
        lTx.color = "#88ddff"; 
        lTx.fontSize = 36;
        lDT.addControl(lTx);
    }
}