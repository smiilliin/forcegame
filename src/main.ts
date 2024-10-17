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
view.y = window.innerHeight;

window.onresize = () => {
  view.x = window.innerWidth / 2;
  view.y = window.innerHeight / 2;
};

const ball = new Ball(new Vector2(-2, 25), view);
view.addChild(ball);
const g = 9.8;

const pointers: Pointer[] = [];
const lines: Line[] = [];

function addPointer(vector: Vector2) {
  const pointer = new Pointer(vector);
  view.addChild(pointer);
  pointers.push(pointer);
}
function addLine(vector: Vector2, angle: number, length: number) {
  const line = new Line(vector, angle, length);
  view.addChild(line);
  lines.push(line);
}
addPointer(new Vector2(0, 8));
addPointer(new Vector2(4, 4));
addLine(new Vector2(-2, 5), 45 * (Math.PI / 180), 4);

app.stage.on("pointerdown", () => {
  let minDistance = Number.MAX_VALUE;
  let minPointer: Pointer = pointers[0];

  pointers.forEach((pointer) => {
    const distance = ball.vector.sub(pointer.vector).norm();
    if (distance < minDistance) {
      minDistance = distance;
      minPointer = pointer;
    }
  });
  ball.join(minPointer);
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
