// ===== КОНФІГУРАЦІЯ WEB SPEECH API =====
// Перевірка підтримки Web Speech API для різних браузерів
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

// Логування та стан додатку
const state = {
    isRecording: false,
    logEntries: [],
    recognition: null
};

// Елементи DOM
const elements = {
    micButton: document.getElementById('micButton'),
    textInput: document.getElementById('textInput'),
    logList: document.getElementById('logList'),
    statusText: document.getElementById('statusText'),
    errorMessage: document.getElementById('errorMessage'),
    copyAllBtn: document.getElementById('copyAllBtn'),
    clearLogBtn: document.getElementById('clearLogBtn'),
    clearTextBtn: document.getElementById('clearTextBtn')
};

// ===== ІНІЦІАЛІЗАЦІЯ WEB SPEECH API =====
function initSpeechRecognition() {
    // Перевірка доступності API
    if (!SpeechRecognition) {
        showError('Ваш браузер не підтримує розпізнавання голосу. Спробуйте Chrome, Edge або Safari.');
        elements.micButton.disabled = true;
        return;
    }

    state.recognition = new SpeechRecognition();

    // Встановлення параметрів розпізнавання
    state.recognition.lang = 'uk-UA'; // Українська мова
    state.recognition.continuous = true; // Безперервне розпізнавання
    state.recognition.interimResults = true; // Проміжні результати
    state.recognition.maxAlternatives = 1;

    // Обробник початку запису
    state.recognition.onstart = () => {
        state.isRecording = true;
        updateMicButton('recording');
        elements.statusText.textContent = '● Запис... Говоріть зараз';
        elements.statusText.classList.add('recording');
        clearError();
    };

    // Обробник результатів розпізнавання
    state.recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        // Обробка результатів
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;

            if (event.results[i].isFinal) {
                finalTranscript += transcript + ' ';
            } else {
                interimTranscript += transcript;
            }
        }

        // Оновлення текстової області з фінальним текстом
        if (finalTranscript) {
            // Додавання нової фрази до існуючого тексту з пробілом
            const currentText = elements.textInput.value.trim();
            const newText = currentText ? currentText + ' ' + finalTranscript.trim() : finalTranscript.trim();
            elements.textInput.value = newText;

            // Додавання до логу
            addLogEntry(finalTranscript.trim());

            // Відтворення звука успіху (опціонально)
            // playSuccessSound();
        }

        // Відображення проміжного результату у текстовій області під час запису
        if (interimTranscript) {
            // Цей код показує проміжні результати (опціонально)
        }
    };

    // Обробник завершення запису
    state.recognition.onend = () => {
        state.isRecording = false;
        
        // Додавання нового рядка при паузі, якщо вже є текст
        if (elements.textInput.value.trim()) {
            // Додаємо новий рядок в кінець для наступної фрази
            if (!elements.textInput.value.endsWith('\n')) {
                elements.textInput.value += '\n';
            }
            
            updateMicButton('success');
            elements.statusText.textContent = '✓ Текст розпізнано успішно';
            elements.statusText.classList.remove('recording');
            
            // Повернення до нормального стану через 2 секунди
            setTimeout(() => {
                if (!state.isRecording) {
                    updateMicButton('inactive');
                    elements.statusText.textContent = 'Готово до запису';
                }
            }, 2000);
        } else {
            updateMicButton('inactive');
            elements.statusText.textContent = 'Готово до запису';
            elements.statusText.classList.remove('recording');
        }
    };

    // Обробник помилок
    state.recognition.onerror = (event) => {
        let errorMessage = '';
        
        switch (event.error) {
            case 'no-speech':
                errorMessage = 'Помилка: голос не виявлено. Спробуйте ще раз.';
                break;
            case 'audio-capture':
                errorMessage = 'Помилка: мікрофон не знайдено. Перевірте підключення мікрофона.';
                break;
            case 'network':
                errorMessage = 'Помилка мережі. Перевірте інтернет-з\'єднання.';
                break;
            case 'not-allowed':
                errorMessage = 'Помилка: доступ до мікрофона заблокований. Надайте дозвіл у налаштуваннях браузера.';
                break;
            case 'permission-denied':
                errorMessage = 'Помилка: дозвіл на використання мікрофона відхилено.';
                break;
            default:
                errorMessage = `Помилка розпізнавання: ${event.error}`;
        }
        
        showError(errorMessage);
        updateMicButton('inactive');
        elements.statusText.textContent = 'Готово до запису';
        elements.statusText.classList.remove('recording');
        state.isRecording = false;
    };
}

// ===== УПРАВЛІННЯ СТАНОМ МІКРОФОННОЇ КНОПКИ =====
function updateMicButton(newState) {
    elements.micButton.classList.remove('inactive', 'recording', 'success');
    elements.micButton.classList.add(newState);
}

