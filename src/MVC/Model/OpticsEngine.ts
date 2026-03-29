import { Scene } from "@babylonjs/core/scene";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Quaternion } from "@babylonjs/core/Maths/math.vector";

import { Model }       from "./Model";
import { TargetModel } from "./TargetModel";
import { GlassModel }  from "./GlassModel";

interface Vector2D { x: number; z: number; }

export class OpticsEngine {

    private scene:     Scene;
    private gameModel: Model;

    // ── Pools de meshes (Reuso para performance mobile) ──────────────────────
    private beamPoolThick: Mesh[] = [];
    private beamPoolThin:  Mesh[] = [];
    private arrowPool:     Mesh[] = [];
    private photonPool:    Array<{ mesh: Mesh; path: Vector3[]; t: number; speed: number }> = [];

    private activeThick:   Mesh[] = [];
    private activeThin:    Mesh[] = [];
    private activeArrows:  Mesh[] = [];
    private activePhotons: Array<{ mesh: Mesh; path: Vector3[]; t: number; speed: number }> = [];

    // ── Materiais ─────────────────────────────────────────────────────────────
    private matLaser!:       StandardMaterial;
    private matSplit!:       StandardMaterial;
    private matArrow!:       StandardMaterial;
    private matPhotonLaser!: StandardMaterial;
    private matPhotonSplit!: StandardMaterial;
    private matNormal!:      StandardMaterial;

    // ── Constantes ────────────────────────────────────────────────────────────
    private readonly RAY_Y      = 0.325;
    private readonly MAX_BOUNCES = 18;
    private readonly WALL_X     = 8.5;
    private readonly WALL_Z     = 16.5;

    private readonly COLOR_LASER        = new Color3(1.0, 0.06, 0.06);
    private readonly COLOR_SPLIT        = new Color3(1.0, 0.16, 0.16);
    private readonly COLOR_ARROW        = new Color3(1.0, 0.55, 0.15);
    private readonly COLOR_PHOTON       = new Color3(1.0, 0.65, 0.65);
    private readonly COLOR_PHOTON_SPLIT = new Color3(1.0, 0.95, 0.55);
    private readonly COLOR_NORMAL       = new Color3(0.25, 0.25, 0.9);

    // ── Vetores temporários (Zero Alocação de Memória no Loop) ───────────────
    private readonly _tmpDir  = new Vector3();
    private readonly _tmpAxis = new Vector3();
    private readonly _nFrom   = new Vector3();
    private readonly _nTo     = new Vector3();
    private readonly _obbHit  = { tEn: 0, tEx: 0 };

    constructor(scene: Scene, gameModel: Model) {
        this.scene     = scene;
        this.gameModel = gameModel;
        this.createSharedMaterials();
    }

    private createSharedMaterials() {
        const mk = (name: string, color: Color3): StandardMaterial => {
            const m = new StandardMaterial(name, this.scene);
            m.emissiveColor  = color;
            m.disableLighting = true;
            m.freeze();
            return m;
        };
        this.matLaser       = mk("matLaser",       this.COLOR_LASER);
        this.matSplit       = mk("matSplit",        this.COLOR_SPLIT);
        this.matArrow       = mk("matArrow",        this.COLOR_ARROW);
        this.matPhotonLaser = mk("matPhotonLaser",  this.COLOR_PHOTON);
        this.matPhotonSplit = mk("matPhotonSplit",  this.COLOR_PHOTON_SPLIT);
        this.matNormal      = mk("matNormal",       this.COLOR_NORMAL);
    }

