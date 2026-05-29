// ==========================================
// Calendar App - JavaScript Logic
// ==========================================

class CalendarApp {
    constructor() {
        this.currentDate = new Date();
        this.today = new Date();
        this.editingDate = null;
        this.todos = this.loadTodos();
        this.deleteHoldTimer = null;
        
        // DOM Elements
        this.monthYearEl = document.getElementById('monthYear');
        this.calendarGrid = document.getElementById('calendarGrid');
        this.yearSelect = document.getElementById('yearSelect');
        this.monthSelect = document.getElementById('monthSelect');
        this.daySelect = document.getElementById('daySelect');
        this.modal = document.getElementById('modal');
        this.modalOverlay = document.getElementById('modalOverlay');
        this.todoInput = document.getElementById('todoInput');
        this.cancelBtn = document.getElementById('cancelBtn');
        this.saveBtn = document.getElementById('saveBtn');
        this.deleteBtn = document.getElementById('deleteBtn');
        this.prevBtn = document.querySelector('.btn-prev');
        this.nextBtn = document.querySelector('.btn-next');
        this.todayBtn = document.getElementById('todayBtn');
        this.modalTitle = document.getElementById('modalTitle');
        
        this.init();
    }

    init() {
        this.populateYearSelect();
        this.attachEventListeners();
        this.renderCalendar();
    }

    // ==========================================
    // Event Listeners
    // ==========================================

    attachEventListeners() {
        this.prevBtn.addEventListener('click', () => this.previousMonth());
        this.nextBtn.addEventListener('click', () => this.nextMonth());
        this.todayBtn.addEventListener('click', () => this.goToToday());
        
        this.yearSelect.addEventListener('change', () => this.handleDateJump());
        this.monthSelect.addEventListener('change', () => this.handleDateJump());
        this.daySelect.addEventListener('change', () => this.handleDateJump());
        
        this.cancelBtn.addEventListener('click', () => this.closeModal());
        this.saveBtn.addEventListener('click', (e) => this.saveTodo(e));
        
        // Delete button with tap-and-hold
        this.deleteBtn.addEventListener('mousedown', () => this.startDeleteHold());
        this.deleteBtn.addEventListener('mouseup', () => this.endDeleteHold());
        this.deleteBtn.addEventListener('mouseleave', () => this.endDeleteHold());
        this.deleteBtn.addEventListener('touchstart', () => this.startDeleteHold());
        this.deleteBtn.addEventListener('touchend', () => this.endDeleteHold());
        
        this.modalOverlay.addEventListener('click', () => this.closeModal());
        
        this.todoInput.addEventListener('input', () => this.updateSaveButtonState());
    }

    // ==========================================
    // Delete Button Tap-and-Hold
    // ==========================================

    startDeleteHold() {
        const holdDuration = 1000; // 1 second
        const deleteProgress = this.deleteBtn.querySelector('.delete-progress');
        let elapsed = 0;
        const step = 50; // Update every 50ms

        this.deleteBtn.classList.add('holding');

        this.deleteHoldTimer = setInterval(() => {
            elapsed += step;
            const progress = Math.min((elapsed / holdDuration) * 100, 100);
            deleteProgress.style.width = progress + '%';

            if (elapsed >= holdDuration) {
                clearInterval(this.deleteHoldTimer);
                this.deleteBtn.classList.remove('holding');
                this.deleteBtn.classList.add('held');
                setTimeout(() => {
                    this.deleteTodo();
                    this.deleteBtn.classList.remove('held');
                }, 300);
            }
        }, step);
    }

    endDeleteHold() {
        if (this.deleteHoldTimer) {
            clearInterval(this.deleteHoldTimer);
            this.deleteBtn.classList.remove('holding');
            const deleteProgress = this.deleteBtn.querySelector('.delete-progress');
            deleteProgress.style.width = '0%';
        }
    }

    // ==========================================
    // Calendar Generation
    // ==========================================

