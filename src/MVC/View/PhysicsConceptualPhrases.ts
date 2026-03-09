export class PhysicsConceptualPhrases {
    public static getRandomPendulumPhrase(languageOption: number): string {
        const phrasesPt = [
            "⏱️ O período de oscilação de um pêndulo simples depende unicamente do comprimento do fio e da aceleração da gravidade.",
            "⚖️ Quanto maior o comprimento do fio (L), maior será o período do pêndulo (T), pois T = 2π√(L/g).",
            "🌍 A aceleração da gravidade (g) afeta diretamente o tempo de oscilação: em planetas com menor gravidade, o período aumenta.",
            "📏 A equação do período de um pêndulo simples é T = 2π√(L/g), onde L é o comprimento do fio e g é a aceleração da gravidade.",
            "⚙️ O movimento do pêndulo é considerado harmônico simples quando o ângulo de oscilação é pequeno (menor que 15°).",
            "💨 A resistência do ar pode diminuir a amplitude do pêndulo ao longo do tempo, mas não altera o período em grandezas pequenas.",
            "🪝 O período de oscilação de um pêndulo não depende da sua amplitude, desde que o ângulo de oscilação seja pequeno.",
            "🔄 O movimento do pêndulo é um exemplo clássico de conversão de energia potencial gravitacional em energia cinética e vice-versa.",
            "🌐 Em um pêndulo simples, a aceleração da gravidade (g) determina a rapidez com que o pêndulo oscila, fazendo com que em Júpiter o período seja menor que na Terra.",
            "🔬 A relação entre o comprimento do fio e o período é diretamente proporcional à raiz quadrada, ou seja, dobrando o comprimento, o período aumenta por √2.",
            "📊 A amplitude inicial de um pêndulo simples (para pequenos ângulos) não influencia o tempo de oscilação, apenas o deslocamento angular.",
            "⚖️ A energia potencial máxima do pêndulo ocorre na sua altura máxima e é convertida completamente em energia cinética no ponto mais baixo."
        ];

        const phrasesEn = [
            "⏱️ The oscillation period of a simple pendulum depends solely on the length of the string and the acceleration due to gravity.",
            "⚖️ The longer the string (L), the longer the pendulum's period (T), since T = 2π√(L/g).",
            "🌍 The acceleration due to gravity (g) directly affects the oscillation time: on planets with lower gravity, the period increases.",
            "📏 The period equation of a simple pendulum is T = 2π√(L/g), where L is the length of the string and g is the acceleration due to gravity.",
            "⚙️ The pendulum's motion is considered simple harmonic when the oscillation angle is small (less than 15°).",
            "💨 Air resistance can reduce the amplitude of the pendulum over time but does not alter the period for small magnitudes.",
            "🪝 The oscillation period of a pendulum does not depend on its amplitude as long as the oscillation angle is small.",
            "🔄 The motion of the pendulum is a classic example of the conversion of gravitational potential energy into kinetic energy and vice versa.",
            "🌐 In a simple pendulum, the acceleration due to gravity (g) determines the speed at which the pendulum swings, meaning on Jupiter the period is shorter than on Earth.",
            "🔬 The relationship between the string length and the period is directly proportional to the square root, meaning doubling the length increases the period by √2.",
            "📊 The initial amplitude of a simple pendulum (for small angles) does not influence the oscillation time, only the angular displacement.",
            "⚖️ The maximum potential energy of the pendulum occurs at its highest point and is completely converted into kinetic energy at the lowest point."
        ];

        if (languageOption === 1) {
            return phrasesEn[Math.floor(Math.random() * phrasesEn.length)];
        } else {
            return phrasesPt[Math.floor(Math.random() * phrasesPt.length)];
        }
    }
}
