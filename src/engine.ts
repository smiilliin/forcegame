import * as PIXI from "pixi.js";
import { Game } from "./game";

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
  dashE: number;
  score: number;
  id: PIXI.Text;

  constructor(vector: Vector2, view: PIXI.Container, id?: string, v?: Vector2) {
    super();
    this.color = 0xffffff;
    this.EE = 0;
    this.dashE = 100;
    this.score = 0;

    this.thread_r = 0;
    this.r = 1 / 3;

    this.ball = new PIXI.Graphics();
    this.addChild(this.ball);

    this.thread = new PIXI.Graphics();
    this.addChild(this.thread);

    this.id = new PIXI.Text(id, { fill: 0xffffff, fontSize: 15 });
    this.id.anchor.set(0.5, 0);
    this.id.x = 0;
    this.id.y = -(this.r + 0.5) * worldscale;
    this.addChild(this.id);

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

    this.id.y = -(this.r + 0.5) * worldscale;

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
    if (this.EE != 0) return;
    this.EE = 100;
    this.color = [37 / 255, 156 / 255, 184 / 255];
    this.draw();
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
    this.thread_r = p.vector.sub(this.vector).norm() || 0.01;
    this.vector = new Vector2(Math.cos(this.theta), Math.sin(this.theta))
      .mul(this.thread_r)
      .add(this.p.vector);
    const v_u = new Vector2(-Math.sin(this.theta), Math.cos(this.theta));
    this.v = v_u.mul(Math.sign(v_u.dot(this.v)) * this.v.norm());

    this.v_r = this.v.norm() / this.thread_r;
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
  die() {
    this.vector = new Vector2(0, 25);
    this.detach();
    this.EE = 0;
    this.v = new Vector2(0, 0);
  }
  update(dt: number, game: Game) {
    const lines = game.lines;
    const deathdots = game.deathdots;
    const scoredots = game.scoredots;

    if (this.vector.y < -10) {
      this.die();
    }
    for (let i = 0; i < deathdots.length; i++) {
      const dot = deathdots[i];
      if (this.vector.sub(dot.vector).norm() <= this.r + dot.r) {
        this.die();
      }
    }
    scoredots.forEach((dot) => {
      if (!dot.hidden && this.vector.sub(dot.vector).norm() <= this.r + dot.r) {
        this.score += dot.score;
        game.scoredotHide(dot);
      }
    });

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

        const D0 = line.p0.sub(this.vector).norm() <= this.r;
        const D1 = line.p1.sub(this.vector).norm() <= this.r;

        if (D0) {
          const delta = this.vector.sub(line.p0);
          const size =
            Math.sqrt(
              Math.pow(this.r + 0.1, 2) -
                (Math.pow(delta.norm(), 2) -
                  Math.pow(delta.dot(this.v.normalize()), 2))
            ) - delta.dot(this.v.normalize());
          this.vector = this.vector.sub(this.v.normalize().mul(size));
        } else if (D1) {
          const delta = this.vector.sub(line.p1);
          const size =
            Math.sqrt(
              Math.pow(this.r + 0.1, 2) -
                (Math.pow(delta.norm(), 2) -
                  Math.pow(delta.dot(this.v.normalize()), 2))
            ) - delta.dot(this.v.normalize());
          this.vector = this.vector.sub(this.v.normalize().mul(size));
        }

        if (
          (D0 &&
            Math.abs(n2.dot(this.vector.sub(line.p0))) >
              Math.abs(n1.dot(this.vector.sub(line.p0)))) ||
          (D1 &&
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

      let Ek = this.EE + this.E - this.m * g * this.vector.y;

      if (Ek < 0) {
        Ek = 0;
      }
      this.v = this.v.normalize().mul(Math.sqrt((2 * Ek) / this.m));
    }

    if (this.EE > 0) {
      const newEE = Math.max(this.EE - 2, 0);
      let Ek = this.E - this.m * g * this.vector.y;
      if (Ek >= 0) {
        this.EE = newEE;
      }

      let r = 1 - this.EE / this.dashE;
      this.color = [
        (1 - 37 / 255) * r + 37 / 255,
        (1 - 156 / 255) * r + 156 / 255,
        (1 - 184 / 255) * r + 184 / 255,
      ];
      this.draw();
    }

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
class DeathDot extends PIXI.Graphics {
  vector: Vector2;
  r: number;

  constructor(vector: Vector2, r: number) {
    super();
    this.vector = vector.clone();
    this.r = r;

    this.beginFill(0xbb5555);
    this.drawCircle(0, 0, r * worldscale);
    this.endFill();

    this.x = vector.x * worldscale;
    this.y = -vector.y * worldscale;
  }
}
class ScoreDot extends PIXI.Graphics {
  vector: Vector2;
  r: number;
  score: number;
  hidden: boolean;

  constructor(vector: Vector2, score: number) {
    super();
    this.vector = vector.clone();
    score = Math.floor(score);
    this.r = score / 200;
    this.score = score;
    this.hidden = false;

    this.beginFill(0x55bb55);
    this.drawCircle(0, 0, this.r * worldscale);
    this.endFill();

    this.x = vector.x * worldscale;
    this.y = -vector.y * worldscale;
  }
  hide() {
    if (!this.hidden) {
      this.hidden = true;
      this.clear();
    }
  }
}

const g = 9.8;

function setWorldScale(s: number) {
  worldscale = s;
}

export {
  Vector2,
  Ball,
  Line,
  Pointer,
  DeathDot,
  ScoreDot,
  setWorldScale,
  worldscale,
};
