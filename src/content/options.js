var unreadMailsManagerOptions = (function(){

    /**
     * User preferences access
     */
    var prefs = null;
    var prefsService = null;

    /**
     * Constructor
     */
    function onLoad(){
        prefsService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
        prefs = prefsService.getBranch("extensions.unreadmailsmanager.");

        // Load values from prefs
        try {
            document.getElementById('external_command_textbox').value = prefs.getCharPref('external_command');
        }
        catch(ex){ /* Nothing to do, defaults to empty text box */ }
    }

    /**
     * Called when user decides to save prefs
     */
    function savePrefs(){
        prefs.setCharPref('external_command', document.getElementById('external_command_textbox').value);
        prefsService.savePrefFile(null);
    }

    /**
     * Called when user decides to reset prefs
     */
    function resetPrefs(){
        document.getElementById('external_command_textbox').value = '';
        prefs.setCharPref('external_command', '');
        prefsService.savePrefFile(null);
    }

    return {
        onLoad: onLoad,
        savePrefs: savePrefs,
        resetPrefs: resetPrefs
    }
})();


// Load event
window.addEventListener("load", function(e) { unreadMailsManagerOptions.onLoad(); }, false);