// ===== ОБРОБНИК КЛІК МІКРОФОННОЇ КНОПКИ =====
elements.micButton.addEventListener('click', () => {
    if (!state.recognition) {
        showError('Web Speech API недоступна');
        return;
    }

    if (state.isRecording) {
        // Зупинка запису
        state.recognition.stop();
    } else {
        // Початок запису
        elements.textInput.focus();
        state.recognition.start();
    }
});

// ===== ФУНКЦІЇ ЛОГУВАННЯ =====
function addLogEntry(text) {
    const timestamp = getCurrentTime();
    const entry = {
        id: Date.now(),
        text: text,
        timestamp: timestamp
    };

    state.logEntries.unshift(entry); // Додавання в початок масиву
    renderLog();
}

function getCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

function renderLog() {
    if (state.logEntries.length === 0) {
        elements.logList.innerHTML = '<div class="log-empty">Логування розпочнеться після першого розпізнавання фрази</div>';
        elements.copyAllBtn.style.display = 'none';
        elements.clearLogBtn.style.display = 'none';
        // Скидаємо висоту логу при видаленні записів
        elements.logList.style.maxHeight = 'none';
        return;
    }

    elements.copyAllBtn.style.display = 'block';
    elements.clearLogBtn.style.display = 'block';

    elements.logList.innerHTML = state.logEntries.map(entry => `
        <div class="log-item">
            <div class="log-content">
                <div class="log-text">${escapeHtml(entry.text)}</div>
                <div class="log-time"><span class="material-icons">schedule</span> ${entry.timestamp}</div>
            </div>
            <div class="log-actions">
                <button class="btn-copy" onclick="copyLogEntry(${entry.id})">
                    <span class="material-icons">content_copy</span>
                </button>
            </div>
        </div>
    `).join('');
    
    // Додаємо скрол тільки якщо більше 8 записів
    if (state.logEntries.length > 8) {
        elements.logList.style.maxHeight = '600px';
        elements.logList.style.overflowY = 'auto';
    } else {
        elements.logList.style.maxHeight = 'none';
        elements.logList.style.overflowY = 'visible';
    }
}

function copyLogEntry(entryId) {
    const entry = state.logEntries.find(e => e.id === entryId);
    if (entry) {
        copyToClipboard(entry.text);
    }
}

function copyAllLog() {
    const allText = state.logEntries.map(e => e.text).join('\n');
    copyToClipboard(allText);
}

function clearLog() {
    if (confirm('Ви впевнені, що хочете очистити весь лог?')) {
        state.logEntries = [];
        renderLog();
        showSuccess('Лог очищено');
    }
}

function clearText() {
    elements.textInput.value = '';
    showSuccess('Текст очищено');
}

// ===== ФУНКЦІЇ КОПІЮВАННЯ =====
function copyToClipboard(text) {
    // Спроба використання сучасного API
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showSuccess('Текст скопійовано в буфер обміну');
        }).catch(() => {
            // Fallback для старих браузерів
            fallbackCopyToClipboard(text);
        });
    } else {
        fallbackCopyToClipboard(text);
    }
}

function fallbackCopyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
        document.execCommand('copy');
        showSuccess('Текст скопійовано в буфер обміну');
    } catch (err) {
        showError('Помилка при копіюванні тексту');
    }
    
    document.body.removeChild(textarea);
}

// ===== ФУНКЦІЇ ПОКАЗУ ПОВІДОМЛЕНЬ =====
function showError(message) {
    const errorEl = elements.errorMessage;
    errorEl.textContent = '⚠ ' + message;
    errorEl.classList.remove('success');
    errorEl.classList.add('show');
}

function showSuccess(message) {
    const errorEl = elements.errorMessage;
    errorEl.textContent = '✓ ' + message;
    errorEl.classList.add('success');
    errorEl.classList.add('show');
    
    // Приховування через 3 секунди
    setTimeout(() => {
        clearError();
    }, 3000);
}

function clearError() {
    elements.errorMessage.classList.remove('show');
}

// ===== ФУНКЦІЯ ЕКРАНУВАННЯ HTML =====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== ФУНКЦІЯ ЗВУКУ УСПІХУ =====
function playSuccessSound() {
    // Створення простого звуку за допомогою Web Audio API
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800; // Частота у Hz
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    } catch (e) {
        // Ігнорування помилок при створенні звука
    }
}

// ===== НАЗНАЧЕННЯ ОБРОБНИКІВ ПОДІЙ =====
elements.copyAllBtn.addEventListener('click', copyAllLog);
elements.clearLogBtn.addEventListener('click', clearLog);
elements.clearTextBtn.addEventListener('click', clearText);

// ===== ІНІЦІАЛІЗАЦІЯ =====
initSpeechRecognition();

// Лог у консоль про успішну ініціалізацію
console.log('✓ Голосовий помічник ініціалізовано');
console.log('🎤 Мова: українська (uk-UA)');
console.log('💡 Совіт: Натисніть мікрофонну кнопку для запису голосу');
