var setShade = function(value) {
  document.getElementById("webpage_sunglasses").style.opacity = value/100;
}

var showValue = function(newValue) {
  document.getElementById("opacity_status").innerHTML=newValue;
}

// submits opacity setting to background.html
var saveOpacity = function(value) {
  chrome.extension.sendRequest({save_sunglasses_opacity: value}, function(response) {
    // console.log(response.status);
  });
}

// requests opacity from background.html
chrome.extension.sendRequest({greeting: "opacity, please?"}, function(response) {
  if (response.requested_sunglasses_opacity != null) {
    setShade(response.requested_sunglasses_opacity);
    showValue(response.requested_sunglasses_opacity);
    document.getElementById('slider').value = response.requested_sunglasses_opacity;
    // console.log("popup.html successfully received sunglasses_opacity upon request");
  } else {
    // console.log("popup.html did not receive sunglasses_opacity upon request");
  }
});

var shadeHandler = function(e) {
  var sliderValue = document.getElementById('slider').value;
  setShade(sliderValue);
  showValue(sliderValue);
}

var saveOpacityHandler = function(e) {
  var sliderValue = document.getElementById('slider').value;
  saveOpacity(sliderValue);
}

document.addEventListener('DOMContentLoaded', function () {
  document.querySelector('#slider').addEventListener('change', shadeHandler);
  document.querySelector('#savebutton').addEventListener('click', saveOpacityHandler);
});
