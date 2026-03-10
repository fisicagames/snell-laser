import { Scene, MeshBuilder, StandardMaterial, Color3, TransformNode, Mesh } from "@babylonjs/core";
import { AdvancedDynamicTexture, TextBlock } from "@babylonjs/gui";

export class TargetModel {
    private scene: Scene;
    public root: TransformNode;
    
    // Guardamos referências para animar depois
    public outerRing: Mesh;
    public midRing: Mesh;
    public inner: Mesh;
    
    // Guardamos os materiais para trocar a cor quando o laser bater
    private orMat: StandardMaterial;
    private mrMat: StandardMaterial;
    private inMat: StandardMaterial;

    public radius: number;
    public x: number;
    public z: number;
    public isHit: boolean = false;

    constructor(scene: Scene, id: number, x: number, z: number, radius: number = 0.65) {
        this.scene = scene;
        this.x = x;
        this.z = z;
        this.radius = radius; // Raio de colisão para o Raycast saber se acertou

        this.root = new TransformNode("targetRoot_" + id, this.scene);
        this.root.position.set(x, 0, z);

        // --- MATERIAIS INICIAIS (IDLE - Escuro) ---
        this.orMat = new StandardMaterial("orM" + id, this.scene);
        this.orMat.emissiveColor = new Color3(0, 0.28, 0.06);

        this.mrMat = new StandardMaterial("mrM" + id, this.scene);
        this.mrMat.emissiveColor = new Color3(0, 0.55, 0.10);

        this.inMat = new StandardMaterial("inM" + id, this.scene);
        this.inMat.diffuseColor = new Color3(0.05, 0.45, 0.10);
        this.inMat.emissiveColor = new Color3(0, 0.22, 0.04);

        // --- MALHAS (MESHES) ---
        // Anel Externo
        this.outerRing = MeshBuilder.CreateTorus("tOuter" + id, { diameter: 2.2, thickness: 0.12, tessellation: 40 }, this.scene);
        this.outerRing.position.set(0, 0.06, 0);
        this.outerRing.material = this.orMat;
        this.outerRing.parent = this.root;
        this.outerRing.isPickable = false;

        // Anel do Meio
        this.midRing = MeshBuilder.CreateTorus("tMid" + id, { diameter: 1.4, thickness: 0.10, tessellation: 32 }, this.scene);
        this.midRing.position.set(0, 0.07, 0);
        this.midRing.material = this.mrMat;
        this.midRing.parent = this.root;
        this.midRing.isPickable = false;

        // Cilindro Interno
        this.inner = MeshBuilder.CreateCylinder("tInner" + id, { diameter: 0.72, height: 0.22, tessellation: 32 }, this.scene);
        this.inner.position.set(0, 0.11, 0);
        this.inner.material = this.inMat;
        this.inner.parent = this.root;
        this.inner.isPickable = false;

        // Linhas de Mira (Cross-hair)
        const cMat = new StandardMaterial("cHM" + id, this.scene);
        cMat.emissiveColor = new Color3(0.05, 0.85, 0.15);

        for (const angle of[0, Math.PI / 2]) {
            const ch = MeshBuilder.CreateBox("tCH" + id + "_" + angle, { width: 2.4, height: 0.04, depth: 0.07 }, this.scene);
            ch.position.set(0, 0.24, 0);
            ch.rotation.y = angle;
            ch.material = cMat;
            ch.parent = this.root;
            ch.isPickable = false;
        }

        // --- RÓTULO FLUTUANTE ---
        const lp = MeshBuilder.CreatePlane("tLP" + id, { width: 1.9, height: 0.48 }, this.scene);
        lp.position.set(0, 1.15, 0);
        lp.billboardMode = Mesh.BILLBOARDMODE_ALL;
        lp.parent = this.root;
        lp.isPickable = false;

        const lDT = AdvancedDynamicTexture.CreateForMesh(lp, 256, 64);
        const lTx = new TextBlock();
        lTx.text = "◎ TARGET";
        lTx.color = "#00ff55";
        lTx.fontSize = 42;
        lTx.fontWeight = "bold";
        lDT.addControl(lTx);
    }

    // Método para ser chamado pelo Raycast quando o laser atingir o alvo
    public setHitState(hit: boolean): void {
        this.isHit = hit;
        if (hit) {
            // Acende verde brilhante
            this.orMat.emissiveColor = new Color3(0.15, 1, 0.25);
            this.mrMat.emissiveColor = new Color3(0.2, 1, 0.3);
            this.inMat.emissiveColor = new Color3(0.1, 0.9, 0.2);
        } else {
            // Volta para verde escuro
            this.orMat.emissiveColor = new Color3(0, 0.28, 0.06);
            this.mrMat.emissiveColor = new Color3(0, 0.55, 0.10);
            this.inMat.emissiveColor = new Color3(0, 0.22, 0.04);
        }
    }
}