// RDance - Dance Simulator
// Система управления скелетом танцора

let isFullscreen = false;
let isPaused = false;

// Размеры canvas
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const FLOOR_Y = CANVAS_HEIGHT * 0.9; // Пол на 90% высоты экрана

// Структура скелета
class Skeleton {
    constructor() {
        // Пропорции скелета (в пикселях)
        this.boneLengths = {
            thigh: 80,        // бедро (таз -> колено)
            shin: 70,         // голень (колено -> ступня)
            spine: 100,       // позвоночник (таз -> шея)
            shoulder: 40,     // плечо (шея -> плечо)
            upperArm: 60,     // плечевая кость (плечо -> локоть)
            forearm: 50,      // предплечье (локоть -> кисть)
            neck: 30          // шея (шея -> голова)
        };
        
        // Состояние скелета
        this.state = {
            // Позиция таза (центральная точка скелета)
            pelvisX: CANVAS_WIDTH / 2,
            pelvisY: FLOOR_Y - this.boneLengths.thigh - this.boneLengths.shin, // Временно, будет пересчитано
            
            // Угол наклона туловища (позвоночника) - вертикально
            spineAngle: -90, // -90° означает вертикально вниз
            
            // Углы костей относительно туловища
            // Ноги: слегка в стороны для естественной позы
            leftThighAngle: 160,    // левое бедро вниз и слегка влево
            rightThighAngle: 200,  // правое бедро вниз и слегка вправо
            leftShinAngle: 0,      // левая голень продолжает линию бедра
            rightShinAngle: 0,     // правая голень продолжает линию бедра
            
            // Плечи: горизонтально
            leftShoulderAngle: 90,   // левое плечо влево (90°)
            rightShoulderAngle: -90, // правое плечо вправо (-90°)
            
            // Руки: вниз и слегка в стороны
            leftUpperArmAngle: 90,   // левая рука вниз
            rightUpperArmAngle: -90, // правая рука вниз
            leftForearmAngle: 0,     // левое предплечье продолжает руку
            rightForearmAngle: 0     // правое предплечье продолжает руку
        };
        
        // Пересчитываем позицию таза для правильного касания пола
        this.state.pelvisY = this.calculatePelvisPositionForFloorContact();
    }
    
    // Вспомогательная функция для конвертации градусов в радианы
    toRadians(degrees) {
        return degrees * PI / 180;
    }
    
