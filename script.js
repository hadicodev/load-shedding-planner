const addButtons = document.querySelectorAll(".add-outage");
const modal = document.getElementById("outageModal");
const closeModal = document.getElementById("closeModal");
const saveOutage = document.getElementById("saveOutage");
const modalDay = document.getElementById("modalDay");

const links = document.getElementById("nav");
const navLinks = document.querySelectorAll("#nav a");
const hamburger = document.querySelector(".hamburger");

const statusLocation = document.getElementById("statusLocation");
const statusLocationText = document.getElementById("statusLocationText");

const startTime = document.getElementById("startTime");
const endTime = document.getElementById("endTime");

const clearSchedule = document.getElementById("clearSchedule");

const todayDate = document.getElementById("todayDate");
const todaySchedule = document.getElementById("todaySchedule");

const powerStatus = document.getElementById("powerStatus");
const statusMessage = document.getElementById("statusMessage");
const nextOutage = document.getElementById("nextOutage");
const countdown = document.getElementById("countdown");
const statusCard = document.querySelector(".status-card");

const taskName = document.getElementById("taskName");
const taskDuration = document.getElementById("taskDuration");
const planTask = document.getElementById("planTask");

const suggestionTitle = document.getElementById("suggestionTitle");
const suggestionText = document.getElementById("suggestionText");

const scheduleTypes = document.querySelectorAll(".schedule-type");
const scheduleEditor = document.getElementById("scheduleEditor");

/* =========================
   NAVBAR
========================= */

hamburger.addEventListener("click", () => {
    hamburger.classList.toggle("active");
    links.classList.toggle("active");
});

navLinks.forEach((link) => {
    link.addEventListener("click", () => {
        hamburger.classList.remove("active");
        links.classList.remove("active");
    });
});

/* =========================
   DEFAULT SCHEDULE
========================= */

function createEmptySchedule() {
    return {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
        sunday: [],
    };
}

/* =========================
   ALL SCHEDULES
========================= */

let schedules = JSON.parse(localStorage.getItem("loadSheddingSchedules")) || {
    home: createEmptySchedule(),
    shop: createEmptySchedule(),
};

/* =========================
   CURRENT TYPE
========================= */

let currentType = localStorage.getItem("currentScheduleType") || "home";

let schedule = schedules[currentType];

/* =========================
   SELECT HOME / SHOP
========================= */

scheduleTypes.forEach((button) => {
    button.addEventListener("click", () => {
        currentType = button.dataset.type;

        schedule = schedules[currentType];

        localStorage.setItem("currentScheduleType", currentType);

        scheduleTypes.forEach((btn) => {
            btn.classList.remove("active");
        });

        button.classList.add("active");

        loadCurrentSchedule();
    });
});

/* =========================
   LOAD CURRENT SCHEDULE
========================= */

function loadCurrentSchedule() {
    scheduleEditor.classList.remove("hidden");

    renderSchedule();
    renderTodaySchedule();
    updatePowerStatus();
}

/* =========================
   SELECTED DAY
========================= */

let selectedDay = "";
let editingIndex = null;

/* =========================
   WEEKLY MODE
========================= */

let weeklyMode = false;

/* =========================
   WEEKLY SETTER BUTTON
========================= */

const weeklySetter = document.createElement("button");

weeklySetter.type = "button";
weeklySetter.className = "weekly-setter";
weeklySetter.textContent = "Set Weekly Schedule";

scheduleEditor.prepend(weeklySetter);

/* =========================
   OPEN WEEKLY SETTER
========================= */

weeklySetter.addEventListener("click", () => {
    weeklyMode = true;
    selectedDay = "";
    editingIndex = null;

    modalDay.textContent = "Every Day";

    startTimePicker.reset();
    endTimePicker.reset();

    modal.classList.remove("hidden");
});

/* =========================
   OPEN MODAL
========================= */

addButtons.forEach((button) => {
    button.addEventListener("click", () => {
        weeklyMode = false;

        selectedDay = button.dataset.day;
        editingIndex = null;

        modalDay.textContent =
            selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1);

        startTimePicker.reset();
        endTimePicker.reset();

        modal.classList.remove("hidden");
    });
});

/* =========================
   CLOSE MODAL
========================= */

closeModal.addEventListener("click", () => {
    weeklyMode = false;

    modal.classList.add("hidden");
});

modal.addEventListener("click", (event) => {
    if (event.target === modal) {
        weeklyMode = false;

        modal.classList.add("hidden");
    }
});

