/*const inquirer = require("inquirer");
const { PNG } = require("pngjs");
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
  let currentPalette;
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

  const paletteChoices = Object.entries(palettes).map(([name, hexList]) => {
    const blocks = hexList
      .map((hex) => {
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) : 255;
        const block = a < 32 ? " " : a < 128 ? "░" : a < 200 ? "▒" : "█";
        return `\x1b[38;2;${r};${g};${b}m` + block + `\x1b[0m`;
      })
      .join("");
    return {
      name: `${name} ${blocks}`,
      value: name,
    };
  });

  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "width",
      message: "Width:",
      default: "512",
      validate: (input) => {
        const val = parseInt(input);
        return val >= 0 ? true : "width must be a positive number";
      },
    },
    {
      type: "input",
      name: "height",
      message: "Height:",
      default: "512",
      validate: (input) => {
        const val = parseInt(input);
        return val >= 0 ? true : "height must be a positive number";
      },
    },
    {
      type: "input",
      name: "gravity",
      message: "Gravity:",
      default: "4",
      validate: (input) => {
        const val = parseInt(input);
        return val >= 0 ? true : "Gravity must be a positive number";
      },
    },
    {
      type: "input",
      name: "drag",
      message: "Drag (0-1):",
      default: "0.05",
      validate: (input) => {
        const val = parseFloat(input);
        return val >= 0 && val <= 1 ? true : "Drag must be between 0 and 1";
      },
    },
    {
      type: "input",
      name: "collisionRadius",
      message: "Radius:",
      default: "5",
      validate: (input) => {
        const val = parseFloat(input);
        return val > 0 ? true : "Collision radius must be a positive number";
      },
    },
    {
      type: "input",
      name: "numPoints",
      message: "Number of Points:",
      default: "3",
    },
    {
      type: "confirm",
      name: "manual",
      message: "Manual Point Positions?",
      default: false,
    },
    {
      type: "confirm",
      name: "showpoints",
      message: "Show Points?",
      default: false,
    },
    {
      type: "list",
      name: "palette",
      message: "Palette:",
      choices: paletteChoices,
    },
    {
      type: "confirm",
      name: "randomcolors",
      message: "Random Colors?",
      default: false,
      when: (answers) => answers.manual === true,
    },
    {
      type: "confirm",
      name: "lightenBySteps",
      message: "Darken by Time?",
      default: false,
    },
    {
      type: "input",
      name: "physicsticks",
      message: "Give Up Timer:",
      default: "30000",
    },
  ]);

  const width = parseInt(answers.width);
  const height = parseInt(answers.height);
  const gravity = parseFloat(answers.gravity);
  const longerSide = Math.max(width, height);
  const baseDrag = 0.0005 * 2;
  const drag =
    parseFloat(answers.drag) * baseDrag * Math.pow(512 / longerSide, 2);
  const numPoints = parseInt(answers.numPoints);
  const collisionRadius = parseFloat(answers.collisionRadius);

  const outputDir = path.join(__dirname, "output");
  const baseName = "as the body falls";
  const extension = ".png";
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

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

  if (paletteLines.length + 1 < numPoints) {
    console.error(
      `/!\\ Only ${
        paletteLines.length + 1
      } colors, cannot draw ${numPoints} points! Add more colors by editing palette.txt`
    );
  } else {
    const png = new PNG({ width, height });

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (width * y + x) << 2;

        function lightenColor(color, repeats) {
          const maxDistance = Math.sqrt(width * width + height * height);
          const distance = repeats;
          let blend = 1 - Math.min(1, Math.max(0, distance / maxDistance));
          const minFactor = 1.0;
          const maxFactor = 0.3;
          const factor = minFactor - blend * (minFactor - maxFactor);
          return [
            Math.round(color[0] * factor),
            Math.round(color[1] * factor),
            Math.round(color[2] * factor),
            color[3],
          ];
        }

        if (
          points.some(
            ([px, py]) =>
              Math.hypot(x - px, y - py) < collisionRadius && answers.showpoints
          )
        ) {
          png.data[idx] = 0; // R
          png.data[idx + 1] = 0; // G
          png.data[idx + 2] = 0; // B
          png.data[idx + 3] = 255; // A
        } else {
          let [px, py] = [x, y];
          let vx = 0,
            vy = 0;
          let collidedIndex = -1;
          let repeats = 0;
          let totalDistance = 0;

          while (true && repeats < parseInt(answers.physicsticks)) {
            repeats += 1;
            let ax = 0,
              ay = 0;
            for (let j = 0; j < points.length; j++) {
              const [ox, oy] = points[j];
              const dx = (ox - px) * (512 / longerSide);
              const dy = (oy - py) * (512 / longerSide);
              const distSq = dx * dx + dy * dy;
              if (distSq < Math.pow(collisionRadius * (512 / longerSide), 2)) {
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
            vx *= 1 - drag;
            vy *= 1 - drag;
            const prevPx = px,
              prevPy = py;
            px += vx;
            py += vy;
            totalDistance += Math.sqrt(
              (px - prevPx) * (px - prevPx) + (py - prevPy) * (py - prevPy)
            );
          }

          if (collidedIndex == -1) {
            let color = colors[0];
            if (answers.lightenBySteps) {
              color = lightenColor(color, totalDistance);
            }
            png.data[idx] = color[0]; // R
            png.data[idx + 1] = color[1]; // G
            png.data[idx + 2] = color[2]; // B
            png.data[idx + 3] = color[3]; // A
          } else {
            let color = colors[collidedIndex + 1] || colors[0];
            if (answers.lightenBySteps) {
              color = lightenColor(color, totalDistance);
            }
            png.data[idx] = color[0]; // R
            png.data[idx + 1] = color[1]; // G
            png.data[idx + 2] = color[2]; // B
            png.data[idx + 3] = color[3]; // A
          }
        }
        const pixelIndex = y * width + x;
        if (
          Math.floor(pixelIndex / ((width * height) / 100)) !=
          Math.floor((pixelIndex - 1) / ((width * height) / 100))
        ) {
          const progress = Math.floor(pixelIndex / ((width * height) / 100));
          process.stdout.write(`\r${progress}%`);
        }
      }
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

    png.text = {
      Title: "as the body falls",
      Author: "Man-o-Valor",
      Description:
        "Generated by https://github.com/man-o-valor/as-the-body-falls/\nThis is not an AI-generated image.",
    };

    const outputBuffer = PNG.sync.write(png);
    fs.writeFileSync(filename, outputBuffer);
    process.stdout.write(`\r100%\nNice! Saved the image to ${filename}`);
  }
}

drawImage();*/

const fs = require("node:fs");
const path = require("node:path");
const { Client, Collection, GatewayIntentBits } = require("discord.js");
const { token } = require("./config.json");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();
const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

const logchannel = client.channels.cache.get("1217859665648680991");
const errorchannel = client.channels.cache.get("1217859723320361041");

module.exports = { logchannel, errorchannel };

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property (it needs both).`
      );
    }
  }
}

const eventsPath = path.join(__dirname, "events");
const eventFiles = fs
  .readdirSync(eventsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

client.login(token).catch((error) => {
  console.error("Error logging in:", error);
});
