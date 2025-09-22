// RDance - Dance Simulator
// Система управления скелетом танцора

let isFullscreen = false;
let isPaused = false;
let isDebugMode = false;

// Размеры canvas
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const FLOOR_Y = CANVAS_HEIGHT * 0.9; // Пол на 90% высоты экрана

// Режимы отрисовки
const RENDER_MODE = {
    SKELETON: 0,      // Простой скелет (исходный)
    SIMPLE: 1,        // Простая девушка
    DETAILED: 2,      // Детализированная девушка
    PHOTOREALISTIC: 3 // Фотореалистичная (с изображениями)
};

// Текущий режим отрисовки (изменить здесь для переключения)
const CURRENT_RENDER_MODE = RENDER_MODE.SKELETON;

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
            neck: 40          // шея (шея -> голова)
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
            rightForearmAngle: 0,    // правое предплечье продолжает руку

            // Шея: поворот относительно туловища
            neckAngle: 0             // шея прямо (0° относительно позвоночника)
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

        // Голова (с учетом поворота шеи относительно туловища)
        const head = {
            x: spineEnd.x + cos(this.toRadians(s.spineAngle + s.neckAngle)) * b.neck,
            y: spineEnd.y + sin(this.toRadians(s.spineAngle + s.neckAngle)) * b.neck
        };

        return {
            pelvis, spineEnd, leftShoulder, rightShoulder,
            leftElbow, rightElbow, leftHand, rightHand,
            leftKnee, rightKnee, leftFoot, rightFoot, head
        };
    }

    // Отрисовка танцора с выбором режима
    draw() {
        const joints = this.calculateJointPositions();

        switch (CURRENT_RENDER_MODE) {
            case RENDER_MODE.SKELETON:
                this.drawSkeleton(joints);
                break;
            case RENDER_MODE.SIMPLE:
                this.drawSimpleGirl(joints);
                break;
            case RENDER_MODE.DETAILED:
                this.drawDetailedGirl(joints);
                break;
            case RENDER_MODE.PHOTOREALISTIC:
                this.drawPhotorealisticGirl(joints);
                break;
        }
    }

    // Простая отрисовка скелета (исходная)
    drawSkeleton(joints) {
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
        circle(joints.head.x, joints.head.y, jointRadius * 4);
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
            rightForearmAngle: 0,

            // Шея прямо
            neckAngle: 0
        };
    }
}

// Глобальные переменные
let skeleton;
let dancerImages = {};

// Загрузка изображений
function preload() {
    try {
        // Загружаем изображения танцовщицы
        dancerImages.body = loadImage('assets/images/dancer_body.png');
        dancerImages.dress = loadImage('assets/images/dress.png');
    } catch (e) {
        console.log('Ошибка загрузки изображений:', e);
    }
}

// Создание простых изображений для фотореалистичности
function createSimpleImages() {
    // Создаем изображение тела (телесный цвет)
    dancerImages.body = createGraphics(100, 200);
    dancerImages.body.background(255, 220, 180);
    dancerImages.body.fill(255, 200, 160);
    dancerImages.body.noStroke();
    dancerImages.body.ellipse(50, 50, 40, 50); // Голова
    dancerImages.body.ellipse(50, 120, 60, 80); // Туловище
    dancerImages.body.ellipse(50, 180, 30, 40); // Ноги

    // Создаем изображение платья (элегантное)
    dancerImages.dress = createGraphics(120, 150);
    dancerImages.dress.background(200, 50, 100, 0); // Прозрачный фон
    dancerImages.dress.fill(150, 30, 80); // Темно-розовый
    dancerImages.dress.noStroke();
    dancerImages.dress.ellipse(60, 30, 50, 60); // Верх платья
    dancerImages.dress.ellipse(60, 100, 80, 100); // Юбка
    dancerImages.dress.fill(180, 40, 90); // Светлее для объема
    dancerImages.dress.ellipse(60, 80, 70, 80); // Средняя часть

    // Добавляем детали платья
    dancerImages.dress.fill(120, 20, 60);
    dancerImages.dress.ellipse(60, 25, 40, 20); // Вырез
    dancerImages.dress.fill(200, 60, 120);
    dancerImages.dress.ellipse(60, 105, 75, 90); // Подол
}

function setup() {
    // Создаем canvas
    let canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    canvas.parent('sketch-container');

    // Создаем изображения если внешние не загрузились
    if (!dancerImages.body || !dancerImages.dress) {
        createSimpleImages();
    }

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

    // Отображаем отладочную информацию
    drawDebugInfo();
}

// Новая система управления согласно task.md

function resetSkeleton() {
    skeleton.reset();
}

function togglePause() {
    isPaused = !isPaused;
    let btn = document.getElementById('pause-btn');
    btn.textContent = isPaused ? 'Продолжить' : 'Пауза';
}

// Переключение режима отладки
function toggleDebugMode() {
    isDebugMode = !isDebugMode;
    console.log('Режим отладки:', isDebugMode ? 'включен' : 'выключен');
}

