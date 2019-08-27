
var Bookmarks = 
{
    m_listBookmarks : {},
    m_bBookmarsVisible : false,
    
    Initialize: function()
    {
        this.LoadBookmarksFromLocalStorage();
    },  

    LoadBookmarksFromLocalStorage:function()
    {
        if (typeof(localStorage['bookmarks']) == 'undefined')
        {
            this.CreateOrRefreshBookmarkDiv();
            return;
        }
        
        try
        {
            this.m_listBookmarks = JSON.parse(localStorage['bookmarks']);
            if (!this.m_listBookmarks)
                this.m_listBookmarks = {};
        }
        catch(e)
        {
            this.m_listBookmarks = {};
        }
            
        var stationsToRemove = [];
        for (stationId in this.m_listBookmarks)            
        {
            if (!this.m_listBookmarks.hasOwnProperty(stationId))
                continue;
            
            if (!TVChrome.m_mapStationsByID.hasOwnProperty(stationId))
                stationsToRemove.push(stationId);        
        }
        
        if (stationsToRemove.length > 0)
        {
            for (var i=0; i<stationsToRemove.length; i++)
                delete this.m_listBookmarks[stationsToRemove[i]];        
            this.SaveBookmarksToLocalStorage();
        }
        this.CreateOrRefreshBookmarkDiv();
    },
    CreateOrRefreshBookmarkDiv:function()
    {   
        BookmarksContent = $('BookmarksContent');
        if (!BookmarksContent)
            return;
        BookmarksMainDiv = $('Bookmarks-main-div');
        if (!BookmarksMainDiv)
            return;
        
        BookmarksContent.innerHTML = '';
        var bBookmarkExist = false;
        for (stationId in Bookmarks.m_listBookmarks)            
        {
            if (!this.m_listBookmarks.hasOwnProperty(stationId))
                continue;

            var LinkElement = TVChrome.createLinkElement(TVChrome.m_mapStationsByID[stationId],true);
            if (LinkElement && (LinkElement != null))
            {
                BookmarksContent.appendChild(LinkElement);
                bBookmarkExist = true;
            }
        }
        if (bBookmarkExist)
        {
            this.m_bBookmarsVisible = true;
            TVChrome.resizeScreen(800);
            BookmarksMainDiv.style.display = 'block';
        }            
        else
        {
            this.m_bBookmarsVisible = false;
            TVChrome.resizeScreen(560);
            BookmarksMainDiv.style.display = 'none';
        }
    },          
    IsStationInBookmarks:function(stationId)
    {
        if (this.m_listBookmarks.hasOwnProperty(stationId))
            return true;
        return false;
    },
    SaveBookmarksToLocalStorage:function()
    {
        
        for (stationId in this.m_listBookmarks)            
        {
            if (!this.m_listBookmarks.hasOwnProperty(stationId))
                continue;
            
        }        
        localStorage['bookmarks'] = JSON.stringify(this.m_listBookmarks);        
    },

    GetImageElementFromButton:function(BookmarkButton)
    {
        BookmarkButton = $(BookmarkButton);
        if (!BookmarkButton)
            return null;
            
        var allGroup = BookmarkButton.getElements('img[bookmarkImage=1]');
        if (!allGroup || (allGroup.length <= 0))
            return null;

        return allGroup[0];    
    },
    
    refreshBookmarkButtonImage:function(BookmarkButton,stationId,bIsOnMouseHover)
    {

        var BookmarkImage = this.GetImageElementFromButton(BookmarkButton);
        if (!BookmarkImage)
            return;
        
        var bIsBookmarked = this.IsStationInBookmarks(stationId);
        this.refreshBookmarkImage(BookmarkImage,bIsBookmarked,bIsOnMouseHover);
        
    },
    refreshBookmarkImage:function(BookmarkImage,bIsBookmarked,bIsOnMouseHover)
    {    
        BookmarkImage = $(BookmarkImage);
        if (!BookmarkImage)
            return;
        
        var imageSrc = this.GetBookmarkImageFileName(bIsBookmarked,bIsOnMouseHover);;

        BookmarkImage.src                  = imageSrc;
        BookmarkImage.title                = this.GetBookmarkImageTooltip(bIsBookmarked);     

    },

    removeBookmarkButtonImage:function(BookmarkButton)
    {   
        if (!BookmarkButton)
            return;
     
        BookmarkButton.innerHTML = '';
    },
    
    addBookmarkButtonToLinkElement:function(LinkElement,stationId,floatLeft)
    {
        
        
        var BookmarkButton = document.createElement("DIV");
            BookmarkButton.className           = "bookmark-button-div";
            if (floatLeft)
                BookmarkButton.className += " left";
            else
                BookmarkButton.className += " inline";
                

            BookmarkButton = $(BookmarkButton);
            
            LinkElement.appendChild(BookmarkButton);        
            

        var BookmarkImage = document.createElement("IMG");
            BookmarkImage.className            = "bookmark-img";
            BookmarkImage.setAttribute('bookmarkImage','1');
            
            BookmarkButton.addEvent('click', function(event) {
                Bookmarks.onBookmarkClicked(stationId,BookmarkButton);
//                return false;
            });
            
            BookmarkButton.appendChild(BookmarkImage);            
            this.refreshBookmarkButtonImage(BookmarkButton,stationId,false);
            
            return BookmarkButton;
    },            
    
    GetBookmarkImageFileName:function(bIsBookmarked,bIsOnHover)
    {
        if (bIsBookmarked)
            return "../img/" + "BookmarkSmall.png";

        if (bIsOnHover)
            return "../img/" + "BookmarkSmallHollow.png";    
            
        return "../img/" + "BookmarkSmallHollowGrey.png";    
    },

    GetBookmarkImageTooltip:function(bIsBookmarked)
    {
        if (bIsBookmarked)
            return "Station Is Bookmarked.\nClick To Remove From Bookmarks List";
        return "Click To Bookmarks This Station";    
    },
    
    onBookmarkClicked:function(stationId,BookmarkButton)
    {
        var bIsBookmarked = this.IsStationInBookmarks(stationId);
        if (bIsBookmarked)
             delete this.m_listBookmarks[stationId];        
        else
             this.m_listBookmarks[stationId] = 1;
        
        this.SaveBookmarksToLocalStorage();
        
        
        this.refreshBookmarkButtonImage(BookmarkButton,stationId,true);

        if (!TVChrome.IsStationCurrentlyPlaying())
            this.CreateOrRefreshBookmarkDiv();
    }
};
