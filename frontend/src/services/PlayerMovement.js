// PlayerMovement.js - Class xử lý di chuyển player
export class PlayerMovement {
  constructor(map, onPositionChange) {
    this.map = map;
    this.currentPosition = this.findStartPosition();
    this.path = [];
    this.currentPathIndex = 0;
    this.onPositionChange = onPositionChange;
    this.isMoving = false;
    this.animationSpeed = 300; // milliseconds per step
  }

  findStartPosition() {
    for (let i = 0; i < this.map.tiles.length; i++) {
      for (let j = 0; j < this.map.tiles[i].length; j++) {
        if (this.map.tiles[i][j] === 'x') {
          return { row: i, col: j };
        }
      }
    }
    return null;
  }

  setPath(path) {
    this.path = path;
    this.currentPathIndex = 0;
    this.currentPosition = this.findStartPosition();
  }

  async animatePath() {
    if (!this.path || this.path.length === 0) {
      console.log('No path to animate');
      return;
    }

    this.isMoving = true;
    this.currentPathIndex = 0;

    for (let i = 0; i < this.path.length; i++) {
      if (!this.isMoving) break;

      this.currentPosition = this.path[i];
      this.currentPathIndex = i;
      
      if (this.onPositionChange) {
        this.onPositionChange(this.currentPosition, i);
      }

      await this.sleep(this.animationSpeed);
    }

    this.isMoving = false;
  }

  stopAnimation() {
    this.isMoving = false;
  }

  reset() {
    this.currentPosition = this.findStartPosition();
    this.currentPathIndex = 0;
    this.isMoving = false;
    if (this.onPositionChange) {
      this.onPositionChange(this.currentPosition, 0);
    }
  }

  setSpeed(speed) {
    // speed: 'slow' (500ms), 'normal' (300ms), 'fast' (100ms)
    const speeds = {
      slow: 500,
      normal: 300,
      fast: 100
    };
    this.animationSpeed = speeds[speed] || 300;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getCurrentPosition() {
    return this.currentPosition;
  }

  getProgress() {
    if (!this.path || this.path.length === 0) return 0;
    return Math.round((this.currentPathIndex / (this.path.length - 1)) * 100);
  }
}
