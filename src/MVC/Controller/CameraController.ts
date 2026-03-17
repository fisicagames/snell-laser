import { Vector3, UniversalCamera, TransformNode } from "@babylonjs/core";

export class CameraController {
    private static currentLookAt: Vector3 | null = null;

    public static updatePosition(camera: UniversalCamera, activeElement: TransformNode, sceneTarget: TransformNode | null): void {
        if (!camera || !activeElement) return;

        // ══════════════════════════════════════════════════════════════
        //  1. AJUSTES DA POSIÇÃO DA CÂMERA
        // ══════════════════════════════════════════════════════════════
        // yHeight: Quão alta a câmera fica. (Mais alto = enxerga mais tabuleiro)
        // zOffset: Quão para trás a câmera fica da peça ativa. (Mais negativo = mais longe)
        const yHeight = 22;  
        const zOffset = -32; 

        const targetPos = new Vector3(0, yHeight, activeElement.position.z + zOffset);
        camera.position = Vector3.Lerp(camera.position, targetPos, 0.05);

        // ══════════════════════════════════════════════════════════════
        //  2. AJUSTES DA MIRA (LOOK-AT)
        // ══════════════════════════════════════════════════════════════
        let lookAtDest: Vector3;

        if (sceneTarget) {
            // lookAtOffsetZ: Quantas unidades "puxar" o olhar para trás do alvo final.
            // Se o alvo está em Z=12 e o offset for 10, a câmera olhará para Z=2.
            // Isso garante que o alvo (Z=12) fique colado no TOPO da tela do celular!
            const lookAtOffsetZ = 10; 
            lookAtDest = new Vector3(0, 0, sceneTarget.position.z - lookAtOffsetZ);
        } else {
            // Fallback caso não haja alvo: apenas olha um pouco à frente da peça ativa
            lookAtDest = new Vector3(0, 0, activeElement.position.z + 8);
        }

        // Interpolação suave da Mira
        if (!this.currentLookAt) {
            this.currentLookAt = camera.getTarget().clone();
        }

        this.currentLookAt = Vector3.Lerp(this.currentLookAt, lookAtDest, 0.05);
        camera.setTarget(this.currentLookAt);
    }
}