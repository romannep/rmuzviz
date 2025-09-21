// Массив для хранения частиц дыма
let particles = [];
let isPaused = false;
let isFullscreen = false;
let originalCanvas;
let fullscreenCanvas;

function setup() {
    // Создаем canvas размером 800x600
    originalCanvas = createCanvas(800, 600);
    originalCanvas.parent('sketch-container');
    
    // Настройки рендеринга
    colorMode(HSB, 360, 100, 100, 1);
    
    // Добавляем обработчики для кнопок
    document.getElementById('reset-btn').addEventListener('click', resetParticles);
    document.getElementById('pause-btn').addEventListener('click', togglePause);
    document.getElementById('fullscreen-btn').addEventListener('click', toggleFullscreen);
    
    // Добавляем обработчик для полноэкранного режима
    document.addEventListener('keydown', handleKeyDown);
}

function draw() {
    // Создаем градиентный фон
    for (let i = 0; i <= height; i++) {
        let inter = map(i, 0, height, 0, 1);
        let c = lerpColor(color(220, 50, 15), color(280, 80, 5), inter);
        stroke(c);
        line(0, i, width, i);
    }
    
    // Обновляем и отрисовываем частицы только если не на паузе
    if (!isPaused) {
        updateParticles();
    }
    drawParticles();
    
    // Добавляем новые частицы с некоторой вероятностью
    if (random(1) < 0.3) {
        addParticle();
    }
}

function addParticle() {
    // Создаем новую частицу в нижней части экрана
    let x = width / 2 + random(-50, 50);
    let y = height - 20;
    
    particles.push({
        x: x,
        y: y,
        vx: random(-0.5, 0.5),
        vy: random(-2, -0.5),
        life: 1.0,
        size: random(10, 25),
        hue: random(20, 40), // Теплые тона для дыма
        saturation: random(20, 40),
        brightness: random(70, 90)
    });
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        
        // Обновляем позицию
        p.x += p.vx;
        p.y += p.vy;
        
        // Добавляем турбулентность (случайное движение)
        p.vx += random(-0.1, 0.1);
        p.vy += random(-0.05, 0.05);
        
        // Ограничиваем скорость
        p.vx = constrain(p.vx, -2, 2);
        p.vy = constrain(p.vy, -3, 0.5);
        
        // Уменьшаем жизнь частицы
        p.life -= 0.008;
        
        // Изменяем размер со временем
        p.size *= 0.998;
        
        // Удаляем мертвые частицы
        if (p.life <= 0 || p.size < 1) {
            particles.splice(i, 1);
        }
    }
}

function drawParticles() {
    noStroke();
    
    for (let p of particles) {
        // Прозрачность зависит от жизни частицы
        let alpha = p.life;
        
        // Создаем цвет частицы
        fill(p.hue, p.saturation, p.brightness, alpha);
        
        // Рисуем частицу как эллипс
        ellipse(p.x, p.y, p.size, p.size);
        
        // Добавляем дополнительный слой для более реалистичного дыма
        fill(p.hue, p.saturation * 0.7, p.brightness * 1.2, alpha * 0.6);
        ellipse(p.x, p.y, p.size * 0.7, p.size * 0.7);
    }
}

function resetParticles() {
    particles = [];
}

function togglePause() {
    isPaused = !isPaused;
    let btn = document.getElementById('pause-btn');
    btn.textContent = isPaused ? 'Продолжить' : 'Пауза';
}

// Обработчик мыши - добавляем частицы при клике
function mousePressed() {
    if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
        for (let i = 0; i < 5; i++) {
            particles.push({
                x: mouseX + random(-20, 20),
                y: mouseY + random(-20, 20),
                vx: random(-1, 1),
                vy: random(-3, -1),
                life: 1.0,
                size: random(15, 30),
                hue: random(20, 40),
                saturation: random(30, 50),
                brightness: random(80, 95)
            });
        }
    }
}

