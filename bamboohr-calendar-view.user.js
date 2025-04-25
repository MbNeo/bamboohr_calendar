// ==UserScript==
// @name         BambooHR Calendar View
// @namespace    https://github.com/MbNeo/bamboohr_calendar
// @version      0.5
// @description  Adds an annual leave calendar to BambooHR with color-coded events
// @author       Mathias Bauer (mbneofrance@gmail.com)
// @copyright    2025, Mathias Bauer
// @license     MIT; https://opensource.org/licenses/MIT
// @match        https://*.bamboohr.com/employees/pto*
// @updateURL    https://openuserjs.org/meta/MbNeo/BambooHR_Calendar_View.meta.js
// @downloadURL  https://openuserjs.org/src/scripts/MbNeo/BambooHR_Calendar_View.user.js
// @icon         https://www.bamboohr.com/favicon.ico
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // Constants
    const DEBUG = false; // set to true to enable debug logs
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
            pending: "Pending"
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
            pending: "En attente"
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
            pending: "Ausstehend"
        }
    };

    // Prevent multiple script executions on the same page
    let calendarInitialized = false;

    let events = [];

    // Custom CSS styles for the calendar and its elements
    const customCSS = document.createElement('style');
    customCSS.textContent = `

/* ===== Main Container ===== */
.custom-calendar-container {
  background-color: #ffffff !important;
  border-radius: 16px !important;
  box-shadow: rgba(56, 49, 47, 0.05) 2px 2px 0px 2px !important;
  box-sizing: border-box !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 28px !important;
  padding: 32px !important;
  margin: 20px 0 !important;
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

/* ===== Leave Types (Annual View) ===== */
.mini-cell.event-rtt {
  background-color: #4caf50 !important;
  color: white !important;
}
.mini-cell.event-leave {
  background-color: #2196f3 !important;
  color: white !important;
}
.mini-cell.event-holiday {
  background-color: #9c27b0 !important;
  color: white !important;
}
.mini-cell.event-seniority {
  background-color: #ff9800 !important;
  color: white !important;
}
.mini-cell.event-paternity {
  background-color: #fd6c9e !important;
  color: white !important;
}
.mini-cell.event-sick {
  background-color: #795548 !important;
  color: white !important;
}
.mini-cell.event-other {
  background-color: #607d8b !important;
  color: white !important;
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
                console.log("Calendar module loaded");
                initializeCalendar();
            } catch (err) {
                console.error("Error initializing calendar:", err);
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Global variables for calendar navigation
    let currentYear = new Date().getFullYear();
    let currentMonth = new Date().getMonth();
    let currentView = 'year';  // 'year' or 'month'
    let currentLanguage = 'en'; // Default language

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
        // Instead of looking for a specific ID, search for a main element
        // that contains a section with the "Upcoming Time Off" text
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
                    console.log("⚠️ Using first main element as fallback");
                }
            }

            if (mainElement) {
                // Find the appropriate place to insert: after the "Upcoming Time Off" section
                const upcomingSection = upcomingTimeOffSpan.closest('section, div, article');

                if (upcomingSection) {
                    // Insert after the upcoming time off section
                    upcomingSection.parentNode.insertBefore(container, upcomingSection.nextSibling);
                    console.log("✅ Calendar inserted after Upcoming Time Off section");
                } else {
                    // Fallback: append to the main element
                    mainElement.appendChild(container);
                    console.warn("⚠️ Could not find Upcoming Time Off section, appending to main");
                }
            } else {
                console.warn("❌ No main element found in the document");
                // Fallback: just append to body
                document.body.appendChild(container);
            }
        } else {
            console.warn("❌ No 'Upcoming Time Off' text found");
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
     * Extracts time off data visible on the page.
     * Returns an array of objects { title, start, end, color, type, status }.
     */
    async function extractTimeOffData(year = currentYear) {
        events = [];

        const span = Array.from(document.querySelectorAll('span')).find(el =>
            UPCOMING_TIME_OFF_REGEX.test(el.textContent.trim())
        );

        if (!span) {
            console.warn('❌ No "Upcoming Time Off" or equivalent text found.');
            return [];
        }

        const container = span.closest('section, div, article');
        if (!container) {
            console.warn('❌ No parent section found for the span.');
            return [];
        }

        const paragraphs = Array.from(container.querySelectorAll('p'));
        for (let i = 0; i < paragraphs.length; i++) {
            const line = paragraphs[i].textContent.trim();
            console.log("line", line);

            const dateInfo = parseDateUniversal(line);

            if (dateInfo.startDate && !isNaN(dateInfo.startDate.getTime())) {
                const dateText = line;
                let description = '';
                let status = '';

                if (i<paragraphs.length-1) {
                    description = paragraphs[i + 1].textContent.trim();
                }

                const typeCategory = detectTypeFromText(description);
                const color = getColorForType(typeCategory);

                events.push({
                    title: description || 'Time Off',
                    start: dateInfo.startDate,
                    end: dateInfo.endDate,
                    type: typeCategory,
                    color,
                    status: status || 'Pending'
                });

                if (DEBUG) {
                    console.log('🗓️ Event detected:', {
                        dateText,
                        description,
                        status,
                        dateInfo
                    });
                }
            }
        }

    const types = [91, 94, 95, 81, 84, 98, 97, 107, 86, 111];

    const ajaxPromises = types.map(t => {
        return new Promise((resolve, reject) => {
            const url_source =  window.location.origin;
            let params = new URLSearchParams(window.location.search);
            let id = params.get('id');

            $.get(window.location.origin + `/time_off/table/requests?id=${id}&type=${t}&year=${year}`)
                .done(data => {
                let typeName = 'Previous Time Off';
                let typeCategory = 'other';
                let color = 'other';

                if (data.type)
                {
                    typeName = data.type.name;
                    typeCategory = detectTypeFromText(typeName);
                    color = getColorForType(typeCategory);
                }


                $.each(data.requests, function (key, value) {
                    events.push({
                        title: typeName,
                        start: new Date(value.startYmd +" 00:00:00"),
                        end: new Date(value.endYmd +" 00:00:00"),
                        type: typeCategory,
                        color: color,
                        status: value.status
                    });
                });
                    resolve(events);
                })
                .fail(err => {
                    console.warn(`❌ Erreur AJAX pour le type ${t}:`, err);
                    resolve([]); // on continue même si un type échoue
                });
        });
    });

    // Attendre tous les appels AJAX
    const results = await Promise.all(ajaxPromises);

    // Fusionner tous les events AJAX dans le tableau principal
    results.forEach(eventArray => {
        events.push(...eventArray);
    });

   events = [...new Set(events)];

   return events
   }

    /**
     * Detects the type of leave from the description text
     * @param {string} text - Description of the leave
     * @returns {string} Type category ('RTT', 'leave', 'holiday', etc.)
     */
    function detectTypeFromText(text) {
        const lowered = text.toLowerCase();

        if (/rtt|ab-310/.test(lowered)) return 'RTT';
        if (/anciennet|ab-631/.test(lowered)) return 'seniority';
        if (/holiday|férié|ferie|jour férié|easter|ascension|may day|labour day|victoire|ostern|auffahrt|mai feiertag/i.test(lowered)) return 'holiday';
        if (/ab-300|paid leave|congés|conge|urlaub/i.test(lowered)) return 'leave';
        if (/ab-632|unpaid leave|congé sans solde|unbezahlter urlaub/i.test(lowered)) return 'unpaid';
        if (/ab-100|sick|maladie|krank/i.test(lowered)) return 'sick';
        if (/ab-210|paternity|paternité|vaterschaft/i.test(lowered)) return 'paternity';

        return 'other';
    }

    /**
     * Maps leave type to a color for visual display
     * @param {string} type - Type of leave
     * @returns {string} Hex color code
     */
    function getColorForType(type) {
        const colors = {
            'RTT': '#4CAF50',
            'leave': '#2196F3',
            'holiday': '#9C27B0',
            'seniority': '#FF9800',
            'unpaid': '#E91E63',
            'sick': '#795548',
            'paternity': '#fd6c9e',
            'other': '#607D8B'
        };
        return colors[type] || '#607D8B';
    }

    /**
     * Builds the legend for leave types and inserts it into the DOM
     * @param {Array} events - List of extracted leave events
     */
    function buildLegend(events) {
        const legendContainer = document.getElementById('legend-container');
        if (!legendContainer) return;

        legendContainer.innerHTML = "";
        // Gather unique categories present in events
        const categories = new Set();
        events.forEach(ev => {
            categories.add(ev.type);
        });

        // Map of category types to their localized labels
        const labelMap = {
            'RTT': getText('legendRTT'),
            'AB-310': getText('legendRTT'),
            'leave': getText('legendLeave'),
            'AB-300': getText('legendLeave'),
            'holiday': getText('legendHolidays'),
            'seniority': getText('legendSeniority'),
            'AB-631': getText('legendSeniority'),
            'unpaid': getText('legendUnpaid'),
            'AB-632': getText('legendUnpaid'),
            'sick': getText('legendSick'),
            'AB-100': getText('legendSick'),
            'paternity': getText('legendpaternity'),
            'AB-210': getText('legendpaternity'),
            'other': getText('legendOther')
        };

        // Add each detected category to the legend with its color
        categories.forEach(type => {
            // Find the corresponding color (from the set of events)
            const color = events.find(ev => ev.type === type)?.color || '#607D8B';
            // Label to display
            const label = labelMap[type] || labelMap['other'];
            const legendItem = document.createElement('div');
            legendItem.className = 'legend-item';
            legendItem.innerHTML = `<div class="color-box" style="background-color: ${color};"></div><span>${label}${type.match(/^AB-/) ? '' : ''}</span>`;
            legendContainer.appendChild(legendItem);
        });

        // Manually add an entry for weekends (gray color) if not already added
        const weekendItem = document.createElement('div');
        weekendItem.className = 'legend-item';
        weekendItem.innerHTML = `<div class="color-box" style="background-color: #f0f0f0;"></div><span>${getText('legendWeekends')}</span>`;
        legendContainer.appendChild(weekendItem);
    }

    /**
     * Displays the calendar according to current view (year or month)
     */
    async function renderCalendar() {

                // Load time off data
        const events = await extractTimeOffData();
        if (DEBUG) console.log("Extracted time off data:", events);
        // Display an error message if no data could be extracted
        if (!events || events.length === 0) {
            const errorMsg = document.createElement('p');
            errorMsg.style.color = 'red';
            errorMsg.textContent = getText('errorNoData');
            container.querySelector('#calendar-display').appendChild(errorMsg);
            return;
        }

        // Build leave type legend dynamically
        buildLegend(events);


        const calendarContainer = document.getElementById('calendar-display');
        if (!calendarContainer) return;
        // Clear current content
        calendarContainer.innerHTML = '';

        if (currentView === 'month') {
            renderMonthView(calendarContainer);
        } else {
            renderYearView(calendarContainer);
        }
    }

    /**
     * Renders Annual Calendar View (12 months of current year in a grid)
     * @param {HTMLElement} container - DOM container for the calendar
     */
    function renderYearView(container) {
        const monthNames = getMonthNames();
        const dayNamesShort = getDayNames(true);  // short day headers (Mon..Sun)

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
                const events = getEventsForDate(date, currentYear);
                const dayOfWeek = date.getDay();
                const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
                const isToday = isCurrentYear && today.getMonth() === month && today.getDate() === day;
                let cellClass = 'mini-cell';
                if (isToday) cellClass += ' today';
                // If there's an event that day, determine corresponding class for color
                let titleAttr = '';
                if (events.length > 0) {
                    // Take the first event to determine the primary type of the day
                    const firstEvent = events[0];
                    let typeClass = firstEvent.type.toLowerCase(); // "holiday", "rtt", etc.
                    cellClass += ` event-${typeClass}`;
                    // Tooltip containing all event titles for the day
                    titleAttr = events.map(e => e.title).join(" & ");
                } else if (isWeekend) {
                    cellClass += ' weekend';
                }
                yearHTML += `<div class="${cellClass}" title="${titleAttr}">${day}</div>`;
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
     * Renders Monthly Calendar View (current month by default with navigation)
     * @param {HTMLElement} container - DOM container for the calendar
     */
    function renderMonthView(container) {
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
            const events = getEventsForDate(date, currentYear);
            const dayOfWeek = date.getDay();
            const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
            const isToday = isCurrentMonth && today.getDate() === day;
            // Base classes for cell
            let cellClasses = 'calendar-cell';
            if (isToday) cellClasses += ' today';
            if (isWeekend && events.length === 0) cellClasses += ' weekend';

            calendarHTML += `<div class="${cellClasses}"><div class="day-number">${day}</div>`;
            // Add any events for the day
            if (events.length > 0) {
                events.forEach(event => {
                    // Use stored color for the event
                    let eventColor = event.color;
                    // Adjust color if needed to match desired fixed colors
                    if (event.type === 'holiday') {
                        eventColor = '#9C27B0';  // purple for holidays
                    }
                    const eventTitle = event.title;
                    const statusText = (event.status === 'Approved') ? getText('approved') : getText('pending');
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
     * Gets all events (time off) matching a specific date
     * @param {Date} date - The date to check
     * @returns {Array} Array of events matching the date
     */
    function getEventsForDate(date, year) {
        // Use the year extracted in extractTimeOffData (via closure)
        // Filter extracted events where the date covers the given day
        //return (typeof extractTimeOffData.cached !== 'undefined' ? extractTimeOffData.cached : (extractTimeOffData.cached = extractTimeOffData()))
        //    .filter(event => date >= event.start && date <= event.end);

        return (typeof events !== 'undefined' ? events : (events = extractTimeOffData(year)))
            .filter(event => date >= event.start && date <= event.end);
    }

    /**
     * Parses date text (range or single date) supporting French/English and different formats.
     * Returns an object { startDate: Date, endDate: Date }.
     * @param {string} dateText - The text containing date information
     * @returns {Object} Object with start and end dates
     */
    function parseDateUniversal(dateText) {
        try {
            if (DEBUG) console.log(`Parsing date: "${dateText}"`);
            // Normalize long dashes to short dashes
            const normalizedText = dateText.replace(/–/g, '-');
            const isRange = normalizedText.includes('-');
            const today = new Date();
            const currentYear = today.getFullYear();

            if (isRange) {
                // Date range, e.g.: "12 Jul - 15 Jul" or "7 juil. - 25 juil."
                const parts = normalizedText.split('-').map(p => p.trim());
                // Extract start and end days and months
                const dayRegex = /(\d+)/g;
                const monthRegex = /[a-zéèêùûôâ]{3,}/i;
                const startDayMatch = parts[0].match(dayRegex);
                const startDay = startDayMatch ? parseInt(startDayMatch[0]) : null;
                const startMonthMatch = parts[0].match(monthRegex);
                const startMonthStr = startMonthMatch ? startMonthMatch[0] : null;
                const endDayMatch = parts[1].match(dayRegex);
                const endDay = endDayMatch ? parseInt(endDayMatch[0]) : null;
                let endMonthStr = null;
                const endMonthMatch = parts[1].match(monthRegex);
                if (endMonthMatch) {
                    endMonthStr = endMonthMatch[0];
                } else {
                    endMonthStr = startMonthStr;
                }
                const startMonthNum = getMonthNumberRobust(startMonthStr);
                const endMonthNum = getMonthNumberRobust(endMonthStr);
                if (startDay !== null && endDay !== null && startMonthNum !== -1 && endMonthNum !== -1) {
                    // Use current year to create dates
                    const startDate = new Date(currentYear, startMonthNum, startDay);
                    const endDate = new Date(currentYear, endMonthNum, endDay);
                    if (DEBUG) console.log(`Interpreted range: ${startDate.toDateString()} - ${endDate.toDateString()}`);
                    return { startDate, endDate };
                }
                // If interpretation fails, try alternative approach (case where month is only mentioned once)
                if (/^\d+$/.test(parts[1]) && startMonthStr) {
                    const altStartMatch = parts[0].match(/(\d+)\s+([A-Za-zéèêùûôâ.]+)/);
                    if (altStartMatch) {
                        const altStartDay = parseInt(altStartMatch[1]);
                        const altStartMonthStr = altStartMatch[2];
                        const altStartMonthNum = getMonthNumberRobust(altStartMonthStr);
                        const altEndDay = parseInt(parts[1]);
                        if (!isNaN(altEndDay) && altStartMonthNum !== -1) {
                            const startDate = new Date(currentYear, altStartMonthNum, altStartDay);
                            const endDate = new Date(currentYear, altStartMonthNum, altEndDay);
                            if (DEBUG) console.log(`Alternative range: ${startDate.toDateString()} - ${endDate.toDateString()}`);
                            return { startDate, endDate };
                        }
                    }
                }
            } else {
                // Single date, e.g.: "14 juillet" or "Jul 14"
                const dayMatch = normalizedText.match(/(\d+)/);
                const monthMatch = normalizedText.match(/[A-Za-zéèêùûôâ]{3,}/);
                if (dayMatch && monthMatch) {
                    const day = parseInt(dayMatch[0]);
                    const monthStr = monthMatch[0];
                    const monthNum = getMonthNumberRobust(monthStr);
                    if (monthNum !== -1) {
                        const date = new Date(currentYear, monthNum, day);
                        if (DEBUG) console.log(`Interpreted date: ${date.toDateString()}`);
                        return { startDate: date, endDate: date };
                    }
                }
            }
            // Failed to parse: return today's date by default
            if (DEBUG) console.log(`Failed to parse "${dateText}", returning today's date as default.`);
            return { startDate: new Date(), endDate: new Date() };
        } catch (error) {
            console.error("Error parsing date:", error);
            // In case of error, return today's date
            return { startDate: new Date(), endDate: new Date() };
        }
    }

    /**
     * Converts a month name (French or English, full or abbreviated) to month number (0-11)
     * @param {string} monthStr - The month name or abbreviation
     * @returns {number} Corresponding month number, or -1 if unknown
     */
    function getMonthNumberRobust(monthStr) {
        if (!monthStr) return -1;
        
        // Normalize the input string: lowercase, remove accents and punctuation
        const normalized = monthStr.toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")  // remove accents
            .replace(/[.]/g, "");  // remove punctuation (periods in abbreviations)
        
        // Create a map of all month names and their variants
        if (!getMonthNumberRobust.monthMap) {
            // Build the map only once and cache it
            const monthMap = {};
            
            // Process each language's month names
            for (const [lang, months] of Object.entries(MONTH_NAMES)) {
                months.forEach((month, index) => {
                    // Add full month name
                    const fullName = month.toLowerCase()
                        .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    monthMap[fullName] = index;
                    
                    // Add common abbreviations (first 3 chars, first 4 chars)
                    if (fullName.length > 3) {
                        monthMap[fullName.substring(0, 3)] = index;
                    }
                    if (fullName.length > 4) {
                        monthMap[fullName.substring(0, 4)] = index;
                    }
                });
            }
            
            // Add additional common abbreviations and variants
            const additionalVariants = {
                // French specific
                'janv': 0, 'fevr': 1, 'fev': 1, 'avr': 3, 
                'juil': 6, 'jui': 6, 'aou': 7, 'ao': 7,
                'sept': 8, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11,
                // English specific
                'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 
                'jun': 5, 'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11,
                // German specific
                'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 
                'jun': 5, 'jul': 6, 'aug': 7, 'sep': 8, 'okt': 9, 'dez': 11,
                // Special cases for 'may'/'mai'
                'may': 4, 'mai': 4
            };
            
            // Add the additional variants to our map
            Object.entries(additionalVariants).forEach(([abbrev, monthIndex]) => {
                monthMap[abbrev] = monthIndex;
            });
            
            // Cache the map for future use
            getMonthNumberRobust.monthMap = monthMap;
        }
        
        // First, try direct lookup in our map
        if (getMonthNumberRobust.monthMap[normalized] !== undefined) {
            return getMonthNumberRobust.monthMap[normalized];
        }
        
        // If not found, try partial matching
        for (const [name, num] of Object.entries(getMonthNumberRobust.monthMap)) {
            if (name.startsWith(normalized) || normalized.startsWith(name)) {
                return num;
            }
        }
        
        return -1; // Month not found
    }
})();
