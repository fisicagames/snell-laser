export interface ISoundInterface {
    toggleAllMusicsEnabled(): boolean;
    play(): void;
    pause(): void;
    togglePlayback(): void;
    setVolume(volume: number): void;
    getVolume(): number;
    setLoop(loop: boolean): void;
}
