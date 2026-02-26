import { Snake } from './Snake';
import type { SnakeOptions } from './Snake';
import type { Vector } from '../utils/MathUtils';
import { angleBetween, distance } from '../utils/MathUtils';

export class AISnake extends Snake {
    targetUpdateTimer: number = 0;
    targetUpdateInterval: number = 100; // frames
    wonderTag: Vector = { x: 0, y: 0 };

    constructor(startPos: Vector, options: SnakeOptions) {
        super(startPos, options);
        this.setNewWonderTarget();
    }

    setNewWonderTarget() {
        // Random point in world
        this.wonderTag = {
            x: (Math.random() - 0.5) * 4000,
            y: (Math.random() - 0.5) * 4000
        };
    }

    updateAI(foods: any[], dt: number) {
        this.targetUpdateTimer++;

        // Find nearest food
        let nearestFood = null;
        let minDist = 500; // detection range

        for (const food of foods) {
            const d = distance(this.segments[0], food.pos);
            if (d < minDist) {
                minDist = d;
                nearestFood = food;
            }
        }

        if (nearestFood) {
            this.targetAngle = angleBetween(this.segments[0], nearestFood.pos);
        } else if (this.targetUpdateTimer > this.targetUpdateInterval) {
            this.setNewWonderTarget();
            this.targetUpdateTimer = 0;
            this.targetAngle = angleBetween(this.segments[0], this.wonderTag);
        }

        // Random boosting
        if (Math.random() < 0.01) {
            this.isBoosting = !this.isBoosting;
        }

        super.update(dt);
    }
}
