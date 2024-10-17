import * as PIXI from "pixi.js";

const app = new PIXI.Application({
  background: "#000000",
  resizeTo: document.body,
});

document.body.appendChild(app.view as HTMLCanvasElement);

app.stage.eventMode = "static";
app.stage.hitArea = app.screen;

const view = new PIXI.Container();

app.stage.addChild(view);

class Vector2 {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  add(v: Vector2): Vector2 {
    return new Vector2(this.x + v.x, this.y + v.y);
  }
  sub(v: Vector2): Vector2 {
    return new Vector2(this.x - v.x, this.y - v.y);
  }
  mul(x: number): Vector2 {
    return new Vector2(this.x * x, this.y * x);
  }
  div(x: number): Vector2 {
    return new Vector2(this.x / x, this.y / x);
  }
  dot(v: Vector2): number {
    return this.x * v.x + this.y * v.y;
  }
  norm() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
  normalize() {
    return this.div(this.norm());
  }
  inverse() {
    return new Vector2(-this.x, -this.y);
  }
  clone(): Vector2 {
    return new Vector2(this.x, this.y);
  }
}

let worldscale = 15;

class Pointer extends PIXI.Graphics {
  vector: Vector2;
  r: number;

  constructor(vector: Vector2, r: number) {
    super();
    this.vector = vector.clone();
    this.r = r;
    this.update();
    this.draw();
  }
  update() {
    this.x = this.vector.x * worldscale;
    this.y = -this.vector.y * worldscale;
  }
  draw() {
    this.clear();
    this.beginFill(0xffffff);
    this.drawCircle(0, 0, worldscale / 2);
    this.endFill();
  }
}
class Line extends PIXI.Graphics {
  p0: Vector2;
  p1: Vector2;
  d: Vector2;
  L: number;

  constructor(p0: Vector2, d: Vector2, L: number) {
    super();
    this.p0 = p0.clone();
    this.d = d.clone();
    this.L = L;
    this.p1 = p0.add(d.mul(L));

    this.update();
    this.draw();
  }
  update() {
    this.x = this.p0.x * worldscale;
    this.y = -this.p0.y * worldscale;
  }
  draw() {
    let p = this.p1.sub(this.p0).mul(worldscale);
    this.clear();
    this.lineStyle(worldscale / 6, 0xffffff);
    this.moveTo(0, 0);
    this.lineTo(p.x, -p.y);
  }
  isCollide(ball: Ball): boolean {
    const p = ball.vector;
    const r = ball.r;
    const D =
      Math.abs(
        this.d.y * p.x -
          this.d.x * p.y -
          this.d.y * this.p0.x +
          this.d.x * this.p0.y
      ) / Math.sqrt(this.d.x * this.d.x + this.d.y * this.d.y);

    if (D > r) return false;

    const D1 = Math.sqrt(Math.pow(p.sub(this.p0).norm(), 2) - D * D) <= this.L;
    const D2 = Math.sqrt(Math.pow(p.sub(this.p1).norm(), 2) - D * D) <= this.L;
    const D3 = p.sub(this.p0).norm() <= r;
    const D4 = p.sub(this.p1).norm() <= r;

    return (D1 && D2) || D3 || D4;
  }
}

class Ball extends PIXI.Container {
  vector: Vector2;
  r: number;
  E: number;
  theta: number;
  v: Vector2;
  v_r: number;
  p: Pointer | null;
  m: number;
  v_vector: PIXI.Graphics;
  thread: PIXI.Graphics;
  ball: PIXI.Graphics;
  afterimages: PIXI.Graphics[];

