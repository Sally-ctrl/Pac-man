// board
let board;
const rowCount = 21;
const columnCount = 19;
const tileSize = 32;
const boardWidth = columnCount * tileSize;
const boardHeight = rowCount * tileSize;
const tileMap = [
    "XXXXXXXXXXXXXXXXXXX",
    "X*       X      X X",
    "X XX XXX X XXX XX X",
    "X                 X",
    "X XX X XXXXX X XX X",
    "X    X       X   *X",
    "XXXX XXXXXXXXX XXXX",
    "OOOX X       X XOOO",
    "XXXX X XXrXX X XXXX",
    "O       bpo       O",
    "XXXX X XXXXX X XXXX",
    "OOOX X       X XOOO",
    "XXXX X XXXXX X XXXX",
    "X        X        X",
    "X XX XXX X XXX XX X",
    "X  X     P     X  X",
    "XX X X XXXXX X X XX",
    "X*   X   X   X    X",
    "X XXXXXX X XXXXXX X",
    "X X              *X",
    "XXXXXXXXXXXXXXXXXXX"
];

let context;

// images
let blueGhostImage;
let orangeGhostImage;
let pinkGhostImage;
let redGhostImage;
let scaredGhostImage;

let pacmanUpImage;
let pacmanDownImage;
let pacmanLeftImage;
let pacmanRightImage;
let wallImage;

const walls = new Set();
const foods = new Set();
const ghosts = new Set();
const CherryImages = new Set();
let pacman;
let Cherry;

const direction = ['U', 'D', 'L', 'R'];
let score = 0;
let lives = 3;
let gameOver = false;
let gameWon = false;

function loadImages() {
    wallImage = new Image();
    wallImage.src = "./wall.png"

    scaredGhostImage = new Image();
    scaredGhostImage.src = "./scaredGhost.png"

    blueGhostImage = new Image();
    blueGhostImage.src = "./blueGhost.png"

    orangeGhostImage = new Image();
    orangeGhostImage.src = "./orangeGhost.png"

    pinkGhostImage = new Image();
    pinkGhostImage.src = "./pinkGhost.png"

    redGhostImage = new Image();
    redGhostImage.src = "./redGhost.png"

    pacmanUpImage = new Image();
    pacmanUpImage.src = "./pacmanUp.png"

    pacmanDownImage = new Image();
    pacmanDownImage.src = "./pacmanDown.png"

    pacmanLeftImage = new Image();
    pacmanLeftImage.src = "./pacmanLeft.png"

    pacmanRightImage = new Image();
    pacmanRightImage.src = "./pacmanRight.png"

    Cherry = new Image();
    Cherry.src = "./cherry.png"

}

window.onload = function () {
    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d");
    loadImages();
    loadMap();
    for (let ghost of ghosts.values()) {
        newDirection_generation(ghost);
    }
    update();
    // key listener
    document.addEventListener("keyup", movePacman);
}

