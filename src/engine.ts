import * as PIXI from "pixi.js";

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

let worldscale = 30;

class Pointer extends PIXI.Graphics {
  vector: Vector2;

  constructor(vector: Vector2) {
    super();
    this.vector = vector.clone();
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

  constructor(p0: Vector2, theta: number, L: number) {
    super();
    this.p0 = p0.clone();
    this.d = new Vector2(Math.cos(theta), Math.sin(theta));
    this.L = L;
    this.p1 = p0.add(this.d.mul(L));

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
  thread_r: number;
  r: number;
  E: number;
  EE: number;
  theta: number;
  v: Vector2;
  v_r: number;
  p: Pointer | null;
  m: number;
  thread: PIXI.Graphics;
  ball: PIXI.Graphics;
  afterimages: PIXI.Graphics[];
  color: PIXI.ColorSource;

  constructor(vector: Vector2, view: PIXI.Container, v?: Vector2) {
    super();
    this.color = 0xffffff;
    this.EE = 0;

    this.thread_r = 0;
    this.r = 1 / 3;

    this.ball = new PIXI.Graphics();
    this.addChild(this.ball);

    this.thread = new PIXI.Graphics();
    this.addChild(this.thread);

    this.theta = 0;
    this.p = null;
    this.m = 1;

    this.vector = vector.clone();
    this.v = v?.clone() || new Vector2(0, 0);
    this.v_r = 0;

    this.E =
      this.m * g * this.vector.y +
      (1 / 2) * this.m * Math.pow(this.v.norm(), 2);

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
    this.ball.beginFill(this.color);
    this.ball.drawCircle(0, 0, this.r * worldscale);
    this.ball.endFill();

    this.afterimages.forEach((graphic, i) => {
      graphic.clear();
      graphic.beginFill(this.color);
      graphic.drawCircle(
        0,
        0,
        (worldscale / 3) * (i / (this.afterimages.length - 1))
      );
      graphic.endFill();
    });
  }
  dash() {
    this.EE = 10;
  }
  remove(view: PIXI.Container) {
    this.afterimages.forEach((afterimage) => view.removeChild(afterimage));
  }
  join(p: Pointer) {
    this.p = p;
    this.theta = Math.atan2(
      this.vector.y - p.vector.y,
      this.vector.x - p.vector.x
    );
    this.thread_r = p.vector.sub(this.vector).norm();
    this.vector = new Vector2(Math.cos(this.theta), Math.sin(this.theta))
      .mul(this.thread_r)
      .add(this.p.vector);
    const v_u = new Vector2(-Math.sin(this.theta), Math.cos(this.theta));
    this.v = v_u.mul(Math.sign(v_u.dot(this.v)) * this.v.norm());

    this.v_r = this.v.norm() / this.thread_r;

    this.E =
      this.m * g * this.vector.y +
      (1 / 2) * this.m * Math.pow(this.v.norm(), 2);
  }
  updateE() {
    this.E =
      this.m * g * this.vector.y +
      (1 / 2) * this.m * Math.pow(this.v.norm(), 2);
  }
  detach() {
    this.p = null;
    this.thread.clear();
  }
  update(dt: number, lines: Line[]) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.isCollide(this)) {
        if (this.p != null) {
          this.v = this.v.inverse();
          break;
        }
        const d = lines[i].d;
        let n: Vector2;
        const n1: Vector2 = new Vector2(-d.y, d.x);
        const n2: Vector2 = d;

        if (
          (line.p0.sub(this.vector).norm() <= this.r &&
            Math.abs(n2.dot(this.vector.sub(line.p0))) >
              Math.abs(n1.dot(this.vector.sub(line.p0)))) ||
          (line.p1.sub(this.vector).norm() <= this.r &&
            Math.abs(n2.dot(this.vector.sub(line.p1))) >
              Math.abs(n1.dot(this.vector.sub(line.p1))))
        ) {
          n = n2;
        } else {
          n = n1;
        }
        this.v = this.v.add(n.mul(this.v.inverse().dot(n)).mul(2));
        break;
      }
    }

    if (this.p != null) {
      const a = this.p.vector
        .sub(this.vector)
        .normalize()
        .mul(g)
        .sub(new Vector2(0, g));
      const v_u = new Vector2(-Math.sin(this.theta), Math.cos(this.theta));
      this.v = v_u.mul(Math.sign(v_u.dot(this.v)) * this.v.norm());
      this.v = this.v.add(a.mul(dt));

      this.v_r = (Math.sign(v_u.dot(this.v)) * this.v.norm()) / this.thread_r;
      this.theta += this.v_r * dt;

      let Ek = this.EE + this.E - this.m * g * this.vector.y;
      if (Ek < 0) {
        Ek = 0;
      }
      this.v = this.v.normalize().mul(Math.sqrt((2 * Ek) / this.m));

      this.vector = new Vector2(Math.cos(this.theta), Math.sin(this.theta))
        .mul(this.thread_r)
        .add(this.p.vector);

      this.thread.clear();
      this.thread.lineStyle(worldscale / 10, 0xffffff);
      this.thread.moveTo(0, 0);
      this.thread.lineTo(
        -this.thread_r * Math.cos(this.theta) * worldscale,
        this.thread_r * Math.sin(this.theta) * worldscale
      );
    } else {
      const a = new Vector2(0, -g);
      this.v = this.v.add(a.mul(dt));
      this.vector = this.vector.add(this.v.mul(dt));

      console.log(this.E);
      let Ek = this.EE + this.E - this.m * g * this.vector.y;
      if (Ek < 0) {
        Ek = 0;
      }
      this.v = this.v.normalize().mul(Math.sqrt((2 * Ek) / this.m));
    }

    if (this.EE > 0) {
      const newEE = Math.max(this.EE - 0.1, 0);
      let Ek = this.E - this.m * g * this.vector.y;
      if (Ek >= 0) {
        this.EE = newEE;
      }
    }
    // console.log(this.EE);

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
  }
}

const g = 9.8;

function setWorldScale(s: number) {
  worldscale = s;
}

export { Vector2, Ball, Line, Pointer, setWorldScale, worldscale };
