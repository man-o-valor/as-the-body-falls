const inquirer = require("inquirer");
const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");

async function drawImage() {
  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "width",
      message: "Enter the width of the picture",
      default: "512",
    },
    {
      type: "input",
      name: "height",
      message: "Enter the height of the picture",
      default: "512",
    },
  ]);

  const canvas = createCanvas(
    parseInt(answers.width),
    parseInt(answers.height)
  );
  const ctx = canvas.getContext("2d");

  const imageData = ctx.createImageData(
    parseInt(answers.width),
    parseInt(answers.height)
  );
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const isWhite = Math.random() < 0.5;
    const value = isWhite ? 255 : 0;
    data[i] = value; // R
    data[i + 1] = value; // G
    data[i + 2] = value; // B
    data[i + 3] = 255; // A
  }

  ctx.putImageData(imageData, 0, 0);
  const buffer = canvas.toBuffer("image/png");
  const filename = path.join(__dirname, "output/as the body falls.png");
  fs.writeFileSync(filename, buffer);

  console.log(`✅ Image saved to ${filename}`);
}

drawImage();
