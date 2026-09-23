let tasks = JSON.parse(localStorage.getItem('my_tasks')) || [];
const activeTimers = {};
let selectedTaskIdForTimer = null;

// Element References
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskShortDescInput = document.getElementById('task-short-desc');
const taskLongDescInput = document.getElementById('task-long-desc');
const pendingList = document.getElementById('pending-list');
const completedList = document.getElementById('completed-list');

const formModal = document.getElementById('form-modal');
const btnOpenForm = document.getElementById('btn-open-form');
const btnCloseForm = document.getElementById('btn-close-form');

const timerModal = document.getElementById('timer-modal');
const modalTimerSelect = document.getElementById('modal-timer-select');
const btnSaveTimer = document.getElementById('btn-save-timer');
const btnCloseTimerModal = document.getElementById('btn-close-timer-modal');

const descModal = document.getElementById('desc-modal');
const btnCloseModal = document.getElementById('btn-close-modal');

const inputTimerHours = document.getElementById('timer-hours');
const inputTimerMinutes = document.getElementById('timer-minutes');
const inputTimerSeconds = document.getElementById('timer-seconds');


const DURATION_OPTIONS = [
    { label: '5 Menit', minutes: 5 },
    { label: '10 Menit', minutes: 10 },
    { label: '15 Menit', minutes: 15 },
    { label: '30 Menit', minutes: 30 },
    { label: '1 Jam', minutes: 60 },
    { label: '2 Jam', minutes: 120 },
    { label: '3 Jam', minutes: 180 },
    { label: '4 Jam', minutes: 240 },
    { label: '8 Jam', minutes: 480 }
];

// KODE BARU (Hanya minta izin 1x di awal jika pengguna belum pernah memilih)
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}

function triggerNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body });
    }
    showToast(`${title}: ${body}`);
}

function showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

function saveTasks() {
    localStorage.setItem('my_tasks', JSON.stringify(tasks));
}

function formatTime(seconds = 0) {
    if (seconds <= 0) return '00:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    const pad = (num) => String(num).padStart(2, '0');
    return hrs > 0 ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
}

