import type { Vector } from '../utils/MathUtils';

export const PowerUpType = {
    SPEED_BURST: '⚡',
    MAGNET: '🧲',
    GHOST: '👻',
    MASS_BOMB: '💣',
    SHIELD: '🛡',
    GROWTH_SURGE: '🧬'
} as const;

export type PowerUpType = (typeof PowerUpType)[keyof typeof PowerUpType];

export class PowerUp {
    pos: Vector;
    type: PowerUpType;
    color: string;
    radius: number = 15;
    pulse: number = 0;
    label: string;

    constructor(pos: Vector, type: PowerUpType) {
        this.pos = pos;
        this.type = type;
        this.label = type;

        switch (type) {
            case PowerUpType.SPEED_BURST: this.color = '#ffff00'; break;
            case PowerUpType.MAGNET: this.color = '#ff0000'; break;
            case PowerUpType.GHOST: this.color = '#ffffff'; break;
            case PowerUpType.MASS_BOMB: this.color = '#ffaa00'; break;
            case PowerUpType.SHIELD: this.color = '#00f2ff'; break;
            case PowerUpType.GROWTH_SURGE: this.color = '#00ff41'; break;
            default: this.color = '#ffffff';
        }
    }

    update() {
        this.pulse += 0.05;
    }

    draw(ctx: CanvasRenderingContext2D, camera: any) {
        const screenPos = camera.worldToScreen(this.pos);
        if (screenPos.x < -50 || screenPos.x > camera.width + 50 ||
            screenPos.y < -50 || screenPos.y > camera.height + 50) return;

        const pulseRadius = this.radius + Math.sin(this.pulse) * 4;

        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;

        // Outer ring
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, pulseRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Background
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, pulseRadius, 0, Math.PI * 2);
        ctx.fill();

        // Icon
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.label, screenPos.x, screenPos.y);

        ctx.shadowBlur = 0;
    }
}