// Обработчик клавиатуры для p5.js
function keyPressed() {
    if (key === ' ') {
        togglePause();
    } else if (key === 'r' || key === 'R') {
        resetParticles();
    }
}

// Обработчик клавиатуры для полноэкранного режима
function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.ctrlKey && !event.altKey && !event.metaKey) {
        event.preventDefault();
        toggleFullscreen();
    } else if (event.key === 'Escape' && isFullscreen) {
        event.preventDefault();
        exitFullscreen();
    }
}

// Переключение полноэкранного режима
function toggleFullscreen() {
    if (!isFullscreen) {
        enterFullscreen();
    } else {
        exitFullscreen();
    }
}

// Вход в полноэкранный режим
function enterFullscreen() {
    if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
    } else if (document.documentElement.webkitRequestFullscreen) {
        document.documentElement.webkitRequestFullscreen();
    } else if (document.documentElement.msRequestFullscreen) {
        document.documentElement.msRequestFullscreen();
    }
}

// Выход из полноэкранного режима
function exitFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
    }
}

// Обработчик изменения размера окна
function windowResized() {
    if (isFullscreen) {
        // В полноэкранном режиме canvas занимает весь экран
        resizeCanvas(windowWidth, windowHeight);
        
        // Обновляем стили sketch-container на случай изменения размера
        const sketchContainer = document.getElementById('sketch-container');
        if (sketchContainer) {
            sketchContainer.style.width = '100vw';
            sketchContainer.style.height = '100vh';
        }
    } else {
        // В обычном режиме возвращаем стандартный размер
        resizeCanvas(800, 600);
    }
}

// Обработчик событий полноэкранного режима
document.addEventListener('fullscreenchange', handleFullscreenChange);
document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
document.addEventListener('mozfullscreenchange', handleFullscreenChange);
document.addEventListener('MSFullscreenChange', handleFullscreenChange);

function handleFullscreenChange() {
    isFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
    );
    
    // Получаем элементы интерфейса
    const container = document.querySelector('.container');
    const sketchContainer = document.getElementById('sketch-container');
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    
    if (isFullscreen) {
        // Скрываем основной контейнер
        container.style.display = 'none';
        
        // Перемещаем sketch-container в body для полного контроля
        document.body.appendChild(sketchContainer);
        
        // Устанавливаем полноэкранные стили
        sketchContainer.style.position = 'fixed';
        sketchContainer.style.top = '0';
        sketchContainer.style.left = '0';
        sketchContainer.style.width = '100vw';
        sketchContainer.style.height = '100vh';
        sketchContainer.style.zIndex = '9999';
        sketchContainer.style.margin = '0';
        sketchContainer.style.padding = '0';
        sketchContainer.style.borderRadius = '0';
        sketchContainer.style.boxShadow = 'none';
        
        // Убираем градиентный фон body, чтобы не мешал
        document.body.style.background = 'transparent';
        
        // Изменяем размер canvas
        resizeCanvas(windowWidth, windowHeight);
    } else {
        // Возвращаем sketch-container в исходное место
        const main = container.querySelector('main');
        main.insertBefore(sketchContainer, main.querySelector('.controls'));
        
        // Показываем основной контейнер
        container.style.display = 'block';
        
        // Сбрасываем стили sketch-container
        sketchContainer.style.position = 'static';
        sketchContainer.style.top = 'auto';
        sketchContainer.style.left = 'auto';
        sketchContainer.style.width = 'auto';
        sketchContainer.style.height = 'auto';
        sketchContainer.style.zIndex = 'auto';
        sketchContainer.style.margin = '';
        sketchContainer.style.padding = '';
        sketchContainer.style.borderRadius = '';
        sketchContainer.style.boxShadow = '';
        
        // Возвращаем исходный фон body
        document.body.style.background = '';
        
        // Возвращаем исходный размер canvas
        resizeCanvas(800, 600);
    }
    
    // Обновляем текст кнопки
    if (fullscreenBtn) {
        fullscreenBtn.textContent = isFullscreen ? 'Выйти из полного экрана' : 'Полный экран';
    }
}
