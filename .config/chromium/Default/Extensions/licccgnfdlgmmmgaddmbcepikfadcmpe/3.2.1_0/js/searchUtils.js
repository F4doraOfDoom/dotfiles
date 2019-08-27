
var SearchUtils = 
{
    m_lastSearchTermHandled : '',
    m_bIsOnSearchMode       :false,
    m_SearchBox             :null,
    m_SearchBoxButton       :null,
    m_SearchBoxButtonImage  :null,

    Initialize: function()
    {

        this.m_SearchBox = $('main-search-editbox');
        if (!this.m_SearchBox)
            return;

        this.m_SearchBoxButton = $('search-box-button');
        if (!this.m_SearchBoxButton)
            return;

        this.m_SearchBoxButtonImage = $('search-box-button-img');
        if (!this.m_SearchBoxButtonImage)
            return;
        
        var cancelButton = $('search-title-cancel');
        if (cancelButton)
        {
            cancelButton.addEvent('click', function(event) 
            {   SearchUtils.OnCancelSearch(); });        
        }
                    
        this.m_bIsOnSearchMode = false;   
        this.m_lastSearchTermHandled = '';                     
        
        this.m_SearchBox.addEvent('keydown', function(event) 
        {
            event = window.event || event;
            if (!event)
                return;
            
            if (event.keyCode == 13)    // Enter
                SearchUtils.OnPerformSearch();
            else if (event.keyCode == 27) // Escape
            {
                SearchUtils.OnCancelSearch();
                return false;
            } 
            else
                SearchUtils.OnSearchBoxChange();
 
        });
                
        this.m_SearchBoxButton.addEvent('click', function(event) 
            {   SearchUtils.OnSearchButtonClicked(); });            
        
        this.RefreshSearchButtonImage();

    },  
    
    OnSearchBoxChange:function()
    {
        (   function()
            {             
                SearchUtils.OnSearchBoxChangeDelay();        
            }
        ).delay(700,this);        
    },
    OnSearchBoxChangeDelay:function()
    {
        if (TVChrome.IsStationCurrentlyPlaying())
            return;
            
        if (this.m_lastSearchTermHandled == this.m_SearchBox.value)
            return;
            
        this.m_lastSearchTermHandled = this.m_SearchBox.value;        
        this.OnPerformSearch();
    },
    
    RefreshSearchButtonImage:function()
    {
         if (this.m_bIsOnSearchMode)
         {
            this.m_SearchBoxButtonImage.src     = "img/Cancel.png";            
         }   
         else
         {
            this.m_SearchBoxButtonImage.src = "img/Search.png"
         }         
    },
    OnSearchButtonClicked:function()
    {
        if (this.m_bIsOnSearchMode)
            this.OnCancelSearch();
        else
            this.OnPerformSearch();
    },
    OnCancelSearch:function()
    {
        this.m_bIsOnSearchMode = false; 
        this.RefreshSearchButtonImage();
        this.m_SearchBox.value = '';
        this.m_lastSearchTermHandled = '';
           
        $('main-search-results-div').style.display = 'none';
        $('search-results-content-div').innerHTML = '';
        $('main-categories-content-div').style.display = 'block';
        
        Bookmarks.CreateOrRefreshBookmarkDiv();

            
    },
    OnPerformSearch:function()
    {
        if (this.m_SearchBox.value == '')
            return this.OnCancelSearch();
        
        if (TVChrome.IsStationCurrentlyPlaying())
            TVChrome.OnCancelPlayStation();
            
        this.PerformSearch(this.m_SearchBox.value);
            
    },
    PerformSearch:function(SearchTermValue)
    {
        this.m_bIsOnSearchMode = true;
        this.RefreshSearchButtonImage();
        var mainSearchResultsDiv = $('main-search-results-div');
        var searchResultsContentDiv = $('search-results-content-div');
        var mainCategoriesContentDiv = $('main-categories-content-div');
        var mapStationsAdded = {};
       
       
        searchResultsContentDiv.innerHTML = '';
        SearchTermValue = SearchTermValue.toLowerCase();
        this.PerformSearchInCategory(SearchTermValue,searchResultsContentDiv,LiveTvByCountry,mapStationsAdded);       
        this.PerformSearchInCategory(SearchTermValue,searchResultsContentDiv,LiveTvByCategory,mapStationsAdded);       
       
        mainCategoriesContentDiv.style.display = 'none';
        mainSearchResultsDiv.style.display = 'block';
    },
    PerformSearchInCategory:function(SearchTermValue,searchResultsContentDiv,CategoryObject,mapStationsAdded)
    {
    
        for (var i=0; i<CategoryObject.List.length; i++)
        {
            var bCategoryAdded = false;
            
            if (CategoryObject.List[i].CaptionLower.indexOf(SearchTermValue) != -1)
            {
                var CategoryElement = TVChrome.createCategoryElement(CategoryObject.List[i],false);
                searchResultsContentDiv.appendChild(CategoryElement);
                bCategoryAdded = true;
            }
            
            if (bCategoryAdded)
            {
                var CategoryContentElement = document.createElement("DIV");
                CategoryContentElement.className = "category-content-div-wide";            
                for (var j=0; j<CategoryObject.List[i].List.length; j++)
                {
                    if (mapStationsAdded.hasOwnProperty(CategoryObject.List[i].List[j].ID))
                        continue;
                        
                    var LinkElement = TVChrome.createLinkElement(CategoryObject.List[i].List[j],false);
                    if (LinkElement && (LinkElement != null))
                    {
                        CategoryContentElement.appendChild(LinkElement);
                        mapStationsAdded[CategoryObject.List[i].List[j].ID] = 1;
                    }
                } 
                searchResultsContentDiv.appendChild(CategoryContentElement);
            }
            else
            {
                for (var j=0; j<CategoryObject.List[i].List.length; j++)
                {
                    if (mapStationsAdded.hasOwnProperty(CategoryObject.List[i].List[j].ID))
                        continue;
                        
                    if (CategoryObject.List[i].List[j].CaptionLower.indexOf(SearchTermValue) != -1)
                    {
                        var LinkElement = TVChrome.createLinkElement(CategoryObject.List[i].List[j]);
                        if (LinkElement && (LinkElement != null))
                        {
                            searchResultsContentDiv.appendChild(LinkElement);                    
                            mapStationsAdded[CategoryObject.List[i].List[j].ID] = 1;
                        }
                    }
                } 
            }
        }
   }     
    
};
