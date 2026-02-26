import './style.css';
import { Camera } from './engine/Camera';
import { Snake } from './entities/Snake';
import { EntityManager } from './engine/EntityManager';
import type { Vector } from './utils/MathUtils';
import { angleBetween } from './utils/MathUtils';

class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  camera: Camera;
  entities: EntityManager;
  player: Snake | null = null;
  mousePosition: Vector = { x: 0, y: 0 };
  worldSize: number = 2000;
  lastTime: number = 0;
  isPlaying: boolean = false;

  // UI elements
  overlay: HTMLElement;
  playerNameInput: HTMLInputElement;
  startBtn: HTMLButtonElement;
  scoreElement: HTMLElement;

  constructor() {
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.camera = new Camera(window.innerWidth, window.innerHeight);
    this.entities = new EntityManager();

    this.overlay = document.getElementById('overlay')!;
    this.playerNameInput = document.getElementById('player-name') as HTMLInputElement;
    this.startBtn = document.getElementById('start-btn') as HTMLButtonElement;
    this.scoreElement = document.getElementById('current-score')!;

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());

    // Input matching slither.io style
    window.addEventListener('mousemove', (e) => {
      this.mousePosition = { x: e.clientX, y: e.clientY };
      if (this.player) {
        const worldMouse = this.camera.screenToWorld(this.mousePosition);
        this.player.targetAngle = angleBetween(this.player.segments[0], worldMouse);
      }
    });

    window.addEventListener('mousedown', () => {
      if (this.player) this.player.isBoosting = true;
    });

    window.addEventListener('mouseup', () => {
      if (this.player) this.player.isBoosting = false;
    });

    this.startBtn.addEventListener('click', () => this.startGame());

    // Start game loop
    requestAnimationFrame((t) => this.loop(t));
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.camera.resize(this.canvas.width, this.canvas.height);
  }

  startGame() {
    const name = this.playerNameInput.value || 'Adventurer';
    this.player = new Snake({ x: 0, y: 0 }, {
      name,
      color: '#00f2ff',
      isPlayer: true
    });
    this.entities.player = this.player;

    this.isPlaying = true;
    this.overlay.classList.remove('visible');
  }

  update(dt: number) {
    if (!this.isPlaying || !this.player) return;

    if (this.entities.checkSnakeCollision(this.player)) {
      this.handleGameOver();
      return;
    }

    this.entities.update(dt);
    this.camera.update(this.player.segments[0]);
    this.updateLeaderboard();
    this.drawMinimap();
    this.updatePowerUpUI();
  }

  updatePowerUpUI() {
    if (!this.player) return;
    const container = document.getElementById('score-panel')!;
    let indicators = container.querySelector('.powerup-indicators');
    if (!indicators) {
      indicators = document.createElement('div');
      indicators.className = 'powerup-indicators';
      container.appendChild(indicators);
    }

    let html = '';
    const puIcons: Record<string, string> = {
      speedBurst: '⚡',
      magnet: '🧲',
      ghost: '👻',
      shield: '🛡'
    };

    Object.entries(this.player.powerUps).forEach(([key, time]) => {
      if (time > 0) {
        html += `<div class="pu-badge" title="${key}">${puIcons[key]} ${Math.ceil(time / 1000)}s</div>`;
      }
    });
    indicators.innerHTML = html;
  }

  handleGameOver() {
    this.isPlaying = false;
    this.overlay.classList.add('visible');
    const h1 = this.overlay.querySelector('h1')!;
    h1.innerText = 'GAME OVER';
    const p = this.overlay.querySelector('p')!;
    p.innerText = `Final Length: ${this.player?.segments.length || 0}`;
    const btn = this.overlay.querySelector('button')!;
    btn.innerText = 'TRY AGAIN';

    // Add death particles
    if (this.player) {
      this.entities.handleSnakeDeath(this.player);
      this.entities.player = null;
    }
  }

  drawMinimap() {
    const miniCanvas = document.getElementById('minimap-canvas') as HTMLCanvasElement;
    const mctx = miniCanvas.getContext('2d')!;

    if (miniCanvas.width !== 150) {
      miniCanvas.width = 150;
      miniCanvas.height = 150;
    }

    mctx.fillStyle = 'rgba(0,0,0,0.5)';
    mctx.fillRect(0, 0, 150, 150);

    const scale = 150 / 4000;
    const center = 75;

    // Draw food
    mctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    this.entities.foods.forEach(f => {
      mctx.fillRect(center + f.pos.x * scale, center + f.pos.y * scale, 1, 1);
    });

    // Draw enemies
    this.entities.enemies.forEach(e => {
      mctx.fillStyle = e.color;
      mctx.fillRect(center + e.segments[0].x * scale - 1, center + e.segments[0].y * scale - 1, 3, 3);
    });

    // Draw player
    if (this.player) {
      mctx.fillStyle = '#ffffff';
      mctx.shadowBlur = 5;
      mctx.shadowColor = '#ffffff';
      mctx.fillRect(center + this.player.segments[0].x * scale - 2, center + this.player.segments[0].y * scale - 2, 4, 4);
      mctx.shadowBlur = 0;
    }
  }

  updateLeaderboard() {
    const allSnakes: Snake[] = [...this.entities.enemies];
    if (this.player) allSnakes.push(this.player);
    allSnakes.sort((a, b) => b.segments.length - a.segments.length);

    const list = document.getElementById('leaderboard-list')!;
    list.innerHTML = '';
    allSnakes.slice(0, 10).forEach((s, i) => {
      const li = document.createElement('li');
      li.className = s === this.player ? 'player' : '';
      li.innerHTML = `<span>${i + 1}. ${s.name}</span> <span>${s.segments.length}</span>`;
      list.appendChild(li);
    });
  }

  draw() {
    // Clear background
    this.ctx.fillStyle = '#050505';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw Grid
    this.drawGrid();

    // Draw Entities (food + snakes + player)
    this.entities.draw(this.ctx, this.camera);

    if (this.player) {
      this.scoreElement.innerText = Math.floor(this.player.segments.length).toString();
    }
  }

  drawGrid() {
    const gridSize = 100;
    const screenTopLeft = this.camera.screenToWorld({ x: 0, y: 0 });
    const screenBottomRight = this.camera.screenToWorld({ x: this.canvas.width, y: this.canvas.height });

    this.ctx.strokeStyle = 'rgba(0, 242, 255, 0.05)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();

    // Vertical lines
    for (let x = Math.floor(screenTopLeft.x / gridSize) * gridSize; x <= screenBottomRight.x; x += gridSize) {
      const screenX = (x - this.camera.pos.x) * this.camera.zoom + this.camera.width / 2;
      this.ctx.moveTo(screenX, 0);
      this.ctx.lineTo(screenX, this.canvas.height);
    }

    // Horizontal lines
    for (let y = Math.floor(screenTopLeft.y / gridSize) * gridSize; y <= screenBottomRight.y; y += gridSize) {
      const screenY = (y - this.camera.pos.y) * this.camera.zoom + this.camera.height / 2;
      this.ctx.moveTo(0, screenY);
      this.ctx.lineTo(this.canvas.width, screenY);
    }

    this.ctx.stroke();
  }

  loop(time: number) {
    const dt = (time - this.lastTime) / 1000;
    this.lastTime = time;

    this.update(dt);
    this.draw();

    requestAnimationFrame((t) => this.loop(t));
  }
}

new Game();
