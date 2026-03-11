// CHANGE THIS LINE - use relative path instead of localhost
var API_BASE = "/api";

// REST OF THE FILE STAYS EXACTLY THE SAME
// Don't change anything else
function showSection(sectionName) {
    var sections = document.querySelectorAll(".section");
    for (var i = 0; i < sections.length; i++) {
        sections[i].classList.remove("active");
    }

    var tabs = document.querySelectorAll(".tab-btn");
    for (var i = 0; i < tabs.length; i++) {
        tabs[i].classList.remove("active");
    }

    var targetSection = document.getElementById(sectionName + "-section");
    if (targetSection) {
        targetSection.classList.add("active");
    }

    var keywords = { booking: "book", slots: "view", myappointments: "my" };
    var keyword = keywords[sectionName];

    var tabButtons = document.querySelectorAll(".tab-btn");
    for (var i = 0; i < tabButtons.length; i++) {
        var text = tabButtons[i].textContent.toLowerCase();
        if (text.indexOf(keyword) !== -1) {
            tabButtons[i].classList.add("active");
        }
    }
}

// ... KEEP EVERYTHING ELSE EXACTLY THE SAME AS BEFORE ...

// ===== Section Navigation =====
function showSection(sectionName) {
    // Hide all sections
    var sections = document.querySelectorAll(".section");
    for (var i = 0; i < sections.length; i++) {
        sections[i].classList.remove("active");
    }

    // Remove active from all tabs
    var tabs = document.querySelectorAll(".tab-btn");
    for (var i = 0; i < tabs.length; i++) {
        tabs[i].classList.remove("active");
    }

    // Show selected section
    var targetSection = document.getElementById(sectionName + "-section");
    if (targetSection) {
        targetSection.classList.add("active");
    }

    // Set active tab
    var tabButtons = document.querySelectorAll(".tab-btn");
    for (var i = 0; i < tabButtons.length; i++) {
        if (tabButtons[i].textContent.toLowerCase().indexOf(getTabKeyword(sectionName)) !== -1) {
            tabButtons[i].classList.add("active");
        }
    }
}

function getTabKeyword(section) {
    if (section === "booking") return "book";
    if (section === "slots") return "view";
    if (section === "myappointments") return "my";
    return section;
}

// ===== Initialize Date Inputs =====
function initializeDates() {
    var today = new Date();
    var maxDate = new Date();
    maxDate.setDate(today.getDate() + 6);

    var todayStr = formatDateForInput(today);
    var maxStr = formatDateForInput(maxDate);

    var bookingDate = document.getElementById("booking-date");
    var viewDate = document.getElementById("view-date");

    bookingDate.setAttribute("min", todayStr);
    bookingDate.setAttribute("max", maxStr);
    viewDate.setAttribute("min", todayStr);
    viewDate.setAttribute("max", maxStr);
    viewDate.value = todayStr;
}

function formatDateForInput(date) {
    var year = date.getFullYear();
    var month = String(date.getMonth() + 1).padStart(2, "0");
    var day = String(date.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
}

function formatDateForDisplay(dateStr) {
    var date = new Date(dateStr + "T00:00:00");
    var options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
    return date.toLocaleDateString("en-US", options);
}

// ===== Load Time Slots for Booking Form =====
function loadTimeSlots(date) {
    var container = document.getElementById("time-slots-container");
    container.innerHTML = '<p class="placeholder-text">Loading available slots...</p>';

    var xhr = new XMLHttpRequest();
    xhr.open("GET", API_BASE + "/slots?date=" + date, true);

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                var slots = JSON.parse(xhr.responseText);
                displayBookingSlots(slots);
            } else {
                container.innerHTML = '<p class="placeholder-text">Error loading slots. Is the server running?</p>';
            }
        }
    };

    xhr.onerror = function () {
        container.innerHTML = '<p class="placeholder-text">Cannot connect to server. Make sure the Java server is running on port 8080.</p>';
    };

    xhr.send();
}

function displayBookingSlots(slots) {
    var container = document.getElementById("time-slots-container");
    container.innerHTML = "";

    if (slots.length === 0) {
        container.innerHTML = '<p class="placeholder-text">No slots available for this date</p>';
        return;
    }

    for (var i = 0; i < slots.length; i++) {
        var slot = slots[i];
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "time-slot-btn";
        btn.textContent = slot.time;
        btn.setAttribute("data-time", slot.time);

        if (!slot.available) {
            btn.classList.add("unavailable");
            btn.setAttribute("disabled", "true");
            btn.title = "Already booked";
        } else {
            btn.onclick = (function (timeValue) {
                return function () {
                    selectTimeSlot(timeValue);
                };
            })(slot.time);
        }

        container.appendChild(btn);
    }
}

