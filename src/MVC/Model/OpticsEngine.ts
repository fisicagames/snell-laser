import { Scene, MeshBuilder, StandardMaterial, Color3, Vector3, Mesh, Quaternion } from "@babylonjs/core";
import { Model } from "./Model";
import { TargetModel } from "./TargetModel";
import { GlassModel } from "./GlassModel";

interface Vector2D { x: number; z: number; }

export class OpticsEngine {
    private scene: Scene;
    private gameModel: Model;

    // Listas para gerenciar e descartar as malhas a cada recálculo
    private rayMeshes: Mesh[] =[];
    private photons: { mesh: Mesh, path: Vector3[], t: number, speed: number }[] =[];

    // Constantes Visuais e Físicas
    private readonly RAY_Y = 0.325;
    private readonly MAX_BOUNCES = 18;
    // Limites da parede para o cenário mobile (16x32 -> metade é 8x16)
    private readonly WALL_X = 8.5;
    private readonly WALL_Z = 16.5;

    // Cores
    private readonly BEAM_LASER = new Color3(1.0, 0.06, 0.06);
    private readonly BEAM_SPLIT = new Color3(1.0, 0.16, 0.16);
    private readonly ARROW_COL = new Color3(1.0, 0.55, 0.15);
    private readonly PHOT_COL = new Color3(1.0, 0.65, 0.65);
    private readonly PHOT_SPLIT = new Color3(1.0, 0.95, 0.55);

    constructor(scene: Scene, gameModel: Model) {
        this.scene = scene;
        this.gameModel = gameModel;
    }



    // --- Matemática 2D ---
    private v2(x: number, z: number): Vector2D { return { x, z }; }
    private norm2(v: Vector2D): Vector2D { const l = Math.hypot(v.x, v.z); return this.v2(v.x / l, v.z / l); }
    private dot2(a: Vector2D, b: Vector2D): number { return a.x * b.x + a.z * b.z; }
    
    private reflect2(d: Vector2D, n: Vector2D): Vector2D {
        const k = this.dot2(d, n);
        return this.norm2(this.v2(d.x - 2 * k * n.x, d.z - 2 * k * n.z));
    }

    private refract2(d: Vector2D, n: Vector2D, n1: number, n2: number): Vector2D {
        let nx = n.x, nz = n.z;
        let ci = -(d.x * nx + d.z * nz);
        if (ci < 0) { nx = -nx; nz = -nz; ci = -ci; }
        const r = n1 / n2, sin2t = r * r * (1 - ci * ci);
        if (sin2t >= 1) return this.reflect2(d, this.v2(nx, nz)); // Reflexão Interna Total
        const ct = Math.sqrt(1 - sin2t);
        return this.norm2(this.v2(r * d.x + (r * ci - ct) * nx, r * d.z + (r * ci - ct) * nz));
    }

    private hitSeg(o: Vector2D, d: Vector2D, p1: Vector2D, p2: Vector2D): number | null {
        const ex = p2.x - p1.x, ez = p2.z - p1.z;
        const den = d.x * ez - d.z * ex;
        if (Math.abs(den) < 1e-9) return null;
        const fx = p1.x - o.x, fz = p1.z - o.z;
        const t = (fx * ez - fz * ex) / den;
        const u = (fx * d.z - fz * d.x) / den;
        return (t > 1e-4 && u >= -1e-6 && u <= 1 + 1e-6) ? t : null;
    }

