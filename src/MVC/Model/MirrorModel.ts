import { Scene, MeshBuilder, StandardMaterial, Color3, Mesh } from "@babylonjs/core";

export class MirrorModel {
    private scene: Scene;
    public mesh: Mesh;
    public length: number;

    constructor(scene: Scene, id: number, x: number, z: number, rotationY: number, length: number = 3.0) {
        this.scene = scene;
        this.length = length;
        this.mesh = this.createMirror(id, x, z, rotationY);
    }

    private createMirror(id: number, x: number, z: number, rotationY: number): Mesh {
        const mesh = MeshBuilder.CreateBox("mir" + id, { width: 0.1, height: 0.52, depth: this.length }, this.scene);
        mesh.position.set(x, 0.26, z);
        mesh.rotation.y = rotationY;
        
        const mat = new StandardMaterial("mm" + id, this.scene);
        mat.diffuseColor = new Color3(0.78, 0.92, 1);
        mat.emissiveColor = new Color3(0.15, 0.25, 0.45); // Cor base
        mat.specularColor = Color3.White();
        mat.specularPower = 512;
        mesh.material = mat;

        return mesh;
    }

    public setHighlight(isHighlighted: boolean): void {
        const mat = this.mesh.material as StandardMaterial;
        if (mat) {
            mat.emissiveColor = isHighlighted ? new Color3(1, 0.75, 0.05) : new Color3(0.15, 0.25, 0.45);
        }
    }
}