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

function widget_options_with_plupload(options) {
  return widget_options({
    "target": "my_target",
    "plupload_src": "lib/plupload-1.2.4/plupload.full.min.js"
  });
}