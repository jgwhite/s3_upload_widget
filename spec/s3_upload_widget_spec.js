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
    for (var i = S3UploadWidget.instances.length - 1; i >= 0; i--) {
      S3UploadWidget.instances[i].remove();
    }
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
    
    describe("when processing special options", function() {
      var widget;
      
      beforeEach(function() {
        widget = new S3UploadWidget().initialize(widget_options());
      });
      afterEach(function() {
        widget.remove();
        delete widget;
      });
      
      it("should set hidden input for AWSAccessKeyId", function() {
        var input = $("input[name='AWSAccessKeyId']", widget.form())[0];
        expect(input).toBeDefined();
        expect(input.value).toEqual(widget_options()["aws_access_key_id"]);
      });
      
      it("should set hidden input for policy", function() {
        var input = $("input[name='policy']", widget.form())[0];
        expect(input).toBeDefined();
        expect(input.value).toEqual(widget_options()["policy"]);
      });
      
      it("should set hidden input for signature", function() {
        var input = $("input[name='signature']", widget.form())[0];
        expect(input).toBeDefined();
        expect(input.value).toEqual(widget_options()["signature"]);
      });
      
    });
    
  });
  
  describe("#dealloc", function() {
    
    it("should delete all instance variables", function() {
      var widget = S3UploadWidget.create(widget_options());
      widget.element();
      expect(widget._options).toBeDefined();
      expect(widget._element).toBeDefined();
      widget.dealloc();
      expect(widget._options).not.toBeDefined();
      expect(widget._element).not.toBeDefined();
    });
    
  });
  
  describe("#unregister", function() {
    
    it("should unregister the instance", function() {
      expect(S3UploadWidget.instances.length).toEqual(0);
      
      var widget = S3UploadWidget.create(widget_options());
      expect(S3UploadWidget.instances.length).toEqual(1);
      expect(S3UploadWidget.instances.indexOf(widget)).not.toEqual(-1);
      
      widget.unregister();
      expect(S3UploadWidget.instances.length).toEqual(0);
      expect(S3UploadWidget.instances.indexOf(widget)).toEqual(-1);
    });
    
  });
  
  describe("#remove_elements", function() {
    
    it("should remove all generated elements", function() {
      var widget = S3UploadWidget.create(widget_options({ "target": "my_target" }));
      expect(my_target.childNodes.length).toEqual(1);
      widget.remove_elements();
      expect(my_target.childNodes.length).toEqual(0);
    });
    
  });
  
  describe("#remove", function() {
    
    it("should remove all generated elements and dealloc", function() {
      var widget = S3UploadWidget.create(widget_options({ "target": "my_target" }));
      widget.remove();
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
    var widget;
    
    beforeEach(function() {
      widget = S3UploadWidget.create(widget_options());
    });
    afterEach(function() {
      widget.remove();
      delete widget;
    });
    
    it("should return a div with class S3UploadWidget", function() {
      expect(widget.element()).toBeDefined();
      expect(widget.element().nodeName).toEqual("DIV");
      expect(widget.element().className).toEqual("S3UploadWidget");
    });
    
    describe("form", function() {
      var form;
      
      beforeEach(function() {
        form = $("form", widget.element())[0];
      });
      
      it("should have method post, action pointing to bucket and correct enctype", function() {
        expect(form).toBeDefined();
        expect(form.nodeName).toEqual("FORM");
        expect(form.action).toEqual("http://" + widget.options()["bucket"] + ".s3.amazonaws.com/");
        expect(form.method).toEqual("post");
        expect(form.enctype).toEqual("multipart/form-data");
      });
      
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
  
  describe("#add_field", function() {
    
    var widget;
    var field;
    
    beforeEach(function() {
      widget = S3UploadWidget.create(widget_options());
      field = widget.add_field({
        "type": "checkbox",
        "name": "terms_agreed",
        "value": "1",
        "label": "I agree to the Terms &amp; Conditions"
      });
    });
    
    it("should return the new field object", function() {
      expect(field).toBeDefined();
      expect(field.constructor).toEqual(S3UploadWidget.Field);
    });
    
    it("should append a field to the element", function() {
      var field_element = $("fieldset.s3_upload_widget_fieldset", widget.element())[0];
      expect(field_element).toBeDefined();
      expect(field_element.nodeName).toEqual("FIELDSET");
      expect(field_element).toEqual(field.element());
    });
    
    it("should append an input to the element", function() {
      var field_input = $("input[name='terms_agreed']", widget.element())[0];
      expect(field_input).toBeDefined();
      expect(field_input.nodeName).toEqual("INPUT");
      expect(field_input).toEqual(field.input());
    });
    
    it("should append the field before the upload button", function() {
      // var next = $(field.element()).next();
      // expect(next).toBeDefined();
      // expect(next.className).toEqual("s3_upload_widget_submit_button");
    });
    
  });
  
  describe("#set_hidden_value", function() {
    
    var widget;
    
    beforeEach(function() {
      widget = S3UploadWidget.create(widget_options());
    });
    
    it("should create an input of type hidden", function() {
      var input = $("input:hidden[name='foo']", widget.element())[0];
      expect(input).not.toBeDefined();
      
      widget.set_hidden_value("foo", "bar");
      
      var input = $("input:hidden[name='foo']", widget.element())[0];
      expect(input).toBeDefined();
      expect(input.nodeName).toEqual("INPUT");
      expect(input.type).toEqual("hidden");
      expect(input.name).toEqual("foo");
      expect(input.value).toEqual("bar");
    });
    
    it("should re-use an existing input when changing value", function() {
      widget.set_hidden_value("foo", "yes");
      var input = $("input:hidden[name='foo']", widget.element())[0];
      expect(input).toBeDefined();
      expect(input.value).toEqual("yes");
      widget.set_hidden_value("foo", "no");
      var inputs = $("input:hidden[name='foo']", widget.element());
      expect(inputs.length).toEqual(1);
      expect(input.value).toEqual("no");
    });
    
    it("should remove an input when nullified", function() {
      widget.set_hidden_value("foo", "bar");
      var input = $("input:hidden[name='foo']", widget.element())[0];
      expect(input).toBeDefined();
      expect(widget.hidden_inputs()["foo"]).toBeDefined();
      
      widget.set_hidden_value("foo", null);
      var input = $("input:hidden[name='foo']", widget.element())[0];
      expect(input).not.toBeDefined();
      expect(widget.hidden_inputs()["foo"]).not.toBeDefined();
    });
    
  });
  
  describe("#set_hidden_values", function() {
    
    var widget;
    
    beforeEach(function() {
      widget = S3UploadWidget.create(widget_options());
      widget.set_hidden_values({
        "foo": "yes",
        "bar": "no"
      });
    });
    afterEach(function() {
      widget.remove();
      delete widget;
    });
    
    it("should create a collection of hidden fields", function() {
      expect(widget.hidden_inputs()["foo"]).toBeDefined();
      expect($("input[name='foo']", widget.form())[0]).toBeDefined();
      expect(widget.hidden_inputs()["bar"]).toBeDefined();
      expect($("input[name='bar']", widget.form())[0]).toBeDefined();
    });
    
    it("should erase previous fields and set all new ones", function() {
      expect($("input[type='hidden']", widget.form()).length).toEqual(2);
      widget.set_hidden_values({ "timecode": "UTC" });
      var hidden_inputs = $("input[type='hidden']", widget.form());
      expect(hidden_inputs.length).toEqual(1);
      expect(hidden_inputs[0].name).toEqual("timecode");
      expect(hidden_inputs[0].value).toEqual("UTC");
      expect(widget.hidden_inputs()["timecode"]).toEqual(hidden_inputs[0]);
    });
    
  });
  
  describe("Field", function() {
    
    var field;
    
    beforeEach(function() {
      field = new S3UploadWidget.Field();
    });
    
    afterEach(function() {
      delete field;
    });
    
    describe(".generate_id", function() {
      
      beforeEach(function() {
        S3UploadWidget.Field.__id = 0;
      });
      afterEach(function() {
        S3UploadWidget.Field.__id = 0;
      })
      
      it("should return an ascending series of numbers", function() {
        expect(S3UploadWidget.Field.generate_id()).toEqual(0);
        expect(S3UploadWidget.Field.generate_id()).toEqual(1);
        expect(S3UploadWidget.Field.generate_id()).toEqual(2);
      });
      
    });
    
    describe("#id", function() {
      
      it("should be unique for each instance", function() {
        var field1 = new S3UploadWidget.Field();
        var field2 = new S3UploadWidget.Field();
        expect(field1.id()).not.toEqual(field2.id());
      });
      
    });
    
    describe("#element", function() {
      
      it("should return a fieldset", function() {
        expect(field.element()).toBeDefined();
        expect(field.element().nodeName).toEqual("FIELDSET");
        expect(field.element().className).toEqual("s3_upload_widget_fieldset");
      });
      
      it("should contain input", function() {
        expect(field.element().childNodes[0]).toEqual(field.input());
      });
            
    });
    
    describe("#input", function() {
      
      it("should return an input of default type with related id", function() {
        expect(field.input()).toBeDefined();
        expect(field.input().type).toEqual(S3UploadWidget.Field.DEFAULTS["type"]);
        expect(field.input().id).toEqual(field.id() + "_input");
      });
      
    });
    
    describe("#set_type", function() {
      
      it("should set the type of input", function () {
        field.set_type("checkbox");
        expect(field.input().nodeName).toEqual("INPUT");
        expect(field.input().type).toEqual("checkbox");
      });
      
      it("should convert an input into a textarea when necessary", function() {
        expect(field.input().nodeName).toEqual("INPUT");
        field.set_type("textarea");
        expect(field.input().nodeName).toEqual("TEXTAREA");
        field.set_type("text");
        expect(field.input().nodeName).toEqual("INPUT");
      });
      
    });
    
    describe("#set_name", function() {
      
      it("should set the name of input", function() {
        field.set_name("my_input");
        expect(field.input().name).toEqual("my_input");
      });
      
    });
    
    describe("#set_value", function() {
      
      it("should set the value of input", function() {
        field.set_value("Foo");
        expect(field.input().value).toEqual("Foo");
      });
      
    });
    
    describe("#make_input", function() {
      
      it("should set create correct element", function() {
        field.make_input("text");
        expect(field.input().nodeName).toEqual("INPUT");
        expect(field.input().type).toEqual("text");
        
        field.make_input("checkbox");
        expect(field.input().nodeName).toEqual("INPUT");
        expect(field.input().type).toEqual("checkbox");
        
        field.make_input("hidden");
        expect(field.input().nodeName).toEqual("INPUT");
        expect(field.input().type).toEqual("hidden");
        
        field.make_input("textarea");
        expect(field.input().nodeName).toEqual("TEXTAREA");
      });
      
      it("should preserve existing name", function() {
        field.set_name("foo");
        expect(field.input().name).toEqual("foo");
        field.make_input("textarea");
        expect(field.input().name).toEqual("foo");
      });
      
      it("should preserve existing value", function() {
        field.set_value("bar");
        expect(field.input().value).toEqual("bar");
        field.make_input("textarea");
        expect(field.input().value).toEqual("bar");
      });
      
    });
    
    describe("#set_label", function() {
      
      var label;
      
      beforeEach(function() {
        field.set_label("Foo Bar");
        label = $("label", field.element())[0];
      });
      
      it("should create label with specified innerHTML", function() {
        expect(label).toBeDefined();
        expect(label.nodeName).toEqual("LABEL");
      });
      
      it("should have the for attribute set", function() {
        expect(label.getAttribute("for")).toEqual(field.id() + "_input");
      });
      
      it("should remove label when set to nothing", function() {
        field.set_label("");
        label = $("label", field.element())[0];
        expect(label).not.toBeDefined();
      });
      
    });
    
    describe("#set_disabled", function() {
      
      it("should set the disabled attribute correctly", function() {
        field.set_disabled(true);
        expect(field.disabled()).toBeTruthy();
        field.set_disabled(false);
        expect(field.disabled()).toBeFalsy();
      });
      
    });
    
    describe("#set_checked", function() {
      
      it("should set the checked attribute correctly", function() {
        field.set_type("checkbox");
        field.set_checked(true);
        expect(field.checked()).toEqual(true);
        field.set_checked(false);
        expect(field.checked()).toEqual(false);
      });
      
    });
    
    describe("#value", function() {
      
      it("should return the value of the input", function() {
        field.input().value = "Hello";
        expect(field.value()).toEqual("Hello");
        field.set_type("textarea");
        expect(field.value()).toEqual("Hello");
        field.input().value = "Good bye";
        expect(field.value()).toEqual("Good bye");
        field.set_type("text");
        expect(field.value()).toEqual("Good bye");
      });
      
    });
    
    describe("#initialize", function() {
      
      it("should mass asign type, name, value, label and return the object", function() {
        var returned_field = field.initialize({
          "type": "checkbox",
          "name": "terms_agreed",
          "value": "1",
          "label": "I agree to the Terms &amp; Conditions"
          // "valid_if": { "checked": true }
        });
        expect(returned_field).toEqual(field);
        expect(field.input().type).toEqual("checkbox");
        expect(field.input().name).toEqual("terms_agreed");
        expect(field.input().value).toEqual("1");
        expect(field.input().checked).toBeFalsy();
        expect(field.value()).toEqual("1");
      });
            
    });
    
  });
  
});
