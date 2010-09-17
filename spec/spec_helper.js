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
