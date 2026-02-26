import type { Vector } from '../utils/MathUtils';

export class Particle {
    pos: Vector;
    vel: Vector;
    color: string;
    life: number = 1.0;
    decay: number;
    size: number;

    constructor(pos: Vector, color: string) {
        this.pos = { ...pos };
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2 + 1;
        this.vel = {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed
        };
        this.color = color;
        this.decay = Math.random() * 0.02 + 0.01;
        this.size = Math.random() * 3 + 2;
    }

    update() {
        this.pos.x += this.vel.x;
        this.pos.y += this.vel.y;
        this.life -= this.decay;
        this.vel.x *= 0.98;
        this.vel.y *= 0.98;
    }

    draw(ctx: CanvasRenderingContext2D, camera: any) {
        const screenPos = camera.worldToScreen(this.pos);
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;

        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;
    }
}

export class ParticleSystem {
    particles: Particle[] = [];

    emit(pos: Vector, color: string, count: number = 5) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(pos, color));
        }
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw(ctx: CanvasRenderingContext2D, camera: any) {
        this.particles.forEach(p => p.draw(ctx, camera));
    }
}
