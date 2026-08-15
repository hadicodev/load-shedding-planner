const addButtons = document.querySelectorAll(".add-outage");
const modal = document.getElementById("outageModal");
const closeModal = document.getElementById("closeModal");
const saveOutage = document.getElementById("saveOutage");
const modalDay = document.getElementById("modalDay");

const links = document.getElementById("nav");
const hamburger = document.querySelector(".hamburger");

const startTime = document.getElementById("startTime");
const endTime = document.getElementById("endTime");

const areaInput = document.getElementById("area");
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

hamburger.addEventListener("click", () => {
    hamburger.classList.toggle("active");
    links.classList.toggle("active");
});

let selectedDay = "";

let schedule = JSON.parse(localStorage.getItem("loadSheddingSchedule")) || {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
};

/* =========================
   AREA
========================= */

areaInput.value = localStorage.getItem("loadSheddingArea") || "";

areaInput.addEventListener("input", () => {
    localStorage.setItem("loadSheddingArea", areaInput.value);
});

/* =========================
   OPEN MODAL
========================= */

addButtons.forEach((button) => {
    button.addEventListener("click", () => {
        selectedDay = button.dataset.day;

        modalDay.textContent =
            selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1);

        startTime.value = "";
        endTime.value = "";

        modal.classList.remove("hidden");
    });
});

/* =========================
   CLOSE MODAL
========================= */

closeModal.addEventListener("click", () => {
    modal.classList.add("hidden");
});

modal.addEventListener("click", (event) => {
    if (event.target === modal) {
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

    if (startTime.value >= endTime.value) {
        alert("Power return time must be after the outage start time.");
        return;
    }

    schedule[selectedDay].push({
        start: startTime.value,
        end: endTime.value,
    });

    schedule[selectedDay].sort((a, b) => a.start.localeCompare(b.start));

    saveSchedule();

    modal.classList.add("hidden");

    renderSchedule();
    renderTodaySchedule();
    updatePowerStatus();
});

/* =========================
   SAVE SCHEDULE
========================= */

function saveSchedule() {
    localStorage.setItem("loadSheddingSchedule", JSON.stringify(schedule));
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

                <button
                    class="delete-outage"
                    data-day="${day}"
                    data-index="${index}"
                    aria-label="Delete outage"
                >
                    ×
                </button>
            `;

            container.appendChild(outageElement);
        });
    });

    addDeleteListeners();
}

/* =========================
   DELETE OUTAGE
========================= */

function addDeleteListeners() {
    const deleteButtons = document.querySelectorAll(".delete-outage");

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

    const outages = schedule[today];

    todaySchedule.innerHTML = "";

    if (outages.length === 0) {
        todaySchedule.innerHTML = `
            <div class="empty-state">
                <p>No outages scheduled today.</p>
                <span>Enjoy the power while it lasts.</span>
            </div>
        `;

        return;
    }

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

            <span style="color: var(--red);">
                No power
            </span>
        `;

        todaySchedule.appendChild(item);
    });
}

/* =========================
   POWER STATUS
========================= */

function updatePowerStatus() {
    const now = new Date();

    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const today = getTodayName();

    const outages = schedule[today];

    let currentOutage = null;
    let upcomingOutage = null;

    for (const outage of outages) {
        const [startHour, startMinute] = outage.start.split(":").map(Number);

        const [endHour, endMinute] = outage.end.split(":").map(Number);

        const start = startHour * 60 + startMinute;

        const end = endHour * 60 + endMinute;

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

    if (currentOutage) {
        powerStatus.textContent = "No Power";

        statusMessage.textContent = `Power is expected back at ${formatTime(currentOutage.end)}.`;

        statusCard.classList.add("power-off");

        nextOutage.textContent = `Until ${formatTime(currentOutage.end)}`;

        updateReturnCountdown(currentOutage.end);

        return;
    }

    statusCard.classList.remove("power-off");

    powerStatus.textContent = "Power Available";

    if (upcomingOutage) {
        statusMessage.textContent = "Your next scheduled outage is coming up.";

        nextOutage.textContent = `${formatTime(upcomingOutage.start)} – ${formatTime(upcomingOutage.end)}`;

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

function updateReturnCountdown(targetTime) {
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
   CLEAR SCHEDULE
========================= */

clearSchedule.addEventListener("click", () => {
    const confirmed = confirm("Clear your entire load-shedding schedule?");

    if (!confirmed) {
        return;
    }

    schedule = {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
        sunday: [],
    };

    localStorage.removeItem("loadSheddingSchedule");

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
   INITIAL LOAD
========================= */

updateDate();
renderSchedule();
renderTodaySchedule();
updatePowerStatus();

/* =========================
   UPDATE EVERY SECOND
========================= */

setInterval(() => {
    updatePowerStatus();
}, 1000);
