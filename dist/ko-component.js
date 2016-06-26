var KoComponents;
(function (KoComponents) {
    //todo: add null checking to api functions
    class GenericApiClient {
        //public CallBacks: ApiClientCallbacks;
        constructor(apiRoute, itemTypeName) {
            this.ApiRoute = "api";
            this.IdQuery = "?Id=";
            this.Actions = {
                Create: "create",
                Update: "update",
                Get: "get",
                GetAll: "getall",
                Delete: "delete",
            };
            if (itemTypeName != null && itemTypeName != "") {
                this.ItemTypeName = itemTypeName;
            }
            else {
                throw new Error("Item Type Name Not Valid: " + itemTypeName);
            }
            if (apiRoute != null && apiRoute != "") {
                this.ApiRoute = apiRoute;
            }
            else {
                throw new Error("Api Route Not Valid: " + apiRoute);
            }
        }
        createRequestUrl(action) {
            return `/${this.ApiRoute}/${this.ItemTypeName}/${action}`;
        }
        Create(Item) {
            let settings = {
                type: "POST",
                dataType: "json",
                contentType: "application/json",
                url: this.createRequestUrl(this.Actions.Create),
                data: Item
            };
            return $.ajax(settings);
        }
        Get(Id) {
            let settings = {
                type: "GET",
                dataType: "json",
                contentType: "application/json",
                url: this.createRequestUrl(this.Actions.Get) + "?id=" + Id,
            };
            return $.ajax(settings);
        }
        Update(Item, Id) {
            let settings = {
                type: "POST",
                dataType: "json",
                contentType: "application/json",
                url: this.createRequestUrl(this.Actions.Update) + "?id=" + Id,
                data: Item
            };
            return $.ajax(settings);
        }
        Delete(Id) {
            let settings = {
                type: "DELETE",
                dataType: "json",
                contentType: "application/json",
                url: this.createRequestUrl(this.Actions.Delete) + "?id=" + Id,
            };
            return $.ajax(settings);
        }
        GetAll() {
            let settings = {
                type: "GET",
                //dataType: "json",
                contentType: "application/json",
                url: this.createRequestUrl(this.Actions.GetAll)
            };
            return $.ajax(settings);
        }
    }
    KoComponents.GenericApiClient = GenericApiClient;
    class GraphApiClient extends GenericApiClient {
        constructor(apiRoute, itemTypeName) {
            super(apiRoute, itemTypeName);
            this.Actions = {
                Create: "create",
                Update: "update",
                Get: "get",
                GetAll: "getall",
                Delete: "delete",
                DeleteChild: "deletechild"
            };
        }
        DeleteChild(Child) {
            let settings = {
                type: "DELETE",
                dataType: "json",
                contentType: "application/json",
                url: this.createRequestUrl(this.Actions.DeleteChild),
                data: Child
            };
            return $.ajax(settings);
        }
    }
    KoComponents.GraphApiClient = GraphApiClient;
})(KoComponents || (KoComponents = {}));
/// <reference path="../typings/globals/knockout/index.d.ts" />
var KoComponents;
(function (KoComponents) {
    class FileInput {
        constructor() {
            //will be filled with a File object, Read the files (all are optional
            //e.g: if you're certain that it is a text file, use only text:
            this.file = ko.observable("");
            //FileReader.readAsBinaryString(Blob|File)
            //The result property will contain the file/blob's data as a binary string.
            //Every byte is represented by an integer in the range [0..255].
            this.binaryString = ko.observable("");
            //FileReader.readAsText(Blob|File, opt_encoding)
            //The result property will contain the file/blob's data as a text string.
            //By default the string is decoded as 'UTF-8'.
            //Use the optional encoding parameter can specify a different format.
            this.text = ko.observable("");
            //FileReader.readAsDataURL(Blob|File)
            //The result property will contain the file/blob's data encoded as a data URL.
            this.dataURL = ko.observable("");
            //FileReader.readAsArrayBuffer(Blob|File)
            //The result property will contain the file/blob's data as an ArrayBuffer object.
            this.arrayBuffer = ko.observable("");
            //just the base64 string, without mime type or anything else
            this.base64String = ko.observable("");
        }
    }
    KoComponents.FileInput = FileInput;
    class FileInputViewModel {
        //Need to support 3 different input scenarios  for file:
        //1. poco file
        //2. observable file
        //3. computed that returns poco file
        //develop test scenarios for each and then initialization scenarios
        constructor(params) {
            //this.DownloadButtonId();
            this.FileInput = new FileInput();
            this.externData = ko.observable();
            this.writelock = false;
            this.Label = ko.observable("");
            //Generate GUID function that avoids possible collisions
            //From: http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
            this.generateGUID = () => {
                let d = new Date().getTime();
                if (window.performance && typeof window.performance.now === "function") {
                    d += performance.now(); //use high-precision timer if available
                }
                let uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                    let r = (d + Math.random() * 16) % 16 | 0;
                    d = Math.floor(d / 16);
                    return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
                });
                return uuid;
            };
            this.FileInputSub1 = this.FileInput.dataURL.subscribe((data) => {
                this.externData().Name(this.FileInput.file().name);
                this.externData().ContentType(this.FileInput.file().type);
            });
            this.FileInputSub2 = this.FileInput.base64String.subscribe((base64String) => {
                this.externData().Content(base64String);
            });
            //todo make this lazy loaded
            //inother words make this go to the calling .click on the button method
            this.DownloadHandler = ko.computed(() => {
                if (this.externData() != null && this.externData().Content() != null) {
                    let blob = this.b64toBlob(this.externData().Content(), this.externData().ContentType(), 512);
                    //a.href = URL.createObjectURL(blob);
                    //a.download = myfileInput().file().name;
                    return URL.createObjectURL(blob);
                }
            });
            this.Label(params.label);
            if (params.file.hasOwnProperty("name") && params.file.name == "observable") {
                let file = params.file;
                this.externData(file());
                file.subscribe((data) => {
                    this.externData(data);
                });
            }
            else if (params.file.hasOwnProperty("_options") && ko.isWriteableObservable(params.file)) {
                let file = params.file;
                this.externData(file.peek());
                //should be able to read by calling file()
                //should be able to write by calling file(value)
                this.externComputed = file;
                //this.externData = params.file();
                this.ExternComputedSub1 = this.externComputed.subscribe((data) => {
                    if (!this.writelock) {
                        this.externData(data);
                    }
                });
                this.ExternComputedSub2 = this.externData().Content.subscribe((data) => {
                    this.writelock = true;
                    this.externComputed(this.externData.peek());
                    this.writelock = false;
                });
            }
            else if (params.file.hasOwnProperty("$type")) {
                let model = params.file;
                this.externData(model);
            }
        }
        //http://stackoverflow.com/questions/16245767/creating-a-blob-from-a-base64-string-in-javascript
        b64toBlob(b64Data, contentType, sliceSize) {
            contentType = contentType || '';
            sliceSize = sliceSize || 512;
            let byteCharacters = atob(b64Data);
            let byteArrays = [];
            for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
                let slice = byteCharacters.slice(offset, offset + sliceSize);
                let byteNumbers = new Array(slice.length);
                for (let i = 0; i < slice.length; i++) {
                    byteNumbers[i] = slice.charCodeAt(i);
                }
                let byteArray = new Uint8Array(byteNumbers);
                byteArrays.push(byteArray);
            }
            let blob = new Blob(byteArrays, { type: contentType });
            return blob;
        }
        dispose() {
            //dispose of subscriptions
            this.FileInputSub1.dispose();
            this.FileInputSub2.dispose();
            if (this.ExternObservable1 != null) {
                this.ExternObservable1.dispose();
            }
            if (this.ExternComputedSub1 != null) {
                this.ExternComputedSub1.dispose();
            }
            if (this.ExternComputedSub2 != null) {
                this.ExternComputedSub2.dispose();
            }
            //dispose of computed's
            if (ko.isComputed(this.externComputed)) {
                this.externComputed.dispose();
            }
            else {
                this.externComputed = null;
            }
            this.DownloadHandler.dispose();
            //dispose of non disposables
            this.FileInput = null;
            this.externData = null;
            this.Label = null;
        }
    }
    KoComponents.FileInputViewModel = FileInputViewModel;
})(KoComponents || (KoComponents = {}));
///
ko.components.register("single-file-input", {
    viewModel: function (params) {
        return new KoComponents.FileInputViewModel(params);
    },
    template: '<div class="form-group" databind="fileDrag: FileInput">\
			<label class="control-label col-md-2 col-xs-2" data-bind="text: Label"></label>\
			<div class="col-md-8 col-xs-8">\
				<div class="input-group">\
					<input type="text" readonly= "" class="form-control" placeholder="Placeholder w/file chooser..." data-bind="value: externData().Name" />\
					<input type="file" data-bind="fileInput: FileInput" />\
					<span class="input-group-btn">\
						<button title="Upload File" type="button" class="btn btn-default btn-raised">\
							<i class="material-icons">file_upload</i>\
							Upload\
						</button>\
					</span>\
				</div>\
				<div data-bind="visible: externData().DataUrl">\
					<a class="btn btn-primary btn-raised" data-bind="attr: {href: DownloadHandler, download: externData().Name, title: externData().Name}">\
						<i class="material-icons">file_download</i>\
						<span data-bind="text: externData().Name">Download</span>\
					</a>\
				</div>\
			</div>\
		</div>\
		<hr class="shadow-z-1 primarycolor" data-bind="visible: externData().DataUrl" />\
		<div class="row">\
			<img class="img-responsive" data-bind="attr: { src: externData().DataUrl, visible: externData().DataUrl}" />\
		</div>'
});
ko.components.register("ko-file-input", {
    viewModel: function (params) {
        var myfileInput = ko.observable(new KoComponents.FileInputViewModel(params.file));
        this.Label = ko.observable(params.label);
        this.myfileInput = myfileInput;
        //col-xs-offset-1  btn-fab btn-fab-mini
        var viewModel = {};
        var fileData = ko.observable({
            dataURL: ko.observable(),
        });
        var onClear = function (fileData) {
            if (confirm('Are you sure?')) {
                fileData.clear && fileData.clear();
            }
        };
        var wind = window;
        var debug = function () {
            wind.viewModel = viewModel;
            console.log(ko.toJSON(viewModel));
            debugger;
        };
        //ko.applyBindings(viewModel);
        this.fileData = fileData;
        this.debug = debug;
        this.onClear = onClear;
    },
    template: '<div class="container">\
		<h1>\
			<a target="_blank" href= "https://github.com/adrotec/knockout-file-bindings" > knockout - file - bindings </a>\
		</h1>\
		<div class="" data-bind="fileDrag: fileData">\
			<div class="form-group row">\
				<div class="col-md-6">\
					<img style="height: 125px;" class="img-rounded  thumb" data-bind="attr: { src: fileData().dataURL }, visible: fileData().dataURL">\
				<div data- bind="ifnot: fileData().dataURL">\
				<label class="drag-label">Drag file here</label>\
				</div>\
				 </div>\
			<div class="col-md-6">\
		<input type="file" data- bind="fileInput: fileData, customFileInput: { buttonClass: \'btn btn-success\', fileNameClass: \'disabled form-control\', onClear: onClear}" accept="image">\
		</div>\
		</div>\
		</div>\
		<button class="btn btn-default" data-bind="click: debug">Debug</button>\
		</div>'
});
//reactive Title Control
var KoComponents;
(function (KoComponents) {
    class ReactiveTitle {
        /*
            Examples:
            1. New True False Question
            2. True False Question #...
        */
        constructor(params) {
            this.Value = ko.observable("");
            this.IsNew = ko.computed(() => {
                if (this.Value() == 0
                    || this.Value() == ""
                    || this.Value() == null
                    || this.Value() == undefined) {
                    return true;
                }
                else {
                    return false;
                }
            });
            if (ko.isObservable(params.Value)
                || ko.isComputed(params.Value)) {
                this.Value(params.Value());
                this.ValueSubscription = params.Value.subscribe((data) => {
                    this.Value(data);
                });
            }
            else {
                this.Value(params.Value);
            }
            //assign value
            this.externValue = params.Value;
            //pad title
            this.Title = " " + params.Title + " ";
        }
        //handle disposal properly
        dispose() {
            if (this.ValueSubscription != null) {
                this.ValueSubscription.dispose();
            }
            if (ko.isComputed(this.externValue)) {
                this.externValue.dispose();
            }
            else {
                this.externValue = null;
            }
            this.IsNew.dispose();
            this.Value = null;
            this.Title = null;
        }
    }
    KoComponents.ReactiveTitle = ReactiveTitle;
})(KoComponents || (KoComponents = {}));
ko.components.register("reactive-title", {
    viewModel: function (params) {
        return new KoComponents.ReactiveTitle(params);
    },
    template: '<span class="label label-success" data-bind="if: IsNew">New</span>\
		<span data-bind="text: Title"></span>\
		<span data-bind="ifnot: IsNew"><span data-bind="text: Value"></span></span>'
});
/// <reference path="./ApiClient.ts" />
var KoComponents;
(function (KoComponents) {
    /*
    export interface SideMenuWithCollapse extends SideMenuInterface {
        //alternateCollapse(string, string)
    }
    */
    class BaseSpaViewModel {
        constructor(itemName, formIds) {
            //-- Properties
            /*
                default is true because the form starts empty
                Function Create Items should set this to true
                Retrieval of an item with a set Id should set this to false
            */
            this.StatusMessageModalId = "";
            this.DeleteConfirmModalId = "DeletionConfirmation";
            //When modifying an existing item this will be false
            //when creating a new item it will be true
            //todo make sure delete will only clear editor when true... use pending changes modal
            this.IsCreateMode = true;
            this.IsAnyFormDirty = false;
            this.ConfirmLostChangesMessage = "Are you sure? Any pending changes will be lost!";
            this.ItemList = ko.observableArray([]);
            this.StatusMessage = ko.observable("");
            this.CurrentItemName = ko.pureComputed(() => {
                if (this.Item != null) {
                    return this.ItemName + " - " + this.Item.Id();
                }
                else {
                    return this.ItemName;
                }
            });
            //#region Action Handlers
            /*
             * First make URL for request
             * Second retrieve section
             * Third update section
             * todo: add prompts
             */
            this.ModifyItem = (ListItem) => {
                //confirm if editor is dirty
                if (this.IsAnyFormDirty) {
                    let conf = confirm(this.ConfirmLostChangesMessage);
                    if (conf != true) {
                        return;
                    }
                }
                this.RemoveSelectedClass();
                //set creation mode to false
                this.IsCreateMode = false;
                this.ApiClient.Get(this.idRes(ListItem.Id))
                    .done((data) => {
                    if (data != null || data != "") {
                        this.Item.map(data);
                        this.IsAnyFormDirty = false;
                        this.SelectItem(this.idRes(this.Item.Id));
                    }
                    else {
                        //data error
                        this.StatusMessage("Invalid data returned by server");
                    }
                }).fail(this.requestFailure);
            };
            /**
             * This should be called to update the form data
             * Success paths for this should set IsFormDirty to false
             * todo: this should be update when generic api changes to return updated values
             */
            this.updateDataOnSave = (data) => {
                if (data != null || data != "") {
                    this.Item.map(data);
                    this.IsAnyFormDirty = false;
                    this.StatusMessage("Item Successfully created");
                }
                else {
                    let getPromise = this.ApiClient.Get(this.idRes(this.Item.Id));
                    getPromise.done((data2) => {
                        if (data2 != null || data2 != "") {
                            this.Item.map(data2);
                            this.IsAnyFormDirty = false;
                            this.StatusMessage("Item Successfully Updated");
                        }
                        else {
                            this.StatusMessage("Data Error on updating");
                        }
                    }).fail(this.requestFailure);
                    //error invalid data
                    this.StatusMessage("Server returned invalid data for current item");
                }
                this.GetItemList();
            };
            this.requestFailure = () => {
                this.StatusMessage("Request to server Failed");
                alert("Error Communicating with the Server");
            };
            this.deleteCurrentItem = () => {
                let deletePromise = this.ApiClient.Delete(this.idRes(this.Item.Id));
                deletePromise.done((data) => {
                    //remove item from the item list
                    let delitem = this.ItemList().find((item) => { if (item.Id == this.Item.Id())
                        return true; });
                    this.ItemList.remove(delitem);
                    //clear form
                    //this.Item.map(null);
                    this.ClearEditor();
                    this.StatusMessage("Item and Children Deleted");
                }).fail(this.requestFailure); //.then(() => this.GetItemList());
            };
            //#region Utility
            //Generate GUID function that avoids possible collisions
            //From: http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
            this.GenerateGUID = () => {
                let d = new Date().getTime();
                if (window.performance && typeof window.performance.now === "function") {
                    d += performance.now(); //use high-precision timer if available
                }
                let uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                    let r = (d + Math.random() * 16) % 16 | 0;
                    d = Math.floor(d / 16);
                    return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
                });
                return uuid;
            };
            /**
             * Clears the editor
             * Sets create mode to true
             * removes selection class on side list elements
             * resets IsAnyFormDirty to false
             */
            this.ClearEditor = () => {
                this.IsCreateMode = true;
                //let currentItemId = "#" + Id + "list-group-item";
                this.RemoveSelectedClass();
                this.Item.map(null);
                this.ClearNestedForms();
                this.IsAnyFormDirty = false;
            };
            if (itemName != null && itemName != "") {
                this.ItemName = itemName;
            }
            else {
                throw new Error("Item Name are Not Valid: " + itemName);
            }
            if (formIds != null && formIds.length > 0) {
                this.FormIds = formIds;
            }
            else {
                throw new Error("Form Ids are Not Valid: " + formIds.toString());
            }
            this.ApiClient = new KoComponents.GraphApiClient("api", itemName);
            this.GetItemList();
            //todo more testing
            //todo senerio resets to false and testing
            //if dirty and user clicks create new prompt inorder for reset
            //reset on save changes, on create new
            //reset on delete
            //user modal prompt for delete
            //prototype for dirty observable
            $(":input").on("input", () => {
                if (this.IsAnyFormDirty) {
                    return;
                }
                else {
                    this.IsAnyFormDirty = true;
                }
            });
            //todo change message
            window.addEventListener("beforeunload", (BeforeUnloadEvent) => {
                let confirmationMessage = "If you leave this page you will lose your unsaved changes.";
                if (this.IsAnyFormDirty) {
                    BeforeUnloadEvent.returnValue = confirmationMessage;
                    return true;
                }
                return;
            });
        }
        //-- Methods
        AlternateCollapse(CurrentCollapseId, CollapseToShowId) {
            if (CurrentCollapseId === CollapseToShowId || CurrentCollapseId === "" || CurrentCollapseId == null) {
                let toShowId = "[id=\"" + CollapseToShowId + "\"]";
                $(toShowId).collapse('show');
                return;
            }
            let currentId = "[id=\"" + CurrentCollapseId + "\"]";
            let toShowId = "[id=\"" + CollapseToShowId + "\"]";
            $(currentId).collapse('hide');
            $(toShowId).collapse('show');
        }
        RemoveSelectedClass() {
            $(".menu ul.list-group li.list-group-item").removeClass("active");
        }
        SelectItem(Id) {
            let currentItemId = "#" + Id + "list-group-item";
            //$(".menu ul.list-group li.list-group-item").not($(currentItemId)).removeClass("active");
            $(currentItemId).addClass("active");
            /*
            // Change Active Menu Item
            if (!$(event.target).is(".active")) {
                $(".menu ul.list-group li.list-group-item").not($(currentItemId)).removeClass("active");

                $(currentItemId).addClass("active");
                //body > div.container-fluid.main > div > nav > ul.list-group > li:nth-child(3)
            }
            else {

            }
            */
        }
        //clears the item form
        //This should also set IsAnyForm Dirty to false
        CreateItem() {
            //confirm if editor is dirty
            if (this.IsAnyFormDirty) {
                let conf = confirm(this.ConfirmLostChangesMessage);
                if (conf != true) {
                    return;
                }
            }
            this.ClearEditor();
        }
        //no, we go to form anyways make form name show up in status bar
        /**
         * This should post the current item then retrieve it form the server again
         * Then it should update the form with the data again
         * reseting anyFormDirty is handled in updateDataOnSave
         */
        SaveItem() {
            let AreFormsValid = false;
            //validate all top level forms
            for (let formId of this.FormIds) {
                $(".menu").find("li[data-target=" + "#" + formId + "]").trigger("click");
                let thisform = $("#" + formId + "Form");
                //submit works in place of calling .validate
                thisform.submit();
                if (thisform.valid() == true) {
                    //this.StatusMessage("valid");
                    AreFormsValid = true;
                }
                else {
                    AreFormsValid = false;
                    //write status message
                    this.StatusMessage("One or More forms have errors");
                    break;
                }
            }
            if (AreFormsValid) {
                if (this.IsCreateMode == true) {
                    let createPromise = this.ApiClient.Create(ko.mapping.toJSON(this.Item))
                        .done(this.updateDataOnSave)
                        .fail(this.requestFailure);
                }
                else {
                    let updatePromise = this.ApiClient.Update(ko.mapping.toJSON(this.Item), this.idRes(this.Item.Id))
                        .done(this.updateDataOnSave)
                        .fail(this.requestFailure);
                }
            }
        }
        /**
         *
         */
        DeleteItem() {
            //confirm if editor is dirty
            if (this.IsAnyFormDirty) {
                let conf = confirm(this.ConfirmLostChangesMessage);
                if (conf != true) {
                    return;
                }
            }
            if (!this.IsCreateMode) {
                $("#" + this.DeleteConfirmModalId).modal("show");
            }
            else {
                this.ClearEditor();
            }
        }
        /**
         * This Exports the current Item and any changes to a download-able JSON File in Plain text
         */
        ExportItemToJson() {
            //let contentType = "application/json";
            //let charset = "charset=utf-8";
            let datauri = "data:application/json;charset=utf-8," + ko.mapping.toJSON(this.Item);
            let blob = new Blob([ko.mapping.toJSON(this.Item)], { type: 'application/json' });
            let link = document.createElement("a");
            link.download = this.idRes(this.Item.Id) + ".json";
            link.href = URL.createObjectURL(blob);
            document.body.appendChild(link);
            link.click();
            // Cleanup the DOM
            document.body.removeChild(link);
            //delete link;
        }
        //#endregion
        //todo fix
        GetItemList() {
            let getAllPromise = this.ApiClient.GetAll();
            getAllPromise.done((data) => {
                if (data != null || data != "") {
                    this.ItemList([]);
                    //alert(data);
                    //alert(ko.mapping.fromJS(data));
                    this.ItemList(data);
                    if (this.ItemList().length <= 0) {
                        this.StatusMessage("No Items in Database");
                    }
                }
                else {
                    //data error
                    this.StatusMessage("Invalid data for Item List");
                }
            }).fail(this.requestFailure);
        }
        /**
          * Resolves Ids to their value type
          * @param Id
          */
        idRes(Id) {
            if (ko.isObservable(Id)) {
                return Id();
            }
            else {
                return Id;
            }
        }
    }
    KoComponents.BaseSpaViewModel = BaseSpaViewModel;
})(KoComponents || (KoComponents = {}));
//todo 
//# sourceMappingURL=ko-component.js.map