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

    // Éviter l'exécution multiple du script sur la même page
    let calendarInitialized = false;
    const DEBUG = true; // passer à true pour activer les logs de débogage

    // Style CSS personnalisé pour le calendrier et ses éléments
    const customCSS = document.createElement('style');
    customCSS.textContent = `
        /* ===== Conteneur principal ===== */
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

/* ===== En-tête du calendrier ===== */
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

/* ===== Légende ===== */
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

/* ===== Navigation mois/année ===== */
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

/* ===== Grille calendrier mensuel ===== */
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

/* ===== Événements (vue mensuelle) ===== */
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

/* ===== Grille annuelle ===== */
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

/* ===== Types de congés (vue annuelle) ===== */
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
.mini-cell.event-other {
  background-color: #607d8b !important;
  color: white !important;
}

    `;
    document.head.appendChild(customCSS);

    // Exécuter le script uniquement sur les pages de congés (PTO)
    if (!window.location.href.includes('/employees/pto')) {
        return;
    }

    // Surveiller les changements de la page pour insérer le calendrier au bon moment
    const observer = new MutationObserver(() => {
        if (calendarInitialized) return;

        const span = Array.from(document.querySelectorAll('span')).find(el =>
            /Congés à venir|Upcoming Time Off|Anstehende Abwesenheit/i.test(el.textContent.trim())
        );

        if (span) {
            calendarInitialized = true;
            observer.disconnect(); // On arrête d’observer, c’est bon
            try {
                console.log("loaded");
                initializeCalendar();
            } catch (err) {
                console.error("Erreur lors de l'initialisation du calendrier:", err);
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    /**
     * Initialise le calendrier en insérant le conteneur et en peuplant les données
     */
    function initializeCalendar() {
        // Déterminer la langue de la page en se basant sur le texte de l'onglet ou du contenu
        const pageText = document.body.textContent || "";
        const isFrench = pageText.includes("Congé") || pageText.includes("congé") || pageText.includes("Congés");
        const TEXT = {
            title: isFrench ? "📅 Calendrier Annuel des Congés" : "📅 Annual Leave Calendar",
            viewMonth: isFrench ? "Vue Mensuelle" : "Month View",
            viewYear: isFrench ? "Vue Annuelle" : "Year View",
            legendHolidays: isFrench ? "Jours fériés" : "Public Holidays",
            legendLeave: isFrench ? "Congés payés" : "Paid Leave",
            legendRTT: "RTT",  // "RTT" is understood in both languages in context
            legendSeniority: isFrench ? "Ancienneté" : "Seniority",
            legendWeekends: isFrench ? "Week-ends" : "Weekends",
            legendOther: isFrench ? "Autres" : "Other",
            errorNoData: isFrench ? "Aucune donnée de congé à afficher." : "No time off data available to display."
        };

        // Insérer la structure du calendrier dans la page
        const container = document.createElement('div');
        container.className = 'custom-calendar-container';
        container.id = 'calendar-container';
        container.innerHTML = `
            <div class="calendar-header">
                <h2>${TEXT.title}</h2>
                <div class="view-buttons">
                    <button id="toggle-view">${TEXT.viewMonth}</button>
                </div>
            </div>
            <!-- Légende des types de congés -->
            <div class="leave-type-legend" id="legend-container"></div>
            <!-- Zone d'affichage du calendrier (mois ou année) -->
            <div id="calendar-display"></div>
        `;
        // Insérer le calendrier juste après le conteneur PTO principal
        const main = document.querySelector('main#micro-container5');
        if (main) {
            const innerContainer = main.querySelector('div');
            if (innerContainer) {
                const innerDivs = Array.from(innerContainer.children).filter(el => el.tagName === 'DIV');
                if (innerDivs.length >= 3) {
                    // Insérer juste avant le 3ᵉ div (index 2)
                    innerContainer.insertBefore(container, innerDivs[2]);
                    console.log("✅ Calendrier inséré entre le 2ᵉ et le 3ᵉ div");
                } else {
                    // Fallback si on ne trouve pas 3 divs
                    innerContainer.appendChild(container);
                    console.warn("⚠️ Moins de 3 divs dans le conteneur interne, insertion à la fin");
                }
            } else {
                console.warn("❌ Aucun <div> interne trouvé dans #micro-container5");
            }
        } else {
            console.warn("❌ Impossible de trouver <main id='micro-container5'>");
        }



        // Charger les données de congés
        const events = extractTimeOffData();
        if (DEBUG) console.log("Données de congés extraites:", events);
        // Afficher un message d'erreur si aucune donnée n'a pu être extraite
        if (!events || events.length === 0) {
            const errorMsg = document.createElement('p');
            errorMsg.style.color = 'red';
            errorMsg.textContent = TEXT.errorNoData;
            container.querySelector('#calendar-display').appendChild(errorMsg);
            return;
        }

        // Construire la légende des types de congés de manière dynamique
        buildLegend(events);

        // Initialiser la vue (par défaut en vue annuelle)
        currentView = 'year';
        const toggleViewBtn = container.querySelector('#toggle-view');
        toggleViewBtn.addEventListener('click', () => {
            // Alterner entre vue annuelle et mensuelle
            if (currentView === 'year') {
                currentView = 'month';
                toggleViewBtn.textContent = TEXT.viewYear;
            } else {
                currentView = 'year';
                toggleViewBtn.textContent = TEXT.viewMonth;
            }
            renderCalendar();
        });

        // Rendre le calendrier initial (vue annuelle par défaut)
        renderCalendar();
    }

    // Variables globales pour la navigation du calendrier
    let currentYear = new Date().getFullYear();
    let currentMonth = new Date().getMonth();
    let currentView = 'year';  // 'year' ou 'month'

    /**
     * Extrait les données de congés visibles sur la page.
     * Retourne un tableau d'objets { title, start, end, color, type, status }.
     */
    function extractTimeOffData() {
        const events = [];

        const span = Array.from(document.querySelectorAll('span')).find(el =>
            /Congés à venir|Upcoming Time Off|Anstehende Abwesenheit/i.test(el.textContent.trim())
        );

        console.log("span", span);

        if (!span) {
            console.warn('❌ Aucun texte "Congés à venir" ou "Upcoming Time Off" trouvé.');
            return [];
        }

        const container = span.closest('section, div, article');
        if (!container) {
            console.warn('❌ Aucune section parente trouvée pour le span.');
            return [];
        }

        const paragraphs = Array.from(container.querySelectorAll('p'));
        const dateRegex = /\b(\d{1,2})\s*(janv\.?|févr\.?|mars|avr\.?|mai|juin|juil\.?|août|sept\.?|oct\.?|nov\.?|déc\.?|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)|\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s*\d{1,2}/i;


        console.log("paragraphs", paragraphs);

        
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
                    title: description || 'Congé',
                    start: dateInfo.startDate,
                    end: dateInfo.endDate,
                    type: typeCategory,
                    color,
                    status: status || 'Pending'
                });

                if (DEBUG) {
                    console.log('🗓️ Événement détecté :', {
                        dateText,
                        description,
                        status,
                        dateInfo
                    });
                }

                //i = j; // avancer jusqu’à la prochaine date
            } else {
                //i++; // pas une date → ligne isolée
            }
        }

        console.log("events", events);

        return events;
    }

    function detectTypeFromText(text) {
        const lowered = text.toLowerCase();

        if (/rtt|ab-310/.test(lowered)) return 'RTT';
        if (/anciennet|ab-631/.test(lowered)) return 'seniority';
        if (/holiday|férié|ferie|jour férié|easter|ascension|may day|labour day|victoire|ostern|auffahrt|mai feiertag/i.test(lowered)) return 'holiday';
        if (/ab-300|paid leave|congés|conge|urlaub/i.test(lowered)) return 'leave';


        return 'other';
    }

    function getColorForType(type) {
        const colors = {
            'RTT': '#4CAF50',
            'leave': '#2196F3',
            'holiday': '#9C27B0',
            'seniority': '#FF9800',
            'other': '#607D8B'
        };
        return colors[type] || '#607D8B';
    }


    /**
     * Construit la légende des types de congés et l'insère dans le DOM.
     * @param {Array} events - Liste des événements de congé extraits.
     */
    function buildLegend(events) {
        const legendContainer = document.getElementById('legend-container');
        if (!legendContainer) return;

        // Rassembler les catégories uniques présentes dans les événements
        const categories = new Set();
        events.forEach(ev => {
            categories.add(ev.type);
        });

        // Déterminer la langue pour les libellés
        const isFrench = document.body.textContent && document.body.textContent.includes('Congé');
        const labelMap = {
            'RTT': 'RTT',
            'AB-310': 'RTT',
            'leave': isFrench ? 'Congés payés' : 'Paid Leave',
            'AB-300': isFrench ? 'Congés payés' : 'Paid Leave',
            'holiday': isFrench ? 'Jours fériés' : 'Public Holidays',
            'seniority': isFrench ? 'Ancienneté' : 'Seniority',
            'AB-631': isFrench ? 'Ancienneté' : 'Seniority',
            'other': isFrench ? 'Autres' : 'Other'
        };

        // Ajouter chaque catégorie détectée dans la légende avec sa couleur
        categories.forEach(type => {
            // Trouver la couleur correspondante (depuis l'ensemble d'événements)
            const color = events.find(ev => ev.type === type)?.color || '#607D8B';
            // Libellé à afficher
            const label = labelMap[type] || labelMap['other'];
            const legendItem = document.createElement('div');
            legendItem.className = 'legend-item';
            legendItem.innerHTML = `<div class="color-box" style="background-color: ${color};"></div><span>${label}${type.match(/^AB-/) ? '' : ''}</span>`;
            legendContainer.appendChild(legendItem);
        });

        // Ajouter manuellement une entrée pour les week-ends (couleur grise) si non ajoutée
        const weekendLabel = isFrench ? 'Week-ends' : 'Weekends';
        const weekendItem = document.createElement('div');
        weekendItem.className = 'legend-item';
        weekendItem.innerHTML = `<div class="color-box" style="background-color: #f0f0f0;"></div><span>${weekendLabel}</span>`;
        legendContainer.appendChild(weekendItem);
    }

    /**
     * Affiche le calendrier selon la vue actuelle (année ou mois).
     */
    function renderCalendar() {
        const calendarContainer = document.getElementById('calendar-display');
        if (!calendarContainer) return;
        // Effacer le contenu actuel
        calendarContainer.innerHTML = '';

        if (currentView === 'month') {
            renderMonthView(calendarContainer);
        } else {
            renderYearView(calendarContainer);
        }
    }

    /**
     * Vue Calendrier Annuel (12 mois de l'année courante sur une grille).
     */
    function renderYearView(container) {
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const dayNamesShort = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];  // en-têtes des jours (Mon..Sun)
        // Si besoin, traduire les noms en français
        const isFrench = document.body.textContent && document.body.textContent.includes('Congé');
        if (isFrench) {
            // Remplacer les libellés par leur équivalent français
            dayNamesShort[0] = 'L';  // Lundi
            dayNamesShort[1] = 'M';  // Mardi
            dayNamesShort[2] = 'M';  // Mercredi
            dayNamesShort[3] = 'J';  // Jeudi
            dayNamesShort[4] = 'V';  // Vendredi
            dayNamesShort[5] = 'S';  // Samedi
            dayNamesShort[6] = 'D';  // Dimanche
            monthNames[0] = 'Janvier'; monthNames[1] = 'Février';
            monthNames[2] = 'Mars'; monthNames[3] = 'Avril';
            monthNames[4] = 'Mai'; monthNames[5] = 'Juin';
            monthNames[6] = 'Juillet'; monthNames[7] = 'Août';
            monthNames[8] = 'Septembre'; monthNames[9] = 'Octobre';
            monthNames[10] = 'Novembre'; monthNames[11] = 'Décembre';
        }

        const today = new Date();
        const isCurrentYear = today.getFullYear() === currentYear;
        let yearHTML = `<div class="year-control">
                            <button id="prev-year">◀</button>
                            <h2>${currentYear}</h2>
                            <button id="next-year">▶</button>
                        </div>
                        <div class="year-view">`;
        // Générer un mini-calendrier pour chaque mois
        for (let month = 0; month < 12; month++) {
            yearHTML += `<div class="mini-month">
                            <h4>${monthNames[month]}</h4>
                            <div class="mini-calendar">`;
            // En-têtes des jours de la semaine
            dayNamesShort.forEach((dayName, index) => {
                const isWeekendHeader = index >= 5;
                yearHTML += `<div class="mini-cell header ${isWeekendHeader ? 'weekend' : ''}">${dayName}</div>`;
            });
            // Calculer les jours du mois
            const firstDay = new Date(currentYear, month, 1);
            const lastDay = new Date(currentYear, month + 1, 0);
            // Faire commencer la semaine le lundi (au lieu de dimanche)
            let startWeekDay = firstDay.getDay() - 1;
            if (startWeekDay === -1) startWeekDay = 6;
            // Jours du mois précédent à afficher en début (cases vides)
            for (let i = 0; i < startWeekDay; i++) {
                const isWeekend = i >= 5;
                yearHTML += `<div class="mini-cell ${isWeekend ? 'weekend' : ''}"></div>`;
            }
            // Jours du mois courant
            for (let day = 1; day <= lastDay.getDate(); day++) {
                const date = new Date(currentYear, month, day);
                const events = getEventsForDate(date);
                const dayOfWeek = date.getDay();
                const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
                const isToday = isCurrentYear && today.getMonth() === month && today.getDate() === day;
                let cellClass = 'mini-cell';
                if (isToday) cellClass += ' today';
                // S'il y a un événement ce jour-là, déterminer la classe correspondante pour la couleur
                let titleAttr = '';
                if (events.length > 0) {
                    // On prend le premier événement pour déterminer le type principal du jour
                    const firstEvent = events[0];
                    let typeClass = firstEvent.type.toLowerCase(); // "holiday", "rtt", etc.
                    cellClass += ` event-${typeClass}`;
                    // Infobulle contenant tous les titres d'événements du jour
                    titleAttr = events.map(e => e.title).join(" & ");
                } else if (isWeekend) {
                    cellClass += ' weekend';
                }
                yearHTML += `<div class="${cellClass}" title="${titleAttr}">${day}</div>`;
            }
            // Compléter les cases manquantes en fin de mois pour avoir une grille complète de 6 semaines (42 jours)
            const daysShown = startWeekDay + lastDay.getDate();
            const totalCells = (daysShown <= 35) ? 35 : 42;
            const remainingCells = totalCells - daysShown;

            for (let i = 0; i < remainingCells; i++) {
                const pos = (daysShown + i) % 7;
                const isWeekend = pos === 5 || pos === 6;
                yearHTML += `<div class="mini-cell ${isWeekend ? 'weekend' : ''}"></div>`;
            }
            yearHTML += `</div></div>`; // fin .mini-calendar et .mini-month
        }
        yearHTML += `</div>`; // fin .year-view

        container.innerHTML = yearHTML;
        // Ajout des gestionnaires d'événements pour naviguer entre les années
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
     * Vue Calendrier Mensuelle (mois courant par défaut avec navigation).
     */
    function renderMonthView(container) {
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const isFrench = document.body.textContent && document.body.textContent.includes('Congé');
        if (isFrench) {
            // Traduire les en-têtes si page en français
            monthNames[0] = 'Janvier'; monthNames[1] = 'Février';
            monthNames[2] = 'Mars'; monthNames[3] = 'Avril';
            monthNames[4] = 'Mai'; monthNames[5] = 'Juin';
            monthNames[6] = 'Juillet'; monthNames[7] = 'Août';
            monthNames[8] = 'Septembre'; monthNames[9] = 'Octobre';
            monthNames[10] = 'Novembre'; monthNames[11] = 'Décembre';
            dayNames[0] = 'Lun'; dayNames[1] = 'Mar'; dayNames[2] = 'Mer';
            dayNames[3] = 'Jeu'; dayNames[4] = 'Ven'; dayNames[5] = 'Sam'; dayNames[6] = 'Dim';
        }
        const today = new Date();
        const isCurrentMonth = (today.getFullYear() === currentYear && today.getMonth() === currentMonth);

        let calendarHTML = `<div class="month-nav">
                                <button id="prev-month">◀</button>
                                <h3>${monthNames[currentMonth]} ${currentYear}</h3>
                                <button id="next-month">▶</button>
                            </div>
                            <div class="calendar-grid">`;
        // En-têtes des jours (ligne des jours de la semaine)
        for (let i = 0; i < dayNames.length; i++) {
            const isWeekend = i >= 5;
            calendarHTML += `<div class="calendar-cell header ${isWeekend ? 'weekend' : ''}">${dayNames[i]}</div>`;
        }
        // Calcul du premier jour du mois et du nombre de jours
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        // Commencer le lundi
        let startWeekDay = firstDay.getDay() - 1;
        if (startWeekDay === -1) startWeekDay = 6;
        // Jours du mois précédent visibles
        const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
        for (let i = 0; i < startWeekDay; i++) {
            const dayNum = prevMonthLastDay - startWeekDay + i + 1;
            const isWeekend = i >= 5;
            calendarHTML += `<div class="calendar-cell outside-month ${isWeekend ? 'weekend' : ''}">
                                 <div class="day-number">${dayNum}</div>
                             </div>`;
        }
        // Jours du mois courant
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const date = new Date(currentYear, currentMonth, day);
            const events = getEventsForDate(date);
            const dayOfWeek = date.getDay();
            const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
            const isToday = isCurrentMonth && today.getDate() === day;
            // Classes de base pour la cellule
            let cellClasses = 'calendar-cell';
            if (isToday) cellClasses += ' today';
            if (isWeekend && events.length === 0) cellClasses += ' weekend';

            calendarHTML += `<div class="${cellClasses}"><div class="day-number">${day}</div>`;
            // Ajouter les éventuels événements du jour
            if (events.length > 0) {
                events.forEach(event => {
                    // Utiliser la couleur stockée pour l'événement
                    let eventColor = event.color;
                    // Ajuster la couleur si nécessaire pour correspondre aux couleurs fixes souhaitées
                    if (event.type === 'holiday') {
                        eventColor = '#9C27B0';  // violet pour jours fériés
                    }
                    const eventTitle = event.title;
                    const statusText = (event.status === 'Approved') ? (isFrench ? 'Approuvé' : 'Approved') : (isFrench ? 'En attente' : 'Pending');
                    // Ajouter un bloc événement coloré
                    calendarHTML += `<div class="calendar-event" style="background-color: ${eventColor};" title="${eventTitle} - ${statusText}">${eventTitle}</div>`;
                });
            }
            calendarHTML += `</div>`; // fin .calendar-cell
        }
        // Jours du mois suivant visibles pour compléter la grille (6 lignes)
        const totalCellsUsed = startWeekDay + lastDay.getDate();
        const cellsRemaining = 42 - totalCellsUsed;
        for (let i = 1; i <= cellsRemaining; i++) {
            const isWeekend = ((startWeekDay + lastDay.getDate() + i - 1) % 7 >= 5);
            calendarHTML += `<div class="calendar-cell outside-month ${isWeekend ? 'weekend' : ''}">
                                 <div class="day-number">${i}</div>
                             </div>`;
        }
        calendarHTML += `</div>`; // fin .calendar-grid

        container.innerHTML = calendarHTML;
        // Gestion des boutons de navigation mois précédent / suivant
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
     * Récupère tous les événements (congés) correspondant à une date précise.
     * @param {Date} date - La date à vérifier.
     * @returns {Array} Tableau des événements correspondant à la date.
     */
    function getEventsForDate(date) {
        // On utilise l'année extraite dans extractTimeOffData (via closure)
        // Filtrer les événements extraits dont la date couvre le jour donné
        return (typeof extractTimeOffData.cached !== 'undefined' ? extractTimeOffData.cached : (extractTimeOffData.cached = extractTimeOffData()))
            .filter(event => date >= event.start && date <= event.end);
    }

    /**
     * Analyse de texte de date (plage ou date unique) en prenant en charge français/anglais et différents formats.
     * Retourne un objet { startDate: Date, endDate: Date }.
     */
    function parseDateUniversal(dateText) {
        try {
            if (DEBUG) console.log(`Analyse de la date: "${dateText}"`);
            // Normaliser les tirets longs en tirets courts
            const normalizedText = dateText.replace(/–/g, '-');
            const isRange = normalizedText.includes('-');
            const today = new Date();
            const currentYear = today.getFullYear();

            if (isRange) {
                // Plage de dates, ex: "12 Jul - 15 Jul" ou "7 juil. - 25 juil."
                const parts = normalizedText.split('-').map(p => p.trim());
                // Extraire jours et mois de début et de fin
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
                    // Conserver l'année actuelle pour créer les dates
                    const startDate = new Date(currentYear, startMonthNum, startDay);
                    const endDate = new Date(currentYear, endMonthNum, endDay);
                    if (DEBUG) console.log(`Plage interprétée: ${startDate.toDateString()} - ${endDate.toDateString()}`);
                    return { startDate, endDate };
                }
                // Si échec d'interprétation, tenter une approche alternative (cas où le mois n'est mentionné qu'une fois)
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
                            if (DEBUG) console.log(`Plage alternative: ${startDate.toDateString()} - ${endDate.toDateString()}`);
                            return { startDate, endDate };
                        }
                    }
                }
            } else {
                // Date simple, ex: "14 juillet" ou "Jul 14"
                const dayMatch = normalizedText.match(/(\d+)/);
                const monthMatch = normalizedText.match(/[A-Za-zéèêùûôâ]{3,}/);
                if (dayMatch && monthMatch) {
                    const day = parseInt(dayMatch[0]);
                    const monthStr = monthMatch[0];
                    const monthNum = getMonthNumberRobust(monthStr);
                    if (monthNum !== -1) {
                        const date = new Date(currentYear, monthNum, day);
                        if (DEBUG) console.log(`Date interprétée: ${date.toDateString()}`);
                        return { startDate: date, endDate: date };
                    }
                }
            }
            // Échec de l'analyse : retourner la date du jour par défaut
            if (DEBUG) console.log(`Échec de l'analyse de "${dateText}", retour de la date du jour par défaut.`);
            return { startDate: new Date(), endDate: new Date() };
        } catch (error) {
            console.error("Erreur lors de l'analyse de la date:", error);
            // En cas d'erreur, retourner la date du jour
            return { startDate: new Date(), endDate: new Date() };
        }
    }

    /**
     * Convertit un nom de mois (français ou anglais, complet ou abréviation) en numéro de mois (0-11).
     * @param {string} monthStr - Le nom ou l'abréviation du mois.
     * @returns {number} Numéro de mois correspondant, ou -1 si inconnu.
     */
    function getMonthNumberRobust(monthStr) {
        if (!monthStr) return -1;
        const normalized = monthStr.toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")  // enlever accents
            .replace(/[.]/g, "");  // enlever la ponctuation (points abréviations)
        const monthMap = {
            // Français
            'janvier': 0, 'janv': 0, 'jan': 0,
            'fevrier': 1, 'fevr': 1, 'fev': 1, 'fev': 1,
            'mars': 2, 'mar': 2,
            'avril': 3, 'avr': 3,
            'mai': 4,
            'juin': 5,
            'juillet': 6, 'juil': 6, 'jui': 6,
            'aout': 7, 'août': 7, 'aou': 7, 'ao': 7,
            'septembre': 8, 'sept': 8, 'sep': 8,
            'octobre': 9, 'oct': 9,
            'novembre': 10, 'nov': 10,
            'decembre': 11, 'dec': 11, 'déc': 11,
            // Anglais
            'january': 0, 'jan': 0,
            'february': 1, 'feb': 1,
            'march': 2, 'mar': 2,
            'april': 3, 'apr': 3,
            'may': 4,
            'june': 5, 'jun': 5,
            'july': 6, 'jul': 6,
            'august': 7, 'aug': 7,
            'september': 8, 'sept': 8, 'sep': 8,
            'october': 9, 'oct': 9,
            'november': 10, 'nov': 10,
            'december': 11, 'dec': 11,
            // Allemand
            'januar': 0, 'jan': 0,
            'februar': 1, 'feb': 1,
            'märz': 2, 'maerz': 2, 'mar': 2,
            'april': 3, 'apr': 3,
            'mai': 4,
            'juni': 5, 'jun': 5,
            'juli': 6, 'jul': 6,
            'august': 7, 'aug': 7,
            'september': 8, 'sep': 8,
            'oktober': 9, 'okt': 9, 'oct': 9,
            'november': 10, 'nov': 10,
            'dezember': 11, 'dez': 11, 'dec': 11

        };
        if (monthMap[normalized] !== undefined) {
            return monthMap[normalized];
        }
        // Essai de correspondance partielle si non trouvé (ex: "févr" pour "février")
        for (const [name, num] of Object.entries(monthMap)) {
            if (name.startsWith(normalized) || normalized.startsWith(name)) {
                return num;
            }
        }
        return -1;
    }
})();
