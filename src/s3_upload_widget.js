function S3UploadWidget() {}

S3UploadWidget.id = 0;
S3UploadWidget.instances = [];

S3UploadWidget.create = function(options) {
  var instance = new S3UploadWidget();
  instance.initialize(options);
  return instance;
}

S3UploadWidget.DEFAULT_OPTIONS = {};
S3UploadWidget.REQUIRED_OPTIONS = [ "aws_access_key_id", "bucket", "policy", "signature" ];

S3UploadWidget.prototype.initialize = function(options) {
  this._options = {};
  
  for (var key in S3UploadWidget.DEFAULT_OPTIONS)
    this._options[key] = S3UploadWidget.DEFAULT_OPTIONS[key];
  
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
    
    var fieldset = document.createElement("fieldset");
    
    this._form.appendChild(fieldset);
    
    fieldset.appendChild(this.file_input());
    fieldset.appendChild(this.terms_agreed_input());
    fieldset.appendChild(this.terms_agreed_label());
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
S3UploadWidget.prototype.terms_agreed_input = function() {
  if (!this._terms_agreed_input) {
    this._terms_agreed_input = document.createElement("input");
    this._terms_agreed_input.type = "checkbox";
    this._terms_agreed_input.name = "terms_agreed";
    this._terms_agreed_input.id = this.id() + "_terms_agreed_input";
  }
  return this._terms_agreed_input;
}
S3UploadWidget.prototype.terms_agreed_label = function() {
  if (!this._terms_agreed_label) {
    this._terms_agreed_label = document.createElement("label");
    this._terms_agreed_label.setAttribute("for", this.id() + "_terms_agreed_input");
    this._terms_agreed_label.id = this.id() + "_terms_agreed_label";
  }
  return this._terms_agreed_label;
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

S3UploadWidget.prototype.dealloc = function() {
  var indexOf_this = S3UploadWidget.instances.indexOf(this);
  if (indexOf_this !== -1) S3UploadWidget.instances.splice(indexOf_this, 1);
  for (var prop in this) if (prop.indexOf("_") === 0) delete this[prop];
}