function selectTimeSlot(time) {
    // Remove selection from all
    var allBtns = document.querySelectorAll(".time-slot-btn");
    for (var i = 0; i < allBtns.length; i++) {
        allBtns[i].classList.remove("selected");
    }

    // Select the clicked one
    var buttons = document.querySelectorAll('.time-slot-btn[data-time="' + time + '"]');
    for (var i = 0; i < buttons.length; i++) {
        buttons[i].classList.add("selected");
    }

    document.getElementById("selected-time").value = time;
}

// ===== Book Appointment =====
function bookAppointment(event) {
    event.preventDefault();

    var name = document.getElementById("name").value.trim();
    var email = document.getElementById("email").value.trim();
    var phone = document.getElementById("phone").value.trim();
    var date = document.getElementById("booking-date").value;
    var time = document.getElementById("selected-time").value;
    var purpose = document.getElementById("purpose").value;

    // Validation
    if (!name || !email || !date || !time) {
        alert("Please fill in all required fields and select a time slot.");
        return;
    }

    showLoading();

    var data = JSON.stringify({
        name: name,
        email: email,
        phone: phone,
        date: date,
        time: time,
        purpose: purpose
    });

    var xhr = new XMLHttpRequest();
    xhr.open("POST", API_BASE + "/book", true);
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            hideLoading();
            if (xhr.status === 200) {
                var response = JSON.parse(xhr.responseText);
                if (response.success) {
                    showConfirmation(response.appointment);
                    document.getElementById("booking-form").reset();
                    document.getElementById("selected-time").value = "";
                    document.getElementById("time-slots-container").innerHTML =
                        '<p class="placeholder-text">Please select a date first to view available slots</p>';
                } else {
                    alert("Booking failed: " + response.message);
                }
            } else {
                var errorResponse = JSON.parse(xhr.responseText);
                alert("Booking failed: " + (errorResponse.message || "Server error"));
            }
        }
    };

    xhr.onerror = function () {
        hideLoading();
        alert("Cannot connect to server. Please make sure the Java server is running.");
    };

    xhr.send(data);
}

// ===== Show Confirmation Modal =====
function showConfirmation(appointment) {
    var details = document.getElementById("modal-details");
    details.innerHTML =
        "<p><strong>Booking ID:</strong> " + appointment.id + "</p>" +
        "<p><strong>Name:</strong> " + appointment.name + "</p>" +
        "<p><strong>Email:</strong> " + appointment.email + "</p>" +
        "<p><strong>Date:</strong> " + formatDateForDisplay(appointment.date) + "</p>" +
        "<p><strong>Time:</strong> " + appointment.time + "</p>" +
        "<p><strong>Purpose:</strong> " + (appointment.purpose || "N/A") + "</p>" +
        "<p><strong>Status:</strong> " + appointment.status + "</p>";

    document.getElementById("confirmation-modal").classList.add("show");
}

function closeModal() {
    document.getElementById("confirmation-modal").classList.remove("show");
}

// ===== Load All Slots (View Section) =====
function loadAllSlots() {
    var date = document.getElementById("view-date").value;
    if (!date) {
        alert("Please select a date.");
        return;
    }

    var container = document.getElementById("all-slots-container");
    container.innerHTML = '<p class="placeholder-text">Loading...</p>';

    var xhr = new XMLHttpRequest();
    xhr.open("GET", API_BASE + "/slots?date=" + date, true);

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                var slots = JSON.parse(xhr.responseText);
                displayAllSlots(slots, date);
            } else {
                container.innerHTML = '<p class="placeholder-text">Error loading slots.</p>';
            }
        }
    };

    xhr.onerror = function () {
        container.innerHTML = '<p class="placeholder-text">Cannot connect to server.</p>';
    };

    xhr.send();
}

function displayAllSlots(slots, date) {
    var container = document.getElementById("all-slots-container");
    container.innerHTML = "";

    if (slots.length === 0) {
        container.innerHTML = '<div class="no-results"><span>&#128197;</span><p>No slots found for this date</p></div>';
        return;
    }

    var availableCount = 0;
    var bookedCount = 0;

    var groupDiv = document.createElement("div");
    groupDiv.className = "slots-date-group";

    for (var i = 0; i < slots.length; i++) {
        if (slots[i].available) availableCount++;
        else bookedCount++;
    }

    var heading = document.createElement("h3");
    heading.textContent = formatDateForDisplay(date) +
        " — " + availableCount + " Available, " + bookedCount + " Booked";
    groupDiv.appendChild(heading);

    var grid = document.createElement("div");
    grid.className = "slot-grid-view";

    for (var i = 0; i < slots.length; i++) {
        var slot = slots[i];
        var card = document.createElement("div");
        card.className = "slot-card " + (slot.available ? "available" : "booked");
        card.textContent = slot.time + (slot.available ? " ✓" : " ✗");
        grid.appendChild(card);
    }

    groupDiv.appendChild(grid);
    container.appendChild(groupDiv);
}