  constructor() {
    super();

    this.r = 1 / 3;

    this.ball = new PIXI.Graphics();
    this.addChild(this.ball);

    this.v_vector = new PIXI.Graphics();
    this.addChild(this.v_vector);

    this.thread = new PIXI.Graphics();
    this.addChild(this.thread);

    this.theta = 0;
    this.p = null;
    this.m = 1;

    this.vector = new Vector2(0, 0);
    this.v = new Vector2(0, 0);
    this.v_r = 0;

    this.E = (1 / 2) * this.m * Math.pow(this.v.norm(), 2);

    const afterimages_n = 10;
    this.afterimages = [];
    for (let i = 0; i < afterimages_n; i++) {
      const graphic = new PIXI.Graphics();
      this.afterimages.push(graphic);
      graphic.alpha = i / (afterimages_n - 1);
      view.addChild(graphic);
    }

    this.draw();
  }
  draw() {
    this.ball.clear();
    this.ball.beginFill(0xffffff);
    this.ball.drawCircle(0, 0, this.r * worldscale);
    this.ball.endFill();

    this.afterimages.forEach((graphic, i) => {
      graphic.clear();
      graphic.beginFill(0xffffff);
      graphic.drawCircle(
        0,
        0,
        (worldscale / 3) * (i / (this.afterimages.length - 1))
      );
      graphic.endFill();
    });
  }
  remove() {
    this.afterimages.forEach((afterimage) => view.removeChild(afterimage));
  }
  join(p: Pointer) {
    this.p = p;
    this.theta = Math.atan2(
      this.vector.y - p.vector.y,
      this.vector.x - p.vector.x
    );
    this.vector = new Vector2(Math.cos(this.theta), Math.sin(this.theta))
      .mul(this.p.r)
      .add(this.p.vector);
    const v_u = new Vector2(-Math.sin(this.theta), Math.cos(this.theta));
    this.v = v_u.mul(this.v.norm());
    this.v_r = this.v.norm() / p.r;

    this.E =
      this.m * g * this.vector.y +
      (1 / 2) * this.m * Math.pow(this.v.norm(), 2);
  }
  update(dt: number, lines: Line[]) {
    if (this.p == null) return;
    const a = this.p.vector
      .sub(this.vector)
      .normalize()
      .mul(g)
      .sub(new Vector2(0, g));
    const v_u = new Vector2(-Math.sin(this.theta), Math.cos(this.theta));
    this.v = v_u.mul(Math.sign(v_u.dot(this.v)) * this.v.norm());
    this.v = this.v.add(a.mul(dt));

    this.v_r = (Math.sign(v_u.dot(this.v)) * this.v.norm()) / this.p.r;
    this.theta += this.v_r * dt;

    let Ek = this.E - this.m * g * this.vector.y;
    if (Ek < 0) {
      Ek = 0;
    }
    this.v = this.v.normalize().mul(Math.sqrt((2 * Ek) / this.m));

    this.v_vector.clear();
    this.v_vector.lineStyle(worldscale / 10, 0xff0000);
    this.v_vector.moveTo(0, 0);
    this.v_vector.lineTo(this.v.x * worldscale, -this.v.y * worldscale);

    this.vector = new Vector2(Math.cos(this.theta), Math.sin(this.theta))
      .mul(this.p.r)
      .add(this.p.vector);

    this.thread.clear();
    this.thread.lineStyle(worldscale / 10, 0xffffff);
    this.thread.moveTo(0, 0);
    this.thread.lineTo(
      -this.p.r * Math.cos(this.theta) * worldscale,
      this.p.r * Math.sin(this.theta) * worldscale
    );

    this.x = this.vector.x * worldscale;
    this.y = -this.vector.y * worldscale;

    this.afterimages.forEach((img, i) => {
      if (i == this.afterimages.length - 1) {
        img.x = this.x;
        img.y = this.y;
      } else {
        img.x = this.afterimages[i + 1].x;
        img.y = this.afterimages[i + 1].y;
      }
    });

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].isCollide(this)) {
        this.v = this.v.inverse();

        break;
      }
    }
  }
}

const g = 9.8;

const p = new Pointer(new Vector2(0, 0), 20);
const p2 = new Pointer(new Vector2(20, 20), 20);
const p3 = new Pointer(new Vector2(-25, -10), 20);
const ball = new Ball();
const ball2 = new Ball();
const ball3 = new Ball();

const line = new Line(
  new Vector2(0, -22),
  new Vector2(Math.cos(Math.PI / 6), Math.sin(Math.PI / 6)),
  5
);
const line2 = new Line(
  new Vector2(-6, -12),
  new Vector2(Math.cos(Math.PI / 3), Math.sin(Math.PI / 3)),
  5
);

view.addChild(line);
view.addChild(line2);
const lines = [line, line2];

ball.vector.x = -0.5;
ball.vector.y = 2;

ball.join(p);
ball2.join(p2);
ball3.join(p3);

view.addChild(p);
view.addChild(p2);
view.addChild(p3);
view.addChild(ball);
view.addChild(ball2);
view.addChild(ball3);
view.x = window.innerWidth / 2;
view.y = window.innerHeight / 2;

window.onresize = () => {
  view.x = window.innerWidth / 2;
  view.y = window.innerHeight / 2;
};

const startTime = Date.now();
let lastTime = Date.now();
app.ticker.add(() => {
  const currentTime = Date.now();
  let dt = (currentTime - lastTime) / 1000;
  if (dt > 0.1) dt = 0.1;

  ball.update(dt, lines);
  ball2.update(dt, lines);
  ball3.update(dt, lines);

  // worldscale = (15 / 2) * (1 + Math.cos((currentTime - startTime) / 200));
  // worldscale = Math.max(Math.min(15, worldscale), 10);

  // console.log(ball3.vector);
  // console.log(line2.isCollide(ball3));
  ball.draw();
  ball2.draw();
  ball3.draw();
  // p.update();
  // p2.update();
  // p3.update();
  p.draw();
  p2.draw();
  p3.draw();

  lastTime = currentTime;
});
