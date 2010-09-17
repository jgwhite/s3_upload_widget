// ==========================================================================
// Project:   S3UploadWidget
// Website:   http://github.com/jgwhite/s3_upload_widget
// Authors:   jamie@jgwhite.co.uk
// License:   Licensed under MIT license
// Copyright: © 2010 Jamie White
// ==========================================================================

Array.prototype.remove = function(obj) {
  for (var i = 0; i < this.length; i++)
    if (this[i] === obj) { this.splice(i, 1); return obj; }
  return null;
}
Array.prototype.indexOf = function(obj) {
  for (var i = 0; i < this.length; i++)
    if (this[i] === obj) { return i; }
  return -1;
}

S3UploadWidget = function() {};
S3UploadWidget.instances = [];
S3UploadWidget.DEFAULTS = { "key": "${filename}" };
S3UploadWidget.REQUIRED_OPTIONS = [ "aws_access_key_id", "bucket", "policy", "signature" ];
S3UploadWidget.generate_id = function() {
  if (S3UploadWidget.__id === undefined) S3UploadWidget.__id = 0;
  return S3UploadWidget.__id++;
}
S3UploadWidget.create = function(options) {
  var instance = new S3UploadWidget();
  instance.initialize(options);
  return instance;
}
S3UploadWidget.prototype.initialize = function(options) {
  //--- copy in options
  this._options = {};
  for (var key in S3UploadWidget.DEFAULTS)
    this._options[key] = S3UploadWidget.DEFAULTS[key];
  for (var key in options)
    this._options[key] = options[key];
  
  //--- validate we have all required options
  var missing_options = [];
  for (var i = 0; i < S3UploadWidget.REQUIRED_OPTIONS.length; i++) {
    var required_key = S3UploadWidget.REQUIRED_OPTIONS[i];
    if (this._options[required_key] === undefined
     || this._options[required_key] === null
     || this._options[required_key] === "") {
      missing_options.push(required_key);
    }
  }
  if (missing_options.length > 0)
    throw("The following options are required: " + missing_options.join(", "));
  
  //--- register the instance
  S3UploadWidget.instances.push(this);
  
  //--- add the hidden inputs
  this.set_hidden_values({
    "AWSAccessKeyId": this.options()["aws_access_key_id"],
    "policy": this.options()["policy"],
    "signature": this.options()["signature"],
    "key": this.options()["key"]
  });
  
  //--- add the file field (you don't get a choice about that)
  this._file_field = this.add_field({
    "type": "file",
    "name": "file"
  });
  
  //--- add extra fields
  if (this.options()["fields"]) {
    for (var i = 0; i < this.options()["fields"].length; i++)
      this.add_field(this.options()["fields"][i]);
  }
  
  //--- add the submit button
  this._submit_button = this.add_field({
    "type": "submit",
    "value": "Upload",
    "disabled": true
  });
  
  //--- if a target is specified, append the element
  if (this.options()["target"]) this.insert(this.options()["target"]);
  
  //--- return the instance
  return this;
}
S3UploadWidget.prototype.id = function() {
  return this._id = this._id || ("s3_upload_widget_" + S3UploadWidget.generate_id());
}
S3UploadWidget.prototype.options = function() {
  return this._options;
}
S3UploadWidget.prototype.element = function() {
  if (!this._element) {
    this._element = document.createElement("div");
    this._element.className = "s3_upload_widget";
    this._element.id = this.id();
    this._element.appendChild(this.form());
  }
  return this._element;
}
S3UploadWidget.prototype.form = function() {
  if (!this._form) {
    this._form = document.createElement("form");
    this._form.id = this.id() + "_form";
    this._form.action = "http://" + this.options()["bucket"] + ".s3.amazonaws.com/";
    this._form.method = "post";
    this._form.enctype = "multipart/form-data";
  }
  return this._form;
}
S3UploadWidget.prototype.insert = function(target) {
  if (typeof(target) == "string") target = document.getElementById(target);
  
  if (target == undefined) throw("Target argument must be id or element");
  
  target.appendChild(this.element());
}
S3UploadWidget.prototype.remove = function() {
  this.unregister();
  this.remove_elements();
  this.dealloc();
}
S3UploadWidget.prototype.remove_elements = function() {
  if (this._element && this._element.parentNode)
    this._element.parentNode.removeChild(this._element);
}
S3UploadWidget.prototype.unregister = function () {
  var indexOf_this = S3UploadWidget.instances.remove(this);
}
S3UploadWidget.prototype.dealloc = function() {
  for (var prop in this) if (prop.indexOf("_") === 0) delete this[prop];
}
S3UploadWidget.prototype.fields = function() {
  return this._fields = this._fields || [];
}
S3UploadWidget.prototype.add_field = function(options) {
  var field = new S3UploadWidget.Field().initialize(options);
  this.fields().push(field);
  this.form().appendChild(field.element());
  return field;
}
S3UploadWidget.prototype.hidden_inputs = function() {
  return this._hidden_inputs = this._hidden_inputs || {};
}
S3UploadWidget.prototype.set_hidden_value = function(name, value) {
  var input = this.hidden_inputs()[name];
  if (value !== null) {
    if (!input) {
      input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      this.form().appendChild(input);
      this.hidden_inputs()[name] = input;
    }
    input.value = value;
  } else {
    input.parentNode.removeChild(input);
    delete this.hidden_inputs()[name];
  }
}
S3UploadWidget.prototype.set_hidden_values = function(values) {
  for (var name in this.hidden_inputs()) this.set_hidden_value(name, null);
  for (var name in values) this.set_hidden_value(name, values[name]);
}