    // Вычисление позиций всех суставов
    calculateJointPositions() {
        const s = this.state;
        const b = this.boneLengths;
        
        // Таз (центральная точка)
        const pelvis = { x: s.pelvisX, y: s.pelvisY };
        
        // Позвоночник
        const spineEnd = {
            x: s.pelvisX + cos(this.toRadians(s.spineAngle)) * b.spine,
            y: s.pelvisY + sin(this.toRadians(s.spineAngle)) * b.spine
        };
        
        // Плечи
        const leftShoulder = {
            x: spineEnd.x + cos(this.toRadians(s.leftShoulderAngle + s.spineAngle)) * b.shoulder,
            y: spineEnd.y + sin(this.toRadians(s.leftShoulderAngle + s.spineAngle)) * b.shoulder
        };
        
        const rightShoulder = {
            x: spineEnd.x + cos(this.toRadians(s.rightShoulderAngle + s.spineAngle)) * b.shoulder,
            y: spineEnd.y + sin(this.toRadians(s.rightShoulderAngle + s.spineAngle)) * b.shoulder
        };
        
        // Локти
        const leftElbow = {
            x: leftShoulder.x + cos(this.toRadians(s.leftUpperArmAngle + s.leftShoulderAngle + s.spineAngle)) * b.upperArm,
            y: leftShoulder.y + sin(this.toRadians(s.leftUpperArmAngle + s.leftShoulderAngle + s.spineAngle)) * b.upperArm
        };
        
        const rightElbow = {
            x: rightShoulder.x + cos(this.toRadians(s.rightUpperArmAngle + s.rightShoulderAngle + s.spineAngle)) * b.upperArm,
            y: rightShoulder.y + sin(this.toRadians(s.rightUpperArmAngle + s.rightShoulderAngle + s.spineAngle)) * b.upperArm
        };
        
        // Кисти
        const leftHand = {
            x: leftElbow.x + cos(this.toRadians(s.leftForearmAngle + s.leftUpperArmAngle + s.leftShoulderAngle + s.spineAngle)) * b.forearm,
            y: leftElbow.y + sin(this.toRadians(s.leftForearmAngle + s.leftUpperArmAngle + s.leftShoulderAngle + s.spineAngle)) * b.forearm
        };
        
        const rightHand = {
            x: rightElbow.x + cos(this.toRadians(s.rightForearmAngle + s.rightUpperArmAngle + s.rightShoulderAngle + s.spineAngle)) * b.forearm,
            y: rightElbow.y + sin(this.toRadians(s.rightForearmAngle + s.rightUpperArmAngle + s.rightShoulderAngle + s.spineAngle)) * b.forearm
        };
        
        // Колени (с учетом поворота туловища)
        const leftKnee = {
            x: s.pelvisX + cos(this.toRadians(s.leftThighAngle + s.spineAngle)) * b.thigh,
            y: s.pelvisY + sin(this.toRadians(s.leftThighAngle + s.spineAngle)) * b.thigh
        };
        
        const rightKnee = {
            x: s.pelvisX + cos(this.toRadians(s.rightThighAngle + s.spineAngle)) * b.thigh,
            y: s.pelvisY + sin(this.toRadians(s.rightThighAngle + s.spineAngle)) * b.thigh
        };
        
        // Ступни (с учетом поворота туловища)
        const leftFoot = {
            x: leftKnee.x + cos(this.toRadians(s.leftShinAngle + s.leftThighAngle + s.spineAngle)) * b.shin,
            y: leftKnee.y + sin(this.toRadians(s.leftShinAngle + s.leftThighAngle + s.spineAngle)) * b.shin
        };
        
        const rightFoot = {
            x: rightKnee.x + cos(this.toRadians(s.rightShinAngle + s.rightThighAngle + s.spineAngle)) * b.shin,
            y: rightKnee.y + sin(this.toRadians(s.rightShinAngle + s.rightThighAngle + s.spineAngle)) * b.shin
        };
        
        // Голова
        const head = {
            x: spineEnd.x + cos(this.toRadians(s.spineAngle)) * b.neck,
            y: spineEnd.y + sin(this.toRadians(s.spineAngle)) * b.neck
        };
        
        return {
            pelvis, spineEnd, leftShoulder, rightShoulder,
            leftElbow, rightElbow, leftHand, rightHand,
            leftKnee, rightKnee, leftFoot, rightFoot, head
        };
    }
    
