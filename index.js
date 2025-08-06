const inquirer = require("inquirer");
const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");

const hexToRGBA = (hex) => {
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) : 255;
  return [r, g, b, a];
};

async function drawImage() {
  const rawData = fs.readFileSync(path.join(__dirname, "palettes.txt"), "utf8");
  const lines = rawData.split(/\r?\n/);
  const palettes = {};
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    if (!trimmed.startsWith("#")) {
      currentPalette = trimmed;
      palettes[currentPalette] = [];
    } else if (currentPalette) {
      const hex = trimmed.replace(/^#/, "");
      if (/^[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/.test(hex)) {
        palettes[currentPalette].push(hex);
      }
    }
  });

  const paletteNames = Object.entries(palettes).map(([name, hexList]) => {
    const blocks = hexList
      .map((hex) => {
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) : 255;

        const block = a < 32 ? " " : a < 128 ? "░" : a < 200 ? "▒" : "█";
        return (`\x1b[38;2;${r};${g};${b}m` + block + `\x1b[0m`);
      })
      .join("");

    return `${name} ${blocks}`;
  });

  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "width",
      message: "Enter the width of the picture:",
      default: "512",
    },
    {
      type: "input",
      name: "height",
      message: "Enter the height of the picture:",
      default: "512",
    },
    {
      type: "input",
      name: "gravity",
      message: "Enter the strength of gravity:",
      default: "10",
    },
    {
      type: "input",
      name: "numPoints",
      message: "Enter the number of gravitational points:",
      default: "3",
    },
    {
      type: "confirm",
      name: "manual",
      message: "Do you want to manually choose points' positions?",
      default: false,
    },
    {
      type: "confirm",
      name: "hidepoints",
      message: "Do you want to hide the gravitational points?",
      default: true,
    },
    {
      type: "list",
      name: "palette",
      message: "Choose a palette:",
      choices: paletteNames,
    },
    {
      type: "confirm",
      name: "randomcolors",
      message: "Do you want to shuffle colors randomly?",
      default: false,
    },
  ]);

  const width = parseInt(answers.width);
  const height = parseInt(answers.height);
  const gravity = parseFloat(answers.gravity);
  const numPoints = parseInt(answers.numPoints);

  let points = [];

  if (answers.manual) {
    for (let i = 0; i < numPoints; i++) {
      const pointAnswer = await inquirer.prompt([
        {
          type: "input",
          name: "x",
          message: `Enter the X position for point ${i + 1}:`,
          default: Math.floor(width / 2),
        },
        {
          type: "input",
          name: "y",
          message: `Enter the Y position for point ${i + 1}:`,
          default: Math.floor(height / 2),
        },
      ]);
      points.push([parseInt(pointAnswer.x), parseInt(pointAnswer.y)]);
    }
  } else {
    for (let i = 0; i < numPoints; i++) {
      const randX = Math.floor(Math.random() * width);
      const randY = Math.floor(Math.random() * height);
      points.push([randX, randY]);
    }
  }

  let colors = [];
  let paletteLines = [];
  let inSelectedSection = false;
  try {
    rawData.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      if (!trimmed.startsWith("#")) {
        inSelectedSection =
          trimmed.trim().toLowerCase() === answers.palette.trim().toLowerCase();
      } else if (inSelectedSection) {
        const hex = trimmed.replace(/^#/, "");
        if (/^[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/.test(hex)) {
          paletteLines.push(hex);
        }
      }
    });
  } catch (err) {
    console.error("Failed to read palettes.txt:", err);
  }

  paletteLines.forEach((hex) => {
    const rgba = hexToRGBA(hex);
    const index = Math.floor(Math.random() * (colors.length + 1 - 1)) + 1;
    if (answers.randomcolors) {
      colors.splice(index, 0, rgba);
    } else {
      colors.push(rgba);
    }
  });

  console.log("Found " + (colors.length - 1) + " colors :)");
  if (paletteLines.length + 1 < numPoints) {
    console.error(
      `/!\\ Only ${
        paletteLines.length + 1
      } colors, cannot draw ${numPoints} points! Add more colors by editing palette.txt`
    );
  } else {
    if (width < 1 || height < 1) {
      console.log(
        "Those dimensions don't look right. Make sure they're positive numbers above 0!"
      );
    } else {
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      const imageData = ctx.createImageData(width, height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const pixelIndex = i / 4;
        const x = pixelIndex % width;
        const y = Math.floor(pixelIndex / width);

        if (
          points.some(
            ([px, py]) => Math.hypot(x - px, y - py) < 5 && !answers.hidepoints
          )
        ) {
          data[i] = 0; // R
          data[i + 1] = 0; // G
          data[i + 2] = 0; // B
          data[i + 3] = 255; // A
        } else {
          let [px, py] = [x, y];

          let vx = 0,
            vy = 0;
          let collidedIndex = -1;
          let repeats = 0;

          while (true && repeats < 100000) {
            repeats += 1;
            let ax = 0,
              ay = 0;

            for (let j = 0; j < points.length; j++) {
              const [ox, oy] = points[j];
              const dx = ox - px;
              const dy = oy - py;
              const distSq = dx * dx + dy * dy;

              if (distSq < 5) {
                collidedIndex = j;
                break;
              }

              const force = gravity / distSq;
              const dist = Math.sqrt(distSq);
              ax += force * (dx / dist);
              ay += force * (dy / dist);
            }

            if (collidedIndex >= 0) break;

            vx += ax;
            vy += ay;
            px += vx;
            py += vy;
          }

          if (collidedIndex == -1) {
            data[i] = colors[0][0]; // R
            data[i + 1] = colors[0][1]; // G
            data[i + 2] = colors[0][2]; // B
            data[i + 3] = colors[0][3]; // A
          } else {
            data[i] = colors[collidedIndex + 1][0]; // R
            data[i + 1] = colors[collidedIndex + 1][1]; // G
            data[i + 2] = colors[collidedIndex + 1][2]; // B
            data[i + 3] = colors[collidedIndex + 1][3]; // A
          }
        }
        if (
          Math.floor(pixelIndex / ((width * height) / 100)) !=
          Math.floor((pixelIndex - 1) / ((width * height) / 100))
        ) {
          const progress = Math.floor(pixelIndex / ((width * height) / 100));
          process.stdout.write(`\r${progress}%`);
        }
      }

      const outputDir = path.join(__dirname, "output");
      const baseName = "as the body falls";
      const extension = ".png";
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
      }
      const files = fs.readdirSync(outputDir);
      let nextIndex = 1;
      const regex = new RegExp(`^${baseName} (\\d+)${extension}$`);

      files.forEach((file) => {
        const match = file.match(regex);
        if (match) {
          const index = parseInt(match[1], 10);
          if (index >= nextIndex) {
            nextIndex = index + 1;
          }
        }
      });
      const filename = path.join(
        outputDir,
        `${baseName} ${nextIndex}${extension}`
      );
      ctx.putImageData(imageData, 0, 0);
      const buffer = canvas.toBuffer("image/png");
      fs.writeFileSync(filename, buffer);

      process.stdout.write(`\r100%\nNice! Saved the image to ${filename}`);
    }
  }
}

drawImage();
