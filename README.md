# BambooHR Calendar Enhancement

Ce script Tampermonkey ajoute un calendrier annuel intuitif à l'interface BambooHR, permettant de visualiser facilement tous vos congés avec un code couleur cohérent.

![Aperçu du calendrier](screenshots/calendar-preview.png)

## Fonctionnalités

- Vue annuelle et mensuelle des congés
- Code couleur pour différents types de congés (RTT, congés payés, jours fériés, etc.)
- Les congés sur weekends prennent la priorité sur le fond gris des weekends
- Mise en évidence des congés dans la liste "Upcoming Time Off"
- Positionnement du calendrier avant la liste des congés à venir

## Installation

### Prérequis
1. Installez l'extension Tampermonkey pour votre navigateur :
   - [Chrome](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
   - [Firefox](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
   - [Edge](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)

### Installation automatique
1. Click this link to automatically install the script: [Install Script](https://github.com/MbNeo/bamboohr_calendar/raw/main/bamboohr-calendar-view.user.js)

### Installation manuelle
1. Cliquez sur l'icône Tampermonkey dans votre navigateur
2. Choisissez "Créer un script"
3. Supprimez tout le contenu par défaut
4. Copiez-collez le code du fichier [bamboohr-calendar-view.user.js](bamboohr-calendar-view.user.js)
5. Enregistrez le script (Ctrl+S ou Cmd+S)
6. Rechargez votre page BambooHR

## Utilisation

1. Allez sur votre page de congés BambooHR (https://votre-entreprise.bamboohr.com/employees/pto)
2. Le calendrier apparaîtra automatiquement en haut de la page
3. Utilisez les boutons de navigation pour changer de mois/année
4. Basculez entre les vues mensuelle et annuelle selon vos besoins

## Personnalisation

Pour personnaliser les couleurs ou d'autres aspects du script :
1. Ouvrez le script dans l'éditeur Tampermonkey
2. Modifiez les valeurs CSS dans la section `customCSS.textContent`
3. Enregistrez vos modifications

## Compatibilité

Ce script a été testé avec :
- Chrome version 100+
- Firefox version 95+
- Microsoft Edge version 95+

## Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## Licence

[MIT License](LICENSE)
