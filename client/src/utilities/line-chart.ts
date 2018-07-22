
export type Point = {
  x: number;
  y: number;
};

// fill: https://stackoverflow.com/questions/34339520/canvas-fill-area-below-or-above-lines
export class LineChart {
  constructor(private canvas: HTMLCanvasElement, private points: Point[]) {}

  render() {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    let highestX = 0, highestY = 0;
    this.points.forEach(point => {
      if (point.x > highestX) {
        highestX = point.x;
      }
      if (point.y > highestY) {
        highestY = point.y;
      }
    });

    const ctx = this.canvas.getContext('2d');
    if (ctx === null) {
      throw new Error('canvas context was null');
    }

    ctx.beginPath();
    ctx.moveTo(0, height);
    const p: Point[] = [];
    this.points.forEach((point, index) => {
      const ratioThroughX = point.x * (width / highestX);
      const ratioThroughY = point.y * (height / highestY);
      p.push({x: ratioThroughX, y: ratioThroughY});
    });

    p.forEach(po => ctx.lineTo(po.x, height - po.y));

    ctx.save();
    ctx.clip();
    ctx.fillStyle = 'lightblue';
    ctx.fillRect(0, 0, width, height);

    ctx.restore();

    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 2;

    ctx.stroke();
  }
}
