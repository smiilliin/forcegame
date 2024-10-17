import * as PIXI from "pixi.js";
import {
  Vector2,
  Ball,
  Pointer,
  Line,
  worldscale,
  setWorldScale,
} from "./engine";

const app = new PIXI.Application({
  background: "#000000",
  resizeTo: document.body,
});

document.body.appendChild(app.view as HTMLCanvasElement);

app.stage.eventMode = "static";
app.stage.hitArea = app.screen;

const view = new PIXI.Container();

app.stage.addChild(view);

view.x = window.innerWidth / 2;
view.y = window.innerHeight / 2;

window.onresize = () => {
  view.x = window.innerWidth / 2;
  view.y = window.innerHeight / 2;
};

const ball = new Ball(new Vector2(-2, 10), view);
view.addChild(ball);
const g = 9.8;

const pointer = new Pointer(new Vector2(0, 0));
view.addChild(pointer);

const line = new Line(new Vector2(-2, -3), new Vector2(1, 0), 3);
view.addChild(line);

const lines = [line];

// ball.join(pointer);
app.stage.on("pointerdown", () => {
  ball.join(pointer);
});
app.stage.on("pointerup", () => {
  ball.detach();
});

const startTime = Date.now();
let lastTime = Date.now();

let d1 = false;
let d2 = false;
app.ticker.add(() => {
  const currentTime = Date.now();
  let dt = (currentTime - lastTime) / 1000;
  if (dt > 0.05) dt = 0.05;

  ball.update(dt, lines);

  if ((currentTime - startTime) / 1000 > 0.8 && !d1) {
    ball.detach();
    d1 = true;
  }
  if ((currentTime - startTime) / 1000 > 1.2 && !d2) {
    // ball.join(pointer);
    d2 = true;
  }

  lastTime = currentTime;
});
