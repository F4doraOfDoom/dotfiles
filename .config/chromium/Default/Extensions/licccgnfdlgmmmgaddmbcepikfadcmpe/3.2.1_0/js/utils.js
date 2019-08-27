var Utils = 
{
    GetBoolStoredValue:function(name,bDefault)
    {
        if (typeof(localStorage[name]) == 'string')
        {
            if (localStorage[name] == 'true')
                return true;

            if (localStorage[name] == 'false')
                return false;        
        }
        
        if (typeof(bDefault) == 'undefined')
            return false;
            
        localStorage[name] = bDefault ? 'true' : 'false';
        return bDefault;        
    },
    StoreBoolValue:function(name,bValue)
    {            
        localStorage[name] = bValue ? 'true' : 'false';
    },
    AttachCheckBoxToStoredValue :function(oCheckBox,name,bDefault)
    {   
        oCheckBox = $(oCheckBox);
        if (!oCheckBox)
            return;
        
        var bStoredValue = Utils.GetBoolStoredValue(name,bDefault);
        if (bStoredValue)
            oCheckBox.addClass('checked');
        else
            oCheckBox.removeClass('checked');
         
        oCheckBox.addEvent('click', 
            function() 
            {
                oCheckBox.toggleClass('checked');
                Utils.StoreBoolValue(name, oCheckBox.hasClass("checked"));
            });                   
    },
    LogObject:function(object,parent)
    {
        var type = typeof(object);
        if (type == 'undefined')
            return;
        
        if (type == 'object')
        {                    
            for (prop in object)
            {
                if (!object.hasOwnProperty(prop))
                    continue;
                if (typeof(object[prop]) == 'object')
                    this.LogObject(object[prop],prop);
                else                                                
                    console.log("LogObject - " + (typeof(parent) == 'string' ? "[" + parent + "]" : "") + "[" + prop + "][" + object[prop] + "]");
            }
        }
        else
            console.log("LogObject - " + (typeof(parent) == 'string' ? "[" + parent + "]" : "") + "[" + object + "]");
    },
    SafeExecuteScript:function(tabId,sCode,funcResult)
    {
        try
        {
            chrome.tabs.get(tabId,  function(tab) 
                                    {
                                        if (typeof tab == 'undefined') 
                                        {
                                            console.log('Tab [' + tabId + '] does not exist!');
                                            Utils.LogObject(chrome.runtime.lastError,"lastError");
                                            return;
                                        }
                                        try
                                        {
                                            chrome.tabs.executeScript(tabId, 
                                            {
                                                code: sCode
                                            }, funcResult);                                        
                                        }
                                        catch(e)
                                        {
                                            console.log('chrome.tabs.executeScript [' + tabId + '] - exception:[' + e.message + "]");
                                        }
                                    }
                            );
        
        }
        catch(e)
        {
            console.log('chrome.tabs.get [' + tabId + '] - exception:[' + e.message + "]");
        }
    }
};
