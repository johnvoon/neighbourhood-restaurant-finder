// adjusts menu width to account for the scrollbar
module.exports = (function() {
  function adjustMenuWidth() {
    var menu = document.getElementById('menu');
    var searchForm = document.getElementById('search');
    var scrollBarWidth = menu.offsetWidth - menu.clientWidth;
    var adjustedWidth = scrollBarWidth + menu.offsetWidth;
    menu.setAttribute("style", "width: " + adjustedWidth + "px");
  }

  return {
    adjustMenuWidth: adjustMenuWidth
  }
}());