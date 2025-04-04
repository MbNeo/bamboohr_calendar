// ==UserScript==
// @name         BambooHR Calendar View
// @namespace    https://github.com/MbNeo/bamboohr_calendar
// @version      0.3
// @description  Adds an annual leave calendar to BambooHR with color-coded events
// @author       Mathias Bauer (mbneofrance@gmail.com)
// @match        https://*.bamboohr.com/employees/pto*
// @grant        none
// @updateURL    https://github.com/MbNeo/bamboohr_calendar/raw/main/bamboohr-calendar-view.user.js
// @downloadURL  https://github.com/MbNeo/bamboohr_calendar/raw/main/bamboohr-calendar-view.user.js
// ==/UserScript==

(function() {
    'use strict';

    // Variable to avoid duplications
    let calendarInitialized = false;

    // Add our CSS
    const customCSS = document.createElement('style');
    customCSS.textContent = `
        .custom-calendar-container {
            background-color: rgb(255, 255, 255);
            border-radius: 16px;
            box-shadow: rgba(56, 49, 47, 0.05) 2px 2px 0px 2px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            gap: 28px;
            height: auto;
            min-height: auto;
            padding: 32px;
            margin-top: 20px;
            margin-bottom: 20px;
        }
        .calendar-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        .calendar-header h2 {
            font-size: 22px;
            font-weight: 600;
            font-family: Fields, serif;
        }
        .leave-type-legend {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            margin-bottom: 15px;
        }
        .legend-item {
            display: flex;
            align-items: center;
        }
        .color-box {
            width: 15px;
            height: 15px;
            border-radius: 3px;
            margin-right: 5px;
        }
        .month-nav {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
        }
        .month-nav button {
            background: #f0f0f0;
            border: 1px solid #ccc;
            border-radius: 4px;
            padding: 5px 10px;
            margin: 0 5px;
            cursor: pointer;
        }
        .month-nav button:hover {
            background: #e0e0e0;
        }
        .month-nav h3 {
            margin: 0 10px;
        }
        .calendar-grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 1px;
            background-color: #f0f0f0;
            border: 1px solid #ddd;
        }
        .calendar-cell {
            background-color: white;
            min-height: 80px;
            padding: 5px;
            position: relative;
        }
        .calendar-cell.header {
            background-color: #f8f8f8;
            font-weight: bold;
            text-align: center;
            padding: 10px;
            min-height: auto;
        }
        .calendar-cell.weekend {
            background-color: #f5f5f5;
        }
        .calendar-cell.today {
            background-color: #faffd1;
        }
        .calendar-cell.outside-month {
            color: #ccc;
            background-color: #f9f9f9;
        }
        .calendar-cell.outside-month.weekend {
            background-color: #f0f0f0;
        }
        .day-number {
            font-weight: bold;
            margin-bottom: 5px;
        }
        .calendar-event {
            font-size: 11px;
            padding: 2px 4px;
            border-radius: 3px;
            margin-bottom: 2px;
            color: white;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .year-view {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
        }
        .mini-month {
            border: 1px solid #ddd;
            padding: 10px;
            border-radius: 4px;
        }
        .mini-month h4 {
            text-align: center;
            margin: 0 0 10px 0;
        }
        .mini-calendar {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 1px;
            font-size: 12px;
        }
        .mini-cell {
            text-align: center;
            padding: 2px;
            position: relative;
            height: 20px;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
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
        .event-rtt {
            background-color: #4CAF50 !important;
            color: white !important;
        }
        .event-conges {
            background-color: #2196F3 !important;
            color: white !important;
        }
        .event-ferie {
            background-color: #9C27B0 !important;
            color: white !important;
        }
        .event-anciennete {
            background-color: #FF9800 !important;
            color: white !important;
        }
        .view-buttons {
            display: flex;
            gap: 10px;
            margin-bottom: 15px;
        }
        .view-button {
            padding: 8px 15px;
            background-color: #f0f0f0;
            border: 1px solid #ccc;
            border-radius: 4px;
            cursor: pointer;
        }
        .view-button.active {
            background-color: #007bff;
            color: white;
            border-color: #007bff;
        }
        .year-control {
            display: flex;
            justify-content: center;
            align-items: center;
            margin-bottom: 20px;
        }
        .year-control button {
            background: #f0f0f0;
            border: 1px solid #ccc;
            border-radius: 4px;
            padding: 5px 15px;
            margin: 0 10px;
            cursor: pointer;
        }
        .year-control h2 {
            margin: 0;
        }
        
        /* Upcoming Time Off styling */
        .holiday-item {
            background-color: rgba(156, 39, 176, 0.2) !important;
            border-radius: 4px !important;
            padding: 2px 4px !important;
        }
        
        .rtt-item {
            background-color: rgba(76, 175, 80, 0.2) !important;
            border-radius: 4px !important;
            padding: 2px 4px !important;
        }
        
        .leave-item {
            background-color: rgba(33, 150, 243, 0.2) !important;
            border-radius: 4px !important;
            padding: 2px 4px !important;
        }
        
        .seniority-item {
            background-color: rgba(255, 152, 0, 0.2) !important;
            border-radius: 4px !important;
            padding: 2px 4px !important;
        }
    `;
    document.head.appendChild(customCSS);

    // Global variables
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    let currentView = 'year'; // 'year' or 'month' (annual view by default)
    let timeOffEvents = [];

    // Main function to add the calendar
    function addCalendarView() {
        // Avoid duplication
        if (calendarInitialized) {
            console.log('Calendar already initialized, skipping');
            return;
        }

        // Check if URL matches the leave page
        if (!window.location.href.includes('/employees/pto')) {
            return;
        }

        console.log('BambooHR Calendar Enhancement: Starting...');

        // Wait for the page to be fully loaded
        setTimeout(function() {
            // Check again to avoid duplicates after the delay
            if (document.querySelector('.custom-calendar-container')) {
                console.log('Calendar already exists, skipping');
                return;
            }

            // Extract leave data from the page
            timeOffEvents = extractTimeOffData();

            console.log('Extracted time off data:', timeOffEvents);

            // Create the container for our calendar
            const calendarContainer = document.createElement('div');
            calendarContainer.className = 'custom-calendar-container';
            calendarContainer.id = 'custom-bamboohr-calendar';
            calendarContainer.innerHTML = `
                <div class="calendar-header">
                    <h2>📅 Annual Leave Calendar</h2>
                </div>
                <div class="leave-type-legend">
                    <div class="legend-item">
                        <div class="color-box" style="background-color: #4CAF50;"></div>
                        <span>RTT (AB-310)</span>
                    </div>
                    <div class="legend-item">
                        <div class="color-box" style="background-color: #2196F3;"></div>
                        <span>Paid Leave (AB-300)</span>
                    </div>
                    <div class="legend-item">
                        <div class="color-box" style="background-color: #9C27B0;"></div>
                        <span>Public Holidays</span>
                    </div>
                    <div class="legend-item">
                        <div class="color-box" style="background-color: #FF9800;"></div>
                        <span>Seniority (AB-631)</span>
                    </div>
                    <div class="legend-item">
                        <div class="color-box" style="background-color: #f0f0f0;"></div>
                        <span>Weekends</span>
                    </div>
                </div>
                <div class="view-buttons">
                    <div class="view-button" data-view="month">Monthly View</div>
                    <div class="view-button active" data-view="year">Annual View</div>
                </div>
                <div id="calendar-container"></div>
            `;

            // Find the appropriate element before which to insert our calendar
            const targetElement = document.querySelector('.fabric-polnhg-root') || 
                                 document.querySelector('section.fabric-polnhg-root');

            if (targetElement && targetElement.parentNode) {
                // Insert the calendar before the "Upcoming Time Off" section
                targetElement.parentNode.insertBefore(calendarContainer, targetElement);

                // Render the calendar
                renderCalendar();

                // Add event listeners
                addEventListeners();

                // Mark as initialized
                calendarInitialized = true;

                console.log('BambooHR Calendar Enhancement: Calendar added successfully');
            } else {
                console.error('BambooHR Calendar Enhancement: Target element not found');
            }
        }, 2000); // Wait 2 seconds to ensure the page is loaded
    }

    // Function to add event listeners
    function addEventListeners() {
        // View buttons
        const viewButtons = document.querySelectorAll('.view-button');
        viewButtons.forEach(button => {
            button.addEventListener('click', function() {
                viewButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                currentView = this.getAttribute('data-view');
                renderCalendar();
            });
        });
    }

    // Function to extract leave data
    function extractTimeOffData() {
        const timeOffEvents = [];
        const processedItems = new Set(); // To avoid duplicates

        try {
            // Extract upcoming time off based on the HTML structure you shared
            const upcomingTimeOffItems = document.querySelectorAll('.MuiBox-root.css-1lekzkb');

            upcomingTimeOffItems.forEach(item => {
                try {
                    // Generate a unique identifier for this item
                    const itemId = item.innerHTML.length;
                    if (processedItems.has(itemId)) {
                        return; // Skip this item if it's already been processed
                    }
                    processedItems.add(itemId);

                    // Find the date
                    const dateElement = item.querySelector('.MuiTypography-root.fabric-162rsfc-medium-root');
                    if (!dateElement) {
                        console.log('Date element not found in item:', item);
                        return;
                    }

                    const dateText = dateElement.textContent.trim();
                    console.log('Found date text:', dateText);

                    // Find the leave type (may be in different elements based on your HTML)
                    let typeText = '';
                    const typeElements = [
                        item.querySelector('.fabric-163vq54-root span:last-child'), // For paid leave and RTT
                        item.querySelector('.fabric-kv8rfh-root') // For public holidays
                    ];

                    for (const el of typeElements) {
                        if (el && el.textContent.trim()) {
                            typeText = el.textContent.trim();
                            break;
                        }
                    }

                    console.log('Found type text:', typeText);

                    if (!typeText) {
                        console.log('Type text not found for date:', dateText);
                        return;
                    }

                    // Check if the leave is approved
                    const isApproved = item.querySelector('.fabric-1uoie6m-root') !== null;
                    const statusText = isApproved ? 'Approved' : 'Pending';

                    // Parse the date (could be a range or a single date)
                    let startDate, endDate;

                    if (dateText.includes('–')) {
                        // Date range (e.g., "Apr 17 – 18")
                        const [startStr, endStr] = dateText.split('–').map(d => d.trim());

                        // Process start date
                        const startMonth = getMonthNumber(startStr.split(' ')[0]);
                        const startDay = parseInt(startStr.split(' ')[1]);
                        startDate = new Date(currentYear, startMonth, startDay);

                        // Process end date
                        let endMonth, endDay;
                        if (endStr.includes(' ')) {
                            // Format "Apr 17 – May 18"
                            endMonth = getMonthNumber(endStr.split(' ')[0]);
                            endDay = parseInt(endStr.split(' ')[1]);
                        } else {
                            // Format "Apr 17 – 18"
                            endMonth = startMonth;
                            endDay = parseInt(endStr);
                        }
                        endDate = new Date(currentYear, endMonth, endDay);
                    } else {
                        // Single date (e.g., "Apr 15")
                        const month = getMonthNumber(dateText.split(' ')[0]);
                        const day = parseInt(dateText.split(' ')[1]);
                        startDate = new Date(currentYear, month, day);
                        endDate = new Date(currentYear, month, day);
                    }

                    // Determine the leave type and color
                    let eventColor;
                    let typeCategory;

                    if (typeText.includes('RTT') || typeText.includes('AB-310')) {
                        eventColor = '#4CAF50'; // Green
                        typeCategory = 'rtt';
                    } else if (typeText.includes('France 2024-25') || typeText.includes('AB-300')) {
                        eventColor = '#2196F3'; // Blue
                        typeCategory = 'conges';
                    } else if (typeText.includes('Easter') || typeText.includes('Labour Day') ||
                               typeText.includes('Victoire 1945') || typeText.includes('Ascension Day')) {
                        eventColor = '#9C27B0'; // Purple
                        typeCategory = 'ferie';
                    } else if (typeText.includes('Ancienneté') || typeText.includes('AB-631')) {
                        eventColor = '#FF9800'; // Orange
                        typeCategory = 'anciennete';
                    } else {
                        eventColor = '#607D8B'; // Blue-gray
                        typeCategory = 'autre';
                    }

                    // Add the event
                    timeOffEvents.push({
                        title: typeText,
                        start: startDate,
                        end: endDate,
                        color: eventColor,
                        type: typeCategory,
                        status: statusText
                    });

                    console.log('Added event:', {
                        date: dateText,
                        type: typeText,
                        start: startDate,
                        end: endDate,
                        category: typeCategory
                    });

                } catch (itemError) {
                    console.error('Error processing time off item:', itemError);
                }
            });

            return timeOffEvents;
        } catch (error) {
            console.error('Error extracting time off data:', error);
            return [];
        }
    }

    // Function to render the calendar
    function renderCalendar() {
        const calendarContainer = document.getElementById('calendar-container');
        if (!calendarContainer) return;

        if (currentView === 'month') {
            renderMonthView(calendarContainer);
        } else {
            renderYearView(calendarContainer);
        }
    }

    // Function to render the monthly view
    function renderMonthView(container) {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                           'July', 'August', 'September', 'October', 'November', 'December'];
        const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        // Current date to highlight "today"
        const today = new Date();
        const isCurrentMonth = (today.getMonth() === currentMonth && today.getFullYear() === currentYear);

        // Generate HTML for navigation controls
        const navigationHTML = `
            <div class="month-nav">
                <button id="prev-month">◀</button>
                <h3>${monthNames[currentMonth]} ${currentYear}</h3>
                <button id="next-month">▶</button>
            </div>
        `;

        // Create the calendar grid
        let calendarHTML = `
            ${navigationHTML}
            <div class="calendar-grid">
        `;

        // Add day headers
        dayNames.forEach((day, index) => {
            const isWeekend = index >= 5; // Sat and Sun are the last two days
            calendarHTML += `<div class="calendar-cell header ${isWeekend ? 'weekend' : ''}">${day}</div>`;
        });

        // Get the first and last day of the month
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);

        // Adjust to start with Monday (1) instead of Sunday (0)
        let startingDayIndex = firstDay.getDay() - 1;
        if (startingDayIndex === -1) startingDayIndex = 6;

        // Previous month days
        const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
        for (let i = 0; i < startingDayIndex; i++) {
            const day = prevMonthLastDay - startingDayIndex + i + 1;
            const isWeekend = i >= 5; // Weekend if index >= 5 (sat and sun)
            calendarHTML += `<div class="calendar-cell outside-month ${isWeekend ? 'weekend' : ''}"><div class="day-number">${day}</div></div>`;
        }

        // Current month days
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const date = new Date(currentYear, currentMonth, day);
            const events = getEventsForDate(date);
            const dayOfWeek = date.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // 0 = Sunday, 6 = Saturday
            const isToday = isCurrentMonth && today.getDate() === day;

            // Check if the day has events
            const hasEvents = events.length > 0;

            // Define CSS classes for the cell
            let cellClasses = 'calendar-cell';

            // If we have events, give them priority over the "weekend" marking
            if (isToday) cellClasses += ' today';
            if (!hasEvents && isWeekend) cellClasses += ' weekend';

            calendarHTML += `<div class="${cellClasses}">
                <div class="day-number">${day}</div>
                ${events.map(event => 
                    `<div class="calendar-event" style="background-color: ${event.color};" 
                         title="${event.title} - ${event.status}">${event.title}</div>`
                ).join('')}
            </div>`;
        }

        // Next month days
        const daysAfterMonthEnd = 42 - (startingDayIndex + lastDay.getDate());
        for (let day = 1; day <= daysAfterMonthEnd; day++) {
            // Calculate if it's a weekend based on the day of the week
            const date = new Date(currentYear, currentMonth + 1, day);
            const dayOfWeek = date.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // 0 = Sunday, 6 = Saturday

            calendarHTML += `<div class="calendar-cell outside-month ${isWeekend ? 'weekend' : ''}"><div class="day-number">${day}</div></div>`;
        }

        calendarHTML += `</div>`;

        // Update the content
        container.innerHTML = calendarHTML;

        // Add event listeners for navigation
        document.getElementById('prev-month').addEventListener('click', () => {
            currentMonth--;
            if (currentMonth < 0) {
                currentMonth = 11;
                currentYear--;
            }
            renderCalendar();
        });

        document.getElementById('next-month').addEventListener('click', () => {
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
            renderCalendar();
        });
    }

    // Function to render the annual view
    function renderYearView(container) {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                           'July', 'August', 'September', 'October', 'November', 'December'];
        const dayNamesShort = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

        // Current date to highlight "today"
        const today = new Date();
        const isCurrentYear = today.getFullYear() === currentYear;

        let yearHTML = `
            <div class="year-control">
                <button id="prev-year">◀</button>
                <h2>${currentYear}</h2>
                <button id="next-year">▶</button>
            </div>
            <div class="year-view">
        `;

        // Generate a mini-calendar for each month
        for (let month = 0; month < 12; month++) {
            yearHTML += `
                <div class="mini-month">
                    <h4>${monthNames[month]}</h4>
                    <div class="mini-calendar">
            `;

            // Add day headers
            dayNamesShort.forEach((day, index) => {
                const isWeekend = index >= 5; // Sat and Sun are the last two days
                yearHTML += `<div class="mini-cell header ${isWeekend ? 'weekend' : ''}">${day}</div>`;
            });

            // Get the first and last day of the month
            const firstDay = new Date(currentYear, month, 1);
            const lastDay = new Date(currentYear, month + 1, 0);

            // Adjust to start with Monday (1) instead of Sunday (0)
            let startingDayIndex = firstDay.getDay() - 1;
            if (startingDayIndex === -1) startingDayIndex = 6;

            // Previous month days
            for (let i = 0; i < startingDayIndex; i++) {
                const isWeekend = i >= 5; // Weekend if index >= 5 (sat and sun)
                yearHTML += `<div class="mini-cell ${isWeekend ? 'weekend' : ''}"></div>`;
            }

            // Current month days
            for (let day = 1; day <= lastDay.getDate(); day++) {
                const date = new Date(currentYear, month, day);
                const events = getEventsForDate(date);
                const dayOfWeek = date.getDay();
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // 0 = Sunday, 6 = Saturday
                const isToday = isCurrentYear && today.getMonth() === month && today.getDate() === day;

                // Apply different styles based on events
                let cellClass = 'mini-cell';
                if (isToday) cellClass += ' today';

                let title = '';

                // If we have events, color the cell
                if (events.length > 0) {
                    // Use the first event to determine the color
                    cellClass += ` event-${events[0].type}`;
                    
                    // Create a title that lists all events
                    title = events.map(e => e.title).join('\n');
                } else if (isWeekend) {
                    // If it's a weekend without events, use the weekend class
                    cellClass += ' weekend';
                }

                yearHTML += `<div class="${cellClass}" title="${title}">${day}</div>`;
            }

            // Fill remaining cells (if necessary)
            const totalDaysVisible = 42; // 6 weeks max
            const daysShown = startingDayIndex + lastDay.getDate();
            const remainingCells = (totalDaysVisible - daysShown) % 7;
            
            for (let i = 0; i < remainingCells; i++) {
                const position = (daysShown + i) % 7;
                const isWeekend = position >= 5; // The last two columns are weekends
                yearHTML += `<div class="mini-cell ${isWeekend ? 'weekend' : ''}"></div>`;
            }

            yearHTML += `
                    </div>
                </div>
            `;
        }

        yearHTML += `</div>`;

        // Update the content
        container.innerHTML = yearHTML;

        // Add event listeners for navigation
        document.getElementById('prev-year').addEventListener('click', () => {
            currentYear--;
            renderCalendar();
        });

        document.getElementById('next-year').addEventListener('click', () => {
            currentYear++;
            renderCalendar();
        });
    }

    // Function to get events for a given date
    function getEventsForDate(date) {
        return timeOffEvents.filter(event => {
            // Create copies of dates to avoid modifying the originals
            const eventStart = new Date(event.start);
            const eventEnd = new Date(event.end);

            // Normalize dates to have only the date without the time
            const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const normalizedStart = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate());
            const normalizedEnd = new Date(eventEnd.getFullYear(), eventEnd.getMonth(), eventEnd.getDate());

            // Check if the date is between the start and end of the event (inclusive)
            return normalizedDate >= normalizedStart && normalizedDate <= normalizedEnd;
        });
    }

    // Helper function to convert month name to number
    // Helper function to convert month name to number
    function getMonthNumber(monthName) {
        const months = {
            'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
            'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
        };
        return months[monthName];
    }

    // Function to clean up existing calendars
    function cleanupCalendars() {
        const existingCalendars = document.querySelectorAll('.custom-calendar-container');
        if (existingCalendars.length > 1) {
            // Keep only the first calendar, remove the others
            for (let i = 1; i < existingCalendars.length; i++) {
                existingCalendars[i].remove();
            }
        }
    }

    // Function to add colored style to "Upcoming Time Off" elements
    function addStyleToUpcomingTimeOff() {
        // Wait for elements to load
        setTimeout(() => {
            // Find all elements
            const allElements = document.querySelectorAll('.fabric-163vq54-root span:last-child, .fabric-kv8rfh-root');
            
            allElements.forEach(el => {
                const textContent = el.textContent || '';
                
                // For RTT
                if (textContent.includes('RTT') || textContent.includes('AB-310')) {
                    const parentEl = el.closest('.fabric-163vq54-root') || el;
                    parentEl.style.backgroundColor = 'rgba(76, 175, 80, 0.2)';
                    parentEl.style.borderRadius = '4px';
                    parentEl.style.padding = '2px 6px';
                    parentEl.classList.add('rtt-item');
                }
                
                // For paid leave
                else if (textContent.includes('AB-300')) {
                    const parentEl = el.closest('.fabric-163vq54-root') || el;
                    parentEl.style.backgroundColor = 'rgba(33, 150, 243, 0.2)';
                    parentEl.style.borderRadius = '4px';
                    parentEl.style.padding = '2px 6px';
                    parentEl.classList.add('leave-item');
                }
                
                // For seniority leave
                else if (textContent.includes('Ancienneté') || textContent.includes('AB-631')) {
                    const parentEl = el.closest('.fabric-163vq54-root') || el;
                    parentEl.style.backgroundColor = 'rgba(255, 152, 0, 0.2)';
                    parentEl.style.borderRadius = '4px';
                    parentEl.style.padding = '2px 6px';
                    parentEl.classList.add('seniority-item');
                }
                
                // For public holidays
                else if (textContent.includes('Easter') || 
                        textContent.includes('Labour Day') || 
                        textContent.includes('Victoire') || 
                        textContent.includes('Ascension Day')) {
                    const parentEl = el.closest('.fabric-kv8rfh-root') || el;
                    parentEl.style.backgroundColor = 'rgba(156, 39, 176, 0.2)';
                    parentEl.style.borderRadius = '4px';
                    parentEl.style.padding = '2px 6px';
                    parentEl.classList.add('holiday-item');
                }
            });
        }, 2500);
    }

    // Execute our script
    addCalendarView();
    
    // Clean up existing calendars after a short delay
    setTimeout(cleanupCalendars, 3000);
    
    // Add style to "Upcoming Time Off" elements
    addStyleToUpcomingTimeOff();

    // Observe DOM changes to re-execute our script if necessary
    const observer = new MutationObserver(function(mutations) {
        // Limit to a single instance
        if (calendarInitialized) {
            // If we have too many calendars, clean up
            if (document.querySelectorAll('.custom-calendar-container').length > 1) {
                cleanupCalendars();
            }
            return;
        }
        
        if (window.location.href.includes('/employees/pto')) {
            const calendarExists = document.querySelector('.custom-calendar-container');
            if (!calendarExists) {
                addCalendarView();
                // Reapply style to "Upcoming Time Off" elements
                addStyleToUpcomingTimeOff();
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();
