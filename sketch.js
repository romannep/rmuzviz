// RDance - Dance Simulator
// Система управления скелетом танцора

let isFullscreen = false;
let isPaused = false;

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
const CURRENT_RENDER_MODE = RENDER_MODE.PHOTOREALISTIC;

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
        circle(joints.head.x, joints.head.y, jointRadius);
    }
    
    // Простая отрисовка девушки с правильными пропорциями
    drawSimpleGirl(joints) {
        push();
        
        // Рисуем платье
        this.drawSimpleDress(joints);
        
        // Рисуем тело
        this.drawSimpleBody(joints);
        
        // Рисуем голову
        this.drawSimpleHead(joints);
        
        // Рисуем волосы
        this.drawSimpleHair(joints);
        
        // Рисуем лицо
        this.drawSimpleFace(joints);
        
        pop();
    }
    
    // Простое платье
    drawSimpleDress(joints) {
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
    drawSimpleBody(joints) {
        // Цвет кожи
        fill(255, 220, 180);
        noStroke();
        
        // Руки (видимые части)
        this.drawSimpleArm(joints.spineEnd, joints.leftShoulder, joints.leftElbow, joints.leftHand, 1);
        this.drawSimpleArm(joints.spineEnd, joints.rightShoulder, joints.rightElbow, joints.rightHand, -1);
        
        // Ноги (от колен)
        this.drawSimpleLeg(joints.leftKnee, joints.leftFoot, 1);
        this.drawSimpleLeg(joints.rightKnee, joints.rightFoot, -1);
        
        // Шея
        strokeWeight(8);
        stroke(255, 220, 180);
        line(joints.spineEnd.x, joints.spineEnd.y, joints.head.x, joints.head.y);
    }
    
    // Простая рука
    drawSimpleArm(shoulderStart, shoulder, elbow, hand, side) {
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
    drawSimpleLeg(knee, foot, side) {
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
    drawSimpleHead(joints) {
        fill(255, 220, 180);
        noStroke();
        
        // Лицо (овальное)
        ellipse(joints.head.x, joints.head.y, 30, 40);
        
        // Подбородок
        ellipse(joints.head.x, joints.head.y + 15, 20, 10);
    }
    
    // Простые волосы
    drawSimpleHair(joints) {
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
    drawSimpleFace(joints) {
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
    drawDetailedGirl(joints) {
        push();
        
        // Рисуем платье с деталями
        this.drawDetailedDress(joints);
        
        // Рисуем тело с деталями
        this.drawDetailedBody(joints);
        
        // Рисуем голову с деталями
        this.drawDetailedHead(joints);
        
        // Рисуем волосы с деталями
        this.drawDetailedHair(joints);
        
        // Рисуем лицо с деталями
        this.drawDetailedFace(joints);
        
        pop();
    }
    
    // Детализированное платье
    drawDetailedDress(joints) {
        // Основное платье с градиентом
        fill(150, 40, 100);
        noStroke();
        
        // Талия (узкая часть)
        let waistY = joints.pelvis.y + (joints.spineEnd.y - joints.pelvis.y) * 0.3;
        let waistX = joints.pelvis.x + (joints.spineEnd.x - joints.pelvis.x) * 0.3;
        ellipse(waistX, waistY, 28, 40);
        
        // Верх платья
        let chestY = joints.pelvis.y + (joints.spineEnd.y - joints.pelvis.y) * 0.6;
        let chestX = joints.pelvis.x + (joints.spineEnd.x - joints.pelvis.x) * 0.6;
        ellipse(chestX, chestY, 38, 50);
        
        // Юбка с складками
        let skirtY = (waistY + Math.min(joints.leftKnee.y, joints.rightKnee.y)) / 2;
        let skirtX = waistX;
        let skirtHeight = Math.min(joints.leftKnee.y, joints.rightKnee.y) - waistY - 15;
        ellipse(skirtX, skirtY, 55, skirtHeight);
        
        // Складки на юбке
        fill(130, 30, 80);
        for (let i = 0; i < 3; i++) {
            let foldX = skirtX + (i - 1) * 8;
            ellipse(foldX, skirtY, 45, skirtHeight - 5);
        }
        
        // Вырез с деталями
        fill(170, 60, 120);
        ellipse(chestX, chestY - 10, 22, 18);
        
        // Пояс
        fill(100, 20, 60);
        ellipse(waistX, waistY, 30, 8);
    }
    
    // Детализированное тело
    drawDetailedBody(joints) {
        // Цвет кожи
        fill(255, 220, 180);
        noStroke();
        
        // Руки с деталями
        this.drawDetailedArm(joints.spineEnd, joints.leftShoulder, joints.leftElbow, joints.leftHand, 1);
        this.drawDetailedArm(joints.spineEnd, joints.rightShoulder, joints.rightElbow, joints.rightHand, -1);
        
        // Ноги с деталями
        this.drawDetailedLeg(joints.leftKnee, joints.leftFoot, 1);
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
    
    // Детализированная рука
    drawDetailedArm(shoulderStart, shoulder, elbow, hand, side) {
        fill(255, 220, 180);
        noStroke();
        
        // Плечо с объемом
        ellipse(shoulder.x, shoulder.y, 14, 28);
        
        // Предплечье с объемом
        ellipse(elbow.x, elbow.y, 12, 22);
        
        // Кисть с деталями
        ellipse(hand.x, hand.y, 10, 14);
        
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
    
    // Детализированная нога
    drawDetailedLeg(knee, foot, side) {
        fill(255, 220, 180);
        noStroke();
        
        // Голень с объемом
        ellipse(knee.x, knee.y, 18, 38);
        
        // Ступня с деталями
        ellipse(foot.x + side * 10, foot.y, 22, 14);
        
        // Соединение с градиентом
        strokeWeight(5);
        stroke(255, 220, 180);
        line(knee.x, knee.y, foot.x, foot.y);
        
        // Тень на ноге
        strokeWeight(3);
        stroke(255, 200, 160);
        line(knee.x + side * 2, knee.y, foot.x + side * 2, foot.y);
    }
    
    // Детализированная голова
    drawDetailedHead(joints) {
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
    
    // Детализированные волосы
    drawDetailedHair(joints) {
        fill(60, 40, 20);
        noStroke();
        
        // Основные волосы с объемом
        ellipse(joints.head.x, joints.head.y - 8, 38, 48);
        
        // Челка с деталями
        ellipse(joints.head.x, joints.head.y - 12, 28, 15);
        
        // Длинные пряди с деталями
        stroke(60, 40, 20);
        strokeWeight(4);
        noFill();
        
        // Левая прядь с изгибами
        beginShape();
        vertex(joints.head.x - 16, joints.head.y - 5);
        quadraticVertex(joints.head.x - 22, joints.head.y + 8, joints.head.x - 14, joints.head.y + 20);
        quadraticVertex(joints.head.x - 10, joints.head.y + 30, joints.head.x - 8, joints.head.y + 25);
        endShape();
        
        // Правая прядь с изгибами
        beginShape();
        vertex(joints.head.x + 16, joints.head.y - 5);
        quadraticVertex(joints.head.x + 22, joints.head.y + 8, joints.head.x + 14, joints.head.y + 20);
        quadraticVertex(joints.head.x + 10, joints.head.y + 30, joints.head.x + 8, joints.head.y + 25);
        endShape();
        
        // Дополнительные пряди
        strokeWeight(2);
        for (let i = 0; i < 3; i++) {
            let x = joints.head.x - 12 + i * 12;
            let y = joints.head.y + 15 + i * 5;
            line(x, joints.head.y - 3, x - 3, y);
            line(x, joints.head.y - 3, x + 3, y);
        }
    }
    
    // Детализированное лицо
    drawDetailedFace(joints) {
        // Глаза с деталями
        fill(255);
        noStroke();
        ellipse(joints.head.x - 8, joints.head.y - 5, 10, 8);
        ellipse(joints.head.x + 8, joints.head.y - 5, 10, 8);
        
        // Карие глаза с градиентом
        fill(139, 69, 19);
        ellipse(joints.head.x - 8, joints.head.y - 5, 7, 5);
        ellipse(joints.head.x + 8, joints.head.y - 5, 7, 5);
        
        // Внутренняя часть глаз
        fill(160, 80, 40);
        ellipse(joints.head.x - 8, joints.head.y - 5, 5, 4);
        ellipse(joints.head.x + 8, joints.head.y - 5, 5, 4);
        
        // Зрачки
        fill(0);
        ellipse(joints.head.x - 8, joints.head.y - 5, 3, 3);
        ellipse(joints.head.x + 8, joints.head.y - 5, 3, 3);
        
        // Блики
        fill(255);
        ellipse(joints.head.x - 7.5, joints.head.y - 5.5, 1.5, 1.5);
        ellipse(joints.head.x + 7.5, joints.head.y - 5.5, 1.5, 1.5);
        
        // Дополнительный блик
        fill(255, 255, 255, 150);
        ellipse(joints.head.x - 8.5, joints.head.y - 6, 1, 1);
        ellipse(joints.head.x + 7.5, joints.head.y - 6, 1, 1);
        
        // Брови с деталями
        stroke(60, 40, 20);
        strokeWeight(3);
        noFill();
        arc(joints.head.x - 8, joints.head.y - 8, 12, 4, PI, 0);
        arc(joints.head.x + 8, joints.head.y - 8, 12, 4, PI, 0);
        
        // Нос с объемом
        strokeWeight(2);
        stroke(255, 200, 160);
        line(joints.head.x, joints.head.y - 2, joints.head.x, joints.head.y + 4);
        
        // Тень от носа
        strokeWeight(1);
        stroke(255, 180, 140, 100);
        line(joints.head.x + 1, joints.head.y - 1, joints.head.x + 1, joints.head.y + 2);
        
        // Рот с деталями
        strokeWeight(3);
        stroke(255, 180, 180);
        noFill();
        arc(joints.head.x, joints.head.y + 8, 10, 5, 0, PI);
        
        // Внутренняя часть рта
        fill(200, 100, 100);
        noStroke();
        arc(joints.head.x, joints.head.y + 8, 8, 3, 0, PI);
        
        // Губы
        strokeWeight(2);
        stroke(255, 160, 160);
        noFill();
        arc(joints.head.x, joints.head.y + 8, 10, 5, 0, PI);
    }
    
    // Фотореалистичная отрисовка (переименованная существующая)
    drawPhotorealisticGirl(joints) {
        // Рисуем платье (чуть выше колена)
        this.drawDress(joints);
        
        // Рисуем тело девушки
        this.drawRealisticBody(joints);
        
        // Рисуем голову с лицом
        this.drawRealisticHead(joints);
        
        // Рисуем волосы
        this.drawRealisticHair(joints);
        
        // Рисуем глаза
        this.drawRealisticEyes(joints);
    }
    
    // Отрисовка тела девушки
    drawBody(joints) {
        // Настройки для тела
        strokeWeight(4);
        stroke(255, 220, 180); // Теплый телесный цвет
        fill(255, 220, 180);
        
        // Рисуем ноги (женские формы)
        this.drawLeg(joints.leftFoot, joints.leftKnee, joints.pelvis, 1);
        this.drawLeg(joints.rightFoot, joints.rightKnee, joints.pelvis, -1);
        
        // Рисуем туловище
        this.drawTorso(joints);
        
        // Рисуем руки
        this.drawArm(joints.spineEnd, joints.leftShoulder, joints.leftElbow, joints.leftHand, 1);
        this.drawArm(joints.spineEnd, joints.rightShoulder, joints.rightElbow, joints.rightHand, -1);
        
        // Рисуем шею
        this.drawNeck(joints.spineEnd, joints.head);
    }
    
    // Отрисовка ноги
    drawLeg(foot, knee, pelvis, side) {
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
    drawTorso(joints) {
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
    drawArm(shoulderStart, shoulder, elbow, hand, side) {
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
    drawNeck(spineEnd, head) {
        strokeWeight(6);
        line(spineEnd.x, spineEnd.y, head.x, head.y);
    }
    
    // Отрисовка головы
    drawHead(joints) {
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
    drawHair(joints) {
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
    drawEyes(joints) {
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
    drawDress(joints) {
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
    drawRealisticBody(joints) {
        if (dancerImages.body) {
            push();
            
            // Рисуем руки (видимые части)
            this.drawRealisticArm(joints.spineEnd, joints.leftShoulder, joints.leftElbow, joints.leftHand, 1);
            this.drawRealisticArm(joints.spineEnd, joints.rightShoulder, joints.rightElbow, joints.rightHand, -1);
            
            // Рисуем ноги от колен до ступней (платье скрывает верх)
            this.drawRealisticLeg(joints.leftKnee, joints.leftFoot, 1);
            this.drawRealisticLeg(joints.rightKnee, joints.rightFoot, -1);
            
            pop();
        } else {
            // Fallback к простой отрисовке
            this.drawBody(joints);
        }
    }
    
    // Фотореалистичная отрисовка руки
    drawRealisticArm(shoulderStart, shoulder, elbow, hand, side) {
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
    drawRealisticLeg(knee, foot, side) {
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
    drawRealisticHead(joints) {
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
            this.drawHead(joints);
        }
    }
    
    // Фотореалистичная отрисовка волос
    drawRealisticHair(joints) {
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
    drawRealisticEyes(joints) {
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