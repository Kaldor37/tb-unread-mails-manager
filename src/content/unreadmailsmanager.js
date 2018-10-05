var unreadMailsManager = {

    logger: null,
    prefs: null,
    unreadMessages: 0,
    lastUpdateDuration: 0,

    debug: function(message){
        if(this.logger != null)
            this.logger.debug(message);
    },

    error: function(message){
        if(this.logger != null)
            this.logger.error(message);
    },

    /**
     * Called when a message is opened
     */
    onMessageOpened: function(message) {
        this.debug('Message opened: ' + message.mime2DecodedSubject);
        this.computeUnreadMessages();
    },

    /**
     * Makes a system call
     */
    callExternalCommand: function(command, arguments){
        try{
            let file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsIFile);
            file.initWithPath(command);
            let process = Components.classes["@mozilla.org/process/util;1"].createInstance(Components.interfaces.nsIProcess);
            process.init(file);
            process.runAsync(arguments, 1);
        }
        catch(exception){
            this.error('Failed to call command: ' + command);
        }
    },

    /**
     * Updates info panel
     */
    updatePanel: function(){
        document.getElementById("unread-mails-manager-panel").label = 'Total unread: ' + this.unreadMessages + ' - Updated in: ' + this.lastUpdateDuration + 'ms';
    },

    /**
     * Compute amount of unread messages, display it and call external command if necessary
     */
    computeUnreadMessages: function() {
        let updateStart = new Date();

        this.unreadMessages = 0;

        let accountManager = Components.classes["@mozilla.org/messenger/account-manager;1"].getService(Components.interfaces.nsIMsgAccountManager);
        let accounts = accountManager.accounts;
        for (var i = 0; i < accounts.length; i++) {
            let account = accounts.queryElementAt(i, Components.interfaces.nsIMsgAccount);
            let rootFolder = account.incomingServer.rootFolder;
            this.unreadMessages += rootFolder.getNumUnread(true);
        }

        let updateEnd = new Date();
        this.lastUpdateDuration = updateEnd.getTime() - updateStart.getTime();
        this.debug('Updated unread messages !');

        this.updatePanel();

        let externalCommand = null;
        try{
            externalCommand = prefs.getCharPref('external_command');
        }
        catch(exception){
            externalCommand = null;
        }
        if(externalCommand){
            this.debug('Calling external command: ' + externalCommand);
            this.callExternalCommand(externalCommand, [unreadMessages]);
        }
    },

    /**
     * Called when initialization completes
     */
    onLoad: function(){
        try{
            Components.utils.import("resource://gre/modules/Log.jsm");
            this.logger = Log.repository.getLogger("UnreadMailsManager");
            this.logger.level = Log.Level.Debug;
            this.logger.addAppender(new Log.ConsoleAppender(new Log.BasicFormatter()));
        }
        catch(exception){
            this.logger = null;
        }

        this.prefs = Components.
                        classes["@mozilla.org/preferences-service;1"].
                        getService(Components.interfaces.nsIPrefService).
                        getBranch("extensions.unreadmailsmanager.");

        let newMailListener = {
            msgAdded: function(message) {
                unreadMailsManager.debug('Received new message: ' + message.mime2DecodedSubject);
                if(!message.isRead){
                    ++unreadMailsManager.unreadMessages;
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
                    unreadMailsManager.onMessageOpened(gFolderDisplay.selectedMessage);
                }
            }, true);
        }

        // Compute total count of unread messages at startup
        this.computeUnreadMessages();

        // Recompute every minutes
        window.setInterval( function() { unreadMailsManager.computeUnreadMessages(); }, 60000);
    },

    onQuit: function(){ }
}

// Load event
window.addEventListener("load", function(e) { unreadMailsManager.onLoad(); }, false);

// Unload event
window.addEventListener("unload", function(e) { unreadMailsManager.onQuit(); }, false);