    // ── Matemática 2D ─────────────────────────────────────────────────────────
    private v2(x: number, z: number): Vector2D { return { x, z }; }
    private norm2(v: Vector2D): Vector2D {
        const l = Math.hypot(v.x, v.z);
        return { x: v.x / l, z: v.z / l };
    }
    private dot2(a: Vector2D, b: Vector2D): number { return a.x * b.x + a.z * b.z; }
    private reflect2(d: Vector2D, n: Vector2D): Vector2D {
        const k = this.dot2(d, n);
        return this.norm2({ x: d.x - 2 * k * n.x, z: d.z - 2 * k * n.z });
    }
    private refract2(d: Vector2D, n: Vector2D, n1: number, n2: number): { dir: Vector2D; isTIR: boolean } {
        let nx = n.x, nz = n.z;
        let ci = -(d.x * nx + d.z * nz);
        if (ci < 0) { nx = -nx; nz = -nz; ci = -ci; }
        const r = n1 / n2;
        const sin2t = r * r * (1 - ci * ci);
        if (sin2t >= 1) return { dir: this.reflect2(d, { x: nx, z: nz }), isTIR: true };
        const ct = Math.sqrt(1 - sin2t);
        return { dir: this.norm2({ x: r * d.x + (r * ci - ct) * nx, z: r * d.z + (r * ci - ct) * nz }), isTIR: false };
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

    private hitOBB(o: Vector2D, d: Vector2D, center: Vector2D, cosA: number, sinA: number, halfW: number, halfD: number): { tEn: number; tEx: number } | null {
        const lx = o.x - center.x, lz = o.z - center.z;
        const localOx = lx * cosA - lz * sinA;
        const localOz = lx * sinA + lz * cosA;
        const localDx = d.x * cosA - d.z * sinA;
        const localDz = d.x * sinA + d.z * cosA;
        let t1x: number, t2x: number, t1z: number, t2z: number;
        if (Math.abs(localDx) < 1e-12) {
            if (localOx < -halfW - 1e-6 || localOx > halfW + 1e-6) return null;
            t1x = -1e9; t2x = 1e9;
        } else {
            t1x = (-halfW - localOx) / localDx; t2x = (halfW - localOx) / localDx;
            if (t1x > t2x) { const s = t1x; t1x = t2x; t2x = s; }
        }
        if (Math.abs(localDz) < 1e-12) {
            if (localOz < -halfD - 1e-6 || localOz > halfD + 1e-6) return null;
            t1z = -1e9; t2z = 1e9;
        } else {
            t1z = (-halfD - localOz) / localDz; t2z = (halfD - localOz) / localDz;
            if (t1z > t2z) { const s = t1z; t1z = t2z; t2z = s; }
        }
        const tEn = Math.max(t1x, t1z), tEx = Math.min(t2x, t2z);
        if (tEn <= tEx && tEx > 1e-4) {
            this._obbHit.tEn = tEn; this._obbHit.tEx = tEx;
            return this._obbHit;
        }
        return null;
    }

    private obbNormal(pt: Vector2D, center: Vector2D, cosA: number, sinA: number, halfW: number, halfD: number): Vector2D {
        const lx = pt.x - center.x, lz = pt.z - center.z;
        const localX = lx * cosA - lz * sinA;
        const localZ = lx * sinA + lz * cosA;
        const e = 0.04;
        let lnx = 0, lnz = 0;
        if (Math.abs(localX - (-halfW)) < e) lnx = -1;
        else if (Math.abs(localX - halfW) < e) lnx = 1;
        else if (Math.abs(localZ - (-halfD)) < e) lnz = -1;
        else lnz = 1;
        return { x: lnx * cosA + lnz * sinA, z: -lnx * sinA + lnz * cosA };
    }

    // ── Pool Helpers ──────────────────────────────────────────────────────────
    private acquireBeam(thick: boolean): Mesh {
        const pool = thick ? this.beamPoolThick : this.beamPoolThin;
        if (pool.length > 0) {
            const m = pool.pop()!; m.isVisible = true; return m;
        }
        const m = MeshBuilder.CreateCylinder("b", { height: 1, diameter: thick ? 0.072 : 0.024, tessellation: 6 }, this.scene);
        m.isPickable = false; m.doNotSyncBoundingInfo = true;
        m.rotationQuaternion = new Quaternion();
        return m;
    }

    private acquireArrow(): Mesh {
        if (this.arrowPool.length > 0) {
            const m = this.arrowPool.pop()!; m.isVisible = true; return m;
        }
        const m = MeshBuilder.CreateCylinder("a", { height: 0.38, diameterTop: 0, diameterBottom: 0.30, tessellation: 6 }, this.scene);
        m.isPickable = false; m.doNotSyncBoundingInfo = true;
        m.rotationQuaternion = new Quaternion();
        return m;
    }

    private acquirePhoton(path: Vector3[], mat: StandardMaterial) {
        if (this.photonPool.length > 0) {
            const p = this.photonPool.pop()!;
            p.mesh.material = mat; p.mesh.isVisible = true;
            p.path = path; p.t = Math.random();
            return p;
        }
        const mesh = MeshBuilder.CreateSphere("ph", { diameter: 0.28, segments: 3 }, this.scene);
        mesh.material = mat; mesh.isPickable = false; mesh.doNotSyncBoundingInfo = true;
        return { mesh, path, t: Math.random(), speed: 2.0 };
    }

    private clearRays() {
        this.activeThick.forEach(m => { m.isVisible = false; this.beamPoolThick.push(m); });
        this.activeThin.forEach(m => { m.isVisible = false; this.beamPoolThin.push(m); });
        this.activeArrows.forEach(m => { m.isVisible = false; this.arrowPool.push(m); });
        this.activePhotons.forEach(p => { p.mesh.isVisible = false; this.photonPool.push(p); });
        this.activeThick.length = 0; this.activeThin.length = 0;
        this.activeArrows.length = 0; this.activePhotons.length = 0;
    }

    // ── Renderização ──────────────────────────────────────────────────────────
    private orientAlong(mesh: Mesh, from3: Vector3, to3: Vector3) {
        to3.subtractToRef(from3, this._tmpDir);
        this._tmpDir.normalize();
        // CORREÇÃO: Uso do método estático para aceitar vetores ReadOnly
        Vector3.CrossToRef(Vector3.UpReadOnly, this._tmpDir, this._tmpAxis);
        if (this._tmpAxis.length() > 0.001) {
            const angle = Math.acos(Math.max(-1, Math.min(1, Vector3.Dot(Vector3.UpReadOnly, this._tmpDir))));
            this._tmpAxis.normalize();
            Quaternion.RotationAxisToRef(this._tmpAxis, angle, mesh.rotationQuaternion!);
        }
    }

    private drawBeam(from3: Vector3, to3: Vector3, material: StandardMaterial, thick = true) {
        to3.subtractToRef(from3, this._tmpDir);
        const len = this._tmpDir.length();
        if (len < 0.02) return;
        const b = this.acquireBeam(thick);
        b.scaling.y = len;
        b.position.set((from3.x + to3.x) * 0.5, (from3.y + to3.y) * 0.5, (from3.z + to3.z) * 0.5);
        this.orientAlong(b, from3, to3);
        b.material = material;
        (thick ? this.activeThick : this.activeThin).push(b);
    }

    private drawArrowHead(from3: Vector3, to3: Vector3) {
        to3.subtractToRef(from3, this._tmpDir);
        if (this._tmpDir.length() < 0.55) return;
        const cone = this.acquireArrow();
        cone.position.set((from3.x + to3.x) * 0.5, (from3.y + to3.y) * 0.5, (from3.z + to3.z) * 0.5);
        this.orientAlong(cone, from3, to3);
        cone.material = this.matArrow;
        this.activeArrows.push(cone);
    }

    private drawNormal(hitXZ: Vector2D, nXZ: Vector2D) {
        const hx = hitXZ.x, hy = this.RAY_Y, hz = hitXZ.z;
        const invLen = 1 / Math.hypot(nXZ.x, nXZ.z);
        const nx = nXZ.x * invLen, nz = nXZ.z * invLen;
        const dl = 0.30, gap = 0.22, total = 1.9;
        for (const sign of [-1, 1] as const) {
            let t = gap * 0.45;
            while (t < total) {
                this._nFrom.set(hx + nx * sign * t, hy, hz + nz * sign * t);
                this._nTo.set(hx + nx * sign * (t + dl), hy, hz + nz * sign * (t + dl));
                this.drawBeam(this._nFrom, this._nTo, this.matNormal, false);
                t += dl + gap;
            }
        }
    }

    // ── Lógica Core ───────────────────────────────────────────────────────────
    public calculateRays() {
        this.clearRays();
        const hitSet = new Set<TargetModel>();
        let reflCount = 0, refrCount = 0, tirCount = 0;

        this.gameModel.getTargets().forEach(t => t.setHitState(false));

        const traceBeam = (oIn: Vector2D, dIn: Vector2D, depth: number, beamMat: StandardMaterial, photMat: StandardMaterial) => {
            if (depth > 5) return;
            let o = this.v2(oIn.x, oIn.z);
            let d = this.norm2({ x: dIn.x, z: dIn.z });
            const pathXZ: Vector2D[] = [this.v2(o.x, o.z)];
            const normals: (Vector2D | null)[] = [];
            let inGlass = false;
            let inGlassRef: GlassModel | null = null;

            for (let bounce = 0; bounce < this.MAX_BOUNCES; bounce++) {
                let bestT = 1000, bestKind = 'wall', bestData: any = null;
                let bestCosA = 1, bestSinA = 0;

                for (const m of this.gameModel.getMirrors()) {
                    const seg = m.getSegment();
                    const t = this.hitSeg(o, d, seg.p1, seg.p2);
                    if (t !== null && t < bestT) { bestT = t; bestKind = 'mirror'; bestData = { seg }; }
                }
                for (const s of this.gameModel.getSplitters()) {
                    const seg = s.getSegment();
                    const t = this.hitSeg(o, d, seg.p1, seg.p2);
                    if (t !== null && t < bestT) { bestT = t; bestKind = 'splitter'; bestData = { seg }; }
                }
                for (const g of this.gameModel.getGlasses()) {
                    const obb = g.getOBB();
                    const cosA = Math.cos(obb.angle), sinA = Math.sin(obb.angle);
                    const gh = this.hitOBB(o, d, obb.center, cosA, sinA, obb.halfW, obb.halfD);
                    if (gh) {
                        if (!inGlass && gh.tEn > 1e-4 && gh.tEn < bestT) { bestT = gh.tEn; bestKind = 'gIn'; bestData = g; bestCosA = cosA; bestSinA = sinA; }
                        if (inGlass && inGlassRef === g && gh.tEx > 1e-4 && gh.tEx < bestT) { bestT = gh.tEx; bestKind = 'gOut'; bestData = g; bestCosA = cosA; bestSinA = sinA; }
                    }
                }
                for (const blk of this.gameModel.getBlocks()) {
                    const obb = blk.getOBB();
                    const cosA = Math.cos(obb.angle), sinA = Math.sin(obb.angle);
                    const hit = this.hitOBB(o, d, obb.center, cosA, sinA, obb.halfW, obb.halfD);
                    if (hit && hit.tEn > 1e-4 && hit.tEn < bestT) { bestT = hit.tEn; bestKind = 'block'; }
                }
                for (const tg of this.gameModel.getTargets()) {
                    const dtx = tg.x - o.x, dtz = tg.z - o.z;
                    const tp = this.dot2({ x: dtx, z: dtz }, d);
                    if (tp > 1e-4 && tp < bestT) {
                        const px = o.x + tp * d.x - tg.x, pz = o.z + tp * d.z - tg.z;
                        if (px * px + pz * pz < tg.radius * tg.radius) { bestT = tp; bestKind = 'target'; bestData = tg; }
                    }
                }
                if (bestKind === 'wall') {
                    let tw = 1000;
                    if (Math.abs(d.x) > 1e-6) tw = Math.min(tw, ((d.x > 0 ? this.WALL_X : -this.WALL_X) - o.x) / d.x);
                    if (Math.abs(d.z) > 1e-6) tw = Math.min(tw, ((d.z > 0 ? this.WALL_Z : -this.WALL_Z) - o.z) / d.z);
                    if (tw > 0 && tw < bestT) bestT = tw;
                }

                const ep = this.v2(o.x + bestT * d.x, o.z + bestT * d.z);
                pathXZ.push(ep);

                if (bestKind === 'target') { hitSet.add(bestData); break; }
                if (bestKind === 'wall' || bestKind === 'block') break;

                if (bestKind === 'mirror') {
                    reflCount++;
                    let n = bestData.seg.n; if (this.dot2(d, n) > 0) n = { x: -n.x, z: -n.z };
                    normals.push(n); d = this.reflect2(d, n); o = ep;
                } else if (bestKind === 'splitter') {
                    reflCount++;
                    let n = bestData.seg.n; if (this.dot2(d, n) > 0) n = { x: -n.x, z: -n.z };
                    normals.push(n); traceBeam({ x: ep.x, z: ep.z }, this.reflect2(d, n), depth + 1, this.matSplit, this.matPhotonSplit); o = ep;
                } else if (bestKind === 'gIn') {
                    refrCount++;
                    const obb = bestData.getOBB();
                    const bn = this.obbNormal(ep, obb.center, bestCosA, bestSinA, obb.halfW, obb.halfD);
                    normals.push(bn); const res = this.refract2(d, bn, 1.0, obb.n);
                    d = res.dir; o = ep; inGlass = true; inGlassRef = bestData;
                } else if (bestKind === 'gOut') {
                    const obb = bestData.getOBB();
                    const bn = this.obbNormal(ep, obb.center, bestCosA, bestSinA, obb.halfW, obb.halfD);
                    normals.push(bn); const res = this.refract2(d, bn, obb.n, 1.0);
                    d = res.dir; o = ep;
                    if (res.isTIR) tirCount++; else { refrCount++; inGlass = false; inGlassRef = null; }
                }
            }

            const path3 = pathXZ.map(p => new Vector3(p.x, this.RAY_Y, p.z));
            for (let i = 0; i < path3.length - 1; i++) {
                this.drawBeam(path3[i], path3[i + 1], beamMat);
                this.drawArrowHead(path3[i], path3[i + 1]);
            }
            normals.forEach((n, i) => { if (n) this.drawNormal(pathXZ[i + 1], n); });
            if (path3.length >= 2) {
                const p = this.acquirePhoton(path3, photMat);
                this.activePhotons.push(p);
            }
        };

        const laser = this.gameModel.getLaser();
        traceBeam(laser.getSourcePosition(), laser.getDirection(), 0, this.matLaser, this.matPhotonLaser);

        hitSet.forEach(t => t.setHitState(true));
        this.gameModel.updateGameState(hitSet.size === this.gameModel.getTargets().length && this.gameModel.getTargets().length > 0, reflCount, refrCount, tirCount);
    }

    public updatePhotons(dt: number) {
        for (const p of this.activePhotons) {
            p.t += p.speed * dt; if (p.t >= 1) p.t -= 1;
            const segs = p.path.length - 1; if (segs < 1) continue;
            const gt = p.t * segs; const idx = Math.min(Math.floor(gt), segs - 1);
            Vector3.LerpToRef(p.path[idx], p.path[idx + 1], gt - idx, p.mesh.position);
        }
    }
}