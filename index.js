const inquirer = require("inquirer");
const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");

const hexToRGBA = (hex) => [
  parseInt(hex.slice(0, 2), 16),
  parseInt(hex.slice(2, 4), 16),
  parseInt(hex.slice(4, 6), 16),
  255,
];

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
    {
      type: "input",
      name: "gravity",
      message: "What is the strength of gravity",
      default: "10",
    },
    {
      type: "input",
      name: "x1",
      message: "Enter the X position of the first point (0 is left)",
      default: "128",
    },
    {
      type: "input",
      name: "y1",
      message: "Enter the Y position of the first point (0 is top)",
      default: "256",
    },
    {
      type: "input",
      name: "x2",
      message: "Enter the X position of the second point (0 is left)",
      default: "384",
    },
    {
      type: "input",
      name: "y2",
      message: "Enter the Y position of the second point (0 is top)",
      default: "256",
    },
    {
      type: "input",
      name: "third",
      message: "Do you want another point, to make 3 total? (y/n)",
      default: "n",
    },
  ]);

  const width = parseInt(answers.width);
  const height = parseInt(answers.height);
  const gravity = parseFloat(answers.gravity);
  let points = [
    [parseInt(answers.x1), parseInt(answers.y1)],
    [parseInt(answers.x2), parseInt(answers.y2)],
  ];

let answers2

  if (answers.third == "y") {
    let answers2 = await inquirer.prompt([
      {
        type: "input",
        name: "x3",
        message: "Enter the X position of the third point (0 is left)",
        default: "256",
      },
      {
        type: "input",
        name: "y3",
        message: "Enter the Y position of the third point (0 is top)",
        default: "128",
      },
      {
        type: "input",
        name: "fourth",
        message: "Do you want another point, to make 4 total? (y/n)",
        default: "n",
      },
    ]);
    points.push([parseInt(answers2.x3), parseInt(answers2.y3)]);
    if (answers2.fourth == "y") {
      const answers3 = await inquirer.prompt([
        {
          type: "input",
          name: "x4",
          message: "Enter the X position of the fourth point (0 is left)",
          default: "256",
        },
        {
          type: "input",
          name: "y4",
          message: "Enter the Y position of the fourth point (0 is top)",
          default: "384",
        },
      ]);
      points.push([parseInt(answers3.x4), parseInt(answers3.y4)]);
    }
  }

  let colors = [
    [0, 0, 0, 255],
    [255, 0, 0, 255],
    [0, 255, 0, 255],
    [0, 0, 255, 255],
    [255, 255, 0, 255],
  ];

  const answers4 = await inquirer.prompt([
    {
      type: "input",
      name: "color0",
      message: "What color should represent points that never touched a point?",
      default: "000000",
    },
    {
      type: "input",
      name: "color1",
      message: "What color should the first point represent?",
      default: "FF0000",
    },
    {
      type: "input",
      name: "color2",
      message: "What color should the second point represent?",
      default: "00FF00",
    },
  ]);

  colors[0] = hexToRGBA(answers4.color0);
  colors[1] = hexToRGBA(answers4.color1);
  colors[2] = hexToRGBA(answers4.color2);

  if (answers.third == "y") {
    const answers5 = await inquirer.prompt([
      {
        type: "input",
        name: "color3",
        message: "What color should the third point represent?",
        default: "0000FF",
      },
    ]);

    colors[3] = hexToRGBA(answers5.color3);

    if (answers2?.fourth == "y") {
      const answers6 = await inquirer.prompt([
        {
          type: "input",
          name: "color4",
          message: "What color should the fourth point represent?",
          default: "FFFF00",
        },
      ]);

      colors[4] = hexToRGBA(answers6.color4);
    }
  }

  const answers7 = await inquirer.prompt([
        {
          type: "input",
          name: "showpoints",
          message: "Show the points? (y/n)",
          default: "y",
        },
      ]);

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

      if (points.some(([px, py]) => Math.hypot(x - px, y - py) < 5) && answers7.showpoints == "y") {
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

    ctx.putImageData(imageData, 0, 0);
    const buffer = canvas.toBuffer("image/png");
    const filename = path.join(__dirname, "output/as the body falls.png");
    fs.writeFileSync(filename, buffer);

    console.log(`\nNice! Saved the image to ${filename}`);
  }
}

drawImage();
