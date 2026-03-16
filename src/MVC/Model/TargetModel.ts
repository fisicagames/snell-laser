import { Scene, MeshBuilder, StandardMaterial, Color3, TransformNode, Mesh, ParticleSystem, Texture, Vector3, Color4 } from "@babylonjs/core";
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

    // Sistema de Partículas
    private particleSystem!: ParticleSystem;

    public radius: number;
    public x: number;
    public z: number;
    public isHit: boolean = false;
    
    // Variável de tempo para a animação de pulso
    private spinT: number = 0;

    constructor(scene: Scene, id: number, x: number, z: number, radius: number = 0.65) {
        this.scene = scene;
        this.x = x;
        this.z = z;
        this.radius = radius; 

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
        this.outerRing = MeshBuilder.CreateTorus("tOuter" + id, { diameter: 2.2, thickness: 0.12, tessellation: 40 }, this.scene);
        this.outerRing.position.set(0, 0.06, 0);
        this.outerRing.material = this.orMat;
        this.outerRing.parent = this.root;
        this.outerRing.isPickable = false;

        this.midRing = MeshBuilder.CreateTorus("tMid" + id, { diameter: 1.4, thickness: 0.10, tessellation: 32 }, this.scene);
        this.midRing.position.set(0, 0.07, 0);
        this.midRing.material = this.mrMat;
        this.midRing.parent = this.root;
        this.midRing.isPickable = false;

        this.inner = MeshBuilder.CreateCylinder("tInner" + id, { diameter: 0.72, height: 0.22, tessellation: 32 }, this.scene);
        this.inner.position.set(0, 0.11, 0);
        this.inner.material = this.inMat;
        this.inner.parent = this.root;
        this.inner.isPickable = false;

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

        // Inicializa o sistema de partículas e animações visuais
        this.setupParticles();
        this.setupAnimations();
    }

    private setupParticles() {
        this.particleSystem = new ParticleSystem("targetParticles", 400, this.scene);
        
        // DICA: No futuro, é bom baixar esta imagem e colocar em /public/assets/textures/flare.png
        this.particleSystem.particleTexture = new Texture("https://playground.babylonjs.com/textures/flare.png", this.scene);
        
        // Ponto de emissão: exato centro do alvo
        this.particleSystem.emitter = new Vector3(this.x, 0.3, this.z);
        
        this.particleSystem.minEmitBox = new Vector3(-0.3, 0, -0.3);
        this.particleSystem.maxEmitBox = new Vector3( 0.3, 0,  0.3);
        
        this.particleSystem.color1 = new Color4(0.2, 1.0, 0.3, 1);
        this.particleSystem.color2 = new Color4(0.8, 1.0, 0.1, 1);
        this.particleSystem.colorDead = new Color4(0, 0.5, 0, 0);
        
        this.particleSystem.minSize = 0.07;
        this.particleSystem.maxSize = 0.32;
        
        this.particleSystem.minLifeTime = 0.9;
        this.particleSystem.maxLifeTime = 2.2;
        
        this.particleSystem.emitRate = 100;
        
        this.particleSystem.blendMode = ParticleSystem.BLENDMODE_ONEONE;
        
        this.particleSystem.gravity = new Vector3(0, -2.5, 0);
        this.particleSystem.direction1 = new Vector3(-1.5, 5, -1.5);
        this.particleSystem.direction2 = new Vector3( 1.5, 8,  1.5);
        
        this.particleSystem.minAngularSpeed = -0.6;
        this.particleSystem.maxAngularSpeed = 0.6;
        
        this.particleSystem.minEmitPower = 0.6;
        this.particleSystem.maxEmitPower = 2.5;
        
        this.particleSystem.updateSpeed = 0.02;
    }

    private setupAnimations() {
        // Vincula a animação ao Render Loop da cena. 
        // Ele vai rodar sozinho apenas quando o alvo estiver 'isHit'
        this.scene.onBeforeRenderObservable.add(() => {
            if (this.isHit) {
                this.spinT += 0.045;
                // Anéis girando em sentidos contrários
                this.outerRing.rotation.y += 0.04;
                this.midRing.rotation.y -= 0.06;
                // Cilindro do meio "pulsando" (sobe e desce)
                this.inner.position.y = 0.11 + Math.sin(this.spinT) * 0.07;
            } else {
                // Se parar de bater, reseta a posição Y suavemente ou direto
                this.inner.position.y = 0.11;
            }
        });
    }

    // Método chamado pelo Motor de Óptica
    public setHitState(hit: boolean): void {
        // Só dispara as partículas se for uma transição de false -> true
        if (hit && !this.isHit) {
            this.particleSystem.start();
            
            // Acende verde brilhante
            this.orMat.emissiveColor = new Color3(0.15, 1, 0.25);
            this.mrMat.emissiveColor = new Color3(0.2, 1, 0.3);
            this.inMat.emissiveColor = new Color3(0.1, 0.9, 0.2);
        } 
        // Só para as partículas se for uma transição de true -> false
        else if (!hit && this.isHit) {
            this.particleSystem.stop();
            
            // Volta para verde escuro
            this.orMat.emissiveColor = new Color3(0, 0.28, 0.06);
            this.mrMat.emissiveColor = new Color3(0, 0.55, 0.10);
            this.inMat.emissiveColor = new Color3(0, 0.22, 0.04);
        }

        this.isHit = hit;
    }
}