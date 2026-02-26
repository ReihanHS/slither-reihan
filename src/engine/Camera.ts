import type { Vector } from '../utils/MathUtils';

export class Camera {
    pos: Vector = { x: 0, y: 0 };
    width: number = 0;
    height: number = 0;
    zoom: number = 1;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
    }

    update(target: Vector) {
        // Smoothly follow target (player head)
        this.pos.x = target.x;
        this.pos.y = target.y;
    }

    resize(width: number, height: number) {
        this.width = width;
        this.height = height;
    }

    worldToScreen(worldPos: Vector): Vector {
        return {
            x: (worldPos.x - this.pos.x) * this.zoom + this.width / 2,
            y: (worldPos.y - this.pos.y) * this.zoom + this.height / 2
        };
    }

    screenToWorld(screenPos: Vector): Vector {
        return {
            x: (screenPos.x - this.width / 2) / this.zoom + this.pos.x,
            y: (screenPos.y - this.height / 2) / this.zoom + this.pos.y
        };
    }
}