// ===== Search Appointments =====
function searchAppointments() {
    var email = document.getElementById("search-email").value.trim();
    if (!email) {
        alert("Please enter your email address.");
        return;
    }

    var container = document.getElementById("appointments-list");
    container.innerHTML = '<p class="placeholder-text">Searching...</p>';

    var xhr = new XMLHttpRequest();
    xhr.open("GET", API_BASE + "/appointments?email=" + encodeURIComponent(email), true);

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                var appointments = JSON.parse(xhr.responseText);
                displayAppointments(appointments);
            } else {
                container.innerHTML = '<p class="placeholder-text">Error fetching appointments.</p>';
            }
        }
    };

    xhr.onerror = function () {
        container.innerHTML = '<p class="placeholder-text">Cannot connect to server.</p>';
    };

    xhr.send();
}

function displayAppointments(appointments) {
    var container = document.getElementById("appointments-list");
    container.innerHTML = "";

    if (appointments.length === 0) {
        container.innerHTML =
            '<div class="no-results">' +
            '<span>&#128203;</span>' +
            '<p>No appointments found for this email address.</p>' +
            '</div>';
        return;
    }

    for (var i = 0; i < appointments.length; i++) {
        var apt = appointments[i];
        var isCancelled = apt.status === "Cancelled";

        var card = document.createElement("div");
        card.className = "appointment-card" + (isCancelled ? " cancelled" : "");

        var statusClass = isCancelled ? "cancelled" : "confirmed";

        card.innerHTML =
            '<h3>Appointment #' + apt.id + '</h3>' +
            '<div class="appointment-info">' +
                '<p><strong>Name:</strong> ' + apt.name + '</p>' +
                '<p><strong>Email:</strong> ' + apt.email + '</p>' +
                '<p><strong>Date:</strong> ' + formatDateForDisplay(apt.date) + '</p>' +
                '<p><strong>Time:</strong> ' + apt.time + '</p>' +
                '<p><strong>Phone:</strong> ' + (apt.phone || 'N/A') + '</p>' +
                '<p><strong>Purpose:</strong> ' + (apt.purpose || 'N/A') + '</p>' +
            '</div>' +
            '<div class="appointment-actions">' +
                '<span class="status-badge ' + statusClass + '">' + apt.status + '</span>' +
                (isCancelled ? '' :
                    '<button class="btn btn-danger" onclick="cancelAppointment(\'' + apt.id + '\')">&#10005; Cancel</button>'
                ) +
            '</div>';

        container.appendChild(card);
    }
}

// ===== Cancel Appointment =====
function cancelAppointment(appointmentId) {
    var confirmed = confirm("Are you sure you want to cancel appointment " + appointmentId + "?");
    if (!confirmed) return;

    showLoading();

    var data = JSON.stringify({ id: appointmentId });

    var xhr = new XMLHttpRequest();
    xhr.open("POST", API_BASE + "/cancel", true);
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            hideLoading();
            if (xhr.status === 200) {
                var response = JSON.parse(xhr.responseText);
                if (response.success) {
                    alert(response.message);
                    searchAppointments(); // Refresh the list
                } else {
                    alert("Error: " + response.message);
                }
            } else {
                alert("Failed to cancel appointment.");
            }
        }
    };

    xhr.onerror = function () {
        hideLoading();
        alert("Cannot connect to server.");
    };

    xhr.send(data);
}

// ===== Reset Form =====
function resetForm() {
    document.getElementById("selected-time").value = "";
    document.getElementById("time-slots-container").innerHTML =
        '<p class="placeholder-text">Please select a date first to view available slots</p>';
}

// ===== Loading Functions =====
function showLoading() {
    document.getElementById("loading").classList.add("show");
}

function hideLoading() {
    document.getElementById("loading").classList.remove("show");
}

// ===== Event Listeners =====
document.addEventListener("DOMContentLoaded", function () {
    initializeDates();

    // Load time slots when date changes in booking form
    document.getElementById("booking-date").addEventListener("change", function () {
        var date = this.value;
        if (date) {
            document.getElementById("selected-time").value = "";
            loadTimeSlots(date);
        }
    });

    // Booking form submission
    document.getElementById("booking-form").addEventListener("submit", bookAppointment);

    // Close modal on outside click
    document.getElementById("confirmation-modal").addEventListener("click", function (e) {
        if (e.target === this) {
            closeModal();
        }
    });
});