    // Отрисовка скелета
    draw() {
        const joints = this.calculateJointPositions();
        
        // Настройки отрисовки
        strokeWeight(3);
        stroke(255);
        fill(255);
        
        // Рисуем кости (линии)
        // Ноги
        line(joints.leftFoot.x, joints.leftFoot.y, joints.leftKnee.x, joints.leftKnee.y);
        line(joints.leftKnee.x, joints.leftKnee.y, joints.pelvis.x, joints.pelvis.y);
        line(joints.rightFoot.x, joints.rightFoot.y, joints.rightKnee.x, joints.rightKnee.y);
        line(joints.rightKnee.x, joints.rightKnee.y, joints.pelvis.x, joints.pelvis.y);
        
        // Позвоночник
        line(joints.pelvis.x, joints.pelvis.y, joints.spineEnd.x, joints.spineEnd.y);
        
        // Шея и голова
        line(joints.spineEnd.x, joints.spineEnd.y, joints.head.x, joints.head.y);
        
        // Руки
        line(joints.spineEnd.x, joints.spineEnd.y, joints.leftShoulder.x, joints.leftShoulder.y);
        line(joints.leftShoulder.x, joints.leftShoulder.y, joints.leftElbow.x, joints.leftElbow.y);
        line(joints.leftElbow.x, joints.leftElbow.y, joints.leftHand.x, joints.leftHand.y);
        
        line(joints.spineEnd.x, joints.spineEnd.y, joints.rightShoulder.x, joints.rightShoulder.y);
        line(joints.rightShoulder.x, joints.rightShoulder.y, joints.rightElbow.x, joints.rightElbow.y);
        line(joints.rightElbow.x, joints.rightElbow.y, joints.rightHand.x, joints.rightHand.y);
        
        // Рисуем суставы (круги)
        strokeWeight(2);
        stroke(0);
        
        const jointRadius = 6;
        circle(joints.leftFoot.x, joints.leftFoot.y, jointRadius);
        circle(joints.rightFoot.x, joints.rightFoot.y, jointRadius);
        circle(joints.leftKnee.x, joints.leftKnee.y, jointRadius);
        circle(joints.rightKnee.x, joints.rightKnee.y, jointRadius);
        circle(joints.pelvis.x, joints.pelvis.y, jointRadius);
        circle(joints.spineEnd.x, joints.spineEnd.y, jointRadius);
        circle(joints.leftShoulder.x, joints.leftShoulder.y, jointRadius);
        circle(joints.rightShoulder.x, joints.rightShoulder.y, jointRadius);
        circle(joints.leftElbow.x, joints.leftElbow.y, jointRadius);
        circle(joints.rightElbow.x, joints.rightElbow.y, jointRadius);
        circle(joints.leftHand.x, joints.leftHand.y, jointRadius);
        circle(joints.rightHand.x, joints.rightHand.y, jointRadius);
        circle(joints.head.x, joints.head.y, jointRadius);
    }
    
    // Расчет позиции таза для касания ступней пола
    calculatePelvisPositionForFloorContact() {
        // Временно устанавливаем углы для расчета
        const tempState = {
            ...this.state,
            spineAngle: -90, // Туловище вертикально
            leftThighAngle: 160,
            rightThighAngle: 200,
            leftShinAngle: 0,
            rightShinAngle: 0
        };
        
        // Вычисляем вертикальное расстояние от таза до ступней
        // Учитываем наклон ног и поворот туловища
        const leftThighVertical = this.boneLengths.thigh * sin(this.toRadians(tempState.leftThighAngle + tempState.spineAngle));
        const leftShinVertical = this.boneLengths.shin * sin(this.toRadians(tempState.leftShinAngle + tempState.leftThighAngle + tempState.spineAngle));
        const leftFootY = leftThighVertical + leftShinVertical;
        
        const rightThighVertical = this.boneLengths.thigh * sin(this.toRadians(tempState.rightThighAngle + tempState.spineAngle));
        const rightShinVertical = this.boneLengths.shin * sin(this.toRadians(tempState.rightShinAngle + tempState.rightThighAngle + tempState.spineAngle));
        const rightFootY = rightThighVertical + rightShinVertical;
        
        // Берем максимальную высоту ступни (которая ближе к полу)
        const maxFootHeight = Math.max(leftFootY, rightFootY);
        
        // Позиция таза = пол - высота ступней
        return FLOOR_Y - maxFootHeight;
    }
    
    // Сброс к начальному состоянию
    reset() {
        this.state = {
            // Позиция таза рассчитывается так, чтобы ступни касались пола
            pelvisX: CANVAS_WIDTH / 2,
            pelvisY: this.calculatePelvisPositionForFloorContact(),
            
            // Туловище вертикально
            spineAngle: -90,
            
            // Ноги слегка в стороны для естественной позы
            leftThighAngle: 160,
            rightThighAngle: 200,
            leftShinAngle: 0,
            rightShinAngle: 0,
            
            // Плечи горизонтально
            leftShoulderAngle: 90,
            rightShoulderAngle: -90,
            
            // Руки вниз и слегка в стороны
            leftUpperArmAngle: 90,
            rightUpperArmAngle: -90,
            leftForearmAngle: 0,
            rightForearmAngle: 0
        };
    }
}

// Глобальные переменные
let skeleton;

