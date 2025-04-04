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

(function () {
    'use strict';

    // Variable to avoid duplications
    let calendarInitialized = false;
    const DEBUG = true;

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
        setTimeout(function () {
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
            button.addEventListener('click', function () {
                viewButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                currentView = this.getAttribute('data-view');
                renderCalendar();
            });
        });
    }

    // Fonction améliorée pour extraire les données de congés de manière générique
    // Fonction améliorée pour extraire les données de congés - compatible multilingue
    function extractTimeOffData() {
        const timeOffEvents = [];
        const processedItems = new Set(); // Pour éviter les doublons

        // Map pour stocker les couleurs par type de congé
        const typeColorMap = new Map();

        // Couleurs prédéfinies attrayantes
        const predefinedColors = [
            '#4CAF50', // Vert
            '#2196F3', // Bleu
            '#9C27B0', // Violet
            '#FF9800', // Orange
            '#E91E63', // Rose
            '#00BCD4', // Cyan
            '#3F51B5', // Indigo
            '#009688', // Teal
            '#FFC107', // Ambre
            '#8BC34A', // Vert clair
            '#673AB7', // Violet foncé
            '#CDDC39'  // Vert-jaune
        ];

        try {
            console.log("Recherche d'éléments de congés...");

            // Approche encore plus générique pour trouver des éléments de congés
            // On cherche toutes les sections qui pourraient contenir des congés
            const allSections = document.querySelectorAll('section, .MuiBox-root, .fabric-5qovnk-root');

            // Rechercher d'abord la section principale
            let mainSection = null;

            for (const section of allSections) {
                // Rechercher du texte qui pourrait indiquer une section de congés
                const sectionText = section.textContent || '';
                if (sectionText.includes('Congés à venir') ||
                    sectionText.includes('Upcoming Time Off') ||
                    sectionText.includes('Congé') ||
                    sectionText.includes('Leave') ||
                    sectionText.includes('Holiday')) {
                    mainSection = section;
                    console.log('Section principale de congés trouvée:', sectionText.substring(0, 30));
                    break;
                }
            }

            if (!mainSection) {
                console.log('Aucune section de congés trouvée, utilisation de la page entière');
                mainSection = document.body;
            }

            // Chercher les éléments potentiels de congés dans la section ou sur la page
            // Approche 1: Rechercher des éléments qui ressemblent à des entrées de congés
            const leaveItems = [];

            // Structure typique des lignes de congés
            const candidateRows = mainSection.querySelectorAll('.MuiBox-root.css-1lekzkb, .fabric-5qovnk-root.MuiBox-root');

            candidateRows.forEach(row => {
                // Vérifier si la ligne contient une date et une description
                const hasDate = row.querySelector('.fabric-10enqx8-root p, .MuiTypography-root, p') !== null;

                // Vérifier s'il contient du texte qui ressemble à un congé
                const rowText = row.textContent || '';
                const isLeaveRow = rowText.includes('jour') ||
                    rowText.includes('day') ||
                    rowText.includes('RTT') ||
                    rowText.includes('congé') ||
                    rowText.includes('leave') ||
                    rowText.includes('holiday') ||
                    rowText.includes('vacation') ||
                    rowText.includes('AB-');

                if (hasDate && isLeaveRow) {
                    leaveItems.push(row);
                }
            });

            console.log(`Trouvé ${leaveItems.length} éléments potentiels de congés`);

            // Parcourir les éléments
            leaveItems.forEach((item, index) => {
                try {
                    // Générer un identifiant unique basé sur le contenu de l'élément
                    const itemText = item.textContent || '';
                    const itemId = `item_${index}_${itemText.length}`;

                    if (processedItems.has(itemId)) {
                        return; // Éviter les doublons
                    }
                    processedItems.add(itemId);

                    // Rechercher l'élément de date (premier élément contenant du texte qui ressemble à une date)
                    let dateText = '';
                    let dateElement = null;

                    // Chercher tous les éléments qui pourraient contenir une date
                    const allElements = item.querySelectorAll('*');
                    for (const el of allElements) {
                        const text = el.textContent || '';
                        // Détecter si le texte ressemble à une date (contient un chiffre et un mois)
                        if (/\d+\s*[a-zéûùàâê.]/i.test(text) && text.length < 30) {
                            dateText = text.trim();
                            dateElement = el;
                            break;
                        }
                    }

                    if (!dateText) {
                        console.log(`Pas de date trouvée pour l'élément ${index}`);
                        return;
                    }

                    console.log(`Date trouvée: "${dateText}"`);

                    // Trouver le type de congé en cherchant dans les éléments qui ne sont pas la date
                    let typeText = '';

                    // Chercher des éléments avec classes spécifiques
                    const typeElements = item.querySelectorAll('.fabric-kv8rfh-root, .fabric-163vq54-root, p');

                    for (const el of typeElements) {
                        // Ignorer l'élément de date
                        if (el === dateElement || el.contains(dateElement) || dateElement?.contains(el)) {
                            continue;
                        }

                        const text = el.textContent || '';
                        if (text &&
                            (text.includes('jour') || text.includes('day') ||
                                text.includes('RTT') || text.includes('AB-') ||
                                text.includes('heures') || text.includes('hours'))) {
                            typeText = text.trim();
                            break;
                        }
                    }

                    // Si aucun type spécifique n'est trouvé, prendre tout texte non-date
                    if (!typeText) {
                        for (const el of allElements) {
                            // Ignorer l'élément de date
                            if (el === dateElement || el.contains(dateElement) || dateElement?.contains(el)) {
                                continue;
                            }

                            const text = el.textContent || '';
                            if (text && text !== dateText && text.length > 3) {
                                typeText = text.trim();
                                break;
                            }
                        }
                    }

                    if (!typeText) {
                        console.log(`Pas de type trouvé pour la date: ${dateText}`);
                        // Utiliser un type par défaut si rien n'est trouvé
                        typeText = "Congé";
                    }

                    console.log(`Type trouvé: "${typeText}"`);

                    // Vérifier si approuvé
                    const isApproved =
                        item.textContent.includes('Approved') ||
                        item.textContent.includes('Approuvé') ||
                        item.querySelector('svg[viewBox="0 0 512 512"]') !== null;

                    // Analyser la date - approche universelle
                    const dateInfo = parseDateUniversal(dateText);

                    if (!dateInfo.startDate || !dateInfo.endDate) {
                        console.log(`Impossible d'analyser les dates: ${dateText}`);
                        return;
                    }

                    // Déterminer la catégorie de congé de manière plus robuste
                    let typeCategory = 'other';

                    // Extraire les codes AB si présents
                    const abMatch = typeText.match(/AB-(\d+)/i);
                    if (abMatch) {
                        typeCategory = `AB-${abMatch[1]}`;
                    }
                    // Sinon, utiliser d'autres indices textuels
                    else if (/RTT/i.test(typeText)) {
                        typeCategory = 'RTT';
                    } else if (/holiday|férié|ferie|public|easter|monday|labour|ascension|victoire/i.test(typeText)) {
                        typeCategory = 'holiday';
                    } else if (/congé|leave|vacation|france 20\d{2}|AB-300/i.test(typeText)) {
                        typeCategory = 'leave';
                    } else if (/ancienneté|seniority|AB-631/i.test(typeText)) {
                        typeCategory = 'seniority';
                    }

                    // Attribution cohérente des couleurs
                    let eventColor;

                    if (typeColorMap.has(typeCategory)) {
                        eventColor = typeColorMap.get(typeCategory);
                    } else {
                        const colorIndex = typeColorMap.size % predefinedColors.length;
                        eventColor = predefinedColors[colorIndex];
                        typeColorMap.set(typeCategory, eventColor);
                    }

                    // Ajouter l'événement au calendrier
                    timeOffEvents.push({
                        title: typeText,
                        start: dateInfo.startDate,
                        end: dateInfo.endDate,
                        color: eventColor,
                        type: typeCategory,
                        status: isApproved ? 'Approved' : 'Pending'
                    });

                    console.log('Événement ajouté:', {
                        date: dateText,
                        type: typeText,
                        category: typeCategory,
                        color: eventColor,
                        start: dateInfo.startDate.toLocaleDateString(),
                        end: dateInfo.endDate.toLocaleDateString()
                    });

                } catch (itemError) {
                    console.error(`Erreur de traitement de l'élément ${index}:`, itemError);
                }
            });

            // Éliminer les doublons potentiels
            const dedupedEvents = [];
            const eventKeys = new Set();

            timeOffEvents.forEach(event => {
                const key = `${event.start.toDateString()}_${event.end.toDateString()}_${event.type}`;
                if (!eventKeys.has(key)) {
                    eventKeys.add(key);
                    dedupedEvents.push(event);
                }
            });

            console.log(`Événements finaux après déduplication: ${dedupedEvents.length}`);

            // Afficher le mappage des types aux couleurs
            console.log("Mappage des types de congés aux couleurs:");
            typeColorMap.forEach((color, type) => {
                console.log(`${type}: ${color}`);
            });

            return dedupedEvents;
        } catch (error) {
            console.error('Erreur globale d\'extraction:', error);
            return [];
        }
    }

    // Fonction très robuste d'analyse des dates dans différentes langues et formats
    function parseDateUniversal(dateText) {
        try {
            console.log(`Analyse de la date: "${dateText}"`);

            // Normaliser les séparateurs de plage
            const normalizedText = dateText.replace(/–/g, '-');

            // Détecter si c'est une plage de dates
            const isRange = normalizedText.includes('-');

            if (isRange) {
                // Séparer la plage
                const parts = normalizedText.split('-').map(p => p.trim());

                // Extraction des valeurs numériques (jours)
                const dayRegex = /(\d+)/g;

                // Extraction des chaînes de mois potentielles
                const monthRegex = /[a-zéèêùûôâ]{3,}/gi;

                // Pour la partie de début
                const startDayMatches = parts[0].match(dayRegex);
                const startDay = startDayMatches ? parseInt(startDayMatches[0]) : null;

                const startMonthMatches = parts[0].match(monthRegex);
                const startMonthStr = startMonthMatches ? startMonthMatches[0].trim().toLowerCase() : null;

                // Pour la partie de fin
                const endDayMatches = parts[1].match(dayRegex);
                const endDay = endDayMatches ? parseInt(endDayMatches[0]) : null;

                let endMonthStr = null;
                const endMonthMatches = parts[1].match(monthRegex);

                if (endMonthMatches) {
                    // La partie de fin contient un mois
                    endMonthStr = endMonthMatches[0].trim().toLowerCase();
                } else {
                    // Même mois que la partie de début
                    endMonthStr = startMonthStr;
                }

                // Convertir les chaînes de mois en numéros de mois
                const startMonth = getMonthNumberRobust(startMonthStr);
                const endMonth = getMonthNumberRobust(endMonthStr);

                console.log(`Plage de dates analysée: du ${startDay} ${startMonthStr} (mois ${startMonth}) au ${endDay} ${endMonthStr} (mois ${endMonth})`);

                // Année en cours
                const currentYear = new Date().getFullYear();

                if (startDay !== null && startMonth !== -1 && endDay !== null && endMonth !== -1) {
                    return {
                        startDate: new Date(currentYear, startMonth, startDay),
                        endDate: new Date(currentYear, endMonth, endDay)
                    };
                }
            } else {
                // Date unique
                const dayMatch = normalizedText.match(/(\d+)/);
                const monthMatch = normalizedText.match(/[a-zéèêùûôâ]{3,}/i);

                if (dayMatch && monthMatch) {
                    const day = parseInt(dayMatch[0]);
                    const monthStr = monthMatch[0].trim().toLowerCase();
                    const month = getMonthNumberRobust(monthStr);

                    console.log(`Date unique analysée: ${day} ${monthStr} (mois ${month})`);

                    if (month !== -1) {
                        const currentYear = new Date().getFullYear();
                        const date = new Date(currentYear, month, day);
                        return { startDate: date, endDate: date };
                    }
                }
            }

            // Échec de l'analyse, retourner des valeurs nulles
            console.log(`Échec de l'analyse pour: "${dateText}"`);
            return { startDate: null, endDate: null };

        } catch (error) {
            console.error('Erreur d\'analyse de date:', error);
            return { startDate: null, endDate: null };
        }
    }

    // Fonction très robuste de reconnaissance des mois dans différentes langues
    function getMonthNumberRobust(monthStr) {
        if (!monthStr) return -1;

        // Normaliser la chaîne
        const normalized = monthStr.toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Enlever les accents
            .replace(/[.,]/g, ''); // Enlever la ponctuation

        // Mappages de mois très complets (y compris les abréviations courantes)
        const monthMappings = {
            // Français
            'janvier': 0, 'jan': 0, 'janv': 0, 'ja': 0,
            'fevrier': 1, 'fev': 1, 'fe': 1, 'fév': 1, 'févr': 1,
            'mars': 2, 'mar': 2, 'ma': 2,
            'avril': 3, 'avr': 3, 'av': 3,
            'mai': 4,
            'juin': 5, 'jui': 5, 'jun': 5,
            'juillet': 6, 'juil': 6, 'jul': 6,
            'aout': 7, 'août': 7, 'aou': 7, 'au': 7, 'aug': 7,
            'septembre': 8, 'sept': 8, 'sep': 8, 'se': 8,
            'octobre': 9, 'oct': 9, 'oc': 9,
            'novembre': 10, 'nov': 10, 'no': 10,
            'decembre': 11, 'dec': 11, 'de': 11, 'déc': 11,

            // Anglais
            'january': 0, 'jan': 0,
            'february': 1, 'feb': 1,
            'march': 2, 'mar': 2,
            'april': 3, 'apr': 3,
            'may': 4,
            'june': 5, 'jun': 5,
            'july': 6, 'jul': 6,
            'august': 7, 'aug': 7,
            'september': 8, 'sep': 8, 'sept': 8,
            'october': 9, 'oct': 9,
            'november': 10, 'nov': 10,
            'december': 11, 'dec': 11
        };

        // Recherche directe
        if (monthMappings[normalized] !== undefined) {
            return monthMappings[normalized];
        }

        // Recherche par correspondance partielle
        for (const [key, value] of Object.entries(monthMappings)) {
            // Vérifier si la chaîne normalisée est au début de la clé ou vice versa
            if (key.startsWith(normalized) || normalized.startsWith(key)) {
                return value;
            }
        }

        // Recherche par les 3 premières lettres
        if (normalized.length >= 3) {
            const firstThree = normalized.substring(0, 3);
            for (const [key, value] of Object.entries(monthMappings)) {
                if (key.startsWith(firstThree)) {
                    return value;
                }
            }
        }

        // Cas spéciaux
        if (normalized === 'm' || normalized === 'ma') {
            // Ambigu entre mars et mai - supposer mai
            return 4;
        }

        console.log(`Mois non reconnu: "${monthStr}" (normalisé: "${normalized}")`);
        return -1;
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
    const observer = new MutationObserver(function (mutations) {
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
