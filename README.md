# Goldman Hours Chrome Extension


I'm an avid tennis player based in San Francisco, and one of the best-maintained
court locations in the city is the Goldman Tennis Center in Golden Gate Park.

Unfortunately, its online reservation system has a frustrating design that makes
it hard for people to reserve courts for extended play:
1. players seeking to play for the max 90-minute reservation time may see a time
   slot available for that duration...
2. ...click on "Reserve", wait for the page to load...
3. ...and ONLY then find out the 90 minutes were actually split over three
   separate courts, in three separate 30-minute slots!
4. (they can't actually book those separate sessions, because each user may only
   book a single court per day)

This GitHub repo is a Chrome extension to fix this display. At step 1., we
reprocess the data to find the actual max length of time available on any single
given court in that time slot, and show it as a label "30", "60", or "90". This
ensures that the user can book the actual duration intended at step 3.

## Installation from ZIP

1. Download the extension ZIP file from [here](https://github.com/frdzy/goldman-hours/archive/refs/heads/main.zip)
2. Extract the ZIP file to a folder on your computer
3. Open Chrome and navigate to `chrome://extensions/`
4. Enable "Developer mode" by toggling the switch in the top right corner
5. Click "Load unpacked" button in the top left
6. Navigate to the extracted folder (goldman-hours-main) and select it
7. The extension should now appear in your Chrome toolbar

## Usage

Once installed, an extension icon will appear in your Chrome toolbar.

Loading the extension will automatically fix the available hours on the Goldman Tennis Center website.

## Development

To modify or contribute to this extension:

1. Clone the repository
2. Make your changes
3. Test locally by loading the unpacked extension in Chrome

## Credits

Assets provided by [Google Material Icons](https://fonts.google.com/icons).
