import { Scene, MeshBuilder, StandardMaterial, TransformNode, Mesh } from "@babylonjs/core";

export class BlockModel {
    private scene: Scene;
    public root: TransformNode;
    public mesh: Mesh;
    
    public width: number;
    public depth: number;

    constructor(
        scene: Scene, 
        id: number, 
        x: number, 
        z: number, 
        rotationY: number, 
        width: number, 
        depth: number, 
        matBody: StandardMaterial, 
        matStripe: StandardMaterial
    ) {
        this.scene = scene;
        this.width = width;
        this.depth = depth;

        this.root = new TransformNode("blockRoot_" + id, this.scene);
        this.root.position.set(x, 0, z);
        this.root.rotation.y = rotationY;

        this.mesh = this.createBlock(id, matBody, matStripe);
    }

    private createBlock(id: number, matBody: StandardMaterial, matStripe: StandardMaterial): Mesh {
        // Corpo principal do obstáculo
        const mesh = MeshBuilder.CreateBox("blk" + id, { width: this.width, height: 0.6, depth: this.depth }, this.scene);
        mesh.position.set(0, 0.3, 0); 
        mesh.parent = this.root;
        mesh.material = matBody; // USANDO FÁBRICA
        mesh.isPickable = false;

        // Detalhe de borda (Stripe)
        const stripe = MeshBuilder.CreateBox("blkS" + id, { width: this.width + 0.05, height: 0.1, depth: this.depth + 0.05 }, this.scene);
        stripe.position.set(0, 0.5, 0);
        stripe.parent = this.root;
        stripe.material = matStripe; // USANDO FÁBRICA
        stripe.isPickable = false;

        return mesh;
    }

    public getOBB() {
        return { 
            center: { x: this.root.position.x, z: this.root.position.z }, 
            angle: this.root.rotation.y, 
            halfW: this.width / 2, 
            halfD: this.depth / 2 
        };
    }
}