/* =========================
   SAVE OUTAGE
========================= */

saveOutage.addEventListener("click", () => {
    if (!startTime.value || !endTime.value) {
        alert("Please enter both times.");
        return;
    }

    if (startTime.value === endTime.value) {
        alert("Power return time must be after the outage start time.");
        return;
    }

    /* =========================
       WEEKLY SCHEDULE
    ========================= */

    if (weeklyMode) {
        const days = Object.keys(schedule);

        days.forEach((day) => {
            schedule[day].push({
                start: startTime.value,
                end: endTime.value,
            });

            schedule[day].sort((a, b) => {
                return a.start.localeCompare(b.start);
            });
        });

        saveSchedule();

        weeklyMode = false;

        modal.classList.add("hidden");

        renderSchedule();
        renderTodaySchedule();
        updatePowerStatus();

        return;
    }

    /* =========================
       NORMAL SINGLE DAY
    ========================= */

    if (editingIndex !== null) {
        schedule[selectedDay][editingIndex] = {
            start: startTime.value,
            end: endTime.value,
        };
    } else {
        /*
         * ADD NEW OUTAGE
         *
         * This pushes the new outage instead of
         * replacing the existing one.
         */
        schedule[selectedDay].push({
            start: startTime.value,
            end: endTime.value,
        });
    }

    /* =========================
       SORT OUTAGES
    ========================= */

    schedule[selectedDay].sort((a, b) => {
        return a.start.localeCompare(b.start);
    });

    saveSchedule();

    modal.classList.add("hidden");

    editingIndex = null;

    renderSchedule();
    renderTodaySchedule();
    updatePowerStatus();
});

/* =========================
   SAVE SCHEDULES
========================= */

function saveSchedule() {
    schedules[currentType] = schedule;

    localStorage.setItem("loadSheddingSchedules", JSON.stringify(schedules));
}

/* =========================
   RENDER WEEKLY SCHEDULE
========================= */

function renderSchedule() {
    const days = Object.keys(schedule);

    days.forEach((day) => {
        const container = document.querySelector(`[data-outages="${day}"]`);

        container.innerHTML = "";

        if (schedule[day].length === 0) {
            const empty = document.createElement("p");

            empty.className = "no-outages";
            empty.textContent = "No outages added.";

            container.appendChild(empty);

            return;
        }

        schedule[day].forEach((outage, index) => {
            const outageElement = document.createElement("div");

            outageElement.className = "outage";

            outageElement.innerHTML = `
                <span class="outage-time">
                    ${formatTime(outage.start)} – ${formatTime(outage.end)}
                </span>

                <div class="outage-actions">
                    <button
                        class="edit-outage"
                        data-day="${day}"
                        data-index="${index}"
                        aria-label="Edit outage"
                    >
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                fill-rule="evenodd"
                                clip-rule="evenodd"
                                d="M20.8477 1.87868C19.6761 0.707109 17.7761 0.707105 16.605 1.87868L2.44744 16.0363C2.02864 16.4551 1.74317 16.9885 1.62702 17.5692L1.03995 20.5046C0.760062 21.904 1.9939 23.1379 3.39334 22.858L6.32868 22.2709C6.90945 22.1548 7.44285 21.8699 7.86165 21.4505L22.0192 7.29289C23.1908 6.12132 23.1908 4.22183 22.0192 3.05025L20.8477 1.87868ZM18.0192 3.29289C18.4098 2.90237 19.0429 2.90237 19.4335 3.29289L20.605 4.46447C20.9956 4.85499 20.9956 5.48815 20.605 5.87868L17.9334 8.55027L15.3477 5.96448L18.0192 3.29289ZM13.9334 7.3787L3.86165 17.4505C3.72205 17.7679 3.6269 17.7679 3.58818 17.9615L3.00111 20.8968L5.93645 20.3097C6.13004 20.271 6.30784 20.1759 6.44744 20.0363L16.5192 9.96448L13.9334 7.3787ZM13.9334 7.3787L16.5192 9.96448L13.9334 7.3787Z"
                                fill="currentColor"
                            />
                        </svg>
                    </button>

                    <button
                        class="delete-outage"
                        data-day="${day}"
                        data-index="${index}"
                        aria-label="Delete outage"
                    >
                        ×
                    </button>
                </div>
            `;

            container.appendChild(outageElement);
        });
    });

    addDeleteListeners();
}

/* =========================
   DELETE / EDIT OUTAGE
========================= */

