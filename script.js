// Telegram WebApp API
const tg = window.Telegram.WebApp;

// Состояние приложения
let currentQuestion = 1;
let answers = {};
let questions = [];

// Элементы DOM
const welcomeScreen = document.getElementById('welcomeScreen');
const questionScreen = document.getElementById('questionScreen');
const resultsScreen = document.getElementById('resultsScreen');
const navigation = document.getElementById('navigation');

const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const questionTitle = document.getElementById('questionTitle');
const questionText = document.getElementById('questionText');
const resultsGrid = document.getElementById('resultsGrid');

const startBtn = document.getElementById('startBtn');
const nextBtn = document.getElementById('nextBtn');
const prevBtn = document.getElementById('prevBtn');
const restartBtn = document.getElementById('restartBtn');

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    // Настройка Telegram WebApp
    tg.ready();
    tg.expand();
    
    // Загружаем вопросы
    loadQuestions();
    
    // Обработчики событий
    startBtn.addEventListener('click', startSurvey);
    nextBtn.addEventListener('click', nextQuestion);
    prevBtn.addEventListener('click', prevQuestion);
    restartBtn.addEventListener('click', restartSurvey);
    
    // Обработчики кнопок рейтинга
    document.querySelectorAll('.rating-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            selectRating(parseInt(this.dataset.rating));
        });
    });
    
    // Показываем экран приветствия
    showScreen('welcome');
});

// Загрузка вопросов (пока заглушка)
function loadQuestions() {
    // TODO: Заменить на реальные вопросы
    questions = [];
    for (let i = 1; i <= 40; i++) {
        questions.push({
            id: i,
            text: `Вопрос ${i}: [Текст вопроса будет заменен на настоящий]`
        });
    }
}

// Начать опрос
function startSurvey() {
    currentQuestion = 1;
    answers = {};
    showScreen('question');
    updateQuestion();
}

// Показать экран
function showScreen(screen) {
    welcomeScreen.classList.add('hidden');
    questionScreen.classList.add('hidden');
    resultsScreen.classList.add('hidden');
    navigation.classList.add('hidden');
    
    switch(screen) {
        case 'welcome':
            welcomeScreen.classList.remove('hidden');
            break;
        case 'question':
            questionScreen.classList.remove('hidden');
            navigation.classList.remove('hidden');
            break;
        case 'results':
            resultsScreen.classList.remove('hidden');
            break;
    }
}

// Обновить вопрос
function updateQuestion() {
    const question = questions[currentQuestion - 1];
    questionTitle.textContent = `Вопрос ${currentQuestion}`;
    questionText.textContent = question.text;
    
    // Обновить прогресс
    const progress = (currentQuestion / questions.length) * 100;
    progressFill.style.width = `${progress}%`;
    progressText.textContent = `Вопрос ${currentQuestion} из ${questions.length}`;
    
    // Обновить кнопки навигации
    prevBtn.disabled = currentQuestion === 1;
    nextBtn.disabled = !answers[currentQuestion];
    
    // Сбросить выбор рейтинга
    document.querySelectorAll('.rating-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Показать предыдущий выбор
    if (answers[currentQuestion]) {
        const selectedBtn = document.querySelector(`[data-rating="${answers[currentQuestion]}"]`);
        if (selectedBtn) {
            selectedBtn.classList.add('selected');
        }
    }
}

// Выбрать рейтинг
function selectRating(rating) {
    answers[currentQuestion] = rating;
    
    // Обновить UI
    document.querySelectorAll('.rating-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    document.querySelector(`[data-rating="${rating}"]`).classList.add('selected');
    
    // Активировать кнопку "Далее"
    nextBtn.disabled = false;
    
    // Автоматически перейти к следующему вопросу через 0.5 сек
    setTimeout(() => {
        if (currentQuestion < questions.length) {
            nextQuestion();
        }
    }, 500);
}

// Следующий вопрос
function nextQuestion() {
    if (currentQuestion < questions.length) {
        currentQuestion++;
        updateQuestion();
    } else {
        finishSurvey();
    }
}

// Предыдущий вопрос
function prevQuestion() {
    if (currentQuestion > 1) {
        currentQuestion--;
        updateQuestion();
    }
}

// Завершить опрос
function finishSurvey() {
    // Вычислить результаты
    const results = calculateResults(answers);
    
    // Показать результаты
    showResults(results);
    
    // Отправить данные в бот
    sendResultsToBot(answers, results);
}

// Показать результаты
function showResults(results) {
    resultsGrid.innerHTML = '';
    
    Object.entries(results).forEach(([culture, score]) => {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        resultItem.innerHTML = `
            <span class="result-label">${culture}</span>
            <span class="result-score">${score}</span>
        `;
        resultsGrid.appendChild(resultItem);
    });
    
    showScreen('results');
}

// Вычислить результаты (заглушка)
function calculateResults(answers) {
    // TODO: Заменить на реальный алгоритм
    const totalScore = Object.values(answers).reduce((sum, answer) => sum + answer, 0);
    const avgScore = totalScore / Object.keys(answers).length;
    
    return {
        "Культура 1": Math.round(avgScore * 20),
        "Культура 2": Math.round(avgScore * 25),
        "Культура 3": Math.round(avgScore * 30),
        "Культура 4": Math.round(avgScore * 25)
    };
}

// Отправить результаты в бот
function sendResultsToBot(answers, results) {
    const data = {
        answers: answers,
        results: results,
        user_id: tg.initDataUnsafe.user?.id,
        username: tg.initDataUnsafe.user?.username
    };
    
    // Отправить данные через Telegram WebApp API
    tg.sendData(JSON.stringify(data));
    
    // Показать уведомление
    tg.showAlert('Результаты отправлены!');
}

// Перезапустить опрос
function restartSurvey() {
    showScreen('welcome');
}

// Обработка закрытия приложения
tg.onEvent('viewportChanged', function() {
    tg.expand();
});

// Обработка кнопки "Назад" в Telegram
tg.onEvent('backButtonClicked', function() {
    if (currentQuestion > 1) {
        prevQuestion();
    } else {
        tg.close();
    }
});

// Показать кнопку "Назад" когда нужно
function updateBackButton() {
    if (currentQuestion > 1) {
        tg.BackButton.show();
    } else {
        tg.BackButton.hide();
    }
}

// Обновить кнопку "Назад" при изменении вопроса
const originalUpdateQuestion = updateQuestion;
updateQuestion = function() {
    originalUpdateQuestion();
    updateBackButton();
};
