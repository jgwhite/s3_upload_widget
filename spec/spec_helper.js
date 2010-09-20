function widget_options(options) {
  var result = {
    "aws_access_key_id": "abc123",
    "bucket": "my-bucket",
    "policy": "123abc",
    "signature": "zyx987"
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

function widget_options_with_plupload(options) {
  return widget_options({
    "target": "my_target",
    "plupload_src": "lib/plupload-1.2.4/plupload.full.min.js"
  });
}