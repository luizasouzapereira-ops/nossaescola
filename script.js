const canvas = document.getElementById("enduroCanvas");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");
const speedElement = document.getElementById("speed");
const btnStart = document.getElementById("btnStart");

// Configurações do Jogo
let gameRunning = false;
let score = 0;
let baseSpeed = 4;
let roadOffset = 0;
let timeCycle = 0; // Controla dia/noite

// Jogador
const player = {
    x: canvas.width / 2 - 20,
    y: canvas.height - 90,
    width: 40,
    height: 65,
    speedX: 6,
    color: "#e63946"
};

// Controles
const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false
};

// Inimigos
let enemies = [];
const enemyColors = ["#f1faee", "#a8dadc", "#ffb703", "#8338ec", "#06d6a0"];

// Eventos de Teclado (evita rolagem da página com as setas)
window.addEventListener("keydown", (e) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
    }
    if (e.key in keys) keys[e.key] = true;
});

window.addEventListener("keyup", (e) => {
    if (e.key in keys) keys[e.key] = false;
});

btnStart.addEventListener("click", startGame);

function startGame() {
    gameRunning = true;
    score = 0;
    baseSpeed = 5;
    timeCycle = 0;
    enemies = [];
    player.x = canvas.width / 2 - player.width / 2;
    btnStart.style.display = "none";
    requestAnimationFrame(gameLoop);
}

// Desenha um carro estilo retrô
function drawCar(x, y, width, height, color, isNight) {
    // Corpo principal
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);

    // Teto / Cabine
    ctx.fillStyle = "#1d3557";
    ctx.fillRect(x + 6, y + 15, width - 12, height - 30);

    // Rodas
    ctx.fillStyle = "#000";
    ctx.fillRect(x - 4, y + 8, 4, 14);
    ctx.fillRect(x + width, y + 8, 4, 14);
    ctx.fillRect(x - 4, y + height - 22, 4, 14);
    ctx.fillRect(x + width, y + height - 22, 4, 14);

    // Faróis ou lanternas traseiras à noite
    if (isNight) {
        ctx.fillStyle = "#ffbe0b";
        ctx.fillRect(x + 4, y + height - 4, 8, 4);
        ctx.fillRect(x + width - 12, y + height - 4, 8, 4);
    }
}

// Cria carros adversários
function spawnEnemy() {
    if (Math.random() < 0.03) {
        const laneWidth = 260;
        const roadLeft = (canvas.width - laneWidth) / 2;
        const enemyWidth = 40;
        const randomX = roadLeft + Math.random() * (laneWidth - enemyWidth);

        // Evita sobreposição imediata no topo
        const tooClose = enemies.some(e => e.y < 120);
        if (!tooClose) {
            enemies.push({
                x: randomX,
                y: -80,
                width: enemyWidth,
                height: 65,
                speed: baseSpeed * 0.6 + Math.random() * 2,
                color: enemyColors[Math.floor(Math.random() * enemyColors.length)]
            });
        }
    }
}

function update() {
    let currentSpeed = keys.ArrowUp ? baseSpeed * 1.6 : baseSpeed;
    
    // Aumenta dificuldade gradualmente
    baseSpeed += 0.001;
    timeCycle += 0.0005;

    // Movimento do jogador
    const roadLeft = 70;
    const roadRight = canvas.width - 70 - player.width;

    if (keys.ArrowLeft && player.x > roadLeft) {
        player.x -= player.speedX;
    }
    if (keys.ArrowRight && player.x < roadRight) {
        player.x += player.speedX;
    }

    // Animação da pista
    roadOffset += currentSpeed;
    if (roadOffset >= 40) roadOffset = 0;

    // Atualiza inimigos
    spawnEnemy();
    for (let i = enemies.length - 1; i >= 0; i--) {
        let e = enemies[i];
        e.y += currentSpeed - (e.speed * 0.3);

        // Verifica colisão
        if (
            player.x < e.x + e.width &&
            player.x + player.width > e.x &&
            player.y < e.y + e.height &&
            player.y + player.height > e.y
        ) {
            gameOver();
            return;
        }

        // Remove inimigo que passou e soma pontos
        if (e.y > canvas.height) {
            enemies.splice(i, 1);
            score += 10;
        }
    }

    // Atualiza HUD
    scoreElement.textContent = score;
    speedElement.textContent = Math.floor(currentSpeed * 22);
}

function draw() {
    // Alterna entre dia (verde) e noite (escuro) baseado no seno do tempo
    const isNight = Math.sin(timeCycle) < -0.2;
    
    // Fundo (grama / terreno)
    ctx.fillStyle = isNight ? "#0b132b" : "#2b9348";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Pista
    const roadWidth = 260;
    const roadX = (canvas.width - roadWidth) / 2;
    ctx.fillStyle = isNight ? "#1c2541" : "#495057";
    ctx.fillRect(roadX, 0, roadWidth, canvas.height);

    // Bordas da pista (zebras)
    for (let y = -40; y < canvas.height; y += 40) {
        ctx.fillStyle = (Math.floor((y + roadOffset) / 40) % 2 === 0) ? "#e63946" : "#f1faee";
        ctx.fillRect(roadX - 10, y + roadOffset, 10, 40);
        ctx.fillRect(roadX + roadWidth, y + roadOffset, 10, 40);
    }

    // Faixa central tracejada
    ctx.fillStyle = "#f1faee";
    for (let y = -40; y < canvas.height; y += 40) {
        ctx.fillRect(canvas.width / 2 - 3, y + roadOffset, 6, 20);
    }

    // Desenha inimigos
    enemies.forEach(e => drawCar(e.x, e.y, e.width, e.height, e.color, isNight));

    // Desenha jogador
    drawCar(player.x, player.y, player.width, player.height, player.color, isNight);
}

function gameOver() {
    gameRunning = false;
    ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#e63946";
    ctx.font = "bold 36px Courier New";
    ctx.textAlign = "center";
    ctx.fillText("FIM DE JOGO", canvas.width / 2, canvas.height / 2 - 20);

    ctx.fillStyle = "#fff";
    ctx.font = "20px Courier New";
    ctx.fillText(`Pontuação Final: ${score}`, canvas.width / 2, canvas.height / 2 + 20);

    btnStart.textContent = "JOGAR NOVAMENTE";
    btnStart.style.display = "block";
}

function gameLoop() {
    if (!gameRunning) return;
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Desenha tela inicial estática
draw();
