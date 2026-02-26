import type { Vector } from '../utils/MathUtils';

export class Food {
    pos: Vector;
    color: string;
    radius: number;
    points: number;
    pulse: number = 0;

    constructor(pos: Vector) {
        this.pos = pos;
        this.radius = Math.random() * 4 + 3;
        this.points = this.radius;

        // Random neon colors
        const colors = ['#00f2ff', '#7000ff', '#ff00d9', '#00ff41', '#fbff00'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
        this.pulse += 0.05;
    }

    draw(ctx: CanvasRenderingContext2D, camera: any) {
        const screenPos = camera.worldToScreen(this.pos);

        // Only draw if on screen
        if (screenPos.x < -20 || screenPos.x > camera.width + 20 ||
            screenPos.y < -20 || screenPos.y > camera.height + 20) return;

        const pulseRadius = this.radius + Math.sin(this.pulse) * 1.5;

        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, pulseRadius, 0, Math.PI * 2);
        ctx.fill();

        // Core highlight
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, pulseRadius * 0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
    }
}
