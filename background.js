// checking if the extension has been run before
var firstRunDone = (localStorage['firstRunDone'] == 'true');
if (!firstRunDone) {
  localStorage['firstRunDone'] = 'true';
  // setting default opacity of 5% for first installation of extension
  localStorage['sunglasses_opacity'] = 5;
}

function sendOpacityToAllTabs() {
  // send opacity to all tabs
  chrome.tabs.getAllInWindow(null, function(tabs) {
    for (i=0; i<tabs.length; i++) {
      chrome.tabs.sendRequest(tabs[i].id, {tab_sunglasses_opacity: localStorage['sunglasses_opacity']}, function(response) {
        // console.log(response.status);
      });
    }
  });
}

chrome.extension.onRequest.addListener(
  function(request, sender, sendResponse) {
    if (request.save_sunglasses_opacity != null) {
      // listening for when popup hits save button
      // save sunglasses_opacity
      localStorage['sunglasses_opacity'] = request.save_sunglasses_opacity;

      sendOpacityToAllTabs();
      sendResponse({status: "sunglasses_opacity saved succesfully with value " + localStorage['sunglasses_opacity']});
    } else if (request.greeting == "opacity, please?") {
      // listening for when popup.html or a new page requests opacity
      sendResponse({requested_sunglasses_opacity: localStorage['sunglasses_opacity']});
    } else if (request.increment != null) {
      // increase opacity
      // max value of 80 is set in popup too, maybe I should set this in a single place
      localStorage['sunglasses_opacity'] = parseInt(localStorage['sunglasses_opacity']) + request.increment;
      // never increment more than 80
      if (parseInt(localStorage['sunglasses_opacity']) > 80) {
        localStorage['sunglasses_opacity'] = 80;
      }
      sendOpacityToAllTabs();
      sendResponse({status: "incremented"});
    } else if (request.decrement != null) {
      // decrease opacity
      localStorage['sunglasses_opacity'] = parseInt(localStorage['sunglasses_opacity']) - request.decrement;
      if (parseInt(localStorage['sunglasses_opacity']) < 0) {
      // never decrease more than 0
        localStorage['sunglasses_opacity'] = 0;
      }
      sendOpacityToAllTabs();
      sendResponse({status: "decremented"});
    } else {
      alert("nothing happened");
      sendResponse({status: "sunglasses_opacity did not save or did not send"});
    }
  });
