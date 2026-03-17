import { AdvancedDynamicTexture, TextBlock, Button } from "@babylonjs/gui";

export class LanguageSwitcher {
    public languageOption: number;
    private strings: Record<string, string[]>;

    constructor() {
        this.languageOption = 0;
        this.strings = {
            ButtonLang: ["ENGLISH", "PORTUGUÊS"],
            TextblockMeta: ["Objetivo: rotacione os espelhos para direcionar o laser até acertar o alvo! Ganhe pontos fazendo o maior número de reflexões (x100) e refrações (x200).", "Objective: rotate the mirrors to direct the laser until you hit the target! Earn points by making the highest number of reflections (x100) and refractions (x200)."],
            TextblockTitle: ["Snell Laser", "Snell Laser"], 
            ButtonMenuStartA: ["Iniciar", "Start"],
            ButtonMenuStartB: ["Movimento Linear", "Linear Motion"],
            ButtonMenuStartC: ["None", "None"],
            TextblockMenuScore: ["Maior pontuação:", "High Score:"],
            TextBlockFirst: ["Lei de Snell-Descartes", "Snell-Descartes Law"],
            TextblockSecond: ["n₁ sen(θ₁) = n₂ sen(θ₂)", "n₁ sin(θ₁) = n₂ sin(θ₂)"],
            TextBlockThird: ["n₁ e n₂: índices de refração do meio 1 e meio 2.", "n₁ and n₂: refractive indices of medium 1 and 2."],
            TextBlockQuarter: ["θ₁:  ângulo de incidência e θ₂: ângulo de refração.", "θ₁:  angle of incidence and θ₂: angle of refraction."],
            TextBlockFiver: ["dV: Infinitesimal de volume (m³).", "dV: Infinitesimal volume (m³)."],            
            ButtonMenuContinuar: ["Reiniciar","Restart"],
            TextblockScoreGame: ["Tensão:  0 Volts","Voltage: 0 Volts"],
            TextblockMusic: ["Música:","Music:"],
            TextblockAviso:  ["Total: 0 pontos","Total: 0 points"],
            ButtonEfeitoSuave: ["Efeito Suave","Soft Effect"],
            ButtonEfeitoIntenso: ["Efeito Intenso","Intense Effect"],
            TextblockGraph: ["Diagrama PxV", "PxV Diagram"],
            ButtonMenuPlay: ["Jogar", "Play"]
        };
    }

    public changeLanguage(advancedTexture: AdvancedDynamicTexture): void {
        this.languageOption = this.languageOption === 0 ? 1 : 0;
        this.updateText(advancedTexture);
    }

    public updateText(advancedTexture: AdvancedDynamicTexture): void {
        for (const key in this.strings) {
            if (this.strings.hasOwnProperty(key)) {
                const translations = this.strings[key];
                const control = advancedTexture.getControlByName(key);

                if (control instanceof TextBlock) {
                    control.text = translations[this.languageOption];
                } else if (control instanceof Button && control.textBlock) {
                    control.textBlock.text = translations[this.languageOption];
                }
            }
        }
    }

    public getCurrentLanguage(): number {
        return this.languageOption;
    }

    public getTranslation(key: string): string {
        return this.strings[key][this.languageOption];
    }
}
