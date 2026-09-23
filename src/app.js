let tasks = JSON.parse(localStorage.getItem('my_tasks')) || [];

const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const pendingList = document.getElementById('pending-list');
const completedList = document.getElementById('completed-list');

function saveTasks() {
    localStorage.setItem('my_tasks', JSON.stringify(tasks));
}

function render() {
    pendingList.innerHTML = '';
    completedList.innerHTML = '';

    tasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item ${task.isCompleted ? 'done' : ''}`;

        li.innerHTML = `
            <input type="checkbox" ${task.isCompleted ? 'checked' : ''} onchange="toggleTask(${task.id})">
            <span>${task.text}</span>
            <button class="btn-delete" onclick="deleteTask(${task.id})">Hapus</button>
            `;

        if (task.isCompleted) {
            completedList.appendChild(li);
        } else {
            pendingList.appendChild(li);
        }
    });
}

taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const taskText = taskInput.value.trim();
    if (!taskText) return;

    const newTask = {
        id: Date.now(),
        text: taskText,
        isCompleted: false
    };

    tasks.push(newTask);
    saveTasks();
    render();

    taskInput.value = '';
});

window.toggleTask = function (id) {
    tasks = tasks.map(task => {
        if (task.id === id) {
            return { ...task, isCompleted: !task.isCompleted };
        }
        return task;
    });
    saveTasks();
    render();
};

window.deleteTask = function (id) {
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    render();
};

render();