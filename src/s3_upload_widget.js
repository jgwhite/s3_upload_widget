// ==========================================================================
// Project:   S3UploadWidget
// Website:   http://github.com/jgwhite/s3_upload_widget
// Authors:   jamie@jgwhite.co.uk
// License:   Licensed under MIT license
// Copyright: © 2010 Jamie White
// ==========================================================================

// TODO: Prevent double require of plupload
// TODO: Setting for multi_selection

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
Function.prototype.bind = function(scope) {
  var __method = this;
  return function() { return __method.apply(scope, arguments) };
}
String.prototype.truncate = function(length, truncation) {
  length = length || 30;
  truncation = truncation == undefined ? '...' : truncation;
  return this.length > length ?
    this.slice(0, length - truncation.length) + truncation : String(this);
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
  S3UploadWidget.lookup_user_ip();
  
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
    "Filename": ""
  });
  
  //--- sets the dynamic key
  this.set_key();
  
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
  
  //--- capture submit events
  this.form().onsubmit = this._on_submit.bind(this);
  
  //--- if a target is specified, append the element
  if (this.options()["target"]) this.insert(this.options()["target"]);
  
  //--- init plupload
  if (this.options()["swfupload"]) this.init_uploader();
  
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
    this._form.className = "s3_upload_widget_form";
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
  if (this.uploader()) this.uploader().destroy();
  this.remove_elements();
  this.release();
}
S3UploadWidget.prototype.remove_elements = function() {
  if (this._element && this._element.parentNode)
    this._element.parentNode.removeChild(this._element);
}
S3UploadWidget.prototype.unregister = function () {
  var indexOf_this = S3UploadWidget.instances.remove(this);
}
S3UploadWidget.prototype.release = function() {
  for (var prop in this) if (prop.indexOf("_") === 0) delete this[prop];
}
S3UploadWidget.prototype.fields = function() {
  return this._fields = this._fields || [];
}
S3UploadWidget.prototype.add_field = function(options) {
  var field = new S3UploadWidget.Field().initialize(options);
  this.fields().push(field);
  this.form().appendChild(field.element());
  field.on_change = this._on_field_change.bind(this);
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
S3UploadWidget.prototype.file_field = function() {
  return this._file_field;
}
S3UploadWidget.prototype.submit_button = function() {
  return this._submit_button;
}
S3UploadWidget.prototype._on_field_change = function(field) {
  if (this.on_field_change) this.on_field_change(field);
}
S3UploadWidget.prototype.on_field_change = function(field) {
  if (this.validate()) {
    this._submit_button.set_disabled(false);
  } else {
    this._submit_button.set_disabled(true);
  }
  if (this.uploader()) this.uploader().setPostParams(this.payload());
}
S3UploadWidget.prototype.validate = function() {
  this.errors = [];
  
  for (var i = 0; i < this.fields().length; i++) {
    if (!this.fields()[i].valid()) this.errors.push(this.fields()[i]);
  }
  
  if ( (this.uploader() && this.uploader().getFile(0) == null)
    || (!this.uploader() && (this.file_field().value() == null || this.file_field().value() == ""))
  ) {
    this.file_field().errors = [];
    this.file_field().errors.push("you need to choose a file");
    this.errors.push(this.file_field());
  }
  
  return this.errors.length === 0;
}
S3UploadWidget.prototype.init_uploader = function() {
  if (window.SWFUpload) {
    this._uploader = new SWFUpload({
      upload_url: this.form().action,
      flash_url: this.options()["swfupload"]["swf"],
      file_post_name: "file",
      post_params: this.payload(),
      use_query_string: false,
      button_placeholder_id: this.file_field().input().id,
      button_image_url: this.options()["swfupload"]["btn"],
      button_cursor: SWFUpload.CURSOR.HAND,
      button_width: 84,
      button_height: 22,
      button_text: "",
      button_text_style: "",
      button_window_mode: SWFUpload.WINDOW_MODE.TRANSPARENT,
      
      swfupload_loaded_handler: this.swfupload_loaded_handler.bind(this),
      file_dialog_start_handler: this.file_dialog_start_handler.bind(this),
      file_queued_handler: this.file_queued_handler.bind(this),
      file_queue_error_handler: this.file_queue_error_handler.bind(this),
      file_dialog_complete_handler: this.file_dialog_complete_handler.bind(this),
      upload_start_handler: this.upload_start_handler.bind(this),
      upload_progress_handler: this.upload_progress_handler.bind(this),
      upload_error_handler: this.upload_error_handler.bind(this),
      upload_success_handler: this.upload_success_handler.bind(this),
      upload_complete_handler: this.upload_complete_handler.bind(this),
      debug_handler: this.debug_handler.bind(this)
    });
  } else {
    var script = document.createElement("script");
    script.src = this.options()["swfupload"]["src"];
    script.type = "text/javascript";
    document.body.appendChild(script);
    this.wait_for_uploader();
  }
}
S3UploadWidget.prototype.wait_for_uploader = function() {
  if (window.SWFUpload) {
    this.on_uploader_ready();
  } else {
    window.setTimeout(this.wait_for_uploader.bind(this), 100);
  }
}
S3UploadWidget.prototype.on_uploader_ready = function() {
  this.init_uploader();
}
S3UploadWidget.prototype.uploader = function() {
  return this._uploader;
}
S3UploadWidget.prototype.swfupload_loaded_handler = function() {
  this.uploader_ready = true;
}
S3UploadWidget.prototype.file_dialog_start_handler = function() {}
S3UploadWidget.prototype.file_queued_handler = function(file) {
  this.file_field().set_label(file.name, 22); // 22 is how much to truncate it by
  this.on_field_change();
}
S3UploadWidget.prototype.file_queue_error_handler = function(file, code, message) {
  
}
S3UploadWidget.prototype.file_dialog_complete_handler = function(file) {
  
}
S3UploadWidget.prototype.upload_start_handler = function(file) {
  
}
S3UploadWidget.prototype.upload_progress_handler = function(file, sent, total) {
  this.progress_display().set_progress({
    loaded: sent,
    size: total,
    percent: (sent / total) * 100
  });
}
S3UploadWidget.prototype.upload_error_handler = function(file, code, messages) {
  switch (code) {
  case SWFUpload.UPLOAD_ERROR.HTTP_ERROR:
    this.hide_form();
    this.progress_display().hide();
    this.set_notice("Uh oh, we&rsquo;ve got a problem, please try again later.")
    this.show_notice();
    break;
  }
}
S3UploadWidget.prototype.upload_success_handler = function() {
  this.progress_display().element().style.display = "none";
  this.element().appendChild(this.thanks());
}
S3UploadWidget.prototype.upload_complete_handler = function() {
  
}
S3UploadWidget.prototype.debug_handler = function(message) {
  // console.log(message)
}
S3UploadWidget.prototype._on_submit = function(event) {
  return this.on_submit(event);
}
S3UploadWidget.prototype.on_submit = function(event) {
  if (!this.uploader()) return true;
  
  if (event) { event.preventDefault(); event.stopPropagation(); }
  
  if (this.uploader()) this.uploader().setPostParams(this.payload());
  
  this.hide_form();
  
  if (this.uploader()) this.uploader().startUpload();
  
  return false;
}
S3UploadWidget.prototype.payload = function() {
  return {
    "AWSAccessKeyId": this.hidden_inputs()["AWSAccessKeyId"].value,
    "policy": this.hidden_inputs()["policy"].value,
    "signature": this.hidden_inputs()["signature"].value,
    "key": this.hidden_inputs()["key"].value
  }
}
S3UploadWidget.prototype.progress_display = function() {
  if (!this._progress_display) {
    this._progress_display = new S3UploadWidget.ProgressDisplay();
    this.element().appendChild(this._progress_display.element());
  }
  return this._progress_display;
}
S3UploadWidget.prototype.thanks = function() {
  if (!this._thanks) {
    this._thanks = document.createElement("p");
    this._thanks.className = "s3_upload_widget_thanks";
    this._thanks.innerHTML = "Thanks for your submission!"
  }
  return this._thanks;
}
S3UploadWidget.prototype.hide_form = function() {
  this.form().style.height = "0px";
}
S3UploadWidget.prototype.show_form = function() {
  this.form().style.height = "auto";
}
S3UploadWidget.prototype.notice = function() {
  if (!this._notice) {
    this._notice = document.createElement("div");
    this._notice.className = "s3_upload_widget_notice";
    this.element().appendChild(this._notice);
  }
  return this._notice;
}
S3UploadWidget.prototype.set_notice = function(text) {
  this.notice().innerHTML = text;
}
S3UploadWidget.prototype.hide_notice = function() {
  this.notice().style.display = "none";
}
S3UploadWidget.prototype.show_notice = function() {
  this.notice().style.display = "block";
}
S3UploadWidget.prototype.on_user_ip_available = function() {
  this.set_key();
}
S3UploadWidget.prototype.check_if_user_ip_available = function() {
  if (S3UploadWidget.user_ip) this.on_user_ip_available();
}
S3UploadWidget.prototype.set_key = function() {
  var key = [];
  
  var date = new Date();
  key.push(date.getFullYear());
  key.push(date.getMonth() + 1);
  key.push(date.getDate());
  
  key.push(S3UploadWidget.user_ip);
  
  key.push("${filename}");
  
  key = key.join("/");
  
  this.set_hidden_value("key", key);
  
  if (this.uploader()) this.uploader().setPostParams(this.payload());
}

S3UploadWidget.Field = function() {};
S3UploadWidget.Field.DEFAULTS = { "type": "text" };
S3UploadWidget.Field.generate_id = function() {
  if (S3UploadWidget.Field.__id === undefined) S3UploadWidget.Field.__id = 0;
  return S3UploadWidget.Field.__id++;
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
S3UploadWidget.Field.prototype.id = function() {
  return this._id = this._id || ("s3_upload_widget_field_" + S3UploadWidget.Field.generate_id());
}
S3UploadWidget.Field.prototype.element = function() {
  if (!this._element) {
    this._element = document.createElement("fieldset");
    this._element.className = "s3_upload_widget_fieldset";
    this._element.id = this.id();
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
  
  type = type || S3UploadWidget.Field.DEFAULTS["type"];
  var classNames = ["s3_upload_widget_input", "s3_upload_widget_input_" + name];
  
  switch (type) {
  case "textarea":
    this._input = document.createElement("textarea");
    classNames.push("s3_upload_widget_input_type_textarea");
    break;
  default:
    this._input = document.createElement("input");
    this._input.type = type;
    classNames.push("s3_upload_widget_input_type_" + type);
    break;
  }
  
  this._input.id = this.id() + "_input";
  this._input.name = name;
  this._input.className = classNames.join(" ");
  if (value && type !== "file") this._input.value = value;
  
  this.__onchange = this._on_change.bind(this);
  this._input.onchange = this.__onchange;
  this._input.onclick = this.__onchange;
  this._input.onkeypress = this.__onchange;
  
  this.element().appendChild(this.input());
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
  this.element().className = ["s3_upload_widget_fieldset", "s3_upload_widget_fieldset_" + new_name].join(" ");
  this.input().name = new_name;
}
S3UploadWidget.Field.prototype.name = function() {
  return this.input().name;
}
S3UploadWidget.Field.prototype.set_value = function(new_value) {
  if (this.input().type === "file") return;
  this.input().value = new_value;
  this._on_change();
}
S3UploadWidget.Field.prototype.value = function() {
  return this.input().value;
}
S3UploadWidget.Field.prototype.set_label = function(new_label, truncate) {
  if (new_label != undefined && new_label.length > 0) {
    if (!this._label) {
      this._label = document.createElement("label");
      this._label.setAttribute("for", this.id() + "_input");
      this._label.className = "s3_upload_widget_label";
      this.element().appendChild(this._label);
    }
    if (truncate) new_label = new_label.truncate(truncate);
    this._label.innerHTML = new_label;
  } else {
    if (this._label && this._label.parentNode) this._label.parentNode.removeChild(this._label);
    delete this.label;
  }
}
S3UploadWidget.Field.prototype.label = function() {
  return this._label && this._label.innerHTML;
}
S3UploadWidget.Field.prototype.set_disabled = function(new_value) {
  this.input().disabled = new_value;
}
S3UploadWidget.Field.prototype.disabled = function() {
  return this.input().disabled;
}
S3UploadWidget.Field.prototype.set_checked = function(new_value) {
  this.input().checked = new_value;
  this._on_change();
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
S3UploadWidget.Field.prototype.valid = function() {
  this.errors = [];
  for (var property in this.valid_if()) {
    var actual = this[property]();
    var expected = this.valid_if()[property];
    var result = false;
    var message = "must be " + this.valid_if()[property];
    
    if (expected instanceof RegExp) {
      message = "is not acceptable";
      result = expected.test(actual);
    } else if (expected === "is not blank") {
      message = "must not be blank";
      result = (actual !== undefined && actual !== null && (/^\s*$/).test(actual) !== true);
    } else if (expected === true) {
      message = "required";
      result = expected === actual;
    } else {
      result = expected === actual;
    }
    
    if (result === false) this.errors.push(message);
  }
  return this.errors.length === 0;
}
S3UploadWidget.Field.prototype._on_change = function() {
  if (this.on_change) this.on_change(this);
}
S3UploadWidget.Field.prototype.on_change = null;
S3UploadWidget.Field.prototype.make_shim_receiver = function() {
  this.set_type("button");
  this.set_value("Choose File");
}

S3UploadWidget.ProgressDisplay = function() {};
S3UploadWidget.ProgressDisplay.prototype.initialize = function() {
  return this;
}
S3UploadWidget.ProgressDisplay.prototype.element = function() {
  if (!this._element) {
    this._element = document.createElement("div");
    this._element.className = "s3_upload_widget_progress_display";
    
    this._element.appendChild(this.bar_outer());
    
    this.bar_outer().appendChild(this.bar_inner());
    
    this._element.appendChild(this.text());
  }
  return this._element;
}
S3UploadWidget.ProgressDisplay.prototype.bar_outer = function() {
  if (!this._bar_outer) {
    this._bar_outer = document.createElement("div");
    this._bar_outer.className = "s3_upload_widget_progress_bar_outer";
  }
  return this._bar_outer;
}
S3UploadWidget.ProgressDisplay.prototype.bar_inner = function() {
  if (!this._bar_inner) {
    this._bar_inner = document.createElement("div");
    this._bar_inner.className = "s3_upload_widget_progress_bar_inner";
  }
  return this._bar_inner;
}
S3UploadWidget.ProgressDisplay.prototype.text = function() {
  if (!this._text) {
    this._text = document.createElement("div");
    this._text.className = "s3_upload_widget_progress_text";
  }
  return this._text;
}
S3UploadWidget.ProgressDisplay.prototype.set_progress = function(new_value) {
  var loaded = (new_value.loaded / 1024 / 1024).toFixed(2);
  var size = (new_value.size / 1024 / 1024).toFixed(2);
  
  this.bar_inner().style.width = new_value.percent + "%";
  this.text().innerHTML = loaded + "Mb/" + size + "Mb &mdash; " + new_value.percent.toFixed(0) + "%";
}
S3UploadWidget.ProgressDisplay.prototype.hide = function() {
  this.element().style.display = "none";
}
S3UploadWidget.ProgressDisplay.prototype.show = function() {
  this.element().style.display = "block";
}

S3UploadWidget.user_ip = "unknown";
S3UploadWidget.lookup_user_ip = function() {
  if (S3UploadWidget.user_ip != undefined && S3UploadWidget.user_ip != "unknown") return;
  
  if (!document.body && S3UploadWidget.lookup_timeout == undefined) {
    S3UploadWidget.lookup_timeout = setTimeout(S3UploadWidget.lookup_user_ip, 100);
    return;
  }
  
  S3UploadWidget.lookup_timeout = null;
  
  var script = document.createElement("script");
  script.type = "text/javascript";
  script.src = "http://jsonip.appspot.com/?callback=S3UploadWidget.set_user_ip";
  document.body.appendChild(script);
}
S3UploadWidget.set_user_ip = function(details) {
  S3UploadWidget.user_ip = details["ip"];
  
  for (var i = 0; i < S3UploadWidget.instances.length; i++)
    S3UploadWidget.instances[i].on_user_ip_available();
}
S3UploadWidget.lookup_user_ip();