function move() {
    //check if pac-man is perfectly aligned with the grid
    if (pacman.x % tileSize === 0 && pacman.y % tileSize === 0) {
        let prevDir = pacman.direction;
        pacman.updateDirection(pacman.nextDirection);

        for (let wall of walls.values()) {
            if (collision(pacman, wall)) {
                pacman.updateDirection(prevDir);
                break;
            }
        }
    }
    if (pacman.direction == 'U') {
        pacman.image = pacmanUpImage;
    }
    else if (pacman.direction == 'D') {
        pacman.image = pacmanDownImage;
    }
    else if (pacman.direction == 'R') {
        pacman.image = pacmanRightImage;
    }
    else if (pacman.direction == 'L') {
        pacman.image = pacmanLeftImage;
    }
    pacman.x += pacman.velocityX;
    pacman.y += pacman.velocityY;
    handleTunnelWrap(pacman);

    // wall collision
    for (let wall of walls.values()) {

        if (collision(pacman, wall)) {
            pacman.x -= pacman.velocityX;
            pacman.y -= pacman.velocityY;

            break;
        }
    }

    for (let ghost of ghosts.values()) {
        let scaredGhost_remove = null;
        if (collision(pacman, ghost)) {
            if (ghost.scared) {
                score += 100;
                scaredGhost_remove = ghost;
                ghosts.delete(scaredGhost_remove);
            }
            else {
                lives -= 1;
                if (lives == 0) {
                    gameOver = true;
                    return;
                }
                resetPositions();
            }
        }

        if (ghost.y == tileSize * 9 && ghost.direction != 'U' && ghost.direction != 'D') {
            ghost.updateDirection('U')
        }

        ghost.x += ghost.velocityX;
        ghost.y += ghost.velocityY;
        handleTunnelWrap(ghost);
        for (let wall of walls.values()) {
            if (collision(ghost, wall)) {
                ghost.x -= ghost.velocityX;
                ghost.y -= ghost.velocityY;
                newDirection_generation(ghost);
            }
        }
    }

    // checking for food collisions
    let foodEaten = null;
    for (let food of foods.values()) {
        if (collision(pacman, food)) {
            foodEaten = food;
            score += 10
            break;
        }
    }
    foods.delete(foodEaten);

    //cherry collision
    let eatenCherry = null;
    for (let cherry of CherryImages.values()) {
        if (collision(pacman, cherry)) {
            ScaredGhost_generation();
            eatenCherry = cherry;
            break;
        }
    }
    CherryImages.delete(eatenCherry);

    if (foods.size === 0 && !gameOver) {
        gameOver = true;
        gameWon = true;
        return;
    }
}

function ScaredGhost_generation() {
    // picking a random ghost from the Set
    const ghostArray = Array.from(ghosts);
    const randomIndex = Math.floor(Math.random() * ghostArray.length);
    const randomGhost = ghostArray[randomIndex];

    // if it’s already scared, don’t retrigger
    if (randomGhost.scared) return;

    randomGhost.scared = true;
    randomGhost.normalImage = randomGhost.image;
    randomGhost.image = scaredGhostImage;

    setTimeout(() => {
        randomGhost.scared = false;
        randomGhost.image = randomGhost.normalImage;
    }, 7000);
}


function handleTunnelWrap(entity) {
    // entity can be pacman or ghost
    if (entity.y % tileSize === 0) {
        if (entity.x <= 0) {
            entity.x = (columnCount - 1) * tileSize;
        }
        else if (entity.x + entity.width >= boardWidth) {
            entity.x = 0;
        }
    }
}

function movePacman(e) {
    if (gameOver) {
        if (e.code === "Enter") {

            loadMap();
            resetPositions();
            lives = 3;
            score = 0;
            gameOver = false;
            gameWon = false;
            update();
        }
        return;
    }

    if (e.code == "ArrowUp" || e.code == "keyW") {
        pacman.nextDirection = 'U';
    }
    if (e.code == "ArrowDown" || e.code == "keyS") {
        pacman.nextDirection = 'D';
    }
    if (e.code == "ArrowLeft" || e.code == "keyA") {
        pacman.nextDirection = 'L';
    }
    if (e.code == "ArrowRight" || e.code == "keyD") {
        pacman.nextDirection = 'R';
    }

    //update pacman images
    if (pacman.direction == 'U') {
        pacman.image = pacmanUpImage;
    }
    else if (pacman.direction == 'D') {
        pacman.image = pacmanDownImage;
    }
    else if (pacman.direction == 'R') {
        pacman.image = pacmanRightImage;
    }
    else if (pacman.direction == 'L') {
        pacman.image = pacmanLeftImage;
    }


}

function update() {
    if (gameOver) {
        return;
    }
    move();
    draw();
    setTimeout(update, 50); // recursive
}

function draw() {
    context.clearRect(0, 0, board.width, board.height);
    context.drawImage(pacman.image, pacman.x, pacman.y, pacman.width, pacman.height);
    for (let ghost of ghosts.values()) {
        context.drawImage(ghost.image, ghost.x, ghost.y, ghost.width, ghost.height);
    }

    for (let wall of walls.values()) {
        context.drawImage(wall.image, wall.x, wall.y, wall.width, wall.height);
    }

    context.fillStyle = "white";
    for (let food of foods.values()) {
        context.fillRect(food.x, food.y, food.width, food.height);
    }

    //score
    context.fillStyle = "white";
    context.font = "18px sans-serif";
    for (let oneCherry of CherryImages.values()) {
        context.drawImage(oneCherry.image, oneCherry.x, oneCherry.y, oneCherry.width, oneCherry.height);
    }
    if (gameOver) {
        if (gameWon) {
            context.fillText("You Win! Score: " + String(score), tileSize / 2, tileSize / 2);
        } else {
            context.fillText("Game Over: " + String(score), tileSize / 2, tileSize / 2);
        }
        context.fillText("Press Enter to Restart", tileSize / 2, tileSize);
    } else {
        context.fillText("x" + String(lives) + " " + String(score), tileSize / 2, tileSize / 2);
    }
}

