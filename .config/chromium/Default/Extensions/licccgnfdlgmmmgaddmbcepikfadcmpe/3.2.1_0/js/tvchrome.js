
var TVChrome = 
{
    m_mapStationsByID : {},
    m_currentPlayingStation : null,
    m_FullScreenTooltipShown:false,
    m_BackgroundPagePort:null,
    Initialize: function()
    {   
        window.addEvent('resize',function(){
            TVChrome.OnResize();   
        });
        
        $('MainClose').addEvent('click',function(){
            window.close();
        });
        this.InitializeScreenSize();
                                 
        (   function()
            {             
                this.InitializeGUI();        
            }
        ).delay(50,this);
        
        this.m_BackgroundPagePort = chrome.runtime.connect();
    },  
    
    InitializeGUI: function()
    {
        this.InitializeAllCategories();
        this.InitializePlayerControls();
         
        Bookmarks.Initialize();
        SearchUtils.Initialize();
        
       
         (  function()
            {             
                $('mainContent').removeClass('hidden');
                $('LoadingImg').innerHTML = '';
            }
        ).delay(500,this);
        
    },
    InitializePlayerControls:function()
    {
        $('Player-Cancel').addEvent('click', function(event) {
            TVChrome.OnCancelPlayStation();
        });

        $('Play-New-Window').addEvent('click', function(event) {
            TVChrome.OnPlayStationInNewWindow();
        });

        $('Play-New-Tab').addEvent('click', function(event) {
            TVChrome.OnPlayStationInNewTab();
        });
        
    },
    InitializeScreenSize:function()
    {
        var width;
        if (typeof(localStorage['screenWidth']) == 'undefined')
            width = 560;
        else
            width = parseInt(localStorage['screenWidth']);
        
        if (isNaN(width) || (width < 100))            
            width = 560;
        
        this.resizeScreen(width);
    },
    resizeScreen:function(newWidth)
    {
        if (SearchUtils.m_bIsOnSearchMode)
            return;

        $('MainDiv').setStyle('width',newWidth + "px");
        localStorage['screenWidth'] = newWidth;
        this.OnResize();
    },
    InitializeAllCategories:function()
    {
        this.initMainCategory($('LiveTvByCategory'),LiveTvByCategory);
        this.initMainCategory($('LiveTvByCountry'),LiveTvByCountry);
    },
    initMainCategory:function(CategoryDiv,CategoryObject)
    {
        if (!CategoryDiv)
            return;
        
        if (typeof(CategoryObject) == 'undefined')
            return;  
            
        CategoryDiv.innerHTML = '';              
        for (var i=0; i<CategoryObject.List.length; i++)
        {
            var CategoryElement = this.createCategoryElement(CategoryObject.List[i],true);
            CategoryDiv.appendChild(CategoryElement);

            for (var j=0; j<CategoryObject.List[i].List.length; j++)
            {
                this.m_mapStationsByID[CategoryObject.List[i].List[j].ID] = CategoryObject.List[i].List[j];
                CategoryObject.List[i].List[j].CaptionLower = CategoryObject.List[i].List[j].Caption.toLowerCase();                
            } 
        }
    },
    createCategoryElement:function(CategoryItem,bNoWrap)
    {
        var CategoryElement = document.createElement("DIV");
            CategoryElement.className = "tv-category";            
            
            CategoryElement.innerHTML = 
                    '<div class="category-image-div"><img class="category-image" src="../img/tv/' + CategoryItem.Icon + '" /></div>'
                +   '<div class="category-title-div' + (bNoWrap ? ' category-title-div-nowrap' : '') + '"><span class="category-title">' + CategoryItem.Caption + '</span></div>';
        
        CategoryElement = $(CategoryElement);
        CategoryElement.addEvent('mouseenter', function(event) {
            CategoryElement.tween('color','#FF0000');
        });
        
        CategoryElement.addEvent('mouseleave', function(event) {
            CategoryElement.tween('color', '#47494B');
        });
        
        CategoryElement.addEvent('click', function(event) {
            TVChrome.ToggleCategory(CategoryElement,CategoryItem);
        });
        
        CategoryItem.CaptionLower = CategoryItem.Caption.toLowerCase();
        return CategoryElement;                     
    },       
    GetOrCreateCategoryLinksContentElement:function(CategoryElement,CategoryItem)
    {
        CategoryElement = $(CategoryElement);
        if (!CategoryElement)
            return null;
            
        var next = CategoryElement.getNext();
        if (next && (next.getAttribute('CategoryLinksContentElement') == '1'))
            return next;
        
        var CategoryLinksContentElement = document.createElement("DIV");
        CategoryLinksContentElement.className = "category-content-div-narrow hidden";
        CategoryLinksContentElement.setAttribute('CategoryLinksContentElement','1');
        for (var j=0; j<CategoryItem.List.length; j++)
        {            
            var LinkElement = this.createLinkElement(CategoryItem.List[j],true);
            if (LinkElement && (LinkElement != null))
                CategoryLinksContentElement.appendChild(LinkElement);
        }
        
        CategoryElement.getParent().insertBefore(CategoryLinksContentElement,next);
        return CategoryLinksContentElement; 
    },


    createLinkElement:function(LinkItem,bNoWrap)
    {
        if (!LinkItem)
            return null;
        var LinkElement = document.createElement("DIV");
            LinkElement.className           = "tv-link";
            
        var BookmarkButton = Bookmarks.addBookmarkButtonToLinkElement(LinkElement,LinkItem.ID,true);  
            
        var InnerLinkElement = document.createElement("DIV");
                                  
            InnerLinkElement.innerHTML += 
                    '<div class="category-image-div"><img class="category-image" src="../img/tv/' + LinkItem.Icon + '" /></div>'
                +   '<div class="category-title-div' + (bNoWrap ? ' category-title-div-nowrap' : '') + '"><span class="category-title" title="' + LinkItem.Caption + '">' + LinkItem.Caption + '</span></div>';

        InnerLinkElement = $(InnerLinkElement);
        LinkElement = $(LinkElement);
        LinkElement.appendChild(InnerLinkElement);
         InnerLinkElement.addEvent('click', function(event) {
             TVChrome.PlayStationByID(LinkItem.ID);
             return false;
         });
                
        LinkElement.addEvent('mouseenter', function(event) {
            Bookmarks.refreshBookmarkButtonImage(BookmarkButton,LinkItem.ID,true);                
            LinkElement.setStyle('color','blue');
        });
            
        LinkElement.addEvent('mouseleave', function(event) {
          Bookmarks.refreshBookmarkButtonImage(BookmarkButton,LinkItem.ID,false);
            LinkElement.setStyle('color','#47494B');
        });
                        
        return LinkElement;                     
    },
    
    
    ToggleCategory: function(CategoryElement,CategoryItem)
    {            
        if(this.animating)
            return; 
       
        this.animating = true; 
        
        CategoryElement = $(CategoryElement);
        
        CategoryLinksContentElement = this.GetOrCreateCategoryLinksContentElement(CategoryElement,CategoryItem);
        if (!CategoryLinksContentElement)
            return;
        
        var fxr = new Fx.Reveal(CategoryLinksContentElement,{
           onComplete: function(){
                this.animating = false;
           }.bind(this)
           
        });
            
        fxr.toggle();
    },
    
    PlayStation: function(station)
    {
        var MainPlayerDiv   = $('Main-Player-Div');
        var PlayerDiv       = $('Player-Div');
        var mainContent     = $('mainContent');
        
        
        var PlayerHeader       = $('PlayerHeader');
        
        Bookmarks.addBookmarkButtonToLinkElement(PlayerHeader,station.ID,false);
        var InnerElement = document.createElement("DIV");
            InnerElement.className = 'inline';
            InnerElement.innerHTML += '<img class="Station-Icon" src="' + "../img/tv/" + station.Icon + '" alt="" title="" />';
            InnerElement.innerHTML += '<span class="Station-Title">' + station.Caption + '</span>';
            PlayerHeader.appendChild(InnerElement);                        
                        
        
        this.m_currentPlayingStation = station;
        

        PlayerDiv.innerHTML = "<iframe width='100%' height='100%' frameborder='0' src='" + station.Url + "' allowfullscreen='0' />";
        MainPlayerDiv.style.display="block";
        mainContent.style.display="none";
        
        this.InitializeFullScreenTooltip(PlayerDiv);
                     
        if (this.m_BackgroundPagePort && (this.m_BackgroundPagePort != null))
        {
            this.m_BackgroundPagePort.postMessage({messageID: "StationPlay"});
        }        
    },
    PlayStationByID:function(stationID)
    {        
        if (!this.m_mapStationsByID[stationID])
            return;
        this.PlayStation(this.m_mapStationsByID[stationID]);    
                        
    },
    IsStationCurrentlyPlaying:function()
    {
        if (!this.m_currentPlayingStation || (this.m_currentPlayingStation == null))
            return false;
        return true;    
    },
    OnCancelPlayStation:function()
    {
        var MainPlayerDiv   = $('Main-Player-Div');
        var PlayerDiv       = $('Player-Div');
        var mainContent     = $('mainContent');
        var PlayerHeader       = $('PlayerHeader');
        
        this.m_currentPlayingStation = null;
        PlayerDiv.innerHTML = "";
        PlayerHeader.innerHTML = "";
        MainPlayerDiv.style.display="none";
        mainContent.style.display="block";
        this.OnCloseFullScreenTooltip();
        
        Bookmarks.CreateOrRefreshBookmarkDiv();
    },
    OnPlayStationInNewWindow:function()
    {
        if (!this.m_currentPlayingStation)
            return;
        
        var width = 600;
        var height = 600;
        var top = 150;
        var left = (screen.width - width)/2;
        
        window.open(this.m_currentPlayingStation.Url,'tvchrome','menubar=0,location=0,resizable=0,scrollbars=0,status=0,top=' + top + ',left=' + left + ',width=' + width + ',height=' + height);  
        window.close();      
        
    },    
    OnPlayStationInNewTab:function()
    {   
        if (!this.m_currentPlayingStation)
            return;
        chrome.tabs.create({
                index: 100000000, //last
                url: this.m_currentPlayingStation.Url
            });         
        window.close();  
    },
    OnResize: function()
    {        
        if (SearchUtils.m_bIsOnSearchMode)
            return;
        var bodyWidth = $(document.body).getSize().x;
        var mainContent = $('MainHeader').getSize().x;
                            
        var midSize = mainContent - $('main-header-div-left').getSize().x - $('main-header-div-right').getSize().x;        
        $('main-header-div-mid').setStyle('width',midSize + "px");
                
        if (Bookmarks.m_bBookmarsVisible)
        {
            $('search-box-bg').setStyle('marginLeft',"100px");
            $('main-categories-content-div').setStyle('marginLeft',"17px");
        }
        else
        {
            $('search-box-bg').setStyle('marginLeft',"0px");
            $('main-categories-content-div').setStyle('marginLeft',"25px");
        }                    
        var searchMidSize = $('search-box-bg').getSize().x - $('search-box-bg-left').getSize().x - $('search-box-bg-right').getSize().x;
        $('search-box-bg-mid').setStyle('width',searchMidSize + "px");
                        
        $('main-search-editbox').setStyle('width',searchMidSize - 30 + "px");
        
        
        $('main-search-results-frame-div').setStyle('width',mainContent - 30 + "px");
        
    },
    InitializeFullScreenTooltip:function(PlayerDiv)
    {
        if (typeof(localStorage['ShowFullScreenTooltip']) == 'string' && 
            localStorage['ShowFullScreenTooltip'] == '0')
            return;
            
        this.m_FullScreenTooltipShown = false;    
        PlayerDiv.addEvent('mouseenter', function(event) 
        {
            (   function()
                {             
                    TVChrome.OnShowFullScreenTooltip();
                }
            ).delay(12000,this);             
        });     

        $('tooltip-close').addEvent('click', function(event) {
            TVChrome.OnCloseFullScreenTooltip();
        });        
    },
    OnShowFullScreenTooltip:function()
    {
        if (this.m_FullScreenTooltipShown)
            return;
        
        this.m_FullScreenTooltipShown = true;    
        this.ShowHideFullScreenTooltip(true);
    },
    OnCloseFullScreenTooltip:function()
    {
        if ($('tooltip-dont-show-again').checked)
        {
            localStorage['ShowFullScreenTooltip'] = '0';
        }
        
        this.ShowHideFullScreenTooltip(false);
    },
    
    ShowHideFullScreenTooltip:function(bShow)
    {
        var FullScreenTooltip = $('FullScreenTooltip');   
        if (Bookmarks.m_bBookmarsVisible)
        {
            FullScreenTooltip.style.left = "95px";
            $('FullScreenTooltipPointer').style.left = "-166px";
        }        
        else
        {
            FullScreenTooltip.style.left = "2px";
            $('FullScreenTooltipPointer').style.left = "-183px";
        }        
        
        var fxr = new Fx.Reveal(FullScreenTooltip,{});
        
        if (bShow)    
            fxr.reveal();
        else
            fxr.dissolve();
    }
    
};


window.addEvent('domready',function(){
    TVChrome.Initialize();
});