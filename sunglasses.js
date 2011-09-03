function addShade() {
  if(document.getElementById("webpage_sunglasses") == null) {
    var sunglasses = document.createElement("div");
    sunglasses.id = "webpage_sunglasses";
    document.body.appendChild(sunglasses);
  }
}

function shadePage(opacity) {
  document.getElementById("webpage_sunglasses").style.opacity = opacity;
}

// requests background for opacity
chrome.extension.sendRequest({greeting: "opacity, please?"}, function(response) {
  if (response.requested_sunglasses_opacity != null) {
    addShade();
    shadePage(response.requested_sunglasses_opacity);
    // console.log("sunglasses.js successfully received sunglasses_opacity upon request");
  } else {
    // console.log("sunglasses.js did not receive sunglasses_opacity upon request");
  }
});

// listens for when background pushes a new opacity to all tabs
chrome.extension.onRequest.addListener(
  function(request, sender, sendResponse) {
    if (request.tab_sunglasses_opacity != null) {
      addShade();
      shadePage(request.tab_sunglasses_opacity);

      sendResponse({status: "sunglasses.js successfully received sunglasses_opacity " + request.tab_sunglasses_opacity});
    } else {
      sendResponse({status: "sunglasses.js did not receive sunglasses_opacity"});
    }
  });

key("ctrl+shift+=", function(){
  chrome.extension.sendRequest({increment: 0.05}, function(response) {
    // console.log(response.status);
  })
});

key("ctrl+shift+-", function(){
  chrome.extension.sendRequest({decrement: 0.05}, function(response) {
    // console.log(response.status);
  })
});
