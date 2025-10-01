/* global TrelloPowerUp */

var t = TrelloPowerUp.iframe();

var getCardChecklists = function(){
  return t.card('checklists')
    .then(function(card){
      return (card && card.checklists) ? card.checklists : [];
    })
    .catch(function(error){
      console.error('Error reading card checklists:', error);
      return [];
    });
};

// Render checklists
var renderChecklists = function(checklists){
  var contentDiv = document.getElementById('content');

  if (!checklists || checklists.length === 0) {
    contentDiv.innerHTML = '<div class="no-checklists">No checklists found. Create a checklist on this card to see it here!</div>';
    return t.sizeTo('#content');
  }

  var html = '';

  checklists.forEach(function(checklist){
    html += '<div class="checklist-container">';
    html += '<div class="checklist-title">' + escapeHtml(checklist.name) + '</div>';
    html += '<ul class="checklist-items">';

    if (checklist.checkItems && checklist.checkItems.length > 0) {
      checklist.checkItems.forEach(function(item){
        var isComplete = item.state === 'complete';
        var textClass = isComplete ? 'completed' : '';

        html += '<li class="checklist-item">';
        html += '<input type="checkbox" disabled ' + (isComplete ? 'checked' : '') + '>';
        html += '<span class="checklist-item-text ' + textClass + '">' + escapeHtml(item.name) + '</span>';
        html += '</li>';
      });
    }

    html += '</ul>';
    html += '</div>';
  });

  contentDiv.innerHTML = html;

  return t.sizeTo('#content');
};

// Escape HTML to prevent XSS
var escapeHtml = function(text){
  var map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, function(m) { return map[m]; });
};

// Initialize
t.render(function(){
  return getCardChecklists()
    .then(function(checklists){
      return renderChecklists(checklists);
    });
});