// Отображение отладочной информации
function drawDebugInfo() {
    if (!isDebugMode) return;

    push();

    // Настройки текста
    textAlign(LEFT, TOP);
    textSize(12);
    fill(255, 255, 255);
    stroke(0, 0, 0);
    strokeWeight(1);

    // Позиция отображения (левый верхний угол)
    let x = 10;
    let y = 10;
    let lineHeight = 16;

    // Заголовок
    text('=== DEBUG MODE ===', x, y);
    y += lineHeight * 1.5;

    // Отображаем все поля state с округлением до целого
    const state = skeleton.state;

    text(`pelvisX: ${Math.round(state.pelvisX)}`, x, y);
    y += lineHeight;

    text(`pelvisY: ${Math.round(state.pelvisY)}`, x, y);
    y += lineHeight;

    text(`spineAngle: ${Math.round(state.spineAngle)}`, x, y);
    y += lineHeight;

    text(`leftThighAngle: ${Math.round(state.leftThighAngle)}`, x, y);
    y += lineHeight;

    text(`rightThighAngle: ${Math.round(state.rightThighAngle)}`, x, y);
    y += lineHeight;

    text(`leftShinAngle: ${Math.round(state.leftShinAngle)}`, x, y);
    y += lineHeight;

    text(`rightShinAngle: ${Math.round(state.rightShinAngle)}`, x, y);
    y += lineHeight;

    text(`leftShoulderAngle: ${Math.round(state.leftShoulderAngle)}`, x, y);
    y += lineHeight;

    text(`rightShoulderAngle: ${Math.round(state.rightShoulderAngle)}`, x, y);
    y += lineHeight;

    text(`leftUpperArmAngle: ${Math.round(state.leftUpperArmAngle)}`, x, y);
    y += lineHeight;

    text(`rightUpperArmAngle: ${Math.round(state.rightUpperArmAngle)}`, x, y);
    y += lineHeight;

    text(`leftForearmAngle: ${Math.round(state.leftForearmAngle)}`, x, y);
    y += lineHeight;

    text(`rightForearmAngle: ${Math.round(state.rightForearmAngle)}`, x, y);
    y += lineHeight;

    text(`neckAngle: ${Math.round(state.neckAngle)}`, x, y);
    y += lineHeight;

    // Инструкция
    y += lineHeight;
    text('Нажмите W для выключения', x, y);

    pop();
}

