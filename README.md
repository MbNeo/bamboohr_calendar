# BambooHR Calendar Enhancement

This Tampermonkey script adds an intuitive annual calendar to the BambooHR interface, allowing you to easily visualize all your time off with a consistent color code.

![Calendar Preview](screenshots/Screenshot001.png)

## Features
- Annual and monthly views of time off
- Color coding for different types of time off (RTT, paid leave, holidays, etc.)
- Time off on weekends takes priority over the gray background of weekends
- Highlighting of time off in the "Upcoming Time Off" list
- Calendar positioning above the upcoming time off list

## Installation

### Prerequisites
1. Install the Tampermonkey extension for your browser:
   - [Chrome](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
   - [Firefox](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
   - [Edge](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)

### Automatic Installation
1. Click this link to automatically install the script: [Install Script](https://github.com/MbNeo/bamboohr_calendar/raw/main/bamboohr-calendar-view.user.js)

### Manual Installation
1. Click on the Tampermonkey icon in your browser
2. Choose "Create a script"
3. Delete all default content
4. Copy and paste the code from the [bamboohr-calendar-view.user.js](bamboohr-calendar-view.user.js) file
5. Save the script (Ctrl+S or Cmd+S)
6. Reload your BambooHR page

## Usage
1. Go to your BambooHR time off page (https://your-company.bamboohr.com/employees/pto)
2. The calendar will automatically appear at the top of the page
3. Use the navigation buttons to change month/year
4. Switch between monthly and annual views as needed

## Customization
To customize colors or other aspects of the script:
1. Open the script in the Tampermonkey editor
2. Modify the CSS values in the `customCSS.textContent` section
3. Save your changes

## Compatibility
This script has been tested with:
- Chrome version 100+
- Firefox version 95+
- Microsoft Edge version 95+

## Contribution
Contributions are welcome! Feel free to open an issue or a pull request.

## Contributors

- **Mathias Bauer**
- **Thibault Guillaume** (historical leaves)

## License
[MIT License](LICENSE)