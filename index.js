const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');

let canvasWidth, canvasHeight;
let particles = [];
const formingCount = 800;   // Particles that form shapes
const fillerCount = 300;    // Particles for decoration only
let currentTargetIndex = 0;
let sceneStartTime = Date.now();

const DISPLAY_TIME = 5000;     // Time to stay in a shape (ms)
const TRANSITION_TIME = 8000;  // Time to scatter between shapes (ms)

const colors = ['#0a4a5c', '#01579b', '#0288d1', '#4fc3f7', '#00b8d4'];

const scenes = [
    { content: "UNILU", type: "text", size: 160 },
    { content: "EXCELLENCE", type: "text", size: 100 },
    { content: "ARCHIVAGE", type: "text", size: 110 }
];

let sceneTargets = [];
let mouse = { x: -1000, y: -1000, radius: 120 };

function resize() {
    canvasWidth = canvas.parentNode.clientWidth;
    canvasHeight = canvas.parentNode.clientHeight;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    prepareScenes();
}

function prepareScenes() {
    sceneTargets = [];
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = canvasWidth;
    tempCanvas.height = canvasHeight;

    scenes.forEach(scene => {
        tempCtx.clearRect(0, 0, canvasWidth, canvasHeight);
        tempCtx.fillStyle = "black";
        tempCtx.textAlign = "center";
        tempCtx.textBaseline = "middle";
        tempCtx.font = `bold ${scene.size}px Inter, sans-serif`;
        
        if (scene.content.length > 20) {
            const words = scene.content.split(' ');
            tempCtx.fillText(words.slice(0, 2).join(' '), canvasWidth / 2, canvasHeight / 2 - scene.size / 2);
            tempCtx.fillText(words.slice(2).join(' '), canvasWidth / 2, canvasHeight / 2 + scene.size / 2);
        } else {
            tempCtx.fillText(scene.content, canvasWidth / 2, canvasHeight / 2);
        }

        const pixels = tempCtx.getImageData(0, 0, canvasWidth, canvasHeight).data;
        const coords = [];
        for (let y = 0; y < canvasHeight; y += 5) {
            for (let x = 0; x < canvasWidth; x += 5) {
                const index = (y * canvasWidth + x) * 4;
                if (pixels[index + 3] > 128) {
                    coords.push({ x, y });
                }
            }
        }
        
        const resampled = [];
        for (let i = 0; i < formingCount; i++) {
            const sourceIndex = Math.floor(i * (coords.length / formingCount));
            resampled.push(coords[sourceIndex] || { x: canvasWidth / 2, y: canvasHeight / 2 });
        }
        sceneTargets.push(resampled);
    });
}

class Particle {
    constructor(id, type = 'forming') {
        this.id = id;
        this.type = type;
        this.x = Math.random() * canvasWidth;
        this.y = Math.random() * canvasHeight;
        this.size = Math.random() * 4 + 1.5;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.velocity = Math.random() * 0.04 + 0.02;
        this.baseVelocity = this.velocity;
        
        // Random drift for scatter and filler particles
        this.dx = (Math.random() - 0.5) * 2;
        this.dy = (Math.random() - 0.5) * 2;
        
        // Target for scatter mode
        this.scatterX = Math.random() * canvasWidth;
        this.scatterY = Math.random() * canvasHeight;
    }

    update() {
        const timeInCycle = (Date.now() - sceneStartTime) % (DISPLAY_TIME + TRANSITION_TIME);
        const isTransition = timeInCycle > DISPLAY_TIME;
        
        if (this.type === 'forming') {
            if (isTransition) {
                // Scatter mode: move towards a random point and drift faster
                const dx = this.scatterX - this.x;
                const dy = this.scatterY - this.y;
                this.x += dx * 0.01 + this.dx * 2.5; // Increased drift
                this.y += dy * 0.01 + this.dy * 2.5; // Increased drift
                
                // Regenerate scatter target occasionally if reached
                if (Math.abs(dx) < 2) {
                    this.scatterX = Math.random() * canvasWidth;
                    this.scatterY = Math.random() * canvasHeight;
                }
            } else {
                // Shape mode
                const target = sceneTargets[currentTargetIndex][this.id];
                const dx = target.x - this.x;
                const dy = target.y - this.y;
                this.x += dx * this.velocity;
                this.y += dy * this.velocity;
            }
        } else {
            // Filler mode: drift smoothly and bounce
            this.x += this.dx * 0.5;
            this.y += this.dy * 0.5;
            if (this.x < 0 || this.x > canvasWidth) this.dx *= -1;
            if (this.y < 0 || this.y > canvasHeight) this.dy *= -1;
        }

        // Mouse interaction
        let mdx = mouse.x - this.x;
        let mdy = mouse.y - this.y;
        let dist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (dist < mouse.radius) {
            let force = (mouse.radius - dist) / mouse.radius;
            this.x -= mdx * force * 0.1;
            this.y -= mdy * force * 0.1;
        }
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.type === 'forming' ? 0.9 : 0.4;
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}

function init() {
    resize();
    particles = [];
    for (let i = 0; i < formingCount; i++) {
        particles.push(new Particle(i, 'forming'));
    }
    for (let i = 0; i < fillerCount; i++) {
        particles.push(new Particle(i, 'filler'));
    }
}

function animate() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    const cycleTime = DISPLAY_TIME + TRANSITION_TIME;
    const elapsed = Date.now() - sceneStartTime;
    
    if (elapsed > cycleTime) {
        currentTargetIndex = (currentTargetIndex + 1) % scenes.length;
        sceneStartTime = Date.now();
    }

    particles.forEach(p => {
        p.update();
        p.draw();
    });

    requestAnimationFrame(animate);
}

window.addEventListener('mousemove', (e) => {
    mouse.x = e.x;
    mouse.y = e.y;
});

window.addEventListener('resize', resize);

init();
animate();

// Handle Login Submission
document.querySelector('.login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('.submit-btn');
    const originalText = btn.innerText;
    
    // Modern "Connecting..." state
    btn.disabled = true;
    btn.innerText = 'Connexion...';
    btn.style.opacity = '0.7';

    // Brief artificial delay for "professional" feel
    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 1200);
});