S3UploadWidget.Field = function() {};
S3UploadWidget.Field.DEFAULTS = { "type": "text" };
S3UploadWidget.Field.generate_id = function() {
  if (S3UploadWidget.Field.__id === undefined) S3UploadWidget.Field.__id = 0;
  return S3UploadWidget.Field.__id++;
}
S3UploadWidget.Field.prototype.id = function() {
  return this._id = this._id || ("s3_upload_widget_field_" + S3UploadWidget.Field.generate_id());
}
S3UploadWidget.Field.prototype.element = function() {
  if (!this._element) {
    this._element = document.createElement("fieldset");
    this._element.className = "s3_upload_widget_fieldset";
    this._element.id = this.id();
    this._element.appendChild(this.input());
  }
  return this._element
}
S3UploadWidget.Field.prototype.make_input = function(type) {
  if (this._input) {
    var name = this._input.name;
    var value = this._input.value;
    
    if (this._input.parentNode) this._input.parentNode.removeChild(this._input);
    delete this._input;
  }
  
  type = type || S3UploadWidget.Field.DEFAULTS;
  
  switch (type) {
  case "textarea":
    this._input = document.createElement("textarea");
    break;
  default:
    this._input = document.createElement("input");
    this._input.setAttribute("type", type);
    break;
  }
  
  this._input.id = this.id() + "_input";
  this._input.name = name;
  this._input.value = value;
}
S3UploadWidget.Field.prototype.input = function() {
  if (!this._input) this.make_input();
  return this._input;
}
S3UploadWidget.Field.prototype.label = function() {
  return this._label;
}
S3UploadWidget.Field.prototype.set_type = function(new_type) {
  this.make_input(new_type);
}
S3UploadWidget.Field.prototype.set_name = function(new_name) {
  this.input().name = new_name;
}
S3UploadWidget.Field.prototype.set_value = function(new_value) {
  this.input().value = new_value;
}
S3UploadWidget.Field.prototype.set_label = function(new_label) {
  if (new_label != undefined && new_label.length > 0) {
    if (!this._label) {
      this._label = document.createElement("label");
      this._label.setAttribute("for", this.id() + "_input");
      this.element().appendChild(this._label);
    }
    this._label.innerHTML = new_label;
  } else {
    if (this._label && this._label.parentNode) this._label.parentNode.removeChild(this._label);
    delete this.label;
  }
}
S3UploadWidget.Field.prototype.set_disabled = function(new_value) {
  this.input().disabled = new_value;
}
S3UploadWidget.Field.prototype.disabled = function() {
  return this.input().disabled;
}
S3UploadWidget.Field.prototype.set_checked = function(new_value) {
  this.input().checked = new_value;
}
S3UploadWidget.Field.prototype.checked = function() {
  return this.input().checked;
}
S3UploadWidget.Field.prototype.set_valid_if = function(new_rules) {
  this._valid_if = new_rules;
}
S3UploadWidget.Field.prototype.valid_if = function() {
  return this._valid_if;
}
S3UploadWidget.Field.prototype.value = function() {
  return this.input().value;
}
S3UploadWidget.Field.prototype.valid = function() {
  this.errors = [];
  for (var property in this.valid_if()) {
    var actual = this[property]();
    var expected = this.valid_if()[property];
    if (actual !== expected)
      this.errors.push(property + " must be " + this.valid_if()[property]);
  }
  return this.errors.length === 0;
}
S3UploadWidget.Field.prototype.initialize = function(new_options) {
  var options = {};
  for (var key in S3UploadWidget.Field.DEFAULTS)
    options[key] = S3UploadWidget.Field.DEFAULTS[key];
  for (var key in new_options)
    options[key] = new_options[key];
  
  for (var key in options) {
    var setter = this["set_" + key];
    if (setter === undefined) continue; // TODO: throw error for unknown setter
    setter.apply(this, [options[key]]);
  }
  
  return this;
}
