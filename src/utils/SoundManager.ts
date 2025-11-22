/**
 * Sound Manager - Centralized audio playback system
 * Handles preloading, playing, and volume control for game sounds
 */

export type SoundEffect =
    | 'shuffle'
    | 'play'
    | 'select'
    | 'turn'
    | 'win'
    | 'lose'
    | 'click'
    | 'toast';

export const SoundEffect = {
    CARD_SHUFFLE: 'shuffle' as SoundEffect,
    CARD_PLAY: 'play' as SoundEffect,
    CARD_SELECT: 'select' as SoundEffect,
    TURN_CHANGE: 'turn' as SoundEffect,
    WIN: 'win' as SoundEffect,
    LOSE: 'lose' as SoundEffect,
    BUTTON_CLICK: 'click' as SoundEffect,
    TOAST: 'toast' as SoundEffect,
};

class SoundManager {
    private sounds: Map<SoundEffect, HTMLAudioElement> = new Map();
    private volume: number = 0.5;
    private enabled: boolean = true;

    constructor() {
        this.initializeSounds();
    }

    /**
     * Initialize sound effects using data URIs for simple beeps/clicks
     * In production, replace with actual audio files
     */
    private initializeSounds() {
        // Simple beep sounds using Web Audio API or data URIs
        // For now, we'll create placeholder elements
        const soundEffects: { [key in SoundEffect]: string } = {
            'shuffle': this.generateTone(220, 0.1),
            'play': this.generateTone(440, 0.05),
            'select': this.generateTone(660, 0.03),
            'turn': this.generateTone(330, 0.15),
            'win': this.generateTone(880, 0.3),
            'lose': this.generateTone(110, 0.3),
            'click': this.generateTone(550, 0.02),
            'toast': this.generateTone(440, 0.08),
        };

        Object.entries(soundEffects).forEach(([key, dataUri]) => {
            const audio = new Audio(dataUri);
            audio.volume = this.volume;
            this.sounds.set(key as SoundEffect, audio);
        });
    }

    /**
     * Generate a simple tone using Web Audio API
     * Returns a data URI for the audio element
     */
    private generateTone(_frequency: number, _duration: number): string {
        // For simplicity, we'll use a silent data URI as placeholder
        // In production, use Web Audio API or actual audio files
        return 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiToIFmS57OehUhIMUKXi7rdkHgU2jdXuy3ksBS15y/LdkUALElyx6OunWhQKR57f7rtkHAU4kdry2H4uBit8zfLekUILE2G26emnWxMJRZ7f77tlHgU3ktbuzHwuBit8zfLfkUIKGWe56OekWhEIQ5zc7rtkHAU3kdbtznswBSh5zPHckEQKFGO25+ilWRAISp3d775lHQU3kNXv0n0vBSh5zPHelEIJGGi66OSlXREISp3c7rxfHgQ6ltTw0H0vBSh5zPHfk0EMXK7j76heFAhJnN3uvWghBTiP1fDRfTAFJ3rM8N+UQA==';
    }

    /**
     * Play a sound effect
     */
    play(effect: SoundEffect): void {
        if (!this.enabled) return;

        const sound = this.sounds.get(effect);
        if (sound) {
            // Clone the audio element to allow overlapping sounds
            const clone = sound.cloneNode() as HTMLAudioElement;
            clone.volume = this.volume;
            clone.play().catch(() => {
                // Ignore errors (e.g., user hasn't interacted with page yet)
            });
        }
    }

    /**
     * Set volume for all sounds (0-1)
     */
    setVolume(volume: number): void {
        this.volume = Math.max(0, Math.min(1, volume));
        this.sounds.forEach(sound => {
            sound.volume = this.volume;
        });
    }

    /**
     * Enable or disable all sounds
     */
    setEnabled(enabled: boolean): void {
        this.enabled = enabled;
    }

    /**
     * Get current enabled state
     */
    isEnabled(): boolean {
        return this.enabled;
    }
}

// Export singleton instance
export const soundManager = new SoundManager();
