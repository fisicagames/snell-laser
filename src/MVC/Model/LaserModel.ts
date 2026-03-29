import { Scene } from "@babylonjs/core/scene";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Mesh } from "@babylonjs/core/Meshes/mesh";

import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";

export class LaserModel {
    private scene: Scene;
    public root: TransformNode;
    public x: number;
    public z: number;

    constructor(scene: Scene, x: number, z: number, rotationY: number, matBody: StandardMaterial, matEmissive: StandardMaterial) {
        this.scene = scene;
        this.x = x;
        this.z = z;
        this.root = this.createLaser(x, z, rotationY, matBody, matEmissive);
    }

    private createLaser(x: number, z: number, rotationY: number, matBody: StandardMaterial, matEmissive: StandardMaterial): TransformNode {
        const root = new TransformNode("laserRoot", this.scene);
        root.position.set(x, 0, z);
        root.rotation.y = rotationY;

        const body = MeshBuilder.CreateBox("emB", { width: 1.3, height: 0.65, depth: 0.65 }, this.scene);
        body.position.set(0, 0.325, 0);
        body.material = matBody; // USANDO FÁBRICA
        body.parent = root;

        const noz = MeshBuilder.CreateCylinder("emN", { diameter: 0.34, height: 0.75, tessellation: 12 }, this.scene);
        noz.rotation.z = Math.PI / 2;
        noz.position.set(0.95, 0.325, 0);
        noz.material = matEmissive; // USANDO FÁBRICA
        noz.parent = root;

        const ring = MeshBuilder.CreateTorus("emR", { diameter: 0.46, thickness: 0.09, tessellation: 20 }, this.scene);
        ring.rotation.z = Math.PI / 2;
        ring.position.set(1.34, 0.325, 0);
        ring.material = matEmissive; // USANDO FÁBRICA
        ring.parent = root;

        for (let i = 0; i < 3; i++) {
            const s = MeshBuilder.CreateBox("emS" + i, { width: 0.05, height: 0.67, depth: 0.02 }, this.scene);
            s.position.set(-0.5 + i * 0.35, 0.325, 0.33);
            s.material = matEmissive; // USANDO FÁBRICA
            s.parent = root;
        }

        const lp = MeshBuilder.CreatePlane("emLP", { width: 1.6, height: 0.42 }, this.scene);
        lp.position.set(0, 0.95, 0);
        lp.billboardMode = Mesh.BILLBOARDMODE_ALL;
        lp.parent = root;
        const lDT = AdvancedDynamicTexture.CreateForMesh(lp, 256, 64);
        const lTx = new TextBlock();
        lTx.text = "⬡ LASER"; lTx.color = "#ff3333"; lTx.fontSize = 44; lTx.fontWeight = "900";
        lDT.addControl(lTx);

        return root;
    }

    public getSourcePosition() { return { x: this.root.position.x, z: this.root.position.z }; }
    public getDirection() {
        const ry = this.root.rotation.y;
        return { x: Math.cos(ry), z: -Math.sin(ry) };
    }
}