function addDeleteListeners() {
    const deleteButtons = document.querySelectorAll(".delete-outage");

    const editButtons = document.querySelectorAll(".edit-outage");

    deleteButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const day = button.dataset.day;
            const index = Number(button.dataset.index);

            schedule[day].splice(index, 1);

            saveSchedule();

            renderSchedule();
            renderTodaySchedule();
            updatePowerStatus();
        });
    });

    editButtons.forEach((button) => {
        button.addEventListener("click", () => {
            weeklyMode = false;

            const day = button.dataset.day;
            const index = Number(button.dataset.index);

            const outage = schedule[day][index];

            selectedDay = day;
            editingIndex = index;

            modalDay.textContent = day.charAt(0).toUpperCase() + day.slice(1);

            startTime.value = outage.start;
            endTime.value = outage.end;

            startTimePicker.load(outage.start);
            endTimePicker.load(outage.end);

            modal.classList.remove("hidden");
        });
    });
}

/* =========================
   FORMAT TIME
========================= */

function formatTime(time) {
    const [hours, minutes] = time.split(":");

    let hour = Number(hours);

    const suffix = hour >= 12 ? "PM" : "AM";

    hour = hour % 12 || 12;

    return `${hour}:${minutes} ${suffix}`;
}

/* =========================
   TODAY'S DATE
========================= */

function updateDate() {
    const date = new Date();

    todayDate.textContent = date.toLocaleDateString("en-PK", {
        weekday: "long",
        day: "numeric",
        month: "long",
    });
}

/* =========================
   GET TODAY
========================= */

function getTodayName() {
    const days = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
    ];

    return days[new Date().getDay()];
}

/* =========================
   TODAY'S SCHEDULE
========================= */

function renderTodaySchedule() {
    const today = getTodayName();

    const homeOutages = schedules.home[today];
    const shopOutages = schedules.shop[today];

    todaySchedule.innerHTML = "";

    if (homeOutages.length === 0 && shopOutages.length === 0) {
        todaySchedule.innerHTML = `
            <div class="empty-state">
                <p>No outages scheduled today.</p>
                <span>Enjoy the power while it lasts.</span>
            </div>
        `;

        return;
    }

    function renderLocation(type, outages) {
        if (outages.length === 0) {
            return;
        }

        const location = document.createElement("div");

        location.className = "today-location";

        location.innerHTML = `
            <div class="today-location-name">
                ${type.toUpperCase()}
            </div>
        `;

        outages.forEach((outage) => {
            const item = document.createElement("div");

            item.className = "outage";

            item.style.padding = "20px 25px";

            item.innerHTML = `
                <span>
                    <strong>${formatTime(outage.start)}</strong>
                    →
                    <strong>${formatTime(outage.end)}</strong>
                </span>

                <span style="color: var(--danger);">
                    No power
                </span>
            `;

            location.appendChild(item);
        });

        todaySchedule.appendChild(location);
    }

    renderLocation("Home", homeOutages);
    renderLocation("Shop", shopOutages);
}

/* =========================
   POWER STATUS
========================= */

function updatePowerStatus() {
    statusLocationText.textContent = currentType.toUpperCase();

    const now = new Date();

    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const today = getTodayName();

    const days = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
    ];

    const todayIndex = days.indexOf(today);

    const previousDay = days[(todayIndex - 1 + 7) % 7];

    const todayOutages = schedule[today];
    const previousDayOutages = schedule[previousDay];

    let currentOutage = null;
    let upcomingOutage = null;

    /* =========================
       CHECK PREVIOUS DAY
       FOR OVERNIGHT OUTAGES
    ========================= */

    for (const outage of previousDayOutages) {
        const start = timeToMinutes(outage.start);
        const end = timeToMinutes(outage.end);

        if (end < start && currentMinutes < end) {
            currentOutage = {
                start: outage.start,
                end: outage.end,
            };

            break;
        }
    }

    /* =========================
       CHECK TODAY'S OUTAGES
    ========================= */

    if (!currentOutage) {
        for (const outage of todayOutages) {
            const start = timeToMinutes(outage.start);

            let end = timeToMinutes(outage.end);

            if (end <= start) {
                end += 1440;
            }

            if (currentMinutes >= start && currentMinutes < end) {
                currentOutage = outage;
                break;
            }

            if (start > currentMinutes) {
                if (
                    !upcomingOutage ||
                    start < timeToMinutes(upcomingOutage.start)
                ) {
                    upcomingOutage = outage;
                }
            }
        }
    }

    /* =========================
       POWER IS OFF
    ========================= */

    if (currentOutage) {
        powerStatus.textContent = "No Power";

        statusCard.classList.add("power-off");

        const endMinutes = timeToMinutes(currentOutage.end);

        const isOvernight = endMinutes <= timeToMinutes(currentOutage.start);

        statusMessage.textContent = `Power is expected back at ${formatTime(
            currentOutage.end,
        )}.`;

        nextOutage.textContent = `Until ${formatTime(currentOutage.end)}`;

        updateReturnCountdown(currentOutage.end, isOvernight);

        return;
    }

    /* =========================
       POWER IS ON
    ========================= */

    statusCard.classList.remove("power-off");

    powerStatus.textContent = "Power Available";

    if (upcomingOutage) {
        statusMessage.textContent = "Your next scheduled outage is coming up.";

        nextOutage.textContent = `${formatTime(upcomingOutage.start)} – ${formatTime(
            upcomingOutage.end,
        )}`;

        updateCountdown(upcomingOutage.start);
    } else {
        statusMessage.textContent = "No more outages scheduled today.";

        nextOutage.textContent = "None today";

        countdown.textContent = "—";
    }
}

