/* global TrelloPowerUp */

var t = TrelloPowerUp.iframe();

// Helper function to get API key
var getApiKey = function(){
  return t.get('organization', 'private', 'apiKey')
    .then(function(apiKey){
      if (!apiKey) {
        return t.get('board', 'private', 'apiKey');
      }
      return apiKey;
    });
};

// Helper function to get token
var getToken = function(){
  return t.get('member', 'private', 'token');
};

// Fetch checklists from Trello API
var fetchChecklists = function(cardId, apiKey, token){
  return fetch('https://api.trello.com/1/cards/' + cardId + '/checklists?checkItems=all&key=' + apiKey + '&token=' + token)
    .then(function(response){
      if (!response.ok) {
        throw new Error('Failed to fetch checklists');
      }
      return response.json();
    });
};

// Update a checklist item state
var updateChecklistItem = function(cardId, checklistId, checkItemId, state, apiKey, token){
  return fetch('https://api.trello.com/1/cards/' + cardId + '/checkItem/' + checkItemId + '?state=' + state + '&key=' + apiKey + '&token=' + token, {
    method: 'PUT'
  })
  .then(function(response){
    if (!response.ok) {
      throw new Error('Failed to update checklist item');
    }
    return response.json();
  });
};

// Render checklists
var renderChecklists = function(checklists, cardId, apiKey, token){
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

        html += '<li class="checklist-item" data-card-id="' + cardId + '" data-checklist-id="' + checklist.id + '" data-item-id="' + item.id + '" data-state="' + item.state + '">';
        html += '<input type="checkbox" ' + (isComplete ? 'checked' : '') + '>';
        html += '<span class="checklist-item-text ' + textClass + '">' + escapeHtml(item.name) + '</span>';
        html += '</li>';
      });
    }

    html += '</ul>';
    html += '</div>';
  });

  contentDiv.innerHTML = html;

  // Add event listeners to checkboxes
  var checkboxes = contentDiv.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(function(checkbox){
    checkbox.addEventListener('change', function(e){
      var listItem = e.target.closest('.checklist-item');
      var cardId = listItem.getAttribute('data-card-id');
      var checklistId = listItem.getAttribute('data-checklist-id');
      var itemId = listItem.getAttribute('data-item-id');
      var currentState = listItem.getAttribute('data-state');
      var newState = currentState === 'complete' ? 'incomplete' : 'complete';

      // Update the item state immediately in the UI
      var textSpan = listItem.querySelector('.checklist-item-text');
      if (newState === 'complete') {
        textSpan.classList.add('completed');
      } else {
        textSpan.classList.remove('completed');
      }
      listItem.setAttribute('data-state', newState);

      // Update via API
      updateChecklistItem(cardId, checklistId, itemId, newState, apiKey, token)
        .then(function(){
          // Notify Trello to refresh card badges
          return t.alert({
            message: 'Checklist updated!',
            duration: 2
          });
        })
        .catch(function(error){
          console.error('Error updating checklist item:', error);
          // Revert UI on error
          if (newState === 'complete') {
            textSpan.classList.remove('completed');
            checkbox.checked = false;
          } else {
            textSpan.classList.add('completed');
            checkbox.checked = true;
          }
          listItem.setAttribute('data-state', currentState);

          t.alert({
            message: 'Failed to update checklist. Please try again.',
            duration: 5,
            display: 'error'
          });
        });
    });
  });

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
  return Promise.all([
    t.card('id'),
    getToken(),
    getApiKey()
  ])
  .then(function(results){
    var cardId = results[0].id;
    var token = results[1];
    var apiKey = results[2];

    if (!token || !apiKey) {
      document.getElementById('content').innerHTML =
        '<div class="error">Please authorize the Power-Up first. Click the gear icon in the Power-Up menu and select "Authorize Account".</div>';
      return t.sizeTo('#content');
    }

    return fetchChecklists(cardId, apiKey, token)
      .then(function(checklists){
        return renderChecklists(checklists, cardId, apiKey, token);
      })
      .catch(function(error){
        console.error('Error loading checklists:', error);
        document.getElementById('content').innerHTML =
          '<div class="error">Error loading checklists. Please make sure you have authorized the Power-Up.</div>';
        return t.sizeTo('#content');
      });
  });
});
