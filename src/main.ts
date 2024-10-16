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
  clone(): Vector2 {
    return new Vector2(this.x, this.y);
  }
}

class Pointer extends PIXI.Graphics {
  vector: Vector2;
  r: number;

  constructor(vector: Vector2, r: number) {
    super();
    this.beginFill(0xffffff);
    this.drawCircle(0, 0, 8);
    this.endFill();
    this.vector = vector.clone();
    this.r = r;
    this.x = vector.x * 10;
    this.y = -vector.y * 10;
  }
}

class Ball extends PIXI.Container {
  vector: Vector2;
  E: number;
  theta: number;
  v: Vector2;
  v_r: number;
  p: Pointer | null;
  m: number;
  v_vector: PIXI.Graphics;

  constructor() {
    super();
    const ball = new PIXI.Graphics();

    ball.beginFill(0xffffff);
    ball.drawCircle(0, 0, 6);
    ball.endFill();
    this.addChild(ball);

    this.v_vector = new PIXI.Graphics();
    this.v_vector.lineStyle(2, 0xff0000);
    this.v_vector.moveTo(0, 0);
    this.v_vector.lineTo(10, 0);
    this.addChild(this.v_vector);

    this.theta = 0;
    this.p = null;
    this.m = 1;

    this.vector = new Vector2(0, 0);
    this.v = new Vector2(0, 0);
    this.v_r = 0;

    this.E = (1 / 2) * this.m * Math.pow(this.v.norm(), 2);
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
    console.log(this.vector.x, this.vector.y);
    // const v_u = new Vector2(Math.sin(this.theta), -Math.cos(this.theta));
    // this.v = v_u.mul(this.v.norm());
    // this.v_r = this.v.norm() / p.r;

    this.E =
      this.m * g * this.vector.y +
      (1 / 2) * this.m * Math.pow(this.v.norm(), 2);
  }
  update(dt: number) {
    if (this.p == null) return;
    const a = this.p.vector
      .sub(this.vector)
      .normalize()
      .mul(g)
      .sub(new Vector2(0, g));
    const v_u = new Vector2(Math.sin(this.theta), -Math.cos(this.theta));
    this.v = this.v.add(a.mul(dt));
    this.v_r = (v_u.dot(this.v.div(this.v.norm())) * this.v.norm()) / this.p.r;
    // console.log(this.v.x, this.v.y);
    // this.v_vector.rotation = Math.PI / 2;

    this.v_vector.clear();
    this.v_vector.lineStyle(2, 0xff0000);
    this.v_vector.moveTo(0, 0);
    this.v_vector.lineTo(v_u.x * 10, -v_u.y * 10);

    // console.log(v_u.dot(this.v.div(this.v.norm())));
    this.theta += this.v_r * dt;
    // this.v_vector.rotation = -(this.theta);
    this.vector = new Vector2(Math.cos(this.theta), Math.sin(this.theta))
      .mul(this.p.r)
      .add(this.p.vector);
    let Ek = this.E - this.m * g * this.vector.y;
    if (Ek < 0) {
      Ek = 0;
    }
    // console.log(Ek);
    this.v = this.v.div(this.v.norm()).mul(Math.sqrt((2 * Ek) / this.m));
    // this.v_r = this.v.norm() / this.p.r;

    // console.log(this.theta);
    this.x = this.vector.x * 10;
    this.y = -this.vector.y * 10;
  }
}

const g = 9.8;

const p = new Pointer(new Vector2(3, 3), 4);
const ball = new Ball();
ball.vector.x = 10;
ball.vector.y = 10;

ball.join(p);

view.addChild(p);
view.addChild(ball);
view.x = window.innerWidth / 2;
view.y = window.innerHeight / 2;

let lastTime = Date.now();
app.ticker.add(() => {
  const currentTime = Date.now();
  let dt = (currentTime - lastTime) / 1000;

  ball.update(dt);
  // console.log(ball.v);

  lastTime = currentTime;
});
