import * as PIXI from "pixi.js";
import { Vector2, Ball, Pointer, Line, DeathDot, ScoreDot } from "./engine";
import { Game } from "./game";

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

app.stage.on("pointerdown", () => {
  game?.click();
});

let clicked = false;
document.onkeydown = (event) => {
  if (event.key == " " && !clicked) {
    game?.click();
    clicked = true;
  }

  if (event.key == "Shift") {
    game?.dash();
  }
};
document.onkeyup = (event) => {
  if (event.key == " ") {
    game?.detach();
    clicked = false;
  }
};
app.stage.on("pointerup", () => {
  game?.detach();
});

let lastTime = Date.now();

const scoretext = new PIXI.Text("", { fill: 0xffffff });
scoretext.x = 10;
scoretext.y = 10;

const timetext = new PIXI.Text("", { fill: 0xffffff });
timetext.x = 10;
timetext.y = 50;

let game: Game | null = null;

app.ticker.add(() => {
  const currentTime = Date.now();
  let dt = (currentTime - lastTime) / 1000;
  if (dt > 0.05) dt = 0.05;
  lastTime = currentTime;

  if (!game) return;

  if (game.started) {
    game.update(dt, app, view, scoretext, timetext);
  } else {
    end.style.display = "";
    const score = game.ball.score;
    scoreText.textContent = `${score}점`;
    game.delete(view);
    app.stage.removeChild(scoretext);
    app.stage.removeChild(timetext);
    game = null;
  }
});

const modeContainer = document.getElementById("mode") as HTMLDivElement;
const end = document.getElementById("end") as HTMLDivElement;
const retry = document.getElementById("retry") as HTMLButtonElement;
const scoreText = document.getElementById("score") as HTMLParagraphElement;
const soloButton = document.getElementById("solo") as HTMLButtonElement;

soloButton.onclick = () => {
  game = new Game();
  game.start(view);
  app.stage.addChild(scoretext);
  app.stage.addChild(timetext);
  modeContainer.style.display = "none";
};

retry.onclick = () => {
  end.style.display = "none";
  modeContainer.style.display = "";
};
