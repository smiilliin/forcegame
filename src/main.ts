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

view.x = app.screen.width / 2;
view.y = app.screen.height;

window.onresize = () => {
  view.x = app.screen.width / 2;
  view.y = app.screen.height;
};

const ball = new Ball(new Vector2(0, 35), view);
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

const chunkWidth = 100;

const chunks: Map<number, Chunk> = new Map();

class Chunk {
  n: number;
  pointers: Pointer[];
  lines: Line[];
  shown: boolean;

  constructor(n: number) {
    this.shown = false;
    this.pointers = [];
    this.lines = [];
    this.n = n;
    const chunkVector = new Vector2(n * chunkWidth, 0);
    const random_pointers_n = Math.random() * 3 + 4;
    const pointers_n = Math.random() * 3 + 4;
    for (let i = 0; i < random_pointers_n; i++) {
      const pointer = new Pointer(
        new Vector2((Math.random() - 0.5) * chunkWidth, Math.random() * 25).add(
          chunkVector
        )
      );
      this.pointers.push(pointer);
    }
    for (let i = 0; i < pointers_n; i++) {
      const pointer = new Pointer(
        new Vector2(
          (i / (pointers_n + 1) - 0.5 + 0.02 * Math.random()) * chunkWidth,
          Math.random() * 20 + 5
        ).add(chunkVector)
      );
      this.pointers.push(pointer);
    }
    const lines_n = Math.random() * 3 + 4;
    for (let i = 0; i < lines_n; i++) {
      const line = new Line(
        new Vector2(
          (Math.sign(Math.random() - 0.5) *
            (Math.random() + 0.5) *
            chunkWidth) /
            3,
          Math.random() * 25
        ).add(chunkVector),
        Math.random() * 2 * Math.PI,
        Math.random() * 8 + 4
      );

      this.lines.push(line);
    }
  }
  show(view: PIXI.Container) {
    if (this.shown) return;
    this.shown = true;
    this.pointers.forEach((pointer) => {
      view.addChild(pointer);
    });
    this.lines.forEach((line) => {
      view.addChild(line);
    });
  }
  hide(view: PIXI.Container) {
    if (!this.shown) return;
    this.shown = false;
    this.pointers.forEach((pointer) => {
      view.removeChild(pointer);
    });
    this.lines.forEach((line) => {
      view.removeChild(line);
    });
  }
}
// function addChunk(n: number) {
//   const chunkVector = new Vector2(n * chunkWidth, 0);
//   const random_pointers_n = Math.random() * 3 + 4;
//   const pointers_n = Math.random() * 3 + 4;
//   for (let i = 0; i < random_pointers_n; i++) {
//     addPointer(
//       new Vector2((Math.random() - 0.5) * chunkWidth, Math.random() * 25).add(
//         chunkVector
//       )
//     );
//   }
//   for (let i = 0; i < pointers_n; i++) {
//     addPointer(
//       new Vector2(
//         (i / (pointers_n + 1) - 0.5 + 0.02 * Math.random()) * chunkWidth,
//         Math.random() * 20 + 5
//       ).add(chunkVector)
//     );
//   }
//   const lines_n = Math.random() * 3 + 4;
//   for (let i = 0; i < lines_n; i++) {
//     addLine(
//       new Vector2(
//         (Math.sign(Math.random() - 0.5) * (Math.random() + 0.5) * chunkWidth) /
//           3,
//         Math.random() * 25
//       ).add(chunkVector),
//       Math.random() * 2 * Math.PI,
//       Math.random() * 8 + 4
//     );
//   }
// }
// const chunk = new Chunk(0);
// const chunk1 = new Chunk(1);
// const chunk2 = new Chunk(2);
// chunk.show(view);

function addChunk(n: number) {
  const chunk = new Chunk(n);
  chunks.set(n, chunk);
  return chunk;
}
function viewMoved(view: PIXI.Container, chunk_i: number) {
  pointers.splice(0);
  lines.splice(0);

  const pushChunk = (n: number) => {
    let chunk = chunks.get(n);

    if (!chunk) {
      chunk = addChunk(n);
    }
    chunk.show(view);
    pointers.push(...chunk.pointers);
    lines.push(...chunk.lines);
  };
  if (chunk_i < 0) {
    pushChunk(0);
  } else {
    pushChunk(chunk_i);
    pushChunk(chunk_i - 1);
    pushChunk(chunk_i + 1);
  }
  [...chunks.values()]
    .filter((chunk) => chunk.shown)
    .forEach((chunk) => {
      if (
        chunk.n != chunk_i &&
        chunk.n != chunk_i - 1 &&
        chunk.n != chunk_i + 1
      ) {
        chunk.hide(view);
      }
    });
}
viewMoved(view, 0);

// chunk.hide(view);
// addChunk(0);
// addChunk(1);
// addChunk(2);

// addPointer(new Vector2(0, 8));
// addPointer(new Vector2(4, 4));
// addLine(new Vector2(-2, 12), 0, 4);
// addLine(new Vector2(-2.2, 10), -90 * (Math.PI / 180), 4);
// addLine(new Vector2(20 - 10, 10), 45 * (Math.PI / 180), 4);
// addLine(new Vector2(15 - 10, 20), -60 * (Math.PI / 180), 4);
// addLine(new Vector2(15, 15), 90 * (Math.PI / 180), 4);
// addLine(new Vector2(15, 15), 0 * (Math.PI / 180), 4);
// addLine(new Vector2(15 + 4, 15), 90 * (Math.PI / 180), 4);

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

  if (event.key == "Shift") {
    ball.dash();
  }
};
document.onkeyup = (event) => {
  if (event.key == " ") {
    ball.detach();
    pressed = false;
  }
};
app.stage.on("pointerup", () => {
  ball.detach();
});

let lastTime = Date.now();

app.ticker.add(() => {
  const currentTime = Date.now();
  let dt = (currentTime - lastTime) / 1000;
  if (dt > 0.05) dt = 0.05;

  ball.update(dt, lines);
  view.x = -ball.x + app.screen.width / 2;
  const chunk = (ball.vector.x + chunkWidth / 2) / chunkWidth;

  lastTime = currentTime;
});
