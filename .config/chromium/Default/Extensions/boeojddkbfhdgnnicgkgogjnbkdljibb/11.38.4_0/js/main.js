(function(){var c=angular.module("beyond",[]);
function e(a,m){function n(a){var b=a.currentTarget,d=b.href;b.href&&!b.classList.contains("menu__item--side")&&window.chrome&&chrome.tabs&&("_blank"===b.target?chrome.tabs.create({url:d}):chrome.tabs.update({url:d}),a.preventDefault())}var b=document.getElementsByClassName("menu")[0],k=b.querySelectorAll(".menu__item"),d;a.background0="img/bg-split.jpg";a.background1=null;a.activeBackground=0;a.notAuth=!0;a.language=chrome.i18n.getUILanguage();document.documentElement.setAttribute("lang",a.language);
a.dir=-1!==["ar","he"].indexOf(a.language)?"rtl":"ltr";a.isEnglish=-1!==a.language.indexOf("en");a.isChromeBook=-1!==window.navigator.userAgent.indexOf("CrOS");a.uninstallMe=function(){chrome.management.uninstallSelf({showConfirmDialog:!0})};b.addEventListener("mouseover",function(){clearTimeout(d);d=setTimeout(function(){b.className="menu"},50)});b.addEventListener("mouseout",function(){clearTimeout(d);d=setTimeout(function(){b.className="menu menu--closed"},50)});for(var h=0;h<k.length;h++)k[h].addEventListener("click",
n);a.getMessage=function(){return m.trustAsHtml(chrome.i18n.getMessage.apply(this,arguments).replace(" \n","<br>"))}}var f=["beyond","app","MainCtrl"],g=this;f[0]in g||!g.execScript||g.execScript("var "+f[0]);for(var l;f.length&&(l=f.shift());)f.length||void 0===e?g[l]?g=g[l]:g=g[l]={}:g[l]=e;e.$inject=["$scope","$sce"];c.controller("beyond.main",e);})();