// AABB overlap
function collision(a, b) {
    return a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y;
}

function shrinkBox(box, margin = 4) {
    return {
        x: box.x + margin,
        y: box.y + margin,
        width: box.width - margin * 2,
        height: box.height - margin * 2
    };
}

function loadMap() {
    walls.clear();
    foods.clear();
    ghosts.clear();

    for (let r = 0; r < rowCount; r++) {
        for (let c = 0; c < columnCount; c++) {
            const row = tileMap[r];
            const tileMapChar = row[c];

            const x = c * tileSize;
            const y = r * tileSize

            if (tileMapChar == 'X') {
                const wall = new Block(wallImage, x, y, tileSize, tileSize);
                walls.add(wall);
            }
            else if (tileMapChar == 'b') {
                const ghost = new Block(blueGhostImage, x, y, tileSize, tileSize);
                ghosts.add(ghost);

            }

            else if (tileMapChar == 'o') {
                const ghost = new Block(orangeGhostImage, x, y, tileSize, tileSize);
                ghosts.add(ghost);

            }
            else if (tileMapChar == 'p') {
                const ghost = new Block(pinkGhostImage, x, y, tileSize, tileSize);
                ghosts.add(ghost);

            }
            else if (tileMapChar == 'r') {
                const ghost = new Block(redGhostImage, x, y, tileSize, tileSize);
                ghosts.add(ghost);

            }
            else if (tileMapChar == 'P') {
                pacman = new Block(pacmanRightImage, x, y, tileSize, tileSize);
            }
            else if (tileMapChar == '*') {
                const cherry = new Block(Cherry, x, y, tileSize, tileSize);
                CherryImages.add(cherry)
            }
            else if (tileMapChar == ' ') { // empty is food
                const food = new Block(null, x + 14, y + 14, 4, 4);
                foods.add(food);
            }
        }
    }
}

function resetPositions() {
    pacman.reset();
    pacman.velocityX = 0;
    pacman.velocityY = 0;
    pacman.direction = '';
    pacman.nextDirection = '';
    for (let ghost of ghosts.values()) {
        ghost.reset();
        newDirection_generation(ghost);
    }
}

function newDirection_generation(ghost) {
    const newDirection = direction[Math.floor(Math.random() * 4)];
    ghost.updateDirection(newDirection);
}

class Block {
    constructor(image, x, y, width, height) {
        this.image = image;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        this.startX = x;
        this.startY = y;

        this.direction = '';
        this.velocityX = 0;
        this.velocityY = 0;

        this.scared = false;

        this.nextDirection = this.direction;


    }

    updateDirection(direction) {
        const prevDirection = this.direction;
        this.direction = direction;
        this.updateVelocity();
        this.x += this.velocityX;
        this.y += this.velocityY;
        for (let wall of walls.values()) {

            if (collision(this, wall)) {
                console.log("wall collision", { wall })
                this.x -= this.velocityX;
                this.y -= this.velocityY;
                this.direction = prevDirection;
                this.updateVelocity();
                return;
            }
        }
    }

    updateVelocity() {
        if (this.direction == 'U') {
            this.velocityX = 0;
            this.velocityY = -tileSize / 4;
        }
        if (this.direction == 'D') {
            this.velocityX = 0;
            this.velocityY = tileSize / 4;
        }
        if (this.direction == 'L') {
            this.velocityX = -tileSize / 4;
            this.velocityY = 0;
        }
        if (this.direction == 'R') {
            this.velocityX = tileSize / 4;
            this.velocityY = 0;
        }

    }

    reset() {
        this.x = this.startX;
        this.y = this.startY;
    }
}
