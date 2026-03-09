import { Engine, GPUParticleSystem } from "@babylonjs/core";

export class EngineInitializer {
    public static createEngine(canvas: HTMLCanvasElement): Engine {
        let engine = new Engine(canvas, true, { disableWebGL2Support: false, audioEngine: true  });
        console.log("GPU is supported after new Engine: ", GPUParticleSystem.IsSupported);
        
        if (!GPUParticleSystem.IsSupported) {
            engine = new Engine(canvas, true, { disableWebGL2Support: true });
        }

        engine.setHardwareScalingLevel(canvas.width / 333);
        engine.disableVertexArrayObjects = true;
        engine.disableUniformBuffers = true;
        engine.displayLoadingUI();

        window.addEventListener('resize', () => {
            engine.resize();
        });

        return engine;
    }
}