function formatDeadline(dateTimeStr) {
    if (!dateTimeStr) return '';
    const date = new Date(dateTimeStr);
    if (isNaN(date.getTime())) return '';

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${date.getDate()} ${months[date.getMonth()]}, ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// Loop Pengecekan Overdue Real-Time
setInterval(() => {
    const now = new Date().getTime();
    let needsRender = false;

    tasks.forEach(task => {
        if (!task.isCompleted) {
            // 1. Cek Keterlambatan Deadline
            if (task.deadline) {
                const deadlineTime = new Date(task.deadline).getTime();
                if (now > deadlineTime) {
                    if (!task.isOverdue) {
                        task.isOverdue = true;
                        task.overdueSeconds = Math.floor((now - deadlineTime) / 1000);
                        triggerNotification("Deadline Terlewati!", `Task "${task.text}" telah melewati deadline!`);
                        needsRender = true;
                    } else {
                        task.overdueSeconds = Math.floor((now - deadlineTime) / 1000);
                        const overdueEl = document.getElementById(`overdue-timer-${task.id}`);
                        if (overdueEl) overdueEl.textContent = `+${formatTime(task.overdueSeconds)}`;
                    }
                }
            }
            // 2. Increment Stopwatch Overdue dari Timer
            else if (task.isOverdue && task.overdueFromTimer) {
                task.overdueSeconds = (task.overdueSeconds || 0) + 1;
                const overdueEl = document.getElementById(`overdue-timer-${task.id}`);
                if (overdueEl) overdueEl.textContent = `+${formatTime(task.overdueSeconds)}`;
            }
        }
    });

    if (needsRender) {
        saveTasks();
        render();
    }
}, 1000);

// Collapse / Expand Section Completed
window.toggleCompletedSection = function () {
    const container = document.querySelector('.completed-container');
    if (container) {
        container.classList.toggle('collapsed');
    }
};

function render() {
    if (!pendingList || !completedList) return;

    pendingList.innerHTML = '';
    completedList.innerHTML = '';
    let completedCount = 0;

    tasks.forEach(task => {
        const li = document.createElement('li');
        const isOverdue = !!task.isOverdue;
        li.className = `task-item ${task.isCompleted ? 'done' : ''} ${isOverdue && !task.isCompleted ? 'overdue' : ''}`;

        const isRunning = !!activeTimers[task.id];
        const hasTimer = !task.deadline && task.remainingSeconds && task.remainingSeconds > 0;

        const shortDescText = (task.shortDesc && task.shortDesc !== 'undefined') ? task.shortDesc : '';
        const shortDescHtml = shortDescText ? `<span class="task-short-desc">${shortDescText}</span>` : '';

        // Pengecekan Long Description (Kembali menggunakan class badge khusus + icon pensil)
        const hasLongDesc = task.longDesc && task.longDesc.trim() !== '' && task.longDesc !== 'Tidak ada catatan detail.';
        const longDescBadgeHtml = hasLongDesc ? `<span class="task-long-desc-badge">📝 Ada Catatan</span>` : '';

        const deadlineText = formatDeadline(task.deadline);
        const deadlineHtml = deadlineText ? `<span class="task-timestamp">Deadline: ${deadlineText}</span>` : '';
        const overdueBadgeHtml = isOverdue ? `<span class="overdue-badge">Overdue</span>` : '';

        if (task.isCompleted) {
            completedCount++;
            li.innerHTML = `
        <div class="task-clickable-area" onclick="openDescModal(${task.id})">
            <input type="checkbox" checked onclick="event.stopPropagation(); toggleTask(${task.id})">
            <div class="task-info">
                <span class="task-text">${task.text}</span>
                ${shortDescHtml}
                ${deadlineHtml}
            </div>
        </div>
        <div class="task-right-section">
            <button onclick="deleteTask(${task.id})" class="btn-timer-action text-danger" style="margin-left: 4px;">Hapus</button>
        </div>
    `;
            completedList.appendChild(li);
        } else {
        let rightControlHtml = '';

        // Kontrol Waktu / Stopwatch untuk Task Ongoing
        if(isOverdue) {
            rightControlHtml = `<span class="timer-display overdue-timer" id="overdue-timer-${task.id}">+${formatTime(task.overdueSeconds || 0)}</span>`;
        } else if(!task.deadline && hasTimer) {
        rightControlHtml = `
                    <span class="timer-display" id="timer-${task.id}">${formatTime(task.remainingSeconds)}</span>
                    <button class="btn-timer-action" onclick="toggleTimer(${task.id})">${isRunning ? 'Pause' : 'Start'}</button>
                `;
    }

    const editTimerOptionHtml = !task.deadline ? `<button onclick="openEditTimerModal(${task.id})">${hasTimer ? 'Edit Timer' : 'Set Timer'}</button>` : '';

    li.innerHTML = `
                <div class="task-clickable-area" onclick="openDescModal(${task.id})">
                    <input type="checkbox" onclick="event.stopPropagation(); toggleTask(${task.id})">
                    <div class="task-info">
                        <span class="task-text">${task.text}</span>
                        ${shortDescHtml}
                        ${deadlineHtml}
                        ${overdueBadgeHtml}
                    </div>
                </div>
                <div class="task-right-section">
                    ${hasLongDesc ? longDescBadgeHtml : ''}
                    ${rightControlHtml}
                    <div class="dropdown">
                        <button class="btn-dots" onclick="toggleDropdown(event, ${task.id})">⋮</button>
                        <div id="dropdown-${task.id}" class="dropdown-menu hidden">
                            ${editTimerOptionHtml}
                            <button onclick="deleteTask(${task.id})" class="text-danger">Hapus</button>
                        </div>
                    </div>
                </div>
            `;
    pendingList.appendChild(li);
}
    });

const completedCountEl = document.getElementById('completed-count');
if (completedCountEl) completedCountEl.textContent = completedCount;
}

// Handler Dropdown Menu
window.toggleDropdown = function (e, id) {
    e.stopPropagation();

    document.querySelectorAll('.dropdown-menu').forEach(el => {
        if (el.id !== `dropdown-${id}`) {
            el.classList.add('hidden');
        }
    });

    const targetMenu = document.getElementById(`dropdown-${id}`);
    if (targetMenu) {
        targetMenu.classList.toggle('hidden');
    }
};

document.addEventListener('click', () => {
    document.querySelectorAll('.dropdown-menu').forEach(el => el.classList.add('hidden'));
});

// Timer Modal Operations
window.openEditTimerModal = function (id) {
    const task = tasks.find(t => t.id === id);
    if (!task || task.deadline || activeTimers[id]) return;

    selectedTaskIdForTimer = id;

    // Jika task sudah punya target timer, break down ke Jam, Menit, dan Detik
    const totalSecs = task.targetSeconds || 0;
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;

    if (inputTimerHours) inputTimerHours.value = hrs;
    if (inputTimerMinutes) inputTimerMinutes.value = mins;
    if (inputTimerSeconds) inputTimerSeconds.value = secs;

    timerModal.classList.remove('hidden');
};

btnSaveTimer.addEventListener('click', () => {
    if (!selectedTaskIdForTimer) return;
    const task = tasks.find(t => t.id === selectedTaskIdForTimer);
    if (task) {
        const hrs = parseInt(inputTimerHours.value, 10) || 0;
        const mins = parseInt(inputTimerMinutes.value, 10) || 0;
        const secs = parseInt(inputTimerSeconds.value, 10) || 0;

        const totalSeconds = (hrs * 3600) + (mins * 60) + secs;

        if (totalSeconds <= 0) {
            showToast("Masukkan durasi timer yang valid!");
            return;
        }

        task.targetSeconds = totalSeconds;
        task.remainingSeconds = totalSeconds;
        task.isOverdue = false;
        task.overdueSeconds = 0;

        saveTasks();
        render();
    }
    timerModal.classList.add('hidden');
});

btnCloseTimerModal.addEventListener('click', () => timerModal.classList.add('hidden'));

// Form Modal Operations
btnOpenForm.addEventListener('click', () => {
    formModal.classList.remove('hidden');
    taskInput.focus();
});
btnCloseForm.addEventListener('click', () => formModal.classList.add('hidden'));

taskLongDescInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        taskForm.requestSubmit();
    }
});

taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const taskText = taskInput.value.trim();
    if (!taskText) return;

    const deadlineVal = document.getElementById('task-deadline') ? document.getElementById('task-deadline').value : '';

    const newTask = {
        id: Date.now(),
        text: taskText,
        shortDesc: taskShortDescInput.value.trim(),
        longDesc: taskLongDescInput.value.trim(),
        isCompleted: false,
        targetSeconds: 0,
        remainingSeconds: 0,
        deadline: deadlineVal,
        isOverdue: false,
        overdueSeconds: 0,
        overdueFromTimer: false
    };

    tasks.push(newTask);
    saveTasks();
    render();

    taskInput.value = '';
    taskShortDescInput.value = '';
    taskLongDescInput.value = '';
    if (document.getElementById('task-deadline')) {
        document.getElementById('task-deadline').value = '';
    }
    formModal.classList.add('hidden');
});

// Detail Modal Operations
window.openDescModal = function (id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    document.getElementById('modal-task-title').textContent = task.text;
    document.getElementById('modal-task-time').textContent = task.deadline ? `Deadline: ${formatDeadline(task.deadline)}` : 'Tidak ada deadline';
    document.getElementById('modal-short-desc-text').textContent = task.shortDesc || '-';
    document.getElementById('modal-long-desc-input').value = task.longDesc || 'Tidak ada catatan detail.';

    const overdueBox = document.getElementById('modal-overdue-box');
    const overdueText = document.getElementById('modal-overdue-text');

    if (overdueBox && overdueText) {
        if (task.isOverdue && task.overdueSeconds > 0) {
            overdueText.textContent = `Terlambat ${formatTime(task.overdueSeconds)}`;
            overdueBox.classList.remove('hidden');
        } else {
            overdueBox.classList.add('hidden');
        }
    }

    descModal.classList.remove('hidden');
};

if (btnCloseModal) {
    btnCloseModal.onclick = function () {
        descModal.classList.add('hidden');
    };
}

// Timer & Task Operations
window.toggleTimer = function (id) {
    const task = tasks.find(t => t.id === id);
    if (!task || task.deadline) return;

    if (activeTimers[id]) {
        clearInterval(activeTimers[id]);
        delete activeTimers[id];
        saveTasks();
        render();
    } else {
        if (task.remainingSeconds <= 0) task.remainingSeconds = task.targetSeconds;

        activeTimers[id] = setInterval(() => {
            task.remainingSeconds--;
            const timerEl = document.getElementById(`timer-${id}`);
            if (timerEl) timerEl.textContent = formatTime(task.remainingSeconds);

            if (task.remainingSeconds <= 0) {
                clearInterval(activeTimers[id]);
                delete activeTimers[id];

                task.isOverdue = true;
                task.overdueFromTimer = true;
                task.overdueSeconds = 0;

                triggerNotification("Timer Habis!", `Waktu untuk task "${task.text}" telah habis!`);
                saveTasks();
                render();
            }
        }, 1000);
        render();
    }
};

window.toggleTask = function (id) {
    if (activeTimers[id]) {
        clearInterval(activeTimers[id]);
        delete activeTimers[id];
    }
    tasks = tasks.map(t => {
        if (t.id === id) {
            const isCompleted = !t.isCompleted;
            if (isCompleted && t.isOverdue && t.deadline) {
                const deadlineTime = new Date(t.deadline).getTime();
                const now = new Date().getTime();
                t.overdueSeconds = Math.max(0, Math.floor((now - deadlineTime) / 1000));
            }
            return { ...t, isCompleted };
        }
        return t;
    });
    saveTasks();
    render();
};

window.deleteTask = function (id) {
    if (activeTimers[id]) {
        clearInterval(activeTimers[id]);
        delete activeTimers[id];
    }
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    render();
};

document.addEventListener('DOMContentLoaded', () => render());