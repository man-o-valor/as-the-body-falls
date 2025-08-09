const { SlashCommandBuilder, AttachmentBuilder, heading } = require("discord.js");
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

module.exports = {
  data: new SlashCommandBuilder()
    .setName("atbf")
    .setDescription("Generate an image with as the body falls")
    .addStringOption((option) =>
      option.setName("width").setDescription("Width of the image (default 200, max 400)")
    )
    .addStringOption((option) =>
      option
        .setName("height")
        .setDescription("Height of the image (default 200, max 400)")
    )
    .addStringOption((option) =>
      option.setName("precision").setDescription("Length of a tick (default 4)")
    )
    .addStringOption((option) =>
      option
        .setName("drag")
        .setDescription("Drag applied to planets (default 0.05)")
    )
    .addStringOption((option) =>
      option
        .setName("radius")
        .setDescription("Collision radius of the gravity points (default 5)")
    )
    .addStringOption((option) =>
      option
        .setName("points")
        .setDescription("Number of gravity points (default 3)")
    )
    .addStringOption((option) =>
      option
        .setName("palette")
        .setDescription('Palette to use (default "Retro")')
        .addChoices(
          { name: "Autumn", value: "autumn" },
          { name: "Bubblegum", value: "bubblegum" },
          { name: "Cliffs", value: "cliffs" },
          { name: "Ghost", value: "ghost" },
          { name: "Coffee", value: "coffee" },
          { name: "Window", value: "window" },
          { name: "Mocha", value: "mocha" },
          { name: "Frappé", value: "frappé" },
          { name: "Seafloor", value: "seafloor" },
          { name: "Inferno", value: "inferno" },
          { name: "Firelight", value: "firelight" },
          { name: "Glacier", value: "glacier" },
          { name: "Souls", value: "souls" },
          { name: "Acidic", value: "acidic" },
          { name: "Retro", value: "retro" },
          { name: "Blackhole", value: "blackhole" },
          { name: "Desmos", value: "desmos" },
          { name: "Monokai", value: "monokai" }
        )
    )
    .addStringOption((option) =>
      option
        .setName("giveup")
        .setDescription(
          "How many ticks to run before giving up (default 30000)"
        )
    ),
  async execute(interaction) {
    await interaction.deferReply();
    const rawData = fs.readFileSync(
      path.join(__dirname, "../../palettes.txt"),
      "utf8"
    );
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

    let width = parseInt(interaction.options.getString("width") ?? "200");
    let height = parseInt(interaction.options.getString("height") ?? "200");
    if (width > 400) {
      width = 400;
    }
    if (height > 400) {
      height = 400;
    }
    const gravity = parseInt(interaction.options.getString("precision") ?? "4");
    const longerSide = Math.max(width, height);
    const baseDrag = 0.0005 * 2;
    const drag =
      parseFloat(interaction.options.getString("drag") ?? "0.05") *
      baseDrag *
      Math.pow(200 / longerSide, 2);
    const numPoints = parseInt(interaction.options.getString("points") ?? "3");
    const collisionRadius = parseInt(
      interaction.options.getString("radius") ?? "5"
    );

    let points = [];
    for (let i = 0; i < numPoints; i++) {
      const randX = Math.floor(Math.random() * width);
      const randY = Math.floor(Math.random() * height);
      points.push([randX, randY]);
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
            trimmed.trim().toLowerCase() ===
            (interaction.options.getString("palette") ?? "retro")
              .trim()
              .toLowerCase();
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
      colors.push(rgba);
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

          let [px, py] = [x, y];
          let vx = 0,
            vy = 0;
          let collidedIndex = -1;
          let repeats = 0;
          let totalDistance = 0;

          while (
            true &&
            repeats <
              parseInt(interaction.options.getString("giveup") ?? "30000")
          ) {
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
            png.data[idx] = color[0]; // R
            png.data[idx + 1] = color[1]; // G
            png.data[idx + 2] = color[2]; // B
            png.data[idx + 3] = color[3]; // A
          } else {
            let color = colors[collidedIndex + 1] || colors[0];
            png.data[idx] = color[0]; // R
            png.data[idx + 1] = color[1]; // G
            png.data[idx + 2] = color[2]; // B
            png.data[idx + 3] = color[3]; // A
          }

          const pixelIndex = y * width + x;
          if (
            Math.floor(pixelIndex / ((width * height) / 100)) !=
              Math.floor((pixelIndex - 1) / ((width * height) / 100)) &&
            Math.floor(pixelIndex / ((width * height) / 100)) % 10 === 0
          ) {
            const progress = Math.floor(pixelIndex / ((width * height) / 100));
            await interaction.editReply({
              content: "~" + progress + "%",
            });
          }
        }
      }

      png.text = {
        Title: "as the body falls",
        Author: "Man-o-Valor",
        Description:
          "Generated by https://github.com/man-o-valor/as-the-body-falls/\nThis is not an AI-generated image.",
      };

      const attachment = new AttachmentBuilder(PNG.sync.write(png), {
        name: `as the body falls.png`,
      });
      await interaction.editReply({
        files: [attachment],
        content: "",
      });
    }
  },
};
