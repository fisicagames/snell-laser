// src/CameraController/CameraController.ts
import { Vector3, FollowCamera, Mesh } from "@babylonjs/core";

export class CameraController {
    // Método estático para atualizar a posição da câmera
    public static updatePosition(followCamera: FollowCamera, followCameraTarget: Mesh): void {
        if (followCamera && followCameraTarget) {
            const offset = new Vector3(-15, 4, 0); 
            const targetPosition = followCameraTarget.position.add(offset);
            targetPosition.y = 3;
            followCamera.position = targetPosition;

            const targetOffset = followCameraTarget.position.subtract(new Vector3(0, -1, 0));
            followCamera.setTarget(targetOffset); 
        }
    }
}