    private hitOBB(o: Vector2D, d: Vector2D, center: Vector2D, angle: number, halfW: number, halfD: number): { tEn: number, tEx: number } | null {
        // Move o raio para o espaço local do bloco (centro = 0,0)
        const lx = o.x - center.x;
        const lz = o.z - center.z;

        // Desfaz a rotação do bloco no raio (Rotaciona na direção oposta)
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        const localOx = lx * cosA - lz * sinA;
        const localOz = lx * sinA + lz * cosA;
        const localDx = d.x * cosA - d.z * sinA;
        const localDz = d.x * sinA + d.z * cosA;

        let t1x, t2x, t1z, t2z;
        
        if (Math.abs(localDx) < 1e-12) {
            if (localOx < -halfW - 1e-6 || localOx > halfW + 1e-6) return null;
            t1x = -1e9; t2x = 1e9;
        } else {
            t1x = (-halfW - localOx) / localDx;
            t2x = (halfW - localOx) / localDx;
            if (t1x > t2x) { const s = t1x; t1x = t2x; t2x = s; }
        }

        if (Math.abs(localDz) < 1e-12) {
            if (localOz < -halfD - 1e-6 || localOz > halfD + 1e-6) return null;
            t1z = -1e9; t2z = 1e9;
        } else {
            t1z = (-halfD - localOz) / localDz;
            t2z = (halfD - localOz) / localDz;
            if (t1z > t2z) { const s = t1z; t1z = t2z; t2z = s; }
        }

        const tEn = Math.max(t1x, t1z);
        const tEx = Math.min(t2x, t2z);

        if (tEn <= tEx && tEx > 1e-4) return { tEn, tEx };
        return null;
    }

    private obbNormal(pt: Vector2D, center: Vector2D, angle: number, halfW: number, halfD: number): Vector2D {
        const lx = pt.x - center.x;
        const lz = pt.z - center.z;

        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);

        // Converte o ponto de impacto pro espaço local
        const localX = lx * cosA - lz * sinA;
        const localZ = lx * sinA + lz * cosA;

        const e = 0.04;
        let localNx = 0, localNz = 0;
        
        if (Math.abs(localX - (-halfW)) < e) localNx = -1;
        else if (Math.abs(localX - halfW) < e) localNx = 1;
        else if (Math.abs(localZ - (-halfD)) < e) localNz = -1;
        else if (Math.abs(localZ - halfD) < e) localNz = 1;
        else localNz = 1; // fallback

