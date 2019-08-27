var BackgroundManager = 
{
    OnDomReady:function()
    {
        chrome.runtime.onInstalled.addListener(function(details){
            BackgroundManager.OnInstall(details);
        });
        
        chrome.runtime.setUninstallURL("http://www.tv-chrome.com/uninstall")
        
        chrome.runtime.onConnect.addListener(function(port){
            BackgroundManager.ConnectToPort(port);
        });
    },
    IsSenderMyPopup:function(sender)
    {
        try
        {
            if (typeof(sender) == 'undefined')
                return false;
                
            if (!sender.id || (sender.id != chrome.runtime.id))
                return false;

            if (!sender.url || (sender.url.indexOf('popup.html') == -1))
                return false;     
            
            return true;                   
        }
        catch(e)
        {
        }                
        return false;    
    },
    ConnectToPort:function(port)
    {
        if (!port)
            return;
            
        if (!this.IsSenderMyPopup(port.sender))
            return;
                            
        port.onMessage.addListener(function(msg){
            BackgroundManager.OnMessageFromPopUp(msg);
        });
        
        port.onDisconnect.addListener(function(msg){
            BackgroundManager.OnDisconnectFromPopUp(msg);
        });                     
    },
    OnMessageFromPopUp:function(msg)
    {
        if (!msg)
            return;
        
        if (msg.messageID == 'StationPlay')
            this.OnStationPlay();                
    },
    OnDisconnectFromPopUp:function(port)
    {
        if (!port)
            return;

        if (!this.IsSenderMyPopup(port.sender))
            return;    
        
        this.OnPopUpClosed();    
    },
    OnInstall:function(details)
    {
         if (details.reason == "install")
         {
             var url = "http://www.tv-chrome.com/thank-you";
             chrome.tabs.create({
                index: 100000000, //last
                url: url
            });             
            return;
         }
         if (details.reason == "update")
         {
              var url = "http://www.tv-chrome.com/update";
              chrome.tabs.create({
                 index: 100000000, //last
                 url: url
             });             
             return;
          }        
    },
    OnStationPlay:function()
    {
    },
   
    OnPopUpClosed:function()
    {
        
    },
}        

window.addEvent('domready',function()
{
    BackgroundManager.OnDomReady();
});

