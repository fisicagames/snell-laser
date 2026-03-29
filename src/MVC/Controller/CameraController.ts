import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { UniversalCamera } from "@babylonjs/core/Cameras/universalCamera";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";

import { TargetModel } from "../Model/TargetModel";

export class CameraController {
    private static currentLookAt: Vector3 | null = null;

    public static updatePosition(camera: UniversalCamera, activeElement: TransformNode, allTargets: TargetModel[]): void {
        if (!camera || !activeElement) return;

        // 1. CÁLCULO DA MÉDIA DOS ALVOS
        let avgTargetZ = 12;
        if (allTargets.length > 0) {
            const sumZ = allTargets.reduce((acc, t) => acc + t.z, 0);
            avgTargetZ = sumZ / allTargets.length;
        }

        const activeZ = activeElement.position.z;

        // 2. POSIÇÃO DA CÂMERA (Os "olhos")
        // yHeight = 32 (Um pouco mais baixa para achatar o ângulo e ver mais longe no horizonte)
        // zOffset = -22 (Distância fixa atrás da peça selecionada)
        const yHeight = 32;
        const zOffset = -22; 
        
        let targetZPos = activeZ + zOffset;

        // TRAVA DE SEGURANÇA: Não permite que a câmera vá além de Z = -30
        // Isso garante que o laser (que costuma estar em Z = -12) sempre apareça.
        if (targetZPos > -30) targetZPos = -30;

        const targetPos = new Vector3(0, yHeight, targetZPos);
        camera.position = Vector3.Lerp(camera.position, targetPos, 0.05);

        // 3. MIRA DA CÂMERA (Look-At)
        // Calculamos o meio do caminho entre a peça ativa e os alvos.
        const centerZ = (activeZ + avgTargetZ) / 2;
        
        // AJUSTE: Em vez de somar +4 (olhar para frente), vamos subtrair -2 (olhar mais para trás).
        // Isso inclina a câmera para baixo, trazendo o laser de volta para dentro da tela.
        const lookAtDest = new Vector3(0, 0, centerZ - 2);

        if (!this.currentLookAt) {
            this.currentLookAt = camera.getTarget().clone();
        }

        this.currentLookAt = Vector3.Lerp(this.currentLookAt, lookAtDest, 0.05);
        camera.setTarget(this.currentLookAt);
    }
}