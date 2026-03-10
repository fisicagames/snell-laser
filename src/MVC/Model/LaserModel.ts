import { Scene, MeshBuilder, StandardMaterial, Color3, TransformNode, Mesh } from "@babylonjs/core";
import { AdvancedDynamicTexture, TextBlock } from "@babylonjs/gui";

export class LaserModel {
    private scene: Scene;
    public root: TransformNode; // Nó principal para mover/rotacionar o laser inteiro
    public x: number;
    public z: number;

    constructor(scene: Scene, x: number, z: number, rotationY: number = 0) {
        this.scene = scene;
        this.x = x;
        this.z = z;
        this.root = this.createLaser(x, z, rotationY);
    }

    private createLaser(x: number, z: number, rotationY: number): TransformNode {
        const root = new TransformNode("laserRoot", this.scene);
        root.position.set(x, 0, z);
        root.rotation.y = rotationY;

        // Materiais
        const bMat = new StandardMaterial("emBm", this.scene);
        bMat.diffuseColor = new Color3(0.12, 0.12, 0.18);
        bMat.emissiveColor = new Color3(0.25, 0.04, 0.04);

        const nMat = new StandardMaterial("emNm", this.scene);
        nMat.emissiveColor = new Color3(0.85, 0.12, 0.12);

        const rMat = new StandardMaterial("emRm", this.scene);
        rMat.emissiveColor = new Color3(1, 0.08, 0.08);

        // Corpo
        const body = MeshBuilder.CreateBox("emB", { width: 1.3, height: 0.65, depth: 0.65 }, this.scene);
        body.position.set(0, 0.325, 0);
        body.material = bMat;
        body.isPickable = false;
        body.parent = root;

        // Bocal (Cilindro)
        const noz = MeshBuilder.CreateCylinder("emN", { diameter: 0.34, height: 0.75, tessellation: 12 }, this.scene);
        noz.rotation.z = Math.PI / 2;
        noz.position.set(0.95, 0.325, 0);
        noz.material = nMat;
        noz.isPickable = false;
        noz.parent = root;

        // Anel de Abertura (Torus)
        const ring = MeshBuilder.CreateTorus("emR", { diameter: 0.46, thickness: 0.09, tessellation: 20 }, this.scene);
        ring.rotation.z = Math.PI / 2;
        ring.position.set(1.34, 0.325, 0);
        ring.material = rMat;
        ring.isPickable = false;
        ring.parent = root;

        // Decalques (Stripes)
        for (let i = 0; i < 3; i++) {
            const s = MeshBuilder.CreateBox("emS" + i, { width: 0.05, height: 0.67, depth: 0.02 }, this.scene);
            s.position.set(-0.5 + i * 0.35, 0.325, 0.33); // Relativo ao root
            const sMat = new StandardMaterial("emSm" + i, this.scene);
            sMat.emissiveColor = new Color3(1, 0.1, 0.1);
            s.material = sMat;
            s.parent = root;
        }

        // Rótulo Flutuante
        const lp = MeshBuilder.CreatePlane("emLP", { width: 1.6, height: 0.42 }, this.scene);
        lp.position.set(0, 0.95, 0);
        lp.billboardMode = Mesh.BILLBOARDMODE_ALL; // Sempre olha para a câmera
        lp.parent = root;

        const lDT = AdvancedDynamicTexture.CreateForMesh(lp, 256, 64);
        const lTx = new TextBlock();
        lTx.text = "⬡ LASER"; 
        lTx.color = "#ff3333"; 
        lTx.fontSize = 44; 
        lTx.fontWeight = "900";
        lDT.addControl(lTx);

        return root;
    }

    public getSourcePosition(): { x: number, z: number } {
        return { x: this.root.position.x, z: this.root.position.z };
    }

    public getDirection(): { x: number, z: number } {
        const ry = this.root.rotation.y;
        return { x: Math.cos(ry), z: -Math.sin(ry) };
    }
}