        // Rotaciona a normal de volta para o mundo real
        return this.v2(
            localNx * cosA + localNz * sinA,
            -localNx * sinA + localNz * cosA
        );
    }

    // --- Renderização Visual ---
    private clearRays() {
        this.rayMeshes.forEach(m => m.dispose()); this.rayMeshes =[];
        this.photons.forEach(p => p.mesh.dispose()); this.photons =[];
    }

    private orientAlong(mesh: Mesh, from3: Vector3, to3: Vector3) {
        const dir = to3.subtract(from3).normalize();
        const axis = Vector3.Cross(new Vector3(0, 1, 0), dir);
        if (axis.length() > 0.001) {
            const angle = Math.acos(Math.max(-1, Math.min(1, Vector3.Dot(new Vector3(0, 1, 0), dir))));
            mesh.rotationQuaternion = Quaternion.RotationAxis(axis.normalize(), angle);
        }
    }

    private drawBeam(from3: Vector3, to3: Vector3, color: Color3, thick = 0.072) {
        const len = to3.subtract(from3).length(); if (len < 0.02) return;
        const b = MeshBuilder.CreateCylinder("b_" + Math.random(), { height: len, diameter: thick, tessellation: 7 }, this.scene);
        b.position = from3.add(to3).scale(0.5); 
        this.orientAlong(b, from3, to3);
        const mat = new StandardMaterial("bm_" + Math.random(), this.scene);
        mat.emissiveColor = color; mat.disableLighting = true;
        b.material = mat; b.isPickable = false; 
        this.rayMeshes.push(b);
    }

    private drawArrowHead(from3: Vector3, to3: Vector3, color: Color3) {
        if (to3.subtract(from3).length() < 0.55) return;
        const mid = from3.add(to3).scale(0.5);
        const cone = MeshBuilder.CreateCylinder("ar_" + Math.random(), { height: 0.38, diameterTop: 0, diameterBottom: 0.30, tessellation: 8 }, this.scene);
        cone.position = mid.clone(); 
        this.orientAlong(cone, from3, to3);
        const mat = new StandardMaterial("am_" + Math.random(), this.scene);
        mat.emissiveColor = color; mat.disableLighting = true;
        cone.material = mat; cone.isPickable = false; 
        this.rayMeshes.push(cone);
    }

    // NOVO: Desenha a linha normal tracejada na colisão
    private drawNormal(hitXZ: Vector2D, nXZ: Vector2D) {
        const hp = new Vector3(hitXZ.x, this.RAY_Y, hitXZ.z);
        const nv = new Vector3(nXZ.x, 0, nXZ.z).normalize();
        const col = new Color3(0.25, 0.25, 0.9);
        const dl = 0.30, gap = 0.22, total = 1.9;
        
        for (const sign of [-1, 1]) {
            let t = gap * 0.45;
            while (t < total) {
                this.drawBeam(hp.add(nv.scale(sign * t)), hp.add(nv.scale(sign * (t + dl))), col, 0.024);
                t += dl + gap;
            }
        }
    }

    private spawnPhoton(path3: Vector3[], color: Color3) {
        const mesh = MeshBuilder.CreateSphere("ph_" + Math.random(), { diameter: 0.28, segments: 5 }, this.scene);
        const mat = new StandardMaterial("pm_" + Math.random(), this.scene);
        mat.emissiveColor = color; mat.disableLighting = true;
        mesh.material = mat; mesh.isPickable = false;
        this.photons.push({ mesh, path: path3, t: Math.random(), speed: 2.0 });
    }

    // --- Motor Core ---
    public calculateRays() {
        this.clearRays();
        const hitSet = new Set<TargetModel>();

        // NOVOS CONTADORES
        let reflectionsCount = 0;
        let refractionsCount = 0;

        // Desliga todos os alvos primeiro
        this.gameModel.getTargets().forEach(t => t.setHitState(false));

        const traceBeam = (oIn: Vector2D, dIn: Vector2D, n1: number, depth: number, color: Color3, photColor: Color3) => {
            if (depth > 6) return; 
            
            let o = this.v2(oIn.x, oIn.z);
            let d = this.norm2({ x: dIn.x, z: dIn.z });
            
            const pathXZ =[this.v2(o.x, o.z)];
            const normals: (Vector2D | null)[] =[];
            
            let inGlass = false;
            let inGlassRef: GlassModel | null = null;

            for (let b = 0; b < this.MAX_BOUNCES; b++) {
                let bestT = 1000, bestKind = 'wall', bestData: any = null;

                // Teste de Colisão: Espelhos
                for (const m of this.gameModel.getMirrors()) {
                    const seg = m.getSegment();
                    const t = this.hitSeg(o, d, seg.p1, seg.p2);
                    if (t !== null && t < bestT) { bestT = t; bestKind = 'mirror'; bestData = { seg }; }
                }

                // Teste de Colisão: Divisores
                for (const s of this.gameModel.getSplitters()) {
                    const seg = s.getSegment();
                    const t = this.hitSeg(o, d, seg.p1, seg.p2);
                    if (t !== null && t < bestT) { bestT = t; bestKind = 'splitter'; bestData = { seg }; }
                }

                // Teste de Colisão: Vidro (OBB)
                for (const g of this.gameModel.getGlasses()) {
                    const obb = g.getOBB();
                    const gh = this.hitOBB(o, d, obb.center, obb.angle, obb.halfW, obb.halfD);
                    if (gh) {
                        if (!inGlass && gh.tEn > 1e-4 && gh.tEn < bestT) { bestT = gh.tEn; bestKind = 'gIn'; bestData = g; }
                        if (inGlass && inGlassRef === g && gh.tEx > 1e-4 && gh.tEx < bestT) { bestT = gh.tEx; bestKind = 'gOut'; bestData = g; }
                    }
                }

                // Teste de Colisão: Alvos
                for (const tg of this.gameModel.getTargets()) {
                    const dtx = tg.x - o.x, dtz = tg.z - o.z;
                    const tp = this.dot2(this.v2(dtx, dtz), d);
                    if (tp > 1e-4 && tp < bestT) {
                        const px = o.x + tp * d.x - tg.x, pz = o.z + tp * d.z - tg.z;
                        if (px * px + pz * pz < tg.radius * tg.radius) { bestT = tp; bestKind = 'target'; bestData = tg; }
                    }
                }

                // Teste de Colisão: Paredes
                if (bestKind === 'wall') {
                    let tw = 1000;
                    if (Math.abs(d.x) > 1e-6) tw = Math.min(tw, ((d.x > 0 ? this.WALL_X : -this.WALL_X) - o.x) / d.x);
                    if (Math.abs(d.z) > 1e-6) tw = Math.min(tw, ((d.z > 0 ? this.WALL_Z : -this.WALL_Z) - o.z) / d.z);
                    if (tw > 0 && tw < bestT) bestT = tw;
                }

                const ep = this.v2(o.x + bestT * d.x, o.z + bestT * d.z);
                pathXZ.push(ep);

                if (bestKind === 'target') { hitSet.add(bestData); normals.push(null); break; }
                if (bestKind === 'wall') { normals.push(null); break; }

                if (bestKind === 'mirror') {
                    reflectionsCount++; // Conta reflexão
                    let n = bestData.seg.n;
                    if (this.dot2(d, n) > 0) n = this.v2(-n.x, -n.z);
                    normals.push(n); 
                    d = this.reflect2(d, n); o = ep;
                } else if (bestKind === 'splitter') {
                    reflectionsCount++; // Conta reflexão do splitter
                    let n = bestData.seg.n;
                    if (this.dot2(d, n) > 0) n = this.v2(-n.x, -n.z);
                    normals.push(n); 
                    const reflD = this.reflect2(d, n);
                    traceBeam(this.v2(ep.x, ep.z), reflD, n1, depth + 1, this.BEAM_SPLIT, this.PHOT_SPLIT);
                    o = ep; 
                } else if (bestKind === 'gIn') {
                    refractionsCount++; 
                    const obb = bestData.getOBB();
                    const bn = this.obbNormal(ep, obb.center, obb.angle, obb.halfW, obb.halfD);
                    normals.push(bn); 
                    d = this.refract2(d, bn, 1.0, obb.n);
                    o = ep; inGlass = true; inGlassRef = bestData;
                } else { // gOut
                    refractionsCount++; 
                    const obb = bestData.getOBB();
                    const bn = this.obbNormal(ep, obb.center, obb.angle, obb.halfW, obb.halfD);
                    normals.push(bn); 
                    d = this.refract2(d, bn, obb.n, 1.0);
                    o = ep; inGlass = false; inGlassRef = null;
                }
            }

            const path3 = pathXZ.map(p => new Vector3(p.x, this.RAY_Y, p.z));
            for (let i = 0; i < path3.length - 1; i++) {
                this.drawBeam(path3[i], path3[i + 1], color, 0.072);
                this.drawArrowHead(path3[i], path3[i + 1], this.ARROW_COL);
            }

            for (let i = 0; i < normals.length; i++) {
                if (normals[i]) this.drawNormal(pathXZ[i + 1], normals[i]!);
            }

            if (path3.length >= 2) this.spawnPhoton(path3, photColor);
        };

        const laser = this.gameModel.getLaser();
        traceBeam(laser.getSourcePosition(), laser.getDirection(), 1.0, 0, this.BEAM_LASER, this.PHOT_COL);

        hitSet.forEach(target => target.setHitState(true));

        // VERIFICA VITÓRIA: O número de alvos atingidos é igual ao número total de alvos da fase?
        const totalTargets = this.gameModel.getTargets().length;
        const isWin = (hitSet.size === totalTargets) && (totalTargets > 0);

        // ENVIAR STATUS PARA O MODEL
        this.gameModel.updateGameState(isWin, reflectionsCount, refractionsCount);
    }

    // Chamado a cada frame para animar os pontinhos de luz (fótons)
    public updatePhotons(dt: number) {
        for (const p of this.photons) {
            p.t += p.speed * dt;
            if (p.t >= 1) p.t -= 1;
            const segs = p.path.length - 1; 
            if (segs < 1) continue;
            
            const gt = p.t * segs;
            const idx = Math.min(Math.floor(gt), segs - 1);
            p.mesh.position = Vector3.Lerp(p.path[idx], p.path[idx + 1], gt - idx);
        }
    }
}