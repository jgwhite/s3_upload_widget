S3UploadWidget = function() {};

S3UploadWidget.id = 0;
S3UploadWidget.instances = [];

S3UploadWidget.create = function(options) {
  var instance = new S3UploadWidget();
  instance.initialize(options);
  return instance;
}

S3UploadWidget.DEFAULTS = {};
S3UploadWidget.REQUIRED_OPTIONS = [ "aws_access_key_id", "bucket", "policy", "signature" ];

S3UploadWidget.prototype.initialize = function(options) {
  this._options = {};
  
  for (var key in S3UploadWidget.DEFAULTS)
    this._options[key] = S3UploadWidget.DEFAULTS[key];
  
  for (var key in options)
    this._options[key] = options[key];
  
  var missing_options = [];
  
  for (var i in S3UploadWidget.REQUIRED_OPTIONS) {
    var required_key = S3UploadWidget.REQUIRED_OPTIONS[i];
    if (this._options[required_key] === undefined
     || this._options[required_key] === null
     || this._options[required_key] === "") {
      missing_options.push(required_key);
    }
  }
  
  if (missing_options.length > 0) {
    throw("The following options are required: " + missing_options.join(", "));
  }
  
  S3UploadWidget.instances.push(this);
  
  if (this.options()["target"]) {
    this.insert(this.options()["target"]);
  }
  
  return this;
}

S3UploadWidget.prototype.id = function() {
  if (!this._id) {
    this._id = "s3_upload_widget_" + S3UploadWidget.id;
    S3UploadWidget.id++;
  }
  
  return this._id;
}

S3UploadWidget.prototype.options = function() {
  return this._options;
}

S3UploadWidget.prototype.element = function() {
  if (!this._element) {
    this._element = document.createElement("div");
    this._element.className = "S3UploadWidget";
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
    
    var fieldset;
    
    fieldset = document.createElement("fieldset");
    this._form.appendChild(fieldset);
    fieldset.appendChild(this.file_input());
    
    fieldset = document.createElement("fieldset");
    this._form.appendChild(fieldset);
    fieldset.appendChild(this.submit_button());
  }
  return this._form;
}
S3UploadWidget.prototype.file_input = function() {
  if (!this._file_input) {
    this._file_input = document.createElement("input");
    this._file_input.type = "file";
    this._file_input.name = "file";
    this._file_input.id = this.id() + "_file_input";
  }
  return this._file_input;
}
S3UploadWidget.prototype.submit_button = function() {
  if (!this._submit_button) {
    this._submit_button = document.createElement("input");
    this._submit_button.type = "submit";
    this._submit_button.value = "Upload";
    this._submit_button.disabled = "disabled";
    this._submit_button.id = this.id() + "_submit_button";
  }
  return this._submit_button;
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
  delete this;
}

S3UploadWidget.prototype.remove_elements = function() {
  if (this._element && this._element.parentNode)
    this._element.parentNode.removeChild(this._element);
}
S3UploadWidget.prototype.unregister = function () {
  var indexOf_this = S3UploadWidget.instances.indexOf(this);
  if (indexOf_this !== -1) S3UploadWidget.instances.splice(indexOf_this, 1);
}
S3UploadWidget.prototype.dealloc = function() {
  for (var prop in this) if (prop.indexOf("_") === 0) delete this[prop];
}


S3UploadWidget.Field = function() {};

S3UploadWidget.Field.DEFAULTS = {
  "type": "text"
};

S3UploadWidget.Field.generate_id = function() {
  if (S3UploadWidget.__id === undefined) S3UploadWidget.__id = 0;
  return S3UploadWidget.__id++;
}

S3UploadWidget.Field.prototype.id = function() {
  return this._id = this._id || ("s3_upload_widget_field_" + S3UploadWidget.Field.generate_id());
}
S3UploadWidget.Field.prototype.element = function() {
  if (!this._element) {
    this._element = document.createElement("fieldset");
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
    break;
  }
  
  this._input.type = type;
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
      this.element().appendChild(this._label);
    }
    this._label.innerHTML = new_label;
  } else {
    if (this._label && this._label.parentNode) this._label.parentNode.removeChild(this._label);
    delete this.label;
  }
}
