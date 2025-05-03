// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand(); // Раскрыть веб-приложение на весь экран

// Элементы DOM
const preloader = document.getElementById('preloader');
const gameContainer = document.getElementById('game-container');
const textDisplay = document.getElementById('text-display');
const buttonContainer = document.getElementById('button-container');
const glitchOverlay = document.getElementById('glitch-overlay');

// Звуки (предзагрузка)
const sounds = {
    type: new Audio('webapp/assets/audio/type.mp3'),
    erase: new Audio('webapp/assets/audio/erase.mp3'), // Опционально
    ambient: new Audio('webapp/assets/audio/ambient.mp3'),
    scare1: new Audio('webapp/assets/audio/scare1.mp3'),
    // ... другие звуки
};

// Настройка звуков
sounds.type.volume = 0.6;
sounds.ambient.loop = true;
sounds.ambient.volume = 0.1; // Очень тихо

// --- Структура Игры (как в Python боте, но в JS) ---
const gameSteps = {
    'start': {
        'text': "Привет...\nТы сейчас один дома?\n\n(Отвечай честно. Я чувствую ложь...)",
        'options': {"Да": "alone_confirm", "Нет": "not_alone_1"},
        'sound_effect': null // Можно добавить звук на появление шага
    },
    'alone_confirm': {
        'text': "Точно один?\nАбсолютно уверен?\n\nОглянись.",
        'options': {"Да": "alone_sure_sound", "Нет": "not_alone_lie_detector"},
        'sound_effect': null,
        'glitch': false // Показать ли глюк на этом шаге
    },
    'not_alone_1': {
        'text': "Рядом кто-то есть?\nХорошо...\nТы уверен, что знаешь *всех*, кто сейчас с тобой?",
        'options': {"Да": "know_everyone", "Нет": "dont_know_everyone"},
        'sound_effect': null
    },
     'alone_sure_sound': {
        'text': "Тишина... да?\nИли тебе только кажется?\nПрислушайся.\n\nТы слышал этот тихий звук?\nТолько что.",
        'options': {"Да": "heard_sound", "Нет": "didnt_hear_sound"},
        'sound_effect': 'scare1' // Пример использования звука
    },
    'not_alone_lie_detector': {
        'text': "Сначала ты сказал, что не один.\nТеперь - что один...\nЯ чувствую ложь.\nЭто опасно.\n\nТы *ТОЧНО* один?",
        'options': {"Да": "alone_sure_sound", "Нет": "lie_consequence_1"},
        'sound_effect': null,
        'glitch': true // Пример использования глюка
    },
    'heard_sound': {
        'text': "Да...\nЭто был скрип.\nСовсем рядом.\nЗа дверью твоей комнаты?",
        'options': {"Да": "sound_behind_door", "Нет": "sound_elsewhere"},
        'sound_effect': 'scare1'
    },
    'didnt_hear_sound': {
        'text': "Ты уверен?\nТишина бывает обманчива.\nПрислушайся еще раз.",
        'options': {"Да": "heard_sound_second_try", "Нет": "ignore_sound"},
        'sound_effect': null
    },
    'lie_consequence_1': {
        'text': "Ложь притягивает... нечто.\nОно теперь знает, что ты здесь.\nИгра окончена. Для тебя.",
        'options': {}, // Конец игры
        'sound_effect': 'scare_final', // Добавить страшный финальный звук
        'on_enter': () => { // Функция, выполняемая при входе на этот шаг
             setTimeout(() => tg.close(), 5000); // Закрыть через 5 сек
         }
    },
    // ... ДОБАВИТЬ МНОГО ДРУГИХ ШАГОВ И ВЕТОК ...

    'final_good': {
        'text': "Тихо... Кажется, все спокойно.\nНаверное.\nСпокойной ночи.\n\n(Игра закончится через несколько секунд)",
        'options': {},
        'sound_effect': null,
         'on_enter': () => {
             setTimeout(() => tg.close(), 7000);
         }
    },
    'final_bad': {
        'text': "Скрип повторился.\nГромче.\nБлиже.\nДверная ручка медленно поворачивается...\n\nНе стоило отвечать мне.",
        'options': {},
        'sound_effect': 'scare_final_bad',
        'glitch': true,
         'on_enter': () => {
             setTimeout(() => tg.close(), 8000);
         }
    }
};
// ----------------------------------------------------

let currentStepId = 'start';
let isTyping = false; // Флаг, чтобы избежать двойного запуска анимации

// Функция для проигрывания звука (с обработкой ошибок)
function playSound(soundName, volume = 1) {
    if (sounds[soundName]) {
        sounds[soundName].volume = volume;
        sounds[soundName].play().catch(e => console.error("Audio play failed:", e));
    }
}