/* =========================
   TIME TO MINUTES
========================= */

function timeToMinutes(time) {
    const [hours, minutes] = time.split(":").map(Number);

    return hours * 60 + minutes;
}

/* =========================
   COUNTDOWN
========================= */

function updateCountdown(targetTime) {
    const now = new Date();

    const [hours, minutes] = targetTime.split(":").map(Number);

    const target = new Date();

    target.setHours(hours);
    target.setMinutes(minutes);
    target.setSeconds(0);
    target.setMilliseconds(0);

    let difference = target - now;

    if (difference < 0) {
        difference = 0;
    }

    countdown.textContent = formatCountdown(difference);
}

/* =========================
   RETURN COUNTDOWN
========================= */

function updateReturnCountdown(targetTime, overnight = false) {
    const now = new Date();

    const [hours, minutes] = targetTime.split(":").map(Number);

    const target = new Date();

    target.setHours(hours);
    target.setMinutes(minutes);
    target.setSeconds(0);
    target.setMilliseconds(0);

    if (overnight && target <= now) {
        target.setDate(target.getDate() + 1);
    }

    let difference = target - now;

    if (difference < 0) {
        difference = 0;
    }

    countdown.textContent = formatCountdown(difference);
}

/* =========================
   FORMAT COUNTDOWN
========================= */

function formatCountdown(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);

    const hours = Math.floor(totalSeconds / 3600);

    const minutes = Math.floor((totalSeconds % 3600) / 60);

    const seconds = totalSeconds % 60;

    return (
        `${String(hours).padStart(2, "0")}:` +
        `${String(minutes).padStart(2, "0")}:` +
        `${String(seconds).padStart(2, "0")}`
    );
}

/* =========================
   CLEAR CURRENT SCHEDULE
========================= */

clearSchedule.addEventListener("click", () => {
    const confirmed = confirm(`Clear your entire ${currentType} schedule?`);

    if (!confirmed) {
        return;
    }

    schedule = createEmptySchedule();

    schedules[currentType] = schedule;

    localStorage.setItem("loadSheddingSchedules", JSON.stringify(schedules));

    renderSchedule();
    renderTodaySchedule();
    updatePowerStatus();
});

/* =========================
   TASK PLANNER
========================= */

planTask.addEventListener("click", () => {
    const name = taskName.value.trim();

    const duration = Number(taskDuration.value);

    if (!name) {
        suggestionTitle.textContent = "Give your task a name.";

        suggestionText.textContent =
            "For example: Charge my laptop or do the laundry.";

        return;
    }

    const today = getTodayName();

    const outages = schedule[today];

    const windows = getPowerWindows(outages);

    let suitableWindow = null;

    for (const window of windows) {
        const available = window.end - window.start;

        if (available >= duration) {
            suitableWindow = window;
            break;
        }
    }

    if (!suitableWindow) {
        suggestionTitle.textContent = "No suitable window today.";

        suggestionText.textContent = `${name} needs ${duration} minutes, but there isn't a long enough power window left today.`;

        return;
    }

    const start = minutesToTime(suitableWindow.start);

    const end = minutesToTime(suitableWindow.start + duration);

    suggestionTitle.textContent = `${start} – ${end}`;

    suggestionText.textContent = `A good time to ${name.toLowerCase()} is between ${start} and ${end}.`;
});

