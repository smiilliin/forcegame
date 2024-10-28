import * as PIXI from "pixi.js";
import { Vector2, Ball, Pointer, Line, DeathDot, ScoreDot } from "./engine";

const chunkWidth = 100;

interface ChunkObject {
  pointers: { vector: Vector2 }[];
  deathdots: { r: number; vector: Vector2 }[];
  scoredots: { r: number; score: number; vector: Vector2 }[];
  lines: { L: number; theta: number; p0: Vector2 }[];
}
class Chunk {
  n: number;
  pointers: Pointer[];
  deathdots: DeathDot[];
  scoredots: ScoreDot[];
  lines: Line[];
  shown: boolean;

  toObject(): ChunkObject {
    const pointers = this.pointers.map((v) => {
      return { vector: v.vector };
    });
    const deathdots = this.deathdots.map((v) => {
      return { r: v.r, vector: v.vector };
    });
    const scoredots = this.scoredots.map((v) => {
      return { r: v.r, score: v.score, vector: v.vector };
    });
    const lines = this.lines.map((v) => {
      return { L: v.L, p0: v.p0, theta: Math.atan2(v.d.y, v.d.x) };
    });
    return {
      pointers: pointers,
      deathdots: deathdots,
      scoredots: scoredots,
      lines: lines,
    };
  }
  fromObject(object: ChunkObject) {
    this.pointers = object.pointers.map((v) => new Pointer(v.vector));
    this.deathdots = object.deathdots.map((v) => new DeathDot(v.vector, v.r));
    this.scoredots = object.scoredots.map((v) => new ScoreDot(v.vector, v.r));
    this.lines = object.lines.map((v) => new Line(v.p0, v.theta, v.L));
  }
  constructor(n: number) {
    this.shown = false;
    this.pointers = [];
    this.lines = [];
    this.deathdots = [];
    this.scoredots = [];
    this.n = n;
    const chunkVector = new Vector2(n * chunkWidth, 0);
    const random_pointers_n = Math.random() * 3 + 4;
    const pointers_n = Math.random() * 3 + 4;
    const deathdots_n = Math.random() * 3 + 3;
    const scoredots_n = Math.random() * 3 + 5;
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
    for (let i = 0; i < deathdots_n; i++) {
      const deathdots = new DeathDot(
        new Vector2(
          (Math.sign(Math.random() - 0.5) *
            (Math.random() + 0.5) *
            chunkWidth) /
            3,
          Math.random() * 25
        ).add(chunkVector),
        Math.random() * 0.2 + 0.4
      );
      this.deathdots.push(deathdots);
    }
    for (let i = 0; i < scoredots_n; i++) {
      const scoredot = new ScoreDot(
        new Vector2(
          (Math.sign(Math.random() - 0.5) *
            (Math.random() + 0.5) *
            chunkWidth) /
            3,
          Math.random() * 25
        ).add(chunkVector),
        Math.random() * 150 + 100
      );
      this.scoredots.push(scoredot);
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
    this.deathdots.forEach((dot) => {
      view.addChild(dot);
    });
    this.scoredots.forEach((dot) => {
      if (!dot.hidden) {
        view.addChild(dot);
      }
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
    this.deathdots.forEach((dot) => {
      view.removeChild(dot);
    });
    this.scoredots.forEach((dot) => {
      view.removeChild(dot);
    });
  }
}
class Game {
  pointers: Pointer[];
  deathdots: DeathDot[];
  scoredots: ScoreDot[];
  chunks: Map<number, Chunk>;
  lines: Line[];
  ball: Ball;
  otherBalls: Map<string, Ball>;
  endTime: number;
  started: boolean;
  lastChunk: number;
  ws: WebSocket | null;

  constructor() {
    this.pointers = [];
    this.deathdots = [];
    this.scoredots = [];
    this.lines = [];
    this.otherBalls = new Map();
    this.ws = null;

    this.endTime = 0;
    this.started = false;
    this.lastChunk = 0;

    const fakeView = new PIXI.Container();
    this.ball = new Ball(new Vector2(0, 0), fakeView);
    this.chunks = new Map();
  }
  joinWs(ws: WebSocket) {
    this.ws = ws;
  }
  scoredotHide(dot: ScoreDot) {
    dot.hide();
  }
  addPlayer(id: string, view: PIXI.Container) {
    const ball = new Ball(new Vector2(0, 25), view, id);
    view.addChild(ball);
    this.otherBalls.set(id, ball);
  }
  updatePlayer(dt: number, id: string) {
    this.otherBalls.get(id)?.update(dt, this);
  }
  update(
    dt: number,
    app: PIXI.Application<PIXI.ICanvas>,
    view: PIXI.Container,
    scoretext: PIXI.Text,
    timetext: PIXI.Text
  ) {
    if (this.endTime < Date.now()) {
      this.started = false;
      return;
    }

    this.ball.update(dt, this);
    view.x = -this.ball.x + app.screen.width / 2;
    scoretext.text = `Score: ${Math.floor(this.ball.score)}`;
    timetext.text = `Time: ${Math.max(
      (this.endTime - Date.now()) / 1000,
      0
    ).toFixed(2)}`;

    const chunk = Math.floor(
      (this.ball.vector.x + chunkWidth / 2) / chunkWidth
    );

    if (this.lastChunk != chunk) {
      this.lastChunk = chunk;
      this.viewMoved(view, chunk);
    }
  }
  addChunk(n: number) {
    const chunk = new Chunk(n);
    this.chunks.set(n, chunk);
    return chunk;
  }
  start(view: PIXI.Container, id?: string) {
    if (this.started) return;

    this.started = true;
    this.endTime = Date.now() + 1000 * 100;
    this.viewMoved(view, 0);

    this.ball = new Ball(new Vector2(0, 25), view, id);
    view.addChild(this.ball);
  }
  dash() {
    if (!this.started) return;

    this.ball.dash();
  }
  detach() {
    if (!this.started) return;

    this.ball.detach();
  }
  click() {
    if (!this.started) return;
    if (this.pointers.length == 0) return;

    let minDistance = Number.MAX_VALUE;
    let minPointer: Pointer = this.pointers[0];

    this.pointers.forEach((pointer) => {
      const distance = this.ball.vector.sub(pointer.vector).norm();
      if (distance < minDistance) {
        minDistance = distance;
        minPointer = pointer;
      }
    });
    this.ball.join(minPointer);
  }

  viewMoved(view: PIXI.Container, chunk_i: number) {
    if (!this.started) return;
    this.pointers.splice(0);
    this.lines.splice(0);
    this.deathdots.splice(0);
    this.scoredots.splice(0);

    const pushChunk = (n: number) => {
      let chunk = this.chunks.get(n);

      if (!chunk) {
        chunk = this.addChunk(n);
        this.chunks.set(n, chunk);
      }
      chunk.show(view);
      this.pointers.push(...chunk.pointers);
      this.lines.push(...chunk.lines);
      this.deathdots.push(...chunk.deathdots);
      this.scoredots.push(...chunk.scoredots);
    };
    pushChunk(chunk_i);
    pushChunk(chunk_i - 1);
    pushChunk(chunk_i + 1);

    [...this.chunks.values()]
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
  delete(view: PIXI.Container) {
    this.chunks.forEach((chunk) => {
      chunk.hide(view);
    });
    Array.from(this.otherBalls.values()).forEach((ball) => {
      ball.remove(view);
      view.removeChild(ball);
    });
    this.ball.remove(view);
    view.removeChild(this.ball);
  }
}

export { Game, Chunk };
