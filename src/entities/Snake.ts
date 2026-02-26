import type { Vector } from '../utils/MathUtils';
import { distance, angleBetween, rotateTowards } from '../utils/MathUtils';

export interface SnakeOptions {
    name: string;
    color: string;
    isPlayer?: boolean;
}

export class Snake {
    segments: Vector[] = [];
    angle: number = 0;
    targetAngle: number = 0;
    speed: number = 3.5;
    baseSpeed: number = 3.5;
    boostSpeed: number = 7;
    turnSpeed: number = 0.08;
    length: number = 20;
    radius: number = 15;
    isBoosting: boolean = false;
    name: string;
    color: string;
    isPlayer: boolean;

    // Power-up states (remaining time in milliseconds)
    powerUps: {
        speedBurst: number;
        magnet: number;
        ghost: number;
        shield: number;
    } = {
            speedBurst: 0,
            magnet: 0,
            ghost: 0,
            shield: 0
        };

    constructor(startPos: Vector, options: SnakeOptions) {
        this.name = options.name;
        this.color = options.color;
        this.isPlayer = options.isPlayer || false;

        // Initialize segments
        for (let i = 0; i < this.length; i++) {
            this.segments.push({ ...startPos });
        }
        this.angle = Math.random() * Math.PI * 2;
        this.targetAngle = this.angle;
    }

    update(dt: number) {
        // Update power-up timers
        Object.keys(this.powerUps).forEach(key => {
            const k = key as keyof typeof this.powerUps;
            if (this.powerUps[k] > 0) this.powerUps[k] -= dt * 1000;
        });

        const isSpeedBurst = this.powerUps.speedBurst > 0;
        this.speed = (this.isBoosting || isSpeedBurst) ? this.boostSpeed : this.baseSpeed;
        if (isSpeedBurst) this.speed *= 1.5; // Double (well, 1.5x) speed burst from plans

        // Smooth turning
        this.angle = rotateTowards(this.angle, this.targetAngle, this.turnSpeed);

        // Calculate head movement
        const head = this.segments[0];
        const nextHead = {
            x: head.x + Math.cos(this.angle) * this.speed,
            y: head.y + Math.sin(this.angle) * this.speed
        };

        // Update segments (trailing effect)
        // The key to slither movement is that segments don't just follow the previous one,
        // they maintain a specific distance.
        const segmentGap = 6;

        this.segments.unshift(nextHead);

        const finalSegments: Vector[] = [nextHead];
        let lastPos = nextHead;

        for (let i = 1; i < this.segments.length; i++) {
            const seg = this.segments[i];
            const dist = distance(lastPos, seg);

            if (dist >= segmentGap) {
                const angle = angleBetween(lastPos, seg);
                const newSeg = {
                    x: lastPos.x + Math.cos(angle) * segmentGap,
                    y: lastPos.y + Math.sin(angle) * segmentGap
                };
                finalSegments.push(newSeg);
                lastPos = newSeg;
            }
        }

        // Trim segments based on current visual length
        const visualLength = Math.floor(this.length);
        if (finalSegments.length > visualLength) {
            finalSegments.length = visualLength;
        }

        this.segments = finalSegments;
    }

    draw(ctx: CanvasRenderingContext2D, camera: any) {
        // Draw body segments
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Draw glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;

        // Body gradient
        for (let i = this.segments.length - 1; i >= 0; i--) {
            const seg = this.segments[i];
            const screenPos = camera.worldToScreen(seg);

            // Body gradient
            ctx.beginPath();
            const r = this.radius * (1 - (i / this.segments.length) * 0.3); // Taper tail
            ctx.arc(screenPos.x, screenPos.y, r, 0, Math.PI * 2);

            if (this.powerUps.ghost > 0) {
                ctx.globalAlpha = 0.3;
            } else {
                ctx.globalAlpha = (i % 3 === 0) ? 1 : 0.8;
            }

            ctx.fillStyle = this.color;
            ctx.fill();

            // Shield effect
            if (this.powerUps.shield > 0 && i === 0) {
                ctx.strokeStyle = '#00f2ff';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, r + 5, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.closePath();
        }

        // Draw Head details (eyes)
        ctx.globalAlpha = 1;
        const headPos = camera.worldToScreen(this.segments[0]);

        ctx.save();
        ctx.translate(headPos.x, headPos.y);
        ctx.rotate(this.angle);

        // Eyes
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(8, -8, 5, 0, Math.PI * 2);
        ctx.arc(8, 8, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(10, -8, 2.5, 0, Math.PI * 2);
        ctx.arc(10, 8, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Reset shadow
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;

        // Name tag
        if (this.isPlayer) {
            ctx.fillStyle = 'white';
            ctx.font = 'bold 14px Outfit';
            ctx.textAlign = 'center';
            ctx.fillText(this.name, headPos.x, headPos.y - 30);
        }
    }
}
