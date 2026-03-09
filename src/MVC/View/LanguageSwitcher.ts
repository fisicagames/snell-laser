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
            TextblockSecond: ["W: Trabalho realizado pelo gás (J).", "W: Work done by the gas (J)."],
            TextBlockThird: ["∫: Símbolo de integração.", "∫: Integration symbol."],
            TextBlockQuarter: ["P: Pressão do gás (Pa).", "P: Gas pressure (Pa)."],
            TextBlockFiver: ["dV: Infinitesimal de volume (m³).", "dV: Infinitesimal volume (m³)."],            
            ButtonMenuContinuar: ["Reiniciar","Restart"],
            TextblockScoreGame: ["Tensão:  0 Volts","Voltage: 0 Volts"],
            TextblockMusic: ["Música:","Music:"],
            TextblockAviso:  ["🌟 Pontuações e Níveis 🏆\n\n<499: Iniciante 🐣\n\n500 - 539: Estudante Curioso 🧐\n540 - 579: Estudante Aplicado 📘\n580 - 619: Universitário Iniciante ✏️\n620 - 659: Universitário Dedicado 📚\n660 - 699: Professor de Física 🧑‍🏫\n700 - 709: Professor de Termodinâmica 🔥\n710 - 719: Gênio da Física 🧠\n\n720+: Nicolas Léonard Sadi Carnot ⚙️\n\n Observação: nesta simulação, por se tratar de uma construção teórica idealizada, alguns elementos, como forças externas, não estão representados.","🌟 Scores and Levels 🏆\n\n<499: Beginner 🐣\n\n500 - 539: Curious Student 🧐\n540 - 579: Dedicated Student 📘\n580 - 619: Novice University Student ✏️\n620 - 659: Advanced University Student 📚\n660 - 699: Physics Professor 🧑‍🏫\n700 - 709: Thermodynamics Professor 🔥\n710 - 719: Physics Genius 🧠\n\n720+: Nicolas Léonard Sadi Carnot ⚙️\n\n Note: In this simulation, since it is a theoretical and idealized construct, some elements, such as external forces, are not represented."],
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