function setup() {
    // Создаем canvas
    let canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    canvas.parent('sketch-container');
    
    // Создаем скелет
    skeleton = new Skeleton();
    
    // Добавляем обработчики для кнопок
    document.getElementById('reset-btn').addEventListener('click', resetSkeleton);
    document.getElementById('pause-btn').addEventListener('click', togglePause);
    document.getElementById('fullscreen-btn').addEventListener('click', toggleFullscreen);
    
    // Добавляем обработчик для полноэкранного режима
    document.addEventListener('keydown', handleKeyDown);
}

function draw() {
    if (isPaused) return;
    
    // Фон
    background(20, 20, 40);
    
    // Рисуем пол
    stroke(255);
    strokeWeight(4);
    line(0, FLOOR_Y, width, FLOOR_Y);
    
    // Рисуем скелет
    skeleton.draw();
    
    // Обработка управления
    handleMovement();
}

function handleMovement() {
    const speed = 2; // Скорость движения
    const angleSpeed = 3; // Скорость поворота
    
    // Движение таза
    if (keyIsDown(87)) { // W - вперед
        skeleton.state.pelvisY -= speed;
    }
    if (keyIsDown(83)) { // S - назад
        skeleton.state.pelvisY += speed;
    }
    if (keyIsDown(65)) { // A - влево
        skeleton.state.pelvisX -= speed;
    }
    if (keyIsDown(68)) { // D - вправо
        skeleton.state.pelvisX += speed;
    }
    
    // Поворот туловища
    if (keyIsDown(81)) { // Q - поворот влево
        skeleton.state.spineAngle -= angleSpeed;
    }
    if (keyIsDown(69)) { // E - поворот вправо
        skeleton.state.spineAngle += angleSpeed;
    }
    
    // Движения рук
    if (keyIsDown(UP_ARROW)) {
        skeleton.state.leftUpperArmAngle -= angleSpeed;
    }
    if (keyIsDown(DOWN_ARROW)) {
        skeleton.state.leftUpperArmAngle += angleSpeed;
    }
    if (keyIsDown(LEFT_ARROW)) {
        skeleton.state.rightUpperArmAngle -= angleSpeed;
    }
    if (keyIsDown(RIGHT_ARROW)) {
        skeleton.state.rightUpperArmAngle += angleSpeed;
    }
    
    // Движения ног
    if (keyIsDown(73)) { // I - левая нога вперед
        skeleton.state.leftThighAngle -= angleSpeed;
    }
    if (keyIsDown(75)) { // K - левая нога назад
        skeleton.state.leftThighAngle += angleSpeed;
    }
    if (keyIsDown(74)) { // J - правая нога вперед
        skeleton.state.rightThighAngle -= angleSpeed;
    }
    if (keyIsDown(76)) { // L - правая нога назад
        skeleton.state.rightThighAngle += angleSpeed;
    }
}

function resetSkeleton() {
    skeleton.reset();
}

function togglePause() {
    isPaused = !isPaused;
    let btn = document.getElementById('pause-btn');
    btn.textContent = isPaused ? 'Продолжить' : 'Пауза';
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
        resizeCanvas(windowWidth, windowHeight);
        const sketchContainer = document.getElementById('sketch-container');
        if (sketchContainer) {
            sketchContainer.style.width = '100vw';
            sketchContainer.style.height = '100vh';
        }
    } else {
        resizeCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
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
    
    const container = document.querySelector('.container');
    const sketchContainer = document.getElementById('sketch-container');
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    
    if (isFullscreen) {
        container.style.display = 'none';
        document.body.appendChild(sketchContainer);
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
        document.body.style.background = 'transparent';
        resizeCanvas(windowWidth, windowHeight);
    } else {
        const main = container.querySelector('main');
        main.insertBefore(sketchContainer, main.querySelector('.controls'));
        container.style.display = 'block';
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
        document.body.style.background = '';
        resizeCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    }
    
    if (fullscreenBtn) {
        fullscreenBtn.textContent = isFullscreen ? 'Выйти из полного экрана' : 'Полный экран';
    }
}