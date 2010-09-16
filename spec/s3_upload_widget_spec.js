describe("S3UploadWidget", function() {
  
  var my_target;
  
  beforeEach(function() {
    my_target = document.createElement("div");
    my_target.id = "my_target";
    document.body.appendChild(my_target);
  });
  
  afterEach(function () {
    document.body.removeChild(my_target);
    delete my_target;
  });
  
  describe("#initialize", function() {
    
    it("should save options and return the instance", function() {
      var widget = new S3UploadWidget().initialize(widget_options());
      expect(widget).toBeDefined();
      expect(widget.constructor).toEqual(S3UploadWidget);
      for (var key in widget_options())
        expect(widget.options()[key]).toEqual(widget_options()[key]);
    });
    
    it("should throw an exception if required parameters are missing or blank", function() {
      expect(function () {
        new S3UploadWidget().initialize();
      }).toThrow("The following options are required: aws_access_key_id, bucket, policy, signature");
      
      expect(function () {
        new S3UploadWidget().initialize(widget_options({ "bucket": null, "policy": null, "signature": null }));
      }).toThrow("The following options are required: bucket, policy, signature");
      
      expect(function () {
        new S3UploadWidget().initialize(widget_options({ "bucket": "" }));
      }).toThrow("The following options are required: bucket");
    });
    
    it("should register itself with the class", function() {
      var widget = new S3UploadWidget().initialize(widget_options());
      expect(S3UploadWidget.instances[S3UploadWidget.instances.length - 1]).toEqual(widget);
    });
    
    it("should insert the widget immediately if target is given", function() {
      var widget = S3UploadWidget.create(widget_options({ "target": my_target.id }));
      expect(my_target.childNodes.length).toEqual(1);
      expect(my_target.childNodes[0]).toEqual(widget.element());
    });
    
  });
  
  describe("#dealloc", function() {
    
    it("should deregister the instance", function() {
      var widget = S3UploadWidget.create(widget_options());
      expect(S3UploadWidget.instances.indexOf(widget)).not.toEqual(-1);
      widget.dealloc();
      expect(S3UploadWidget.instances.indexOf(widget)).toEqual(-1);
      delete widget;
    });
    
    it("should delete all instance variables", function() {
      var widget = S3UploadWidget.create(widget_options());
      expect(widget._options).toBeDefined();
      widget.dealloc();
      expect(widget._options).not.toBeDefined();
    });
    
  });
  
  describe("#create", function() {
    
    it("should return an initialized instance", function() {
      var test_options = widget_options();
      var widget = S3UploadWidget.create(test_options);
      expect(widget).toBeDefined();
      expect(widget.constructor).toEqual(S3UploadWidget);
      for (var key in test_options)
        expect(widget.options()[key]).toEqual(test_options[key]);
    });
    
  });
  
  describe("#id", function() {
    
    it("should be unique for each instance", function() {
      var widget_1 = S3UploadWidget.create(widget_options());
      var widget_2 = S3UploadWidget.create(widget_options());
      expect(widget_1.id()).not.toEqual(widget_2.id());
    });
    
  });
  
  describe("#element", function() {
    var widget = S3UploadWidget.create(widget_options());
    
    it("should return a div with class S3UploadWidget", function() {
      expect(widget.element()).toBeDefined();
      expect(widget.element().nodeName).toEqual("DIV");
      expect(widget.element().className).toEqual("S3UploadWidget");
    });
    
    it("should contain a form with method post and action pointing to bucket", function() {
      var form = $("form", widget.element())[0];
      
      expect(form).toBeDefined();
      expect(form.nodeName).toEqual("FORM");
      expect(form.action).toEqual("http://" + widget.options()["bucket"] + ".s3.amazonaws.com/");
      expect(form.method).toEqual("post");
      expect(form.enctype).toEqual("multipart/form-data");
    });
    
    describe("form", function() {
      var form = widget.form();
      
      it("should contain a file input with name file", function() {
        var file_input = $("input[name='file']", form)[0];
        expect(file_input).toBeDefined();
        expect(file_input.nodeName).toEqual("INPUT");
        expect(file_input.type).toEqual("file");
        expect(file_input.name).toEqual("file");
      });
      
      it("should contain a submit button", function() {
        var submit_button = $("input[type='submit']", form)[0];
        expect(submit_button).toBeDefined();
        expect(submit_button.type).toEqual("submit");
        expect(submit_button.value).toEqual("Upload");
        expect(submit_button.disabled).toBeTruthy();
        expect(submit_button.id).toEqual(widget.id() + "_submit_button");
      });
      
    });
    
  });
  
  describe("#insert", function() {
    
    it("should append element to target", function() {
      var widget = S3UploadWidget.create(widget_options());
      widget.insert(my_target.id);
      expect(my_target.childNodes.length).toEqual(1);
      expect(my_target.childNodes[0]).toEqual(widget.element());
      widget.insert(my_target);
      expect(my_target.childNodes.length).toEqual(1);
      expect(my_target.childNodes[0]).toEqual(widget.element());
    });
    
    it("should throw an exception if target does not exist", function() {
      var widget = S3UploadWidget.create(widget_options());
      
      expect(function() {
        widget.insert(null);
      }).toThrow("Target argument must be id or element");
      
      expect(function() {
        widget.insert("bogus_element");
      }).toThrow("Target argument must be id or element");
      
    });
    
  });
  
});