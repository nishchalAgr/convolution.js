const img = new Image();
img.crossOrigin = "anonymous";
img.src =
  "https://i.guim.co.uk/img/media/8a840f693b91fe67d42555b24c6334e9298f4680/251_1497_2178_1306/master/2178.jpg?width=1200&height=1200&quality=85&auto=format&fit=crop&s=eeb2238745a593ec04237613a5798b3b";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let conv = [
  [1, 2, 1],
  [0, 0, 0],
  [-1, -2, -1]
]

let centerRow = parseInt(conv.length/2);
let centerCol = parseInt(conv[0].length/2);

let imgW = canvas.width;
let imgH = parseInt(canvas.height/2);

let convRow = 3;
let convCol = 3;

img.addEventListener("load", () => {
  ctx.drawImage(
    img, 
    0, 0, img.width, img.height, 
    0, 0, imgW, imgH
  );
  //convolution();
  setInputGrid();
});

const grayscale = (imageData, enable) => {
  if(!enable) return imageData;
  for(let i = 0; i < imageData.data.length; i += 4) {
    let avg = (imageData.data[i] + 
               imageData.data[i+1] + 
               imageData.data[i+2])/3 ;
    imageData.data[i] = avg;
    imageData.data[i+1] = avg;
    imageData.data[i+2] = avg;
  }
  return imageData;
}

const setInputGrid = () => {
  let colHtml = `<div class="column"><input value="0" size="2"></input></div>`
  let s = "";
  for(let r = 0; r < convRow; r++){
    s += `<div class="row">`;
    for(let c = 0; c < convCol; c++){
      s += colHtml;
    }
    s += `</div>`
  }
  document.getElementById("table").innerHTML = s;
}

const incGrid = (d) => {
  convRow += 2 * d;
  convCol += 2 * d;
  if(convRow < 3) convRow = 3
  if(convCol < 3) convCol = 3
  setInputGrid()
}

const getInputGrid = () => {
  conv = []
  let rowsArr = document.getElementById('table').children;
  for (let r = 0; r < rowsArr.length; r++) {
    let colsArr = rowsArr[r].children;
    let a = []
    for (let c = 0; c < colsArr.length; c++) {
      a.push(colsArr[c].children[0].value);
    }
    conv.push(a);
  }
  convolution();
}

const normConv = () => {
  let total = 0;
  for(let row = 0; row < conv.length; row++) {
    for(let col = 0; col < conv[0].length; col++) {
      total += conv[row][col];
    }
  }
  for(let row = 0; row < conv.length; row++) {
    for(let col = 0; col < conv[0].length; col++) {
      conv[row][col] *= 1/total;
    }
  }
}

const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

const norm = (num, min, max) => (num - min) / (max - min);

const getPixel = (data, row, col) => {
  let i = row * 4 * imgW + col * 4;
  if(row < 0 || row >= imgH || col < 0 || col >= imgW)
    return {r: 0, g: 0, b: 0};
  return {r: data[i], g: data[i+1], b: data[i+2]};
};

let minR = 255;
let maxR = 0;
let minG = 255;
let maxG = 0;
let minB = 255;
let maxB = 0;

const convAtPixel = (data, r, c) => {
  total = {r:0, g:0, b:0};
  for(let row = 0; row < conv.length; row++) {
    for(let col = 0; col < conv[0].length; col++) {
      let currentRow = r + (row - centerRow);
      let currentCol = c + (col - centerCol);
      let dir = conv[row][col];
      let val = getPixel(data, currentRow, currentCol);
      total.r += val.r * dir;
      total.g += val.g * dir;
      total.b += val.b * dir;
    }
  }
  minR = Math.min(minR, total.r);
  maxR = Math.max(maxR, total.r);
  minG = Math.min(minR, total.g);
  maxG = Math.max(maxR, total.g);
  minB = Math.min(minR, total.b);
  maxB = Math.max(maxR, total.b);
  return total;
}

const convolution = () => {
  //normConv()
  const origData = ctx.getImageData(0, 0, imgW, imgH);
  let data = origData.data;
  let imageData = ctx.createImageData(canvas.width, parseInt(canvas.height/2));
  for(let row = 0; row < imgH; row++) {
    for(let col = 0; col < imgW; col++) {
      let currentConv = convAtPixel(data, row, col);
      //let currentConv = getPixel(data, row, col)
      let i = row * 4 * imgW + col * 4;
      imageData.data[i] = currentConv.r;
      imageData.data[i+1] = currentConv.g;
      imageData.data[i+2] = currentConv.b;
      imageData.data[i+3] = data[i+3];
    }
  }

  for(let i = 0; i < imageData.data.length; i += 4) {
    imageData.data[i] = norm(imageData.data[i], minR, maxR) * 255;
    imageData.data[i+1] = norm(imageData.data[i+1], minG, maxG) * 255;
    imageData.data[i+2] = norm(imageData.data[i+2], minB, maxB) * 255;
  }

  let gray = (document.getElementById('gray').checked);
  ctx.putImageData(origData, 0, 0);
  ctx.putImageData(grayscale(imageData, gray), 0, parseInt(canvas.height/2));
}