    getDaysInMonth(date) {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    }

    getFirstDayOfMonth(date) {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    }

    renderCalendar() {
        this.updateHeaderTitle();
        this.populateDaySelect();
        this.calendarGrid.innerHTML = '';

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const daysInMonth = this.getDaysInMonth(this.currentDate);
        const firstDay = this.getFirstDayOfMonth(this.currentDate);

        // Get previous month's days to fill the grid
        const prevMonthDate = new Date(year, month, 0);
        const daysInPrevMonth = prevMonthDate.getDate();

        // Previous month's days
        for (let i = firstDay - 1; i >= 0; i--) {
            const dateCell = this.createDateCell(daysInPrevMonth - i, true, year, month - 1);
            this.calendarGrid.appendChild(dateCell);
        }

        // Current month's days
        for (let day = 1; day <= daysInMonth; day++) {
            const dateCell = this.createDateCell(day, false, year, month);
            this.calendarGrid.appendChild(dateCell);
        }

        // Next month's days
        const totalCells = this.calendarGrid.children.length;
        const remainingCells = 42 - totalCells; // 6 rows × 7 days
        for (let day = 1; day <= remainingCells; day++) {
            const dateCell = this.createDateCell(day, true, year, month + 1);
            this.calendarGrid.appendChild(dateCell);
        }
    }

    createDateCell(day, isOtherMonth, year, month) {
        const cell = document.createElement('div');
        cell.className = 'date-cell';

        // Calculate the actual date
        let actualDate;
        if (isOtherMonth && month < 0) {
            actualDate = new Date(year - 1, 11, day);
        } else if (isOtherMonth && month > 11) {
            actualDate = new Date(year + 1, 0, day);
        } else {
            actualDate = new Date(year, month, day);
        }

        const dateKey = this.getDateKey(actualDate);

        // Mark as other month
        if (isOtherMonth) {
            cell.classList.add('other-month');
        }

        // Mark as today
        if (this.isToday(actualDate)) {
            cell.classList.add('today');
        }

        // Mark as past date (only for dates in current month, not other months)
        if (this.isPastDate(actualDate) && !isOtherMonth) {
            cell.classList.add('past-date');
        }

        // Create date number
        const dateNumber = document.createElement('div');
        dateNumber.className = 'date-number';
        dateNumber.textContent = day;
        cell.appendChild(dateNumber);

        // Add todos
        const todos = this.todos[dateKey];
        if (todos) {
            const todoText = document.createElement('div');
            todoText.className = 'todo-text';
            todoText.textContent = todos;
            this.adjustFontSize(todoText);
            cell.appendChild(todoText);
        }

        // Add click event
        if (!isOtherMonth) {
            cell.addEventListener('click', () => this.openModal(actualDate));
        }

        return cell;
    }

    adjustFontSize(element) {
        // Auto-shrink font if text is long
        const text = element.textContent;
        if (text.length > 40) {
            element.style.fontSize = '10px';
        } else if (text.length > 25) {
            element.style.fontSize = '11px';
        }
    }

    // ==========================================
    // Date Utilities
    // ==========================================

    getDateKey(date) {
        return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    }

    isToday(date) {
        return (
            date.getFullYear() === this.today.getFullYear() &&
            date.getMonth() === this.today.getMonth() &&
            date.getDate() === this.today.getDate()
        );
    }

    isPastDate(date) {
        return date < new Date(this.today.getFullYear(), this.today.getMonth(), this.today.getDate());
    }

    updateHeaderTitle() {
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const month = monthNames[this.currentDate.getMonth()];
        const year = this.currentDate.getFullYear();
        this.monthYearEl.textContent = `${month} ${year}`;
    }

    // ==========================================
    // Navigation
    // ==========================================

    previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.renderCalendar();
    }

    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.renderCalendar();
    }

    goToToday() {
        this.currentDate = new Date(this.today);
        this.renderCalendar();
        
        // Add blinking animation
        const todayCell = document.querySelector('.date-cell.today');
        const todayBtn = this.todayBtn;
        
        if (todayCell) {
            todayCell.classList.add('blinking');
            setTimeout(() => todayCell.classList.remove('blinking'), 2000);
        }
        
        if (todayBtn) {
            todayBtn.classList.add('blinking');
            setTimeout(() => todayBtn.classList.remove('blinking'), 2000);
        }
    }

    // ==========================================
    // Year/Month/Day Select
    // ==========================================

    populateYearSelect() {
        const currentYear = new Date().getFullYear();
        for (let year = currentYear - 50; year <= currentYear + 50; year++) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            this.yearSelect.appendChild(option);
        }
        this.yearSelect.value = currentYear;
    }

    populateDaySelect() {
        const daysInMonth = this.getDaysInMonth(this.currentDate);
        this.daySelect.innerHTML = '<option value="">Day</option>';
        
        for (let day = 1; day <= daysInMonth; day++) {
            const option = document.createElement('option');
            option.value = day;
            option.textContent = day;
            this.daySelect.appendChild(option);
        }
    }

    handleDateJump() {
        const year = parseInt(this.yearSelect.value);
        const month = parseInt(this.monthSelect.value);
        const day = parseInt(this.daySelect.value);

        if (year && month !== '' && day) {
            this.currentDate = new Date(year, month, day);
            this.renderCalendar();
            
            // Reset selects
            this.yearSelect.value = '';
            this.monthSelect.value = '';
            this.daySelect.value = '';
        }
    }

    // ==========================================
    // Modal Management
    // ==========================================

    openModal(date) {
        this.editingDate = date;
        const dateKey = this.getDateKey(date);
        const existingTodos = this.todos[dateKey] || '';

        this.modalTitle.textContent = this.formatDateForModal(date);
        this.todoInput.value = existingTodos;
        this.todoInput.focus();

        // Show/hide delete button
        this.deleteBtn.style.display = existingTodos ? 'block' : 'none';

        // Activate modal
        this.modal.classList.add('active');
        this.modalOverlay.classList.add('active');

        // Update save button state
        this.updateSaveButtonState();

        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        this.modal.classList.remove('active');
        this.modalOverlay.classList.remove('active');
        this.todoInput.value = '';
        this.editingDate = null;
        document.body.style.overflow = '';
        this.endDeleteHold();
    }

    formatDateForModal(date) {
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        return `${dayNames[date.getDay()]}, ${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    }

    updateSaveButtonState() {
        const hasContent = this.todoInput.value.trim().length > 0;
        if (hasContent) {
            this.saveBtn.classList.remove('btn-disabled');
            this.saveBtn.disabled = false;
        } else {
            this.saveBtn.classList.add('btn-disabled');
            this.saveBtn.disabled = true;
        }
    }

    saveTodo(e) {
        e.preventDefault();
        
        if (!this.editingDate || !this.todoInput.value.trim()) {
            return;
        }

        const dateKey = this.getDateKey(this.editingDate);
        this.todos[dateKey] = this.todoInput.value.trim();
        this.saveTodosToLocalStorage();
        this.closeModal();
        this.renderCalendar();
    }

    deleteTodo() {
        if (!this.editingDate) return;

        const dateKey = this.getDateKey(this.editingDate);
        delete this.todos[dateKey];
        this.saveTodosToLocalStorage();
        this.closeModal();
        this.renderCalendar();
    }

    // ==========================================
    // LocalStorage Management
    // ==========================================

    loadTodos() {
        const todos = localStorage.getItem('calendarTodos');
        return todos ? JSON.parse(todos) : {};
    }

    saveTodosToLocalStorage() {
        localStorage.setItem('calendarTodos', JSON.stringify(this.todos));
    }
}

// ==========================================
// Initialize App on DOM Load
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    new CalendarApp();
});