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
  view.y = window.innerHeight;
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
addLine(new Vector2(20 - 10, 10), 45 * (Math.PI / 180), 4);
addLine(new Vector2(15 - 10, 20), -60 * (Math.PI / 180), 4);
addLine(new Vector2(15, 15), 90 * (Math.PI / 180), 4);
addLine(new Vector2(15, 15), 0 * (Math.PI / 180), 4);
addLine(new Vector2(15 + 4, 15), 90 * (Math.PI / 180), 4);

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

let pressed = false;
let dashed = false;
document.onkeydown = (event) => {
  if (event.key == " " && !pressed) {
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
    pressed = true;
  }

  if (event.key == "Shift" && ball.EE == 0) {
    // lastE = ball.E;
    // ball.v = ball.v.add(ball.v.normalize().mul(10));
    ball.color = [37 / 255, 156 / 255, 184 / 255];
    ball.draw();
    // ball.updateE();
    ball.dash();
    console.log();
    // dashed = true;
    // dashDec = true;
  }
};
document.onkeyup = (event) => {
  if (event.key == " ") {
    ball.detach();
    pressed = false;
  }
  // if (event.key == "Shift") {
  //   // ball.v = ball.v.add(ball.v.normalize().mul(2));

  // }
};
app.stage.on("pointerup", () => {
  ball.detach();
});

const startTime = Date.now();
let lastTime = Date.now();
let dashFadeTime: number = 0;

let d1 = false;
let d2 = false;
app.ticker.add(() => {
  const currentTime = Date.now();
  let dt = (currentTime - lastTime) / 1000;
  if (dt > 0.05) dt = 0.05;

  ball.update(dt, lines);
  if (dashFadeTime != 0) {
    let r = (currentTime - dashFadeTime) / 1000;
    if (r > 1) {
      r = 1;
      dashFadeTime = 0;
      dashed = false;
    }
    ball.color = [
      (1 - 37 / 255) * r + 37 / 255,
      (1 - 156 / 255) * r + 156 / 255,
      (1 - 184 / 255) * r + 184 / 255,
    ];
    ball.draw();
  }

  lastTime = currentTime;
});