// Функция анимации печатания текста
function typeWriter(text, onComplete) {
    isTyping = true;
    textDisplay.innerHTML = ''; // Очистить предыдущий текст
    textDisplay.style.opacity = 1; // Сделать видимым
    const chars = text.split('');
    let i = 0;
    function typeChar() {
        if (i < chars.length) {
            const span = document.createElement('span');
            span.textContent = chars[i];
            textDisplay.appendChild(span);
            // Небольшая задержка перед показом буквы для эффекта
            setTimeout(() => {
                 span.classList.add('visible');
                 if (chars[i] !== ' ' && chars[i] !== '\n') { // Не играть звук на пробелах/переносах
                     playSound('type', 0.6); // Тихий звук печати
                 }
            }, 10); // Можно настроить

            i++;
            setTimeout(typeChar, 70 + Math.random() * 50); // Скорость печати (немного случайная)
        } else {
            isTyping = false;
            if (onComplete) onComplete(); // Вызвать колбэк после завершения
        }
    }
    typeChar();
}

// Функция стирания текста (опционально)
function eraseText(onComplete) {
     isTyping = true; // Блокируем ввод на время стирания
     const spans = textDisplay.querySelectorAll('span');
     let i = spans.length - 1;
     function eraseChar() {
         if (i >= 0) {
             spans[i].classList.add('erasing');
             // playSound('erase'); // Звук стирания, если есть
             i--;
             setTimeout(eraseChar, 20); // Скорость стирания
         } else {
             textDisplay.innerHTML = ''; // Очистить полностью
             isTyping = false;
             if (onComplete) onComplete();
         }
     }
     eraseChar();
 }


// Функция отображения кнопок
function showButtons(options) {
    buttonContainer.innerHTML = ''; // Очистить старые кнопки
    if (!options || Object.keys(options).length === 0) {
        buttonContainer.classList.remove('visible');
        return; // Нет опций - не показываем
    }

    Object.entries(options).forEach(([text, nextStep]) => {
        const button = document.createElement('button');
        button.textContent = text;
        button.dataset.nextStep = nextStep; // Сохраняем следующий шаг в data-атрибуте
        button.addEventListener('click', handleAnswer);
        buttonContainer.appendChild(button);
    });

    // Показать контейнер с анимацией
     // Небольшая задержка перед показом, чтобы CSS успел примениться
    setTimeout(() => buttonContainer.classList.add('visible'), 50);
}

// Функция скрытия кнопок
function hideButtons(onComplete) {
    buttonContainer.classList.remove('visible');
     // Ждем завершения анимации скрытия перед колбэком
     setTimeout(() => {
         buttonContainer.innerHTML = ''; // Удаляем кнопки после скрытия
         if (onComplete) onComplete();
     }, 500); // Должно соответствовать времени transition в CSS
}

// Функция обработки ответа
function handleAnswer(event) {
    if (isTyping) return; // Не обрабатывать клики во время анимации текста

    const nextStepId = event.target.dataset.nextStep;
    currentStepId = nextStepId;

    // Скрыть кнопки перед переходом
    hideButtons(() => {
         // Стереть старый текст перед показом нового
         eraseText(() => {
             loadStep(currentStepId);
         });
    });
}

// Функция загрузки и отображения шага
function loadStep(stepId) {
    const step = gameSteps[stepId];
    if (!step) {
        console.error(`Step ${stepId} not found!`);
        textDisplay.textContent = "Ошибка. Шаг не найден."; // Сообщение об ошибке
        return;
    }

    // Показать эффект глюка, если он есть для шага
    if (step.glitch) {
        glitchOverlay.classList.remove('hidden');
        // Скрыть глюк через некоторое время
        setTimeout(() => glitchOverlay.classList.add('hidden'), 350); // Длительность анимации + немного
    }

    // Проиграть звук шага, если он есть
    if (step.sound_effect) {
        playSound(step.sound_effect);
    }

    // Запустить печать текста
    typeWriter(step.text, () => {
        // Показать кнопки после завершения печати
        showButtons(step.options);

         // Выполнить действие при входе на шаг, если оно есть
         if (step.on_enter && typeof step.on_enter === 'function') {
             step.on_enter();
         }
    });
}


// --- Инициализация игры ---
function initGame() {
    // Скрыть прелоадер и показать игровой контейнер
    preloader.classList.add('hidden');
    gameContainer.classList.remove('hidden');

    // Попробовать включить фоновый звук (может требовать взаимодействия пользователя)
    playSound('ambient', 0.1);
    // Иногда браузеры блокируют автоплей, можно попробовать включить
    // после первого клика по кнопке, если не сработало сразу.

    // Загрузить первый шаг
    loadStep(currentStepId);
}

// Ждем готовности Telegram Web App API
tg.ready();

// Добавляем небольшую задержку перед инициализацией,
// чтобы все ресурсы успели подгрузиться и TWA API точно было готово
window.addEventListener('load', () => {
     // Можно добавить предзагрузку всех звуков здесь для надежности
     // Promise.all(Object.values(sounds).map(s => s.load()))
     //    .then(() => {
             setTimeout(initGame, 500); // Запускаем игру с небольшой задержкой
     //    })
     //    .catch(e => console.error("Error preloading audio:", e));
});

// Попытка включить звук при первом взаимодействии (если автоплей не сработал)
document.body.addEventListener('click', () => {
    if (sounds.ambient.paused) {
        playSound('ambient', 0.1);
    }
}, { once: true }); // Сработает только один раз