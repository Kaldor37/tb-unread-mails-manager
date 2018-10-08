var unreadMailsManager = (function(){
    /**
     * Logger class
     */
    var logger = null;
    
    /**
     * User preferences access
     */
    var prefs = null;
    
    /**
     * Current count of unread messages
     */
    var unreadMessages = null;
    
    /**
     * Last update date
     */
    var lastUpdateDuration = null;

    function debug(message){
        if(logger != null)
            logger.debug(message);
    }

    function error(message){
        if(logger != null)
            logger.error(message);
    }

    /**
     * Called when a message is opened
     */
    function onMessageOpened(message) {
        debug('Message opened: ' + message.mime2DecodedSubject);
        window.setTimeout( function() { computeUnreadMessages(); }, 100);
    }

    /**
     * Tries to call the command defined in preferences (if defined)
     */
    function callExternalCommand(){
        let externalCommand = null;
        try{
            externalCommand = prefs.getCharPref('external_command');
        }
        catch(exception){
            externalCommand = null;
            _debug('Failed to read external_command from prefs');
        }
        if(externalCommand){
            debug('Calling external command: ' + externalCommand + ' ' + unreadMessages);
            callAsyncProcess(externalCommand, [unreadMessages]);
        }
    }

    /**
     * Makes an async call to a system command/script
     */
    function callAsyncProcess(command, arguments){
        try{
            let file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsIFile);
            file.initWithPath(command);
            let process = Components.classes["@mozilla.org/process/util;1"].createInstance(Components.interfaces.nsIProcess);
            process.init(file);
            process.runAsync(arguments, 1);
        }
        catch(exception){
            error('Failed to call command: ' + command);
        }
    }

    /**
     * Updates info panel
     */
    function updatePanel(){
        document.getElementById("unread-mails-manager-panel").label = 'Total unread: ' + unreadMessages + ' - Updated in: ' + lastUpdateDuration + 'ms';
    }

    /**
     * Compute amount of unread messages, display it and call external command if necessary
     */
    function computeUnreadMessages() {
        let updateStart = new Date();
        let newUnreadMessages = 0;

        let accountManager = Components.classes["@mozilla.org/messenger/account-manager;1"].getService(Components.interfaces.nsIMsgAccountManager);
        let accounts = accountManager.accounts;
        for (var i = 0; i < accounts.length; i++) {
            let account = accounts.queryElementAt(i, Components.interfaces.nsIMsgAccount);
            let rootFolder = account.incomingServer.rootFolder;
            newUnreadMessages += rootFolder.getNumUnread(true);
        }
        let updateEnd = new Date();

        if(newUnreadMessages == unreadMessages)
            return;
        
        unreadMessages = newUnreadMessages;
        lastUpdateDuration = updateEnd.getTime() - updateStart.getTime();
        updatePanel();
        callExternalCommand();
    }

    /**
     * Called when initialization completes
     */
    function onLoad(){
        try{
            Components.utils.import("resource://gre/modules/Log.jsm");
            logger = Log.repository.getLogger("UnreadMailsManager");
            logger.level = Log.Level.Debug;
            logger.addAppender(new Log.ConsoleAppender(new Log.BasicFormatter()));
        }
        catch(exception){
            logger = null;
        }

        prefs = Components.
                        classes["@mozilla.org/preferences-service;1"].
                        getService(Components.interfaces.nsIPrefService).
                        getBranch("extensions.unreadmailsmanager.");

        let newMailListener = {
            msgAdded: function(message) {
                debug('Received new message: ' + message.mime2DecodedSubject);
                if(!message.isRead){
                    ++unreadMessages;
                }
            }
        }

        // Listen to incoming messages
        let notificationsComponent = Components.classes["@mozilla.org/messenger/msgnotificationservice;1"];
        let notificationService = notificationsComponent.getService(Components.interfaces.nsIMsgFolderNotificationService);
        notificationService.addListener(newMailListener, notificationService.msgAdded);

        let messagepane = document.getElementById("messagepane");
        if(messagepane) {
            messagepane.addEventListener("load", function(e){
                if(gFolderDisplay.selectedMessage){
                    onMessageOpened(gFolderDisplay.selectedMessage);
                }
            }, true);
        }

        // Compute total count of unread messages at startup
        computeUnreadMessages();

        // Recompute every minutes
        window.setInterval( function() { computeUnreadMessages(); }, 60000);
    }

    function onQuit(){
        unreadMessages = 0;
        callExternalCommand();
    }
    
    return {
        onLoad: onLoad,
        onQuit: onQuit
    }
})();

// Load event
window.addEventListener("load", function(e) { unreadMailsManager.onLoad(); }, false);

// Unload event
window.addEventListener("unload", function(e) { unreadMailsManager.onQuit(); }, false);

