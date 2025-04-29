// ==UserScript==
// @name         BambooHR Calendar View
// @namespace    https://github.com/MbNeo/bamboohr_calendar
// @version      1.0
// @description  Adds an annual leave calendar to BambooHR with color-coded events
// @author       Mathias Bauer (mbneofrance@gmail.com)
// @copyright    2025, Mathias Bauer
// @license      MIT; https://opensource.org/licenses/MIT
// @match        https://*.bamboohr.com/employees/pto*
// @updateURL    https://openuserjs.org/meta/MbNeo/BambooHR_Calendar_View.meta.js
// @downloadURL  https://openuserjs.org/src/scripts/MbNeo/BambooHR_Calendar_View.user.js
// @icon         https://www.bamboohr.com/favicon.ico
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // Constants for regex pattern matching
    const UPCOMING_TIME_OFF_REGEX = /Congés à venir|Upcoming Time Off|Anstehende Abwesenheit/i;

    // Multilingual date and day names
    const MONTH_NAMES = {
        en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        fr: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
        de: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']
    };

    const DAY_NAMES = {
        en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        fr: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
        de: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
    };

    const DAY_NAMES_SHORT = {
        en: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
        fr: ['L', 'M', 'M', 'J', 'V', 'S', 'D'],
        de: ['M', 'D', 'M', 'D', 'F', 'S', 'S']
    };

    // Localized text strings
    const TEXT = {
        en: {
            title: "📅 Annual Leave Calendar",
            viewMonth: "Month View",
            viewYear: "Year View",
            legendHolidays: "Public Holidays",
            legendLeave: "Paid Leave",
            legendRTT: "RTT",
            legendSeniority: "Seniority",
            legendWeekends: "Weekends",
            legendOther: "Other",
            legendUnpaid: "Unpaid Leave",
            legendSick: "Sick Leave",
            legendpaternity: "Paternity",
            errorNoData: "No time off data available to display.",
            approved: "Approved",
            pending: "Pending",
            loading: "Loading calendar data..."
        },
        fr: {
            title: "📅 Calendrier Annuel des Congés",
            viewMonth: "Vue Mensuelle",
            viewYear: "Vue Annuelle",
            legendHolidays: "Jours fériés",
            legendLeave: "Congés payés",
            legendRTT: "RTT",
            legendSeniority: "Ancienneté",
            legendWeekends: "Week-ends",
            legendOther: "Autres",
            legendUnpaid: "Congé sans solde",
            legendSick: "Maladie",
            legendpaternity: "Paternité",
            errorNoData: "Aucune donnée de congé à afficher.",
            approved: "Approuvé",
            pending: "En attente",
            loading: "Chargement des données du calendrier..."
        },
        de: {
            title: "📅 Urlaubskalender",
            viewMonth: "Monatsansicht",
            viewYear: "Jahresansicht",
            legendHolidays: "Feiertage",
            legendLeave: "Bezahlter Urlaub",
            legendRTT: "RTT",
            legendSeniority: "Seniorität",
            legendWeekends: "Wochenenden",
            legendOther: "Andere",
            legendUnpaid: "Unbezahlter Urlaub",
            legendSick: "Krankheit",
            legendpaternity: "Vaterschaft",
            errorNoData: "Keine Urlaubsdaten zum Anzeigen verfügbar.",
            approved: "Genehmigt",
            pending: "Ausstehend",
            loading: "Kalenderdaten werden geladen..."
        }
    };

    // Default color scheme for different event types
    const DEFAULT_COLORS = {
        'holiday': '#9C27B0',     // violet for holidays
        'rtt': '#4CAF50',         // green for RTT
        'leave': '#2196F3',       // blue for paid leave
        'seniority': '#FF9800',   // orange for seniority
        'sick': '#795548',        // brown for sick leave
        'paternity': '#fd6c9e',   // pink for paternity
        'unpaid': '#E91E63',      // dark pink for unpaid leave
        'other': '#607D8B'        // blue-grey for other types
    };

    // Prevent multiple script executions on the same page
    let calendarInitialized = false;

    // Global events storage
    let events = [];

    // Global variables for calendar navigation
    let currentYear = new Date().getFullYear();
    let currentMonth = new Date().getMonth();
    let currentView = 'year';  // 'year' or 'month'
    let currentLanguage = 'en'; // Default language

    // Custom CSS styles for the calendar and its elements
    const customCSS = document.createElement('style');
    customCSS.textContent = `
/* ===== Main Container ===== */
.custom-calendar-container {
  background-color: #ffffff;
  border-radius: 16px;
  box-shadow: rgba(56, 49, 47, 0.05) 2px 2px 0px 2px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 28px;
  padding: 32px;
  margin: 20px 0;
}

/* ===== Calendar Header ===== */
.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.calendar-header h2 {
  font-size: 22px;
  font-weight: 600;
  font-family: Arial, sans-serif;
  margin: 0;
}
.view-buttons button {
  margin-left: 10px;
  padding: 5px 10px;
  font-size: 14px;
  cursor: pointer;
}

/* ===== Legend ===== */
.leave-type-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 15px;
}
.legend-item {
  display: flex;
  align-items: center;
  font-size: 14px;
}
.legend-item .color-box {
  width: 15px;
  height: 15px;
  border-radius: 3px;
  margin-right: 5px;
}

/* ===== Month/Year Navigation ===== */
.month-nav,
.year-control {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 15px;
}
.month-nav button,
.year-control button {
  background: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 4px 8px;
  margin: 0 5px;
  cursor: pointer;
}
.month-nav button:hover,
.year-control button:hover {
  background: #e0e0e0;
}
.month-nav h3,
.year-control h2 {
  margin: 0 10px;
}

/* ===== Monthly Calendar Grid ===== */
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background-color: #e0e0e0;
}
.calendar-cell {
  background-color: #fff;
  min-height: 80px;
  padding: 4px;
  position: relative;
  box-sizing: border-box;
  overflow: hidden;
}
.calendar-cell.header,
.mini-cell.header {
  background-color: #f8f8f8;
  font-weight: bold;
  text-align: center;
}
.calendar-cell.outside-month {
  background-color: #fafafa;
  color: #aaa;
}
.calendar-cell.weekend,
.mini-cell.weekend {
  background-color: #fafafa;
}
.calendar-cell.today,
.mini-cell.today {
  outline: 1px solid #2196f3;
}

/* ===== Events (Monthly View) ===== */
.calendar-event {
  display: block;
  margin-top: 2px;
  font-size: 11px;
  line-height: 1.2;
  color: #fff;
  padding: 2px 4px;
  border-radius: 3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
  box-sizing: border-box;
}

/* ===== Annual Grid ===== */
.year-view {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
.mini-calendar {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background-color: #e0e0e0;
}
.mini-cell {
  background-color: #fff;
  text-align: center;
  position: relative;
  height: 12px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
}
.mini-cell.header {
  font-weight: bold;
}
.mini-cell.weekend {
  background-color: #f0f0f0;
}
.mini-cell.today {
  background-color: #faffd1;
}
`;
    document.head.appendChild(customCSS);

    // Execute script only on leave/PTO pages
    if (!window.location.href.includes('/employees/pto')) {
        return;
    }

    // Watch for page changes to insert the calendar at the right moment
    const observer = new MutationObserver(() => {
        if (calendarInitialized) return;

        const span = Array.from(document.querySelectorAll('span')).find(el =>
            UPCOMING_TIME_OFF_REGEX.test(el.textContent.trim())
        );

        if (span) {
            calendarInitialized = true;
            observer.disconnect(); // Stop observing once we've found our element
            try {
                initializeCalendar();
            } catch (err) {
                console.error("Error initializing calendar:", err);
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    /**
     * Detects the page language based on content
     * @returns {string} Language code ('en', 'fr', or 'de')
     */
    function detectLanguage() {
        const pageText = document.body.textContent || "";
        if (pageText.includes("Congé") || pageText.includes("congé") || pageText.includes("Congés")) {
            return 'fr';
        }
        if (pageText.includes("Urlaub") || pageText.includes("Abwesenheit")) {
            return 'de';
        }
        return 'en'; // Default to English
    }

    /**
     * Gets month names in the current language
     * @returns {Array} Array of month names
     */
    function getMonthNames() {
        return MONTH_NAMES[currentLanguage] || MONTH_NAMES.en;
    }

    /**
     * Gets day names in the current language
     * @param {boolean} short - Whether to use short day names (single letter)
     * @returns {Array} Array of day names
     */
    function getDayNames(short = false) {
        return short ?
            (DAY_NAMES_SHORT[currentLanguage] || DAY_NAMES_SHORT.en) :
            (DAY_NAMES[currentLanguage] || DAY_NAMES.en);
    }

    /**
     * Gets localized text based on current language
     * @param {string} key - The text key to retrieve
     * @returns {string} The localized text
     */
    function getText(key) {
        return (TEXT[currentLanguage] && TEXT[currentLanguage][key]) || TEXT.en[key] || key;
    }

    /**
     * Initializes the calendar by inserting the container and populating data
     */
    function initializeCalendar() {
        // Determine page language
        currentLanguage = detectLanguage();

        // Insert calendar structure into the page
        const container = document.createElement('div');
        container.className = 'custom-calendar-container';
        container.id = 'calendar-container';
        container.innerHTML = `
        <div class="calendar-header">
            <h2>${getText('title')}</h2>
            <div class="view-buttons">
                <button id="toggle-view">${getText('viewMonth')}</button>
            </div>
        </div>
        <!-- Leave types legend -->
        <div class="leave-type-legend" id="legend-container"></div>
        <!-- Calendar display area (month or year) -->
        <div id="calendar-display"></div>
    `;

        // Find the appropriate container for insertion
        const upcomingTimeOffSpan = Array.from(document.querySelectorAll('span')).find(el =>
            UPCOMING_TIME_OFF_REGEX.test(el.textContent.trim())
        );

        if (upcomingTimeOffSpan) {
            // Find the nearest main element
            let mainElement = upcomingTimeOffSpan.closest('main');

            if (!mainElement) {
                // If no main element directly contains the span, look for any main element
                const mains = document.querySelectorAll('main');
                if (mains.length > 0) {
                    // Use the first main found as fallback
                    mainElement = mains[0];
                }
            }

            if (mainElement) {
                // Find the appropriate place to insert: after the "Upcoming Time Off" section
                const upcomingSection = upcomingTimeOffSpan.closest('section, div, article');

                if (upcomingSection) {
                    // Insert after the upcoming time off section
                    upcomingSection.parentNode.insertBefore(container, upcomingSection.nextSibling);
                } else {
                    // Fallback: append to the main element
                    mainElement.appendChild(container);
                }
            } else {
                // Fallback: just append to body
                document.body.appendChild(container);
            }
        } else {
            // Fallback: append to body
            document.body.appendChild(container);
        }

        // Initialize view (default to year view)
        currentView = 'year';
        const toggleViewBtn = container.querySelector('#toggle-view');
        toggleViewBtn.addEventListener('click', () => {
            // Toggle between year and month view
            if (currentView === 'year') {
                currentView = 'month';
                toggleViewBtn.textContent = getText('viewYear');
            } else {
                currentView = 'year';
                toggleViewBtn.textContent = getText('viewMonth');
            }
            renderCalendar();
        });

        // Render initial calendar (year view by default)
        renderCalendar();
    }

    /**
     * Extracts time off data and holidays from BambooHR APIs
     * @param {number} year - The year to extract data for
     * @returns {Promise<Array>} - List of events
     */
    async function extractTimeOffData(year = currentYear) {
        events = [];

        try {
            // Get employee ID from URL
            let params = new URLSearchParams(window.location.search);
            let employeeId = params.get('id');

            if (!employeeId) {
                return [];
            }

            // 1. Make AJAX call to retrieve policies and holidays
            const employeeResponse = await $.ajax({
                url: window.location.origin + `/time_off/employee?employeeId=${employeeId}`,
                method: 'GET',
                dataType: 'json'
            });

            if (!employeeResponse) {
                return [];
            }

            // 2. Add holidays to events
            if (employeeResponse.upcomingTimeOffEvents && Array.isArray(employeeResponse.upcomingTimeOffEvents)) {
                const holidays = employeeResponse.upcomingTimeOffEvents.filter(event => event.type === 'holiday');

                holidays.forEach(holiday => {
                    // Only events for the requested year
                    if (new Date(holiday.startDate).getFullYear() === year) {
                        events.push({
                            title: holiday.categoryName,
                            start: new Date(holiday.startDate + " 00:00:00"),
                            end: new Date(holiday.endDate + " 23:59:59"),
                            type: 'holiday',
                            color: '#9C27B0', // Color for holidays
                            status: 'approved'
                        });
                    }
                });
            }

            // 3. Check for policies
            if (!employeeResponse.policies || !Array.isArray(employeeResponse.policies)) {
                // Return holidays if available
                return events;
            }

            // 4. Add approved/pending leave requests
            const ajaxPromises = employeeResponse.policies.map(policy => {
                return new Promise((resolve) => {
                    $.get(window.location.origin + `/time_off/table/requests?id=${employeeId}&type=${policy.categoryId}&year=${year}`)
                        .done(data => {
                            // Check if response contains type and requests data
                            if (data && data.type && data.requests) {
                                // Add each leave request to events
                                Object.values(data.requests).forEach(request => {
                                    events.push({
                                        title: data.type.name,
                                        start: new Date(request.startYmd + " 00:00:00"),
                                        end: new Date(request.endYmd + " 23:59:59"),
                                        type: data.type.name,
                                        color: '#' + data.type.color,
                                        status: request.status,
                                        translatedStatus: request.translatedStatus || request.status
                                    });
                                });
                            }
                            resolve();
                        })
                        .fail(() => {
                            resolve(); // Continue even if one type fails
                        });
                });
            });

            // 5. Add scheduled time off (from upcomingTimeOffEvents)
            if (employeeResponse.upcomingTimeOffEvents && Array.isArray(employeeResponse.upcomingTimeOffEvents)) {
                const timeOffs = employeeResponse.upcomingTimeOffEvents.filter(event => event.type === 'request');

                timeOffs.forEach(timeOff => {
                    // Avoid duplicates (these events should already be included via requests)
                    // But add them anyway in case they contain more recent info
                    if (new Date(timeOff.startDate).getFullYear() === year) {
                        let color = '#607d8b';

                        events.push({
                            title: timeOff.categoryName,
                            start: new Date(timeOff.startDate + " 00:00:00"),
                            end: new Date(timeOff.endDate + " 23:59:59"),
                            type: timeOff.categoryName,
                            color: color,
                            status: timeOff.status || 'approved'
                        });
                    }
                });
            }

            // 6. Wait for all AJAX calls
            await Promise.all(ajaxPromises);

            // 7. Filter potential duplicates (same type, same dates)
            const uniqueEvents = [];
            const seenKeys = new Set();

            events.forEach(event => {
                const key = `${event.type}_${event.start.toISOString()}_${event.end.toISOString()}`;
                if (!seenKeys.has(key)) {
                    seenKeys.add(key);
                    uniqueEvents.push(event);
                }
            });

            return uniqueEvents;

        } catch (error) {
            console.error('Error extracting time off data:', error);
            return [];
        }
    }

    /**
     * Displays the calendar according to current view (year or month)
     */
    async function renderCalendar() {
        const calendarContainer = document.getElementById('calendar-display');
        if (!calendarContainer) return;

        // Clear current content
        calendarContainer.innerHTML = '';

        // Display loading indicator
        const loadingMsg = document.createElement('div');
        loadingMsg.textContent = '⌛ ' + getText('loading');
        loadingMsg.style.textAlign = 'center';
        loadingMsg.style.padding = '20px';
        calendarContainer.appendChild(loadingMsg);

        // Load time off data
        const loadedEvents = await extractTimeOffData();

        // Store events in the global variable for other functions to access
        events = loadedEvents;

        // Clear the loading message
        calendarContainer.innerHTML = '';

        // Display an error message if no data could be extracted,
        // but still show navigation controls
        if (!loadedEvents || loadedEvents.length === 0) {
            // Create navigation controls based on current view
            if (currentView === 'month') {
                const navHTML = `<div class="month-nav">
                    <button id="prev-month">◀</button>
                    <h3>${getMonthNames()[currentMonth]} ${currentYear}</h3>
                    <button id="next-month">▶</button>
                </div>`;

                calendarContainer.innerHTML = navHTML;

                // Add error message
                const errorMsg = document.createElement('p');
                errorMsg.style.color = 'red';
                errorMsg.style.textAlign = 'center';
                errorMsg.style.padding = '30px';
                errorMsg.textContent = getText('errorNoData');
                calendarContainer.appendChild(errorMsg);

                // Add navigation event handlers
                calendarContainer.querySelector('#prev-month').addEventListener('click', () => {
                    currentMonth--;
                    if (currentMonth < 0) {
                        currentMonth = 11;
                        currentYear--;
                    }
                    renderCalendar();
                });

                calendarContainer.querySelector('#next-month').addEventListener('click', () => {
                    currentMonth++;
                    if (currentMonth > 11) {
                        currentMonth = 0;
                        currentYear++;
                    }
                    renderCalendar();
                });
            } else {
                // Year view with navigation controls
                const navHTML = `<div class="year-control">
                    <button id="prev-year">◀</button>
                    <h2>${currentYear}</h2>
                    <button id="next-year">▶</button>
                </div>`;

                calendarContainer.innerHTML = navHTML;

                // Add error message
                const errorMsg = document.createElement('p');
                errorMsg.style.color = 'red';
                errorMsg.style.textAlign = 'center';
                errorMsg.style.padding = '30px';
                errorMsg.textContent = getText('errorNoData');
                calendarContainer.appendChild(errorMsg);

                // Add navigation event handlers
                calendarContainer.querySelector('#prev-year').addEventListener('click', () => {
                    currentYear--;
                    renderCalendar();
                });

                calendarContainer.querySelector('#next-year').addEventListener('click', () => {
                    currentYear++;
                    renderCalendar();
                });
            }

            return;
        }

        // Build leave type legend dynamically
        buildLegend(loadedEvents);

        // Render the appropriate view
        if (currentView === 'month') {
            renderMonthView(calendarContainer, loadedEvents);
        } else {
            renderYearView(calendarContainer, loadedEvents);
        }
    }

    /**
     * Renders the year view calendar
     * @param {HTMLElement} container - Container element for the calendar
     * @param {Array} eventsList - List of events to display
     */
    function renderYearView(container, eventsList) {
        const monthNames = getMonthNames();
        const dayNamesShort = getDayNames(true);  // short day headers (Mon..Sun)
    
        // Add dynamic CSS styles for events
        addDynamicEventStyles(eventsList);
    
        const today = new Date();
        const isCurrentYear = today.getFullYear() === currentYear;
        let yearHTML = `<div class="year-control">
                            <button id="prev-year">◀</button>
                            <h2>${currentYear}</h2>
                            <button id="next-year">▶</button>
                        </div>
                        <div class="year-view">`;
        // Generate mini-calendar for each month
        for (let month = 0; month < 12; month++) {
            yearHTML += `<div class="mini-month">
                            <h4>${monthNames[month]}</h4>
                            <div class="mini-calendar">`;
            // Day of week headers
            dayNamesShort.forEach((dayName, index) => {
                const isWeekendHeader = index >= 5;
                yearHTML += `<div class="mini-cell header ${isWeekendHeader ? 'weekend' : ''}">${dayName}</div>`;
            });
            // Calculate days of the month
            const firstDay = new Date(currentYear, month, 1);
            const lastDay = new Date(currentYear, month + 1, 0);
            // Start week on Monday (instead of Sunday)
            let startWeekDay = firstDay.getDay() - 1;
            if (startWeekDay === -1) startWeekDay = 6;
            // Previous month days to display at start (empty cells)
            for (let i = 0; i < startWeekDay; i++) {
                const isWeekend = i >= 5;
                yearHTML += `<div class="mini-cell ${isWeekend ? 'weekend' : ''}"></div>`;
            }
            // Current month days
            for (let day = 1; day <= lastDay.getDate(); day++) {
                const date = new Date(currentYear, month, day);
                const dateEvents = getEventsForDate(date, currentYear, eventsList);
                const dayOfWeek = date.getDay();
                const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
                const isToday = isCurrentYear && today.getMonth() === month && today.getDate() === day;
                let cellClass = 'mini-cell';
                if (isToday) cellClass += ' today';
                
                // If there's an event that day, determine corresponding class for color
                let titleAttr = '';
                let cellStyle = '';
                
                if (dateEvents.length > 0) {
                    // Take the first event to determine the primary type of the day
                    const firstEvent = dateEvents[0];
                    
                    // Use a specific class for this event
                    // Create a safe CSS ID from the type
                    const safeTypeId = makeSafeCSSId(firstEvent.type);
                    cellClass += ` event-type-${safeTypeId}`;
                    
                    // Apply color directly as inline style
                    const eventColor = getEventColor(firstEvent);
                    cellStyle = `background-color: ${eventColor}; color: white;`;
                    
                    // Tooltip containing all event titles for the day
                    titleAttr = dateEvents.map(e => e.title).join(" & ");
                } else if (isWeekend) {
                    cellClass += ' weekend';
                }
                
                yearHTML += `<div class="${cellClass}" title="${titleAttr}" style="${cellStyle}">${day}</div>`;
            }
            // Fill in missing cells at end of month to have complete grid of 6 weeks (42 days)
            const daysShown = startWeekDay + lastDay.getDate();
            const totalCells = (daysShown <= 35) ? 35 : 42;
            const remainingCells = totalCells - daysShown;
    
            for (let i = 0; i < remainingCells; i++) {
                const pos = (daysShown + i) % 7;
                const isWeekend = pos === 5 || pos === 6;
                yearHTML += `<div class="mini-cell ${isWeekend ? 'weekend' : ''}"></div>`;
            }
            yearHTML += `</div></div>`; // end .mini-calendar and .mini-month
        }
        yearHTML += `</div>`; // end .year-view
    
        container.innerHTML = yearHTML;
        // Add event handlers for navigating between years
        container.querySelector('#prev-year').addEventListener('click', () => {
            currentYear--;
            renderCalendar();
        });
        container.querySelector('#next-year').addEventListener('click', () => {
            currentYear++;
            renderCalendar();
        });
    }

/**
     * Adds dynamic CSS styles for event colors
     * @param {Array} events - List of events to create styles for
     */
function addDynamicEventStyles(events) {
    // Remove any existing dynamic styles to avoid duplication
    const existingStyle = document.getElementById('dynamic-event-styles');
    if (existingStyle) {
        existingStyle.remove();
    }
    
    // Create a new style element
    const styleEl = document.createElement('style');
    styleEl.id = 'dynamic-event-styles';
    
    // Build CSS rules for each unique event type
    let cssRules = '';
    const processedTypes = new Set();
    
    events.forEach(event => {
        const typeName = event.type;
        // Get appropriate color (with fallback if needed)
        const typeColor = getEventColor(event);
        
        // Process each type only once
        if (!processedTypes.has(typeName)) {
            processedTypes.add(typeName);
            
            // Create a safe CSS class name from the type
            const safeTypeId = makeSafeCSSId(typeName);
            
            // Add CSS rule for mini cells (year view)
            cssRules += `
.mini-cell.event-type-${safeTypeId} {
    background-color: ${typeColor} !important;
    color: white !important;
}`;
        }
    });
    
    // Add the CSS rules to the style element
    styleEl.textContent = cssRules;
    document.head.appendChild(styleEl);
}

/**
 * Creates a CSS-safe identifier from a string
 * @param {string} str - Input string
 * @returns {string} CSS-safe identifier
 */
function makeSafeCSSId(str) {
    if (!str) return 'unknown';

    // Convert to string if not already
    str = String(str);

    // Replace any non-alphanumeric characters with hyphens
    // Then remove leading/trailing hyphens and convert to lowercase
    return str.replace(/[^a-zA-Z0-9]/g, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase();
}

/**
 * Gets the appropriate color for an event
 * @param {Object} event - Event object
 * @returns {string} Color code for the event
 */
function getEventColor(event) {
    // If event already has a valid color, use it
    if (event.color && event.color !== '#null' && event.color !== 'null' && event.color !== '#undefined') {
        return event.color;
    }
    
    // Otherwise, determine event type to find a default color
    let eventType = 'other';
    
    if (event.type === 'holiday') {
        eventType = 'holiday';
    } else if (/rtt|ab-310/i.test(event.type)) {
        eventType = 'rtt';
    } else if (/ab-300|congés|paid leave/i.test(event.type)) {
        eventType = 'leave';
    } else if (/ancienneté|ab-631|seniority/i.test(event.type)) {
        eventType = 'seniority';
    } else if (/ab-100|sick|maladie/i.test(event.type)) {
        eventType = 'sick';
    } else if (/ab-210|paternity|paternité/i.test(event.type)) {
        eventType = 'paternity';
    } else if (/ab-632|unpaid|sans solde/i.test(event.type)) {
        eventType = 'unpaid';
    }
    
    // Return default color for this type
    return DEFAULT_COLORS[eventType] || DEFAULT_COLORS.other;
}

/**
 * Builds legend for different event types
 * @param {Array} events - List of events
 */
function buildLegend(events) {
    const legendContainer = document.getElementById('legend-container');
    if (!legendContainer) return;

    legendContainer.innerHTML = "";
    
    // Create a Map to store unique event types with their colors
    const typeColors = new Map();
    
    // Go through all events to collect unique types and colors
    events.forEach(event => {
        // Use type name directly as key
        const typeName = event.type;
        
        // Get appropriate color (with fallback if needed)
        const color = getEventColor(event);
        
        // Store only the first event of each type (with its color)
        if (!typeColors.has(typeName)) {
            typeColors.set(typeName, {
                color: color,
                label: typeName // Use type name directly as label
            });
        }
    });
    
    // Add each type to the legend
    typeColors.forEach((value, key) => {
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        legendItem.innerHTML = `<div class="color-box" style="background-color: ${value.color};"></div><span>${value.label}</span>`;
        legendContainer.appendChild(legendItem);
    });

    // Add entry for weekends (gray)
    const weekendItem = document.createElement('div');
    weekendItem.className = 'legend-item';
    weekendItem.innerHTML = `<div class="color-box" style="background-color: #f0f0f0;"></div><span>${getText('legendWeekends')}</span>`;
    legendContainer.appendChild(weekendItem);
}

/**
 * Renders the month view calendar
 * @param {HTMLElement} container - Container element for the calendar
 * @param {Array} eventsList - List of events to display
 */
function renderMonthView(container, eventsList) {
    const monthNames = getMonthNames();
    const dayNames = getDayNames();

    const today = new Date();
    const isCurrentMonth = (today.getFullYear() === currentYear && today.getMonth() === currentMonth);

    let calendarHTML = `<div class="month-nav">
                            <button id="prev-month">◀</button>
                            <h3>${monthNames[currentMonth]} ${currentYear}</h3>
                            <button id="next-month">▶</button>
                        </div>
                        <div class="calendar-grid">`;
    // Day headers (weekday row)
    for (let i = 0; i < dayNames.length; i++) {
        const isWeekend = i >= 5;
        calendarHTML += `<div class="calendar-cell header ${isWeekend ? 'weekend' : ''}">${dayNames[i]}</div>`;
    }
    // Calculate first day of month and number of days
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    // Start on Monday
    let startWeekDay = firstDay.getDay() - 1;
    if (startWeekDay === -1) startWeekDay = 6;
    // Visible days from previous month
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = 0; i < startWeekDay; i++) {
        const dayNum = prevMonthLastDay - startWeekDay + i + 1;
        const isWeekend = i >= 5;
        calendarHTML += `<div class="calendar-cell outside-month ${isWeekend ? 'weekend' : ''}">
                             <div class="day-number">${dayNum}</div>
                         </div>`;
    }
    // Days of current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(currentYear, currentMonth, day);
        const dayEvents = getEventsForDate(date, currentYear, eventsList);
        const dayOfWeek = date.getDay();
        const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
        const isToday = isCurrentMonth && today.getDate() === day;
        // Base classes for cell
        let cellClasses = 'calendar-cell';
        if (isToday) cellClasses += ' today';
        if (isWeekend && dayEvents.length === 0) cellClasses += ' weekend';

        calendarHTML += `<div class="${cellClasses}"><div class="day-number">${day}</div>`;
        // Add any events for the day
        if (dayEvents.length > 0) {
            dayEvents.forEach(event => {
                // Get appropriate color (with fallback if needed)
                const eventColor = getEventColor(event);
                
                const eventTitle = event.title;
                const statusText = (event.status === 'approved' || event.status === 'Approved')
                    ? getText('approved')
                    : getText('pending');
                
                // Add colored event block
                calendarHTML += `<div class="calendar-event" style="background-color: ${eventColor};" title="${eventTitle} - ${statusText}">${eventTitle}</div>`;
            });
        }
        calendarHTML += `</div>`; // end .calendar-cell
    }
    // Visible days from next month to complete grid (6 rows)
    const totalCellsUsed = startWeekDay + lastDay.getDate();
    const cellsRemaining = 42 - totalCellsUsed;
    for (let i = 1; i <= cellsRemaining; i++) {
        const isWeekend = ((startWeekDay + lastDay.getDate() + i - 1) % 7 >= 5);
        calendarHTML += `<div class="calendar-cell outside-month ${isWeekend ? 'weekend' : ''}">
                             <div class="day-number">${i}</div>
                         </div>`;
    }
    calendarHTML += `</div>`; // end .calendar-grid

    container.innerHTML = calendarHTML;
    // Handle prev/next month navigation buttons
    container.querySelector('#prev-month').addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar();
    });
    container.querySelector('#next-month').addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar();
    });
}

/**
 * Gets events for a specific date
 * @param {Date} date - The date to get events for
 * @param {number} year - The year (for filtering)
 * @param {Array} eventsList - List of events to filter
 * @returns {Array} Events for the specified date
 */
function getEventsForDate(date, year, eventsList) {
    // Use provided events list or global events variable
    const eventsToFilter = eventsList || events;

    // If events are not yet loaded, return empty array
    if (!eventsToFilter || !Array.isArray(eventsToFilter)) {
        return [];
    }

    // Filter events where the date is between start and end dates
    return eventsToFilter.filter(event => {
        // Make sure event has valid start and end properties
        if (!event.start || !event.end) {
            return false;
        }

        // Check if the given date falls within the event's date range
        return date >= event.start && date <= event.end;
    });
}

})();