import { Scene, MeshBuilder, StandardMaterial, Color3, TransformNode, Mesh } from "@babylonjs/core";

export class BlockModel {
    private scene: Scene;
    public root: TransformNode;
    public mesh: Mesh;
    
    public width: number;
    public depth: number;

    constructor(scene: Scene, id: number, x: number, z: number, rotationY: number, width: number, depth: number) {
        this.scene = scene;
        this.width = width;
        this.depth = depth;

        this.root = new TransformNode("blockRoot_" + id, this.scene);
        this.root.position.set(x, 0, z);
        this.root.rotation.y = rotationY;

        this.mesh = this.createBlock(id);
    }

    private createBlock(id: number): Mesh {
        // Corpo principal do obstáculo
        const mesh = MeshBuilder.CreateBox("blk" + id, { width: this.width, height: 0.6, depth: this.depth }, this.scene);
        mesh.position.set(0, 0.3, 0); 
        mesh.parent = this.root;
        mesh.isPickable = false; // Obstáculos geralmente são fixos

        const mat = new StandardMaterial("blkm" + id, this.scene);
        mat.diffuseColor = new Color3(0.2, 0.2, 0.25); // Cinza escuro
        mat.emissiveColor = new Color3(0.05, 0.05, 0.08); // Leve brilho
        mat.specularColor = new Color3(0.1, 0.1, 0.1);
        mesh.material = mat;

        // Detalhe de borda (Accent vermelho escuro) para dar um visual sci-fi
        const stripeMat = new StandardMaterial("blke" + id, this.scene);
        stripeMat.emissiveColor = new Color3(0.6, 0.1, 0.1); 
        
        const stripe = MeshBuilder.CreateBox("blkS" + id, { width: this.width + 0.05, height: 0.1, depth: this.depth + 0.05 }, this.scene);
        stripe.position.set(0, 0.5, 0);
        stripe.parent = this.root;
        stripe.material = stripeMat;
        stripe.isPickable = false;

        return mesh;
    }

    // Retorna a Bounding Box Orientada para a Engine de Óptica
    public getOBB() {
        return {
            center: { x: this.root.position.x, z: this.root.position.z },
            angle: this.root.rotation.y,
            halfW: this.width / 2,
            halfD: this.depth / 2
        };
    }
}