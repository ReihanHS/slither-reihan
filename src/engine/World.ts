import { Snake } from '../entities/Snake';
import { Food } from '../entities/Food';
import { distance } from '../utils/MathUtils';

export class World {
    width: number = 4000;
    height: number = 4000;
    foods: Food[] = [];
    maxFood: number = 400;

    constructor() {
        this.spawnInitialFood();
    }

    spawnInitialFood() {
        for (let i = 0; i < this.maxFood; i++) {
            this.spawnFood();
        }
    }

    spawnFood() {
        const pos = {
            x: (Math.random() - 0.5) * this.width,
            y: (Math.random() - 0.5) * this.height
        };
        this.foods.push(new Food(pos));
    }

    update(player: Snake) {
        // Update food animations
        this.foods.forEach(f => f.update());

        // Player eating logic
        const head = player.segments[0];

        for (let i = this.foods.length - 1; i >= 0; i--) {
            const food = this.foods[i];
            const d = distance(head, food.pos);

            // Pickup radius increases slightly with snake size
            const pickupDist = player.radius + food.radius + 5;

            if (d < pickupDist) {
                // Eat food
                player.length += food.points / 10;
                this.foods.splice(i, 1);
                this.spawnFood(); // Keep food density constant
            }
        }

        // Boundary check for player
        const halfW = this.width / 2;
        const halfH = this.height / 2;

        if (head.x < -halfW || head.x > halfW || head.y < -halfH || head.y > halfH) {
            // Death logic would go here, for now just wrap or bounce
            // For slither, you die if you hit the wall.
            // player.isDead = true;
        }
    }

    draw(ctx: CanvasRenderingContext2D, camera: any) {
        // Draw World Boundaries
        const halfW = this.width / 2;
        const halfH = this.height / 2;

        const topLeft = camera.worldToScreen({ x: -halfW, y: -halfH });
        const bottomRight = camera.worldToScreen({ x: halfW, y: halfH });

        ctx.strokeStyle = '#7000ff';
        ctx.lineWidth = 5;
        ctx.strokeRect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);

        // Draw Foods
        this.foods.forEach(f => f.draw(ctx, camera));
    }
}
