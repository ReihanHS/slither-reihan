import { Snake } from '../entities/Snake';
import { AISnake } from '../entities/AISnake';
import { Food } from '../entities/Food';
import { PowerUp, PowerUpType } from '../entities/PowerUp';
import { ParticleSystem } from '../utils/ParticleSystem';
import type { Vector } from '../utils/MathUtils';
import { distance } from '../utils/MathUtils';

export class EntityManager {
    player: Snake | null = null;
    enemies: AISnake[] = [];
    foods: Food[] = [];
    powerUps: PowerUp[] = [];
    particles: ParticleSystem = new ParticleSystem();
    worldWidth: number = 4000;
    worldHeight: number = 4000;
    maxFood: number = 400;
    maxEnemies: number = 20;
    maxPowerUps: number = 10;

    constructor() {
        this.spawnInitialEntities();
    }

    spawnInitialEntities() {
        for (let i = 0; i < this.maxFood; i++) this.spawnFood();
        for (let i = 0; i < this.maxEnemies; i++) this.spawnEnemy();
        for (let i = 0; i < this.maxPowerUps; i++) this.spawnPowerUp();
    }

    spawnPowerUp() {
        const types = Object.values(PowerUpType);
        const pos = {
            x: (Math.random() - 0.5) * this.worldWidth,
            y: (Math.random() - 0.5) * this.worldHeight
        };
        this.powerUps.push(new PowerUp(pos, types[Math.floor(Math.random() * types.length)]));
    }

    spawnFood(pos?: Vector) {
        const p = pos || {
            x: (Math.random() - 0.5) * this.worldWidth,
            y: (Math.random() - 0.5) * this.worldHeight
        };
        this.foods.push(new Food(p));
    }

    spawnEnemy() {
        const pos = {
            x: (Math.random() - 0.5) * this.worldWidth,
            y: (Math.random() - 0.5) * this.worldHeight
        };
        const colors = ['#00f2ff', '#7000ff', '#ff00d9', '#00ff41', '#fbff00'];
        const names = ['Snakey', 'Slinky', 'Neon', 'Void', 'Glow', 'Pulse', 'Cyber'];

        this.enemies.push(new AISnake(pos, {
            name: names[Math.floor(Math.random() * names.length)],
            color: colors[Math.floor(Math.random() * colors.length)]
        }));
    }

    update(dt: number) {
        this.particles.update();
        if (this.player) {
            this.player.update(dt);
            this.checkFoodCollision(this.player);
            this.checkPowerUpCollision(this.player);
            this.checkSnakeCollision(this.player);
        }

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.updateAI(this.foods, dt);
            this.checkFoodCollision(enemy);
            this.checkPowerUpCollision(enemy);

            if (this.checkSnakeCollision(enemy)) {
                // Enemy died - turn into food
                this.handleSnakeDeath(enemy);
                this.enemies.splice(i, 1);
                setTimeout(() => this.spawnEnemy(), 3000);
            }
        }
    }

    checkPowerUpCollision(snake: Snake) {
        const head = snake.segments[0];
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const pu = this.powerUps[i];
            if (distance(head, pu.pos) < snake.radius + pu.radius) {
                this.applyPowerUp(snake, pu);
                this.powerUps.splice(i, 1);
                setTimeout(() => this.spawnPowerUp(), 10000);
            }
        }
    }

    applyPowerUp(snake: Snake, pu: PowerUp) {
        this.particles.emit(pu.pos, pu.color, 15);
        switch (pu.type) {
            case PowerUpType.SPEED_BURST: snake.powerUps.speedBurst = 5000; break;
            case PowerUpType.MAGNET: snake.powerUps.magnet = 8000; break;
            case PowerUpType.GHOST: snake.powerUps.ghost = 4000; break;
            case PowerUpType.SHIELD: snake.powerUps.shield = 10000; break;
            case PowerUpType.GROWTH_SURGE: snake.length *= 1.1; break;
            case PowerUpType.MASS_BOMB: this.dropMassBomb(snake); break;
        }
    }

    dropMassBomb(snake: Snake) {
        const bombPos = { ...snake.segments[snake.segments.length - 1] };
        snake.length *= 0.95; // 5% cost
        this.particles.emit(bombPos, '#ffaa00', 10);

        setTimeout(() => {
            this.particles.emit(bombPos, '#ffaa00', 30);
            for (let i = 0; i < 20; i++) {
                const p = {
                    x: bombPos.x + (Math.random() - 0.5) * 200,
                    y: bombPos.y + (Math.random() - 0.5) * 200
                };
                this.spawnFood(p);
            }
        }, 2000);
    }

    checkFoodCollision(snake: Snake) {
        const head = snake.segments[0];
        const magnetActive = snake.powerUps.magnet > 0;
        const magnetRange = magnetActive ? 200 + snake.segments.length : 0;

        for (let i = this.foods.length - 1; i >= 0; i--) {
            const food = this.foods[i];
            const dist = distance(head, food.pos);

            if (dist < snake.radius + food.radius + 5) {
                snake.length += food.points / 10;
                this.particles.emit(food.pos, food.color, 3);
                this.foods.splice(i, 1);
                this.spawnFood();
            } else if (magnetActive && dist < magnetRange) {
                // Pull food toward snake
                const angle = Math.atan2(head.y - food.pos.y, head.x - food.pos.x);
                food.pos.x += Math.cos(angle) * 10;
                food.pos.y += Math.sin(angle) * 10;
            }
        }
    }

    checkSnakeCollision(snake: Snake): boolean {
        if (snake.powerUps.ghost > 0) return false;
        const head = snake.segments[0];

        // Check against world boundaries
        const halfW = this.worldWidth / 2;
        const halfH = this.worldHeight / 2;
        if (head.x < -halfW || head.x > halfW || head.y < -halfH || head.y > halfH) {
            return true;
        }

        // Check against other snakes
        const allSnakes: Snake[] = [...this.enemies];
        if (this.player) allSnakes.push(this.player);

        for (const other of allSnakes) {
            if (other === snake) continue;

            for (let i = 0; i < other.segments.length; i++) {
                const seg = other.segments[i];
                // Head to body collision
                if (distance(head, seg) < snake.radius + other.radius - 5) {
                    if (snake.powerUps.shield > 0) {
                        snake.powerUps.shield = 0;
                        this.particles.emit(head, '#00f2ff', 20);
                        return false;
                    }
                    return true;
                }
            }
        }
        return false;
    }

    handleSnakeDeath(snake: Snake) {
        // Drop food along the body
        for (let i = 0; i < snake.segments.length; i += 2) {
            const pos = snake.segments[i];
            this.spawnFood(pos);
            this.particles.emit(pos, snake.color, 2);
        }
    }

    draw(ctx: CanvasRenderingContext2D, camera: any) {
        this.foods.forEach(f => f.draw(ctx, camera));
        this.powerUps.forEach(p => p.draw(ctx, camera));
        this.particles.draw(ctx, camera);
        this.enemies.forEach(e => e.draw(ctx, camera));
        if (this.player) this.player.draw(ctx, camera);

        // Draw World Bounds
        const halfW = this.worldWidth / 2;
        const halfH = this.worldHeight / 2;
        const tl = camera.worldToScreen({ x: -halfW, y: -halfH });
        const br = camera.worldToScreen({ x: halfW, y: halfH });
        ctx.strokeStyle = 'rgba(112, 0, 255, 0.3)';
        ctx.lineWidth = 10;
        ctx.strokeRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
    }
}