/* =========================
   POWER WINDOWS
========================= */

function getPowerWindows(outages) {
    const windows = [];

    let previousEnd = 0;

    outages.forEach((outage) => {
        const outageStart = timeToMinutes(outage.start);

        const outageEnd = timeToMinutes(outage.end);

        if (outageStart > previousEnd) {
            windows.push({
                start: previousEnd,
                end: outageStart,
            });
        }

        previousEnd = outageEnd;
    });

    if (previousEnd < 1440) {
        windows.push({
            start: previousEnd,
            end: 1440,
        });
    }

    return windows;
}

/* =========================
   MINUTES TO TIME
========================= */

function minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);

    const mins = minutes % 60;

    return formatTime(
        `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`,
    );
}

/* =========================
   CUSTOM TIME PICKER
========================= */

function createTimePicker(input) {
    const wrapper = document.createElement("div");

    wrapper.className = "time-picker";

    input.classList.add("time-picker-native");

    input.parentNode.insertBefore(wrapper, input);

    wrapper.appendChild(input);

    const display = document.createElement("button");

    display.type = "button";
    display.className = "time-picker-input";

    display.innerHTML = `
        <span class="time-picker-placeholder">
            Select time
        </span>

        <svg
            class="time-picker-icon"
            viewBox="0 0 24 24"
            fill="none"
        >
            <circle
                cx="12"
                cy="12"
                r="9"
                stroke="currentColor"
                stroke-width="1.8"
            />

            <path
                d="M12 7V12L15 14"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
        </svg>
    `;

    wrapper.appendChild(display);

    const menu = document.createElement("div");

    menu.className = "time-picker-menu";

    menu.innerHTML = `
        <div class="time-picker-columns">
            <div
                class="time-picker-column"
                data-part="hour"
            ></div>

            <div
                class="time-picker-column"
                data-part="minute"
            ></div>

            <div
                class="time-picker-column"
                data-part="period"
            ></div>
        </div>
    `;

    wrapper.appendChild(menu);

    const hourColumn = menu.querySelector('[data-part="hour"]');

    const minuteColumn = menu.querySelector('[data-part="minute"]');

    const periodColumn = menu.querySelector('[data-part="period"]');

    /* =========================
       HOURS
    ========================= */

    for (let hour = 1; hour <= 12; hour++) {
        const option = document.createElement("button");

        option.type = "button";

        option.className = "time-picker-option";

        option.textContent = String(hour).padStart(2, "0");

        option.dataset.value = hour;

        option.addEventListener("click", () => {
            selectPart("hour", hour);
        });

        hourColumn.appendChild(option);
    }

    /* =========================
       MINUTES
    ========================= */

    for (let minute = 0; minute < 60; minute++) {
        const option = document.createElement("button");

        option.type = "button";

        option.className = "time-picker-option";

        option.textContent = String(minute).padStart(2, "0");

        option.dataset.value = minute;

        option.addEventListener("click", () => {
            selectPart("minute", minute);
        });

        minuteColumn.appendChild(option);
    }

    /* =========================
       AM / PM
    ========================= */

    ["AM", "PM"].forEach((period) => {
        const option = document.createElement("button");

        option.type = "button";

        option.className = "time-picker-option";

        option.textContent = period;

        option.dataset.value = period;

        option.addEventListener("click", () => {
            selectPart("period", period);
        });

        periodColumn.appendChild(option);
    });

    let selectedHour = null;
    let selectedMinute = null;
    let selectedPeriod = null;

    /* =========================
       SELECT PART
    ========================= */

    function selectPart(part, value) {
        if (part === "hour") {
            selectedHour = Number(value);
        }

        if (part === "minute") {
            selectedMinute = Number(value);
        }

        if (part === "period") {
            selectedPeriod = value;
        }

        updatePicker();

        if (
            selectedHour !== null &&
            selectedMinute !== null &&
            selectedPeriod !== null
        ) {
            const hour24 =
                selectedPeriod === "PM"
                    ? selectedHour === 12
                        ? 12
                        : selectedHour + 12
                    : selectedHour === 12
                      ? 0
                      : selectedHour;

            input.value =
                `${String(hour24).padStart(2, "0")}:` +
                `${String(selectedMinute).padStart(2, "0")}`;

            input.dispatchEvent(
                new Event("change", {
                    bubbles: true,
                }),
            );

            updateDisplay();
        }
    }

    /* =========================
       UPDATE PICKER
    ========================= */

    function updatePicker() {
        hourColumn.querySelectorAll(".time-picker-option").forEach((option) => {
            option.classList.toggle(
                "selected",
                Number(option.dataset.value) === selectedHour,
            );
        });

        minuteColumn
            .querySelectorAll(".time-picker-option")
            .forEach((option) => {
                option.classList.toggle(
                    "selected",
                    Number(option.dataset.value) === selectedMinute,
                );
            });

        periodColumn
            .querySelectorAll(".time-picker-option")
            .forEach((option) => {
                option.classList.toggle(
                    "selected",
                    option.dataset.value === selectedPeriod,
                );
            });
    }

    /* =========================
       UPDATE DISPLAY
    ========================= */

    function updateDisplay() {
        if (
            selectedHour === null ||
            selectedMinute === null ||
            selectedPeriod === null
        ) {
            display.innerHTML = `
                <span class="time-picker-placeholder">
                    Select time
                </span>

                <span class="time-picker-arrow">
                    ▼
                </span>
            `;

            return;
        }

        display.innerHTML = `
            <span class="time-picker-value">
                ${String(selectedHour).padStart(2, "0")}:${String(
                    selectedMinute,
                ).padStart(2, "0")} ${selectedPeriod}
            </span>

            <svg
                class="time-picker-icon"
                viewBox="0 0 24 24"
                fill="none"
            >
                <circle
                    cx="12"
                    cy="12"
                    r="9"
                    stroke="currentColor"
                    stroke-width="1.8"
                />

                <path
                    d="M12 7V12L15 14"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                />
            </svg>
        `;
    }

    /* =========================
       OPEN PICKER
    ========================= */

    function openPicker() {
        document.querySelectorAll(".time-picker-menu.open").forEach((other) => {
            if (other !== menu) {
                other.classList.remove("open");

                other.parentElement
                    .querySelector(".time-picker-input")
                    .classList.remove("active");
            }
        });

        menu.classList.add("open");

        display.classList.add("active");
    }

    /* =========================
       CLOSE PICKER
    ========================= */

    function closePicker() {
        menu.classList.remove("open");

        display.classList.remove("active");
    }

    /* =========================
       DISPLAY CLICK
    ========================= */

    display.addEventListener("click", () => {
        if (menu.classList.contains("open")) {
            closePicker();
        } else {
            openPicker();
        }
    });

    /* =========================
       LOAD EXISTING VALUE
    ========================= */

    function loadValue() {
        if (!input.value) {
            selectedHour = null;
            selectedMinute = null;
            selectedPeriod = null;

            updatePicker();
            updateDisplay();

            return;
        }

        const [hours, minutes] = input.value.split(":").map(Number);

        selectedHour = hours % 12 || 12;

        selectedMinute = minutes;

        selectedPeriod = hours >= 12 ? "PM" : "AM";

        updatePicker();
        updateDisplay();
    }

    input.addEventListener("change", loadValue);

    loadValue();

    return {
        reset() {
            input.value = "";

            selectedHour = null;
            selectedMinute = null;
            selectedPeriod = null;

            updatePicker();
            updateDisplay();

            closePicker();
        },

        load(time) {
            input.value = time;

            loadValue();

            closePicker();
        },
    };
}

/* =========================
   INITIALIZE TIME PICKERS
========================= */

const startTimePicker = createTimePicker(startTime);

const endTimePicker = createTimePicker(endTime);

/* =========================
   CLOSE TIME PICKERS
========================= */

document.addEventListener("click", (event) => {
    if (!event.target.closest(".time-picker")) {
        document.querySelectorAll(".time-picker-menu.open").forEach((menu) => {
            menu.classList.remove("open");

            menu.parentElement
                .querySelector(".time-picker-input")
                .classList.remove("active");
        });
    }
});

/* =========================
   INITIAL LOAD
========================= */

updateDate();

scheduleTypes.forEach((button) => {
    button.classList.toggle("active", button.dataset.type === currentType);
});

statusLocation.addEventListener("click", () => {
    const newType = currentType === "home" ? "shop" : "home";

    currentType = newType;

    schedule = schedules[currentType];

    localStorage.setItem("currentScheduleType", currentType);

    scheduleTypes.forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.type === currentType);
    });

    loadCurrentSchedule();
});

loadCurrentSchedule();

/* =========================
   UPDATE EVERY SECOND
========================= */

setInterval(() => {
    updatePowerStatus();
}, 1000);
