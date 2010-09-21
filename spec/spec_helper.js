function widget_options(options) {
  var result = {
    "aws_access_key_id": "abc123",
    "bucket": "my-bucket",
    "policy": "123abc",
    "signature": "zyx987",
    "key": "${filename}"
  };
  for (var key in options) result[key] = options[key];
  
  return result;
}

function widget_with_extra_field_options(options) {
  return widget_options({
    "fields": [
      {
        "type": "checkbox",
        "name": "terms_agreed",
        "value": "1",
        "label": "I agree to the Terms &amp; Conditions",
        "checked": false,
        "valid_if": { "checked": true }
      }
    ]
  });
}

function widget_options_with_swfupload(options) {
  return widget_options({
    "target": "my_target",
    "swfupload": {
      "src": "/lib/swfupload-2.2.0.1/swfupload.js",
      "swf": "/lib/swfupload-2.2.0.1/swfupload.swf",
      "btn": "/choose_button_sprite.png"
    }
  });
}