// Обработчик клавиатуры для управления танцем и интерфейсом
function handleKeyDown(event) {
    const angleSpeed = 3; // Скорость поворота

    // Управление танцем
    switch (event.key.toLowerCase()) {
        case 'q':
            // Сброс до начального состояния
            event.preventDefault();
            skeleton.reset();
            break;

        case 'w':
            // Включение режима отладки
            event.preventDefault();
            toggleDebugMode();
            break;

        case 'c':
            // Правая голень наружу
            event.preventDefault();
            skeleton.state.rightShinAngle += angleSpeed;
            break;

        case 'v':
            // Правая голень внутрь
            event.preventDefault();
            skeleton.state.rightShinAngle -= angleSpeed;
            break;

        case 'n':
            // Левая голень внутрь
            event.preventDefault();
            skeleton.state.leftShinAngle += angleSpeed;
            break;

        case 'm':
            // Левая голень наружу
            event.preventDefault();
            skeleton.state.leftShinAngle -= angleSpeed;
            break;

        case 'd':
            // Правое бедро наружу
            event.preventDefault();
            skeleton.state.rightThighAngle += angleSpeed;
            break;

        case 'f':
            // Правое бедро внутрь
            event.preventDefault();
            skeleton.state.rightThighAngle -= angleSpeed;
            break;

        case 'j':
            // Левое бедро внутрь
            event.preventDefault();
            skeleton.state.leftThighAngle += angleSpeed;
            break;

        case 'k':
            // Левое бедро наружу
            event.preventDefault();
            skeleton.state.leftThighAngle -= angleSpeed;
            break;

        case 'g':
            // Туловище наклон вправо
            event.preventDefault();
            skeleton.state.spineAngle -= angleSpeed;
            break;

        case 'h':
            // Туловище наклон влево
            event.preventDefault();
            skeleton.state.spineAngle += angleSpeed;
            break;

        case '[':
            // Шея влево
            event.preventDefault();
            skeleton.state.neckAngle -= angleSpeed;
            break;

        case ']':
            // Шея вправо
            event.preventDefault();
            skeleton.state.neckAngle += angleSpeed;
            break;

        case 'e':
            // Правое плечо вниз
            event.preventDefault();
            skeleton.state.rightUpperArmAngle += angleSpeed;
            break;

        case 'r':
            // Правое плечо вверх
            event.preventDefault();
            skeleton.state.rightUpperArmAngle -= angleSpeed;
            break;

        case 'u':
            // Левое плечо вверх
            event.preventDefault();
            skeleton.state.leftUpperArmAngle += angleSpeed;
            break;

        case 'i':
            // Левое плечо вниз
            event.preventDefault();
            skeleton.state.leftUpperArmAngle -= angleSpeed;
            break;

        case 's':
            // Правое плечо вниз
            event.preventDefault();
            skeleton.state.rightForearmAngle -= angleSpeed;
            break;
        case 'a':
            // Правое плечо вверх
            event.preventDefault();
            skeleton.state.rightForearmAngle += angleSpeed;
            break;
        case 'l':
            // Левое плечо вверх
            event.preventDefault();
            skeleton.state.leftForearmAngle += angleSpeed;
            break;
        case ';':
            // Левое плечо вниз
            event.preventDefault();
            skeleton.state.leftForearmAngle -= angleSpeed;
            break;

        case 'x':
            // Правое плечо вниз
            event.preventDefault();
            skeleton.state.rightShoulderAngle -= angleSpeed;
            break;
        case 'z':
            // Правое плечо вверх
            event.preventDefault();
            skeleton.state.rightShoulderAngle += angleSpeed;
            break;
        case ',':
            // Левое плечо вверх
            event.preventDefault();
            skeleton.state.leftShoulderAngle += angleSpeed;
            break;
        case '.':
            // Левое плечо вниз
            event.preventDefault();
            skeleton.state.leftShoulderAngle -= angleSpeed;
            break;
    }

    // Управление интерфейсом
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


// Простая отрисовка девушки с правильными пропорциями
const drawSimpleGirl = (joints) => {
    push();

    // Рисуем платье
    drawSimpleDress(joints);

    // Рисуем тело
    drawSimpleBody(joints);

    // Рисуем голову
    drawSimpleHead(joints);

    // Рисуем волосы
    drawSimpleHair(joints);

    // Рисуем лицо
    drawSimpleFace(joints);

    pop();
}

// Простое платье
const drawSimpleDress = (joints) => {
    // Основное платье
    fill(180, 60, 120); // Темно-розовый
    noStroke();

    // Талия (узкая часть)
    let waistY = joints.pelvis.y + (joints.spineEnd.y - joints.pelvis.y) * 0.3;
    let waistX = joints.pelvis.x + (joints.spineEnd.x - joints.pelvis.x) * 0.3;
    ellipse(waistX, waistY, 25, 35);

    // Верх платья
    let chestY = joints.pelvis.y + (joints.spineEnd.y - joints.pelvis.y) * 0.6;
    let chestX = joints.pelvis.x + (joints.spineEnd.x - joints.pelvis.x) * 0.6;
    ellipse(chestX, chestY, 35, 45);

    // Юбка (от талии до колен)
    let skirtY = (waistY + Math.min(joints.leftKnee.y, joints.rightKnee.y)) / 2;
    let skirtX = waistX;
    let skirtHeight = Math.min(joints.leftKnee.y, joints.rightKnee.y) - waistY - 15;
    ellipse(skirtX, skirtY, 50, skirtHeight);

    // Вырез
    fill(200, 80, 140);
    ellipse(chestX, chestY - 10, 20, 15);
}

// Простое тело
const drawSimpleBody = (joints) => {
    // Цвет кожи
    fill(255, 220, 180);
    noStroke();

    // Руки (видимые части)
    drawSimpleArm(joints.spineEnd, joints.leftShoulder, joints.leftElbow, joints.leftHand, 1);
    drawSimpleArm(joints.spineEnd, joints.rightShoulder, joints.rightElbow, joints.rightHand, -1);

    // Ноги (от колен)
    drawSimpleLeg(joints.leftKnee, joints.leftFoot, 1);
    drawSimpleLeg(joints.rightKnee, joints.rightFoot, -1);

    // Шея
    strokeWeight(8);
    stroke(255, 220, 180);
    line(joints.spineEnd.x, joints.spineEnd.y, joints.head.x, joints.head.y);
}

// Простая рука
const drawSimpleArm = (shoulderStart, shoulder, elbow, hand, side) => {
    fill(255, 220, 180);
    noStroke();

    // Плечо
    ellipse(shoulder.x, shoulder.y, 12, 25);

    // Предплечье
    ellipse(elbow.x, elbow.y, 10, 20);

    // Кисть
    ellipse(hand.x, hand.y, 8, 12);

    // Соединения
    strokeWeight(3);
    stroke(255, 220, 180);
    line(shoulderStart.x, shoulderStart.y, shoulder.x, shoulder.y);
    line(shoulder.x, shoulder.y, elbow.x, elbow.y);
    line(elbow.x, elbow.y, hand.x, hand.y);
}

// Простая нога
const drawSimpleLeg = (knee, foot, side) => {
    fill(255, 220, 180);
    noStroke();

    // Голень
    ellipse(knee.x, knee.y, 15, 35);

    // Ступня
    ellipse(foot.x + side * 8, foot.y, 20, 12);

    // Соединение
    strokeWeight(4);
    stroke(255, 220, 180);
    line(knee.x, knee.y, foot.x, foot.y);
}

// Простая голова
const drawSimpleHead = (joints) => {
    fill(255, 220, 180);
    noStroke();

    // Лицо (овальное)
    ellipse(joints.head.x, joints.head.y, 30, 40);

    // Подбородок
    ellipse(joints.head.x, joints.head.y + 15, 20, 10);
}

// Простые волосы
const drawSimpleHair = (joints) => {
    fill(60, 40, 20); // Темно-коричневый
    noStroke();

    // Основные волосы
    ellipse(joints.head.x, joints.head.y - 8, 35, 45);

    // Челка
    ellipse(joints.head.x, joints.head.y - 12, 25, 12);

    // Длинные пряди
    stroke(60, 40, 20);
    strokeWeight(3);
    noFill();

    // Левая прядь
    beginShape();
    vertex(joints.head.x - 15, joints.head.y - 5);
    quadraticVertex(joints.head.x - 20, joints.head.y + 10, joints.head.x - 12, joints.head.y + 25);
    endShape();

    // Правая прядь
    beginShape();
    vertex(joints.head.x + 15, joints.head.y - 5);
    quadraticVertex(joints.head.x + 20, joints.head.y + 10, joints.head.x + 12, joints.head.y + 25);
    endShape();
}

// Простое лицо
const drawSimpleFace = (joints) => {
    // Глаза
    fill(255);
    noStroke();
    ellipse(joints.head.x - 7, joints.head.y - 5, 8, 6);
    ellipse(joints.head.x + 7, joints.head.y - 5, 8, 6);

    // Карие глаза
    fill(139, 69, 19);
    ellipse(joints.head.x - 7, joints.head.y - 5, 5, 4);
    ellipse(joints.head.x + 7, joints.head.y - 5, 5, 4);

    // Зрачки
    fill(0);
    ellipse(joints.head.x - 7, joints.head.y - 5, 2, 2);
    ellipse(joints.head.x + 7, joints.head.y - 5, 2, 2);

    // Блики
    fill(255);
    ellipse(joints.head.x - 6.5, joints.head.y - 5.5, 1, 1);
    ellipse(joints.head.x + 6.5, joints.head.y - 5.5, 1, 1);

    // Брови
    stroke(60, 40, 20);
    strokeWeight(2);
    noFill();
    arc(joints.head.x - 7, joints.head.y - 8, 10, 3, PI, 0);
    arc(joints.head.x + 7, joints.head.y - 8, 10, 3, PI, 0);

    // Нос
    strokeWeight(1);
    stroke(255, 200, 160);
    line(joints.head.x, joints.head.y - 2, joints.head.x, joints.head.y + 3);

    // Рот
    strokeWeight(2);
    stroke(255, 180, 180);
    noFill();
    arc(joints.head.x, joints.head.y + 8, 8, 4, 0, PI);
}

// Детализированная отрисовка девушки (улучшенная версия)
const drawDetailedGirl = (joints) =>     {
    push();

    // Рисуем платье с деталями
    drawDetailedDress(joints);

    // Рисуем тело с деталями
    drawDetailedBody(joints);

    // Рисуем голову с деталями
    drawDetailedHead(joints);

    // Рисуем волосы с деталями
    drawDetailedHair(joints);

    // Рисуем лицо с деталями
    drawDetailedFace(joints);

    pop();
}

// Детализированное платье (белое, как на фото)
const drawDetailedDress = (joints) => {
    // Основное платье - белое
    fill(255, 255, 255);
    noStroke();

    // Талия (узкая часть) - А-силуэт
    let waistY = joints.pelvis.y + (joints.spineEnd.y - joints.pelvis.y) * 0.3;
    let waistX = joints.pelvis.x + (joints.spineEnd.x - joints.pelvis.x) * 0.3;
    ellipse(waistX, waistY, 24, 36);

    // Верх платья (грудь)
    let chestY = joints.pelvis.y + (joints.spineEnd.y - joints.pelvis.y) * 0.6;
    let chestX = joints.pelvis.x + (joints.spineEnd.x - joints.pelvis.x) * 0.6;
    ellipse(chestX, chestY, 36, 48);

    // Юбка А-силуэт (расширяется к низу)
    let thighLength = Math.abs(joints.leftKnee.y - joints.pelvis.y);
    let dressEndY = joints.pelvis.y + thighLength * 0.7; // 70% бедра
    let skirtY = (waistY + dressEndY) / 2;
    let skirtX = waistX;

    // Юбка с расширением (трапеция)
    let topSkirtWidth = 32;
    let bottomSkirtWidth = 60;

    // Рисуем юбку как трапецию
    beginShape();
    vertex(skirtX - topSkirtWidth / 2, waistY);
    vertex(skirtX + topSkirtWidth / 2, waistY);
    vertex(skirtX + bottomSkirtWidth / 2, dressEndY);
    vertex(skirtX - bottomSkirtWidth / 2, dressEndY);
    endShape(CLOSE);

    // Складки на юбке (тени)
    fill(240, 240, 240);
    for (let i = 0; i < 5; i++) {
        let foldX = skirtX + (i - 2) * 6;
        let foldTopWidth = topSkirtWidth - 4;
        let foldBottomWidth = bottomSkirtWidth - 8;

        beginShape();
        vertex(foldX - foldTopWidth / 2, waistY + 5);
        vertex(foldX + foldTopWidth / 2, waistY + 5);
        vertex(foldX + foldBottomWidth / 2, dressEndY - 5);
        vertex(foldX - foldBottomWidth / 2, dressEndY - 5);
        endShape(CLOSE);
    }

    // Вырез (V-образный)
    fill(245, 245, 245);
    beginShape();
    vertex(chestX - 12, chestY - 8);
    vertex(chestX + 12, chestY - 8);
    vertex(chestX, chestY - 15);
    endShape(CLOSE);

    // Рукава (короткие)
    fill(255, 255, 255);
    ellipse(chestX - 20, chestY + 5, 16, 25);
    ellipse(chestX + 20, chestY + 5, 16, 25);

    // Талия (подчеркнута)
    fill(250, 250, 250);
    ellipse(waistX, waistY, 26, 8);
}

// Детализированное тело
const drawDetailedBody = (joints) => {
    // Цвет кожи
    fill(255, 220, 180);
    noStroke();

    // Руки с деталями
    drawDetailedArm(joints.spineEnd, joints.leftShoulder, joints.leftElbow, joints.leftHand, 1);
    this.drawDetailedArm(joints.spineEnd, joints.rightShoulder, joints.rightElbow, joints.rightHand, -1);

    // Ноги с деталями
    drawDetailedLeg(joints.leftKnee, joints.leftFoot, 1);
    this.drawDetailedLeg(joints.rightKnee, joints.rightFoot, -1);

    // Шея с деталями
    strokeWeight(10);
    stroke(255, 220, 180);
    line(joints.spineEnd.x, joints.spineEnd.y, joints.head.x, joints.head.y);

    // Тень на шее
    strokeWeight(8);
    stroke(255, 200, 160);
    line(joints.spineEnd.x + 2, joints.spineEnd.y, joints.head.x + 2, joints.head.y);
}

// Детализированная рука (правильные пропорции)
const drawDetailedArm = (shoulderStart, shoulder, elbow, hand, side) => {
    fill(255, 220, 180);
    noStroke();

    // Плечо: длина ≈ 1.3× головы, ширина ≈ 0.3× головы
    let headSize = 40; // примерный размер головы
    let shoulderLength = headSize * 1.3;
    let shoulderWidth = headSize * 0.3;
    ellipse(shoulder.x, shoulder.y, shoulderWidth, shoulderLength);

    // Предплечье: длина ≈ 1.1× головы, ширина ≈ 0.25× головы
    let forearmLength = headSize * 1.1;
    let forearmWidth = headSize * 0.25;
    ellipse(elbow.x, elbow.y, forearmWidth, forearmLength);

    // Кисть: длина ≈ 0.4× головы, ширина ≈ 0.2× головы
    let handLength = headSize * 0.4;
    let handWidth = headSize * 0.2;
    ellipse(hand.x, hand.y, handWidth, handLength);

    // Соединения с градиентом
    strokeWeight(4);
    stroke(255, 220, 180);
    line(shoulderStart.x, shoulderStart.y, shoulder.x, shoulder.y);
    line(shoulder.x, shoulder.y, elbow.x, elbow.y);
    line(elbow.x, elbow.y, hand.x, hand.y);

    // Тени на руке
    strokeWeight(2);
    stroke(255, 200, 160);
    line(shoulder.x + side * 2, shoulder.y, elbow.x + side * 2, elbow.y);
    line(elbow.x + side * 2, elbow.y, hand.x + side * 2, hand.y);
}

// Детализированная нога (неравномерная ширина + кеды)
const drawDetailedLeg = (knee, foot, side) => {
    let headSize = 40; // примерный размер головы

    // Голень с неравномерной шириной
    // Ширина вверху ≈ 0.25× головы, внизу ≈ 0.2× головы
    let calfTopWidth = headSize * 0.25;
    let calfBottomWidth = headSize * 0.2;
    let calfLength = headSize * 1.2;

    // Рисуем голень как трапецию
    fill(255, 220, 180);
    noStroke();
    beginShape();
    vertex(knee.x - calfTopWidth / 2, knee.y);
    vertex(knee.x + calfTopWidth / 2, knee.y);
    vertex(foot.x + calfBottomWidth / 2, foot.y - 15);
    vertex(foot.x - calfBottomWidth / 2, foot.y - 15);
    endShape(CLOSE);

    // Соединение с градиентом
    strokeWeight(5);
    stroke(255, 220, 180);
    line(knee.x, knee.y, foot.x, foot.y - 15);

    // Тень на ноге
    strokeWeight(3);
    stroke(255, 200, 160);
    line(knee.x + side * 2, knee.y, foot.x + side * 2, foot.y - 15);

    // Кеды (белые)
    fill(255, 255, 255);
    noStroke();

    // Основная часть кеда
    ellipse(foot.x + side * 8, foot.y, headSize * 0.8, headSize * 0.3);

    // Подошва кеда (темнее)
    fill(200, 200, 200);
    ellipse(foot.x + side * 8, foot.y + 8, headSize * 0.8, headSize * 0.15);

    // Шнурки
    stroke(0);
    strokeWeight(1);
    for (let i = 0; i < 3; i++) {
        let laceX = foot.x + side * 8 + (i - 1) * 4;
        line(laceX, foot.y - 6, laceX, foot.y + 4);
    }

    // Металлические люверсы
    fill(150, 150, 150);
    noStroke();
    for (let i = 0; i < 6; i++) {
        let eyeletX = foot.x + side * 8 + (i - 2.5) * 3;
        circle(eyeletX, foot.y - 2, 2);
    }
}

// Детализированная голова
const drawDetailedHead = (joints) => {
    fill(255, 220, 180);
    noStroke();

    // Лицо с деталями
    ellipse(joints.head.x, joints.head.y, 32, 42);

    // Подбородок с деталями
    ellipse(joints.head.x, joints.head.y + 16, 22, 12);

    // Щеки
    fill(255, 200, 160);
    ellipse(joints.head.x - 10, joints.head.y + 5, 8, 6);
    ellipse(joints.head.x + 10, joints.head.y + 5, 8, 6);
}

// Детализированные волосы (начинаются выше глаз)
const drawDetailedHair = (joints) => {
    fill(60, 40, 20);
    noStroke();

    // Основные волосы с объемом (начинаются выше глаз)
    // Глаза на уровне 1/3 от верха головы, волосы начинаются выше
    let eyesY = joints.head.y - 20; // глаза примерно здесь
    let hairStartY = eyesY - 10; // волосы начинаются выше глаз

    ellipse(joints.head.x, hairStartY - 8, 38, 48);

    // Челка с деталями (выше глаз)
    ellipse(joints.head.x, hairStartY - 12, 28, 15);

    // Длинные пряди с деталями
    stroke(60, 40, 20);
    strokeWeight(4);
    noFill();

    // Левая прядь с изгибами
    beginShape();
    vertex(joints.head.x - 16, hairStartY - 5);
    quadraticVertex(joints.head.x - 22, hairStartY + 8, joints.head.x - 14, hairStartY + 20);
    quadraticVertex(joints.head.x - 10, hairStartY + 30, joints.head.x - 8, hairStartY + 25);
    endShape();

    // Правая прядь с изгибами
    beginShape();
    vertex(joints.head.x + 16, hairStartY - 5);
    quadraticVertex(joints.head.x + 22, hairStartY + 8, joints.head.x + 14, hairStartY + 20);
    quadraticVertex(joints.head.x + 10, hairStartY + 30, joints.head.x + 8, hairStartY + 25);
    endShape();

    // Дополнительные пряди
    strokeWeight(2);
    for (let i = 0; i < 3; i++) {
        let x = joints.head.x - 12 + i * 12;
        let y = hairStartY + 15 + i * 5;
        line(x, hairStartY - 3, x - 3, y);
        line(x, hairStartY - 3, x + 3, y);
    }

    // Верхние пряди (над головой)
    strokeWeight(3);
    for (let i = 0; i < 5; i++) {
        let x = joints.head.x - 16 + i * 8;
        let startY = hairStartY - 15;
        let endY = hairStartY - 8;
        line(x, startY, x + (i - 2) * 2, endY);
    }
}

// Детализированное лицо (правильное расположение глаз)
const drawDetailedFace = (joints) => {
    // Правильное расположение черт лица
    let eyesY = joints.head.y - 20; // глаза на уровне 1/3 от верха головы
    let noseY = joints.head.y - 10; // нос на уровне 1/2 высоты головы
    let mouthY = joints.head.y + 5; // рот на уровне 2/3 высоты головы

    // Глаза с деталями
    fill(255);
    noStroke();
    ellipse(joints.head.x - 8, eyesY, 10, 8);
    ellipse(joints.head.x + 8, eyesY, 10, 8);

    // Карие глаза с градиентом
    fill(139, 69, 19);
    ellipse(joints.head.x - 8, eyesY, 7, 5);
    ellipse(joints.head.x + 8, eyesY, 7, 5);

    // Внутренняя часть глаз
    fill(160, 80, 40);
    ellipse(joints.head.x - 8, eyesY, 5, 4);
    ellipse(joints.head.x + 8, eyesY, 5, 4);

    // Зрачки
    fill(0);
    ellipse(joints.head.x - 8, eyesY, 3, 3);
    ellipse(joints.head.x + 8, eyesY, 3, 3);

    // Блики
    fill(255);
    ellipse(joints.head.x - 7.5, eyesY - 0.5, 1.5, 1.5);
    ellipse(joints.head.x + 7.5, eyesY - 0.5, 1.5, 1.5);

    // Дополнительный блик
    fill(255, 255, 255, 150);
    ellipse(joints.head.x - 8.5, eyesY - 1, 1, 1);
    ellipse(joints.head.x + 7.5, eyesY - 1, 1, 1);

    // Брови с деталями (выше глаз)
    stroke(60, 40, 20);
    strokeWeight(3);
    noFill();
    arc(joints.head.x - 8, eyesY - 3, 12, 4, PI, 0);
    arc(joints.head.x + 8, eyesY - 3, 12, 4, PI, 0);

    // Нос с объемом
    strokeWeight(2);
    stroke(255, 200, 160);
    line(joints.head.x, noseY - 2, joints.head.x, noseY + 4);

    // Тень от носа
    strokeWeight(1);
    stroke(255, 180, 140, 100);
    line(joints.head.x + 1, noseY - 1, joints.head.x + 1, noseY + 2);

    // Рот с деталями
    strokeWeight(3);
    stroke(255, 180, 180);
    noFill();
    arc(joints.head.x, mouthY, 10, 5, 0, PI);

    // Внутренняя часть рта
    fill(200, 100, 100);
    noStroke();
    arc(joints.head.x, mouthY, 8, 3, 0, PI);

    // Губы
    strokeWeight(2);
    stroke(255, 160, 160);
    noFill();
    arc(joints.head.x, mouthY, 10, 5, 0, PI);
}

// Фотореалистичная отрисовка (переименованная существующая)
const drawPhotorealisticGirl = (joints) => {
    // Рисуем платье (чуть выше колена)
    drawDress(joints);

    // Рисуем тело девушки
    drawRealisticBody(joints);

    // Рисуем голову с лицом
    drawRealisticHead(joints);

    // Рисуем волосы
    drawRealisticHair(joints);

    // Рисуем глаза
    drawRealisticEyes(joints);
}

// Отрисовка тела девушки
const drawBody = (joints) => {
    // Настройки для тела
    strokeWeight(4);
    stroke(255, 220, 180); // Теплый телесный цвет
    fill(255, 220, 180);

    // Рисуем ноги (женские формы)
    drawLeg(joints.leftFoot, joints.leftKnee, joints.pelvis, 1);
    drawLeg(joints.rightFoot, joints.rightKnee, joints.pelvis, -1);

    // Рисуем туловище
    drawTorso(joints);

    // Рисуем руки
    drawArm(joints.spineEnd, joints.leftShoulder, joints.leftElbow, joints.leftHand, 1);
    drawArm(joints.spineEnd, joints.rightShoulder, joints.rightElbow, joints.rightHand, -1);

    // Рисуем шею
    drawNeck(joints.spineEnd, joints.head);
}

// Отрисовка ноги
const drawLeg = (foot, knee, pelvis, side) => {
    // Голень
    strokeWeight(6);
    line(foot.x, foot.y, knee.x, knee.y);

    // Бедро
    strokeWeight(8);
    line(knee.x, knee.y, pelvis.x, pelvis.y);

    // Ступня
    strokeWeight(4);
    noFill();
    ellipse(foot.x + side * 8, foot.y, 16, 8);
}

// Отрисовка туловища
const drawTorso = (joints) => {
    // Основное туловище
    strokeWeight(10);
    line(joints.pelvis.x, joints.pelvis.y, joints.spineEnd.x, joints.spineEnd.y);

    // Талия (более узкая)
    strokeWeight(8);
    let waistY = joints.pelvis.y + (joints.spineEnd.y - joints.pelvis.y) * 0.3;
    let waistX = joints.pelvis.x + (joints.spineEnd.x - joints.pelvis.x) * 0.3;
    ellipse(waistX, waistY, 12, 20);
}

// Отрисовка руки
const drawArm = (shoulderStart, shoulder, elbow, hand, side) => {
    // Плечо
    strokeWeight(6);
    line(shoulderStart.x, shoulderStart.y, shoulder.x, shoulder.y);

    // Предплечье
    strokeWeight(5);
    line(shoulder.x, shoulder.y, elbow.x, elbow.y);

    // Кисть
    strokeWeight(4);
    line(elbow.x, elbow.y, hand.x, hand.y);

    // Ладонь
    strokeWeight(3);
    noFill();
    ellipse(hand.x, hand.y, 8, 12);
}

// Отрисовка шеи
const drawNeck = (spineEnd, head) => {
    strokeWeight(6);
    line(spineEnd.x, spineEnd.y, head.x, head.y);
}

// Отрисовка головы
const drawHead = (joints) => {
    // Лицо (овальное)
    strokeWeight(3);
    stroke(255, 220, 180);
    fill(255, 220, 180);
    ellipse(joints.head.x, joints.head.y, 24, 30);

    // Подбородок
    noStroke();
    fill(255, 220, 180);
    ellipse(joints.head.x, joints.head.y + 12, 18, 8);
}

// Отрисовка волос
const drawHair = (joints) => {
    // Основные волосы (темно-коричневые)
    strokeWeight(2);
    stroke(60, 40, 20);
    fill(60, 40, 20);

    // Волосы вокруг головы
    ellipse(joints.head.x, joints.head.y - 5, 32, 35);

    // Челка
    noStroke();
    fill(60, 40, 20);
    ellipse(joints.head.x, joints.head.y - 10, 28, 15);

    // Длинные волосы по бокам
    strokeWeight(3);
    stroke(60, 40, 20);
    noFill();

    // Левые волосы
    beginShape();
    vertex(joints.head.x - 16, joints.head.y - 8);
    quadraticVertex(joints.head.x - 20, joints.head.y + 5, joints.head.x - 15, joints.head.y + 15);
    quadraticVertex(joints.head.x - 12, joints.head.y + 25, joints.head.x - 8, joints.head.y + 20);
    endShape();

    // Правые волосы
    beginShape();
    vertex(joints.head.x + 16, joints.head.y - 8);
    quadraticVertex(joints.head.x + 20, joints.head.y + 5, joints.head.x + 15, joints.head.y + 15);
    quadraticVertex(joints.head.x + 12, joints.head.y + 25, joints.head.x + 8, joints.head.y + 20);
    endShape();
}

// Отрисовка глаз
const drawEyes = (joints) => {
    // Белки глаз
    strokeWeight(1);
    stroke(255);
    fill(255);
    ellipse(joints.head.x - 6, joints.head.y - 3, 6, 4);
    ellipse(joints.head.x + 6, joints.head.y - 3, 6, 4);

    // Карие глаза
    noStroke();
    fill(139, 69, 19); // Коричневый цвет
    ellipse(joints.head.x - 6, joints.head.y - 3, 4, 3);
    ellipse(joints.head.x + 6, joints.head.y - 3, 4, 3);

    // Зрачки
    fill(0);
    ellipse(joints.head.x - 6, joints.head.y - 3, 2, 2);
    ellipse(joints.head.x + 6, joints.head.y - 3, 2, 2);

    // Блеск в глазах
    fill(255);
    ellipse(joints.head.x - 5.5, joints.head.y - 3.5, 1, 1);
    ellipse(joints.head.x + 5.5, joints.head.y - 3.5, 1, 1);

    // Брови
    strokeWeight(2);
    stroke(60, 40, 20);
    noFill();
    arc(joints.head.x - 6, joints.head.y - 6, 8, 3, PI, 0);
    arc(joints.head.x + 6, joints.head.y - 6, 8, 3, PI, 0);

    // Нос
    strokeWeight(1);
    stroke(255, 200, 160);
    line(joints.head.x, joints.head.y - 2, joints.head.x, joints.head.y + 2);

    // Рот (улыбка)
    strokeWeight(2);
    stroke(255, 180, 180);
    noFill();
    arc(joints.head.x, joints.head.y + 5, 8, 4, 0, PI);
}

// Фотореалистичная отрисовка платья
const drawDress = (joints) => {
    if (dancerImages.dress) {
        push();

        // Вычисляем угол наклона туловища для поворота платья
        let torsoAngle = atan2(joints.spineEnd.y - joints.pelvis.y, joints.spineEnd.x - joints.pelvis.x);

        // Позиция платья (от таза до чуть выше колен)
        let dressCenterX = (joints.pelvis.x + joints.spineEnd.x) / 2;
        let dressCenterY = (joints.pelvis.y + joints.spineEnd.y) / 2;

        // Размер платья
        let dressWidth = 60;
        let dressHeight = 120;

        // Ограничиваем высоту платья (чуть выше колен)
        let maxDressY = Math.min(joints.leftKnee.y, joints.rightKnee.y) - 10;
        if (dressCenterY > maxDressY) {
            dressCenterY = maxDressY;
        }

        translate(dressCenterX, dressCenterY);
        rotate(torsoAngle);

        // Рисуем платье с прозрачностью
        tint(255, 255, 255, 200);
        imageMode(CENTER);
        image(dancerImages.dress, 0, 0, dressWidth, dressHeight);

        pop();
    }
}

// Фотореалистичная отрисовка тела
const drawRealisticBody = (joints) => {
    if (dancerImages.body) {
        push();

        // Рисуем руки (видимые части)
        drawRealisticArm(joints.spineEnd, joints.leftShoulder, joints.leftElbow, joints.leftHand, 1);
        drawRealisticArm(joints.spineEnd, joints.rightShoulder, joints.rightElbow, joints.rightHand, -1);

        // Рисуем ноги от колен до ступней (платье скрывает верх)
        drawRealisticLeg(joints.leftKnee, joints.leftFoot, 1);
        drawRealisticLeg(joints.rightKnee, joints.rightFoot, -1);

        pop();
    } else {
        // Fallback к простой отрисовке
        drawBody(joints);
    }
}

// Фотореалистичная отрисовка руки
const drawRealisticArm = (shoulderStart, shoulder, elbow, hand, side) => {
    if (dancerImages.body) {
        push();

        // Вычисляем углы для трансформации
        let armAngle1 = atan2(shoulder.y - shoulderStart.y, shoulder.x - shoulderStart.x);
        let armAngle2 = atan2(elbow.y - shoulder.y, elbow.x - shoulder.x);
        let armAngle3 = atan2(hand.y - elbow.y, hand.x - elbow.x);

        // Рисуем плечо
        translate(shoulder.x, shoulder.y);
        rotate(armAngle1);
        tint(255, 220, 180);
        imageMode(CENTER);
        image(dancerImages.body, 0, 0, 20, 40, 20, 20, 20, 40);

        // Рисуем предплечье
        translate(0, 20);
        rotate(armAngle2 - armAngle1);
        image(dancerImages.body, 0, 0, 15, 35, 20, 60, 15, 35);

        // Рисуем кисть
        translate(0, 17);
        rotate(armAngle3 - armAngle2);
        image(dancerImages.body, 0, 0, 10, 15, 20, 95, 10, 15);

        pop();
    }
}

// Фотореалистичная отрисовка ноги (от колена)
const drawRealisticLeg = (knee, foot, side) => {
    if (dancerImages.body) {
        push();

        // Вычисляем угол ноги
        let legAngle = atan2(foot.y - knee.y, foot.x - knee.x);

        // Рисуем голень
        translate(knee.x, knee.y);
        rotate(legAngle);
        tint(255, 220, 180);
        imageMode(CENTER);
        image(dancerImages.body, 0, 0, 25, 50, 20, 140, 25, 50);

        // Рисуем ступню
        translate(0, 25);
        image(dancerImages.body, side * 8, 0, 20, 15, 20, 190, 20, 15);

        pop();
    }
}

// Фотореалистичная отрисовка головы
const drawRealisticHead = (joints) => {
    if (dancerImages.body) {
        push();

        // Вычисляем угол головы
        let headAngle = atan2(joints.head.y - joints.spineEnd.y, joints.head.x - joints.spineEnd.x);

        translate(joints.head.x, joints.head.y);
        rotate(headAngle);

        // Рисуем голову с лицом
        tint(255, 220, 180);
        imageMode(CENTER);
        image(dancerImages.body, 0, 0, 40, 50, 50, 50, 40, 50);

        pop();
    } else {
        // Fallback к простой отрисовке
        drawHead(joints);
    }
}

// Фотореалистичная отрисовка волос
const drawRealisticHair = (joints) => {
    // Используем улучшенную версию с градиентами
    push();

    // Основные волосы с градиентом
    for (let i = 0; i < 5; i++) {
        let alpha = map(i, 0, 4, 255, 100);
        stroke(60 - i * 5, 40 - i * 3, 20 - i * 2, alpha);
        strokeWeight(3 - i * 0.5);
        noFill();

        // Волосы вокруг головы
        ellipse(joints.head.x, joints.head.y - 5 - i * 2, 32 + i * 3, 35 + i * 2);
    }

    // Челка с объемом
    fill(60, 40, 20, 200);
    noStroke();
    ellipse(joints.head.x, joints.head.y - 10, 28, 15);

    // Длинные пряди с реалистичными изгибами
    stroke(50, 30, 15);
    strokeWeight(2);
    noFill();

    // Левые волосы
    beginShape();
    vertex(joints.head.x - 16, joints.head.y - 8);
    for (let i = 0; i < 3; i++) {
        quadraticVertex(
            joints.head.x - 20 + i * 2,
            joints.head.y + 5 + i * 8,
            joints.head.x - 15 + i * 3,
            joints.head.y + 15 + i * 10
        );
    }
    endShape();

    // Правые волосы
    beginShape();
    vertex(joints.head.x + 16, joints.head.y - 8);
    for (let i = 0; i < 3; i++) {
        quadraticVertex(
            joints.head.x + 20 - i * 2,
            joints.head.y + 5 + i * 8,
            joints.head.x + 15 - i * 3,
            joints.head.y + 15 + i * 10
        );
    }
    endShape();

    pop();
}

// Фотореалистичная отрисовка глаз
const drawRealisticEyes = (joints) => {
    push();

    // Более детальные глаза
    // Белки глаз с тенями
    fill(255);
    noStroke();
    ellipse(joints.head.x - 6, joints.head.y - 3, 8, 6);
    ellipse(joints.head.x + 6, joints.head.y - 3, 8, 6);

    // Тени под глазами
    fill(255, 200, 160, 100);
    ellipse(joints.head.x - 6, joints.head.y - 1, 6, 2);
    ellipse(joints.head.x + 6, joints.head.y - 1, 6, 2);

    // Карие глаза с градиентом
    fill(139, 69, 19);
    ellipse(joints.head.x - 6, joints.head.y - 3, 6, 4);
    ellipse(joints.head.x + 6, joints.head.y - 3, 6, 4);

    // Внутренняя часть глаз
    fill(160, 80, 40);
    ellipse(joints.head.x - 6, joints.head.y - 3, 4, 3);
    ellipse(joints.head.x + 6, joints.head.y - 3, 4, 3);

    // Зрачки
    fill(0);
    ellipse(joints.head.x - 6, joints.head.y - 3, 2.5, 2.5);
    ellipse(joints.head.x + 6, joints.head.y - 3, 2.5, 2.5);

    // Блеск в глазах (более реалистичный)
    fill(255);
    ellipse(joints.head.x - 5.5, joints.head.y - 3.5, 1.5, 1.5);
    ellipse(joints.head.x + 5.5, joints.head.y - 3.5, 1.5, 1.5);

    // Дополнительный блик
    fill(255, 255, 255, 150);
    ellipse(joints.head.x - 6.5, joints.head.y - 3.8, 0.8, 0.8);
    ellipse(joints.head.x + 5.5, joints.head.y - 3.8, 0.8, 0.8);

    // Ресницы
    stroke(60, 40, 20);
    strokeWeight(1);
    for (let i = 0; i < 4; i++) {
        line(joints.head.x - 9 + i * 0.8, joints.head.y - 5, joints.head.x - 8.5 + i * 0.8, joints.head.y - 6);
        line(joints.head.x + 8.5 - i * 0.8, joints.head.y - 5, joints.head.x + 9 - i * 0.8, joints.head.y - 6);
    }

    // Брови с градиентом
    noStroke();
    fill(60, 40, 20, 180);
    arc(joints.head.x - 6, joints.head.y - 6, 10, 4, PI, 0);
    arc(joints.head.x + 6, joints.head.y - 6, 10, 4, PI, 0);

    // Нос с объемом
    strokeWeight(1);
    stroke(255, 200, 160);
    line(joints.head.x, joints.head.y - 2, joints.head.x, joints.head.y + 2);

    // Тень от носа
    stroke(255, 180, 140, 100);
    line(joints.head.x + 1, joints.head.y - 1, joints.head.x + 1, joints.head.y + 1);

    // Рот с объемом
    strokeWeight(2);
    stroke(255, 180, 180);
    noFill();
    arc(joints.head.x, joints.head.y + 5, 10, 5, 0, PI);

    // Внутренняя часть рта
    fill(200, 100, 100);
    noStroke();
    arc(joints.head.x, joints.head.y + 5, 8, 3, 0, PI);

    pop();
}