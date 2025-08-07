# ☄️ as the body falls 🌀

Welcome to the repository for **as the body falls**, a node applicaton for your terminal that generates images based on falling planets. It supports custom palettes, planets, and parameters, and there's endless possibilities and permutations!

So how does this all work? Basically, you get to choose the number and position of "gravity points" on your image that have mass. Then for each pixel, it drops a little planet that falls toward the points. The point that it falls into determines the color of the pixel!

![Example 1](/example1.png)

## How do I use it?

Clone this repository in your terminal with `git clone` or download it from this page and unzip it. Next, install [Node.js](https://nodejs.org/) and run `npm i` from that folder. This will set up the correct packages you need automatically! Now you can create images in your terminal with `node .`.

![Example 2](/example2.png)

## Parameter index

- Width | The width of the image
- Height | The width of the image
- Gravity | The precision of the image, lower number = more precise
- Drag | The simplicity of the image, lower number = more complex
- Radius | Collision radius of each gravity point, lower number = slower calculation, more precise
- Number of Points | Number of gravity points in the image, higher number = more colors, faster, more chaotic
- Manual Point Positions? | Choose whether to have the points randomly placed or choose their placement manually. Both choices can make beautifully organized or chaotic pictures :)
- Show Points? | Choose whether to render the points in the image or have them invisible. Render size affected by Radius
- Palette | Choose the palette to render the image in. Depending on Number of Points, some palettes may not have enough colors. Also see Custom Palettes!
- Random Colors? | Choose whether to shuffle the colors in the palette randomly or keep them in order. Only appears if Manual Point Positions is Yes
- Give Up Timer | Number of physics steps the renderer takes before it calls it a day and marks a pixel with the failure color, higher number = slower calculation, possibly more complete images

![Example 3](/example3.png)

## Custom Palettes

The included `palettes.txt` has lots of palettes for you to try, but feel free to edit it and add your own! Palette names can have spaces and as many colors as you want. The first color is the failure color and might not show up on some high-drag images.

![Example 4](/example4.png)