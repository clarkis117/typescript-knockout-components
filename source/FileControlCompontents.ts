/// <reference path="../typings/globals/knockout/index.d.ts" />

namespace KoComponents {

	export class FileInput {
		//will be filled with a File object, Read the files (all are optional
		//e.g: if you're certain that it is a text file, use only text:
		public file: any = ko.observable("");

		//FileReader.readAsBinaryString(Blob|File)
		//The result property will contain the file/blob's data as a binary string.
		//Every byte is represented by an integer in the range [0..255].
		public binaryString: any = ko.observable("");

		//FileReader.readAsText(Blob|File, opt_encoding)
		//The result property will contain the file/blob's data as a text string.
		//By default the string is decoded as 'UTF-8'.
		//Use the optional encoding parameter can specify a different format.
		public text = ko.observable("");

		//FileReader.readAsDataURL(Blob|File)
		//The result property will contain the file/blob's data encoded as a data URL.
		public dataURL = ko.observable("");

		//FileReader.readAsArrayBuffer(Blob|File)
		//The result property will contain the file/blob's data as an ArrayBuffer object.
		public arrayBuffer: any = ko.observable("");

		//just the base64 string, without mime type or anything else
		public base64String = ko.observable("");
	}

	export class FileInputViewModel {
		public FileInput = new FileInput();

		public externData: KnockoutObservable<IFileData> = ko.observable<IFileData>();

		public externComputed: KnockoutComputed<IFileData>;

		public writelock: boolean = false;

		public Label = ko.observable("");

		//Need to support 3 different input scenarios  for file:
		//1. poco file
		//2. observable file
		//3. computed that returns poco file
		//develop test scenarios for each and then initialization scenarios
		constructor(params) {
			//this.DownloadButtonId();

			this.Label(params.label);

			if (params.file.hasOwnProperty("name") && params.file.name == "observable") //if observable
			{
				let file: KnockoutObservable<IFileData> = params.file;

				this.externData(file());

				file.subscribe((data) => {

					this.externData(data);

				});



				//this.externData().Content(file().Content());
				//this.externData().ContentType(file().ContentType());
				//this.externData().Name(file().Name());
				//this.externData().EncodingType = file().EncodingType;

				//should be able to set a reference to it here with file(), maybe set a subscribe in case ref changes
			}
			else if (params.file.hasOwnProperty("_options") && ko.isWriteableObservable(params.file)) //if computed
			{
				let file: KnockoutComputed<IFileData> = params.file;

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
			else if (params.file.hasOwnProperty("$type")) //else if poco
			{
				let model: IFileData = params.file;

				this.externData(model);
			}
		}

		//Generate GUID function that avoids possible collisions
		//From: http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
		public generateGUID = () => {
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

		public FileInputSub1 = this.FileInput.dataURL.subscribe((data: string) => {
			this.externData().Name(this.FileInput.file().name);
			this.externData().ContentType(this.FileInput.file().type);
		});

		public FileInputSub2 = this.FileInput.base64String.subscribe((base64String: string) => {
			this.externData().Content(base64String);
		});

		public ExternObservable1: KnockoutSubscription;
		public ExternComputedSub1: KnockoutSubscription;
		public ExternComputedSub2: KnockoutSubscription;


		//http://stackoverflow.com/questions/16245767/creating-a-blob-from-a-base64-string-in-javascript
		public b64toBlob(b64Data, contentType, sliceSize) {
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

		//todo make this lazy loaded
		//inother words make this go to the calling .click on the button method
		public DownloadHandler = ko.computed(() => {
			if (this.externData() != null && this.externData().Content() != null) {

				let blob = this.b64toBlob(this.externData().Content(), this.externData().ContentType(), 512)

				//a.href = URL.createObjectURL(blob);
				//a.download = myfileInput().file().name;

				return URL.createObjectURL(blob);
			}
		});

		public dispose() {
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

	export interface IFileData {
		Name: KnockoutObservable<string>;
		ContentType: KnockoutObservable<string>;
		EncodingType: string;
		Content: KnockoutObservable<string>;
	}
}

///
ko.components.register("single-file-input",
	{
		viewModel: function (params: any) {
			return new KoComponents.FileInputViewModel(params);
		},
		template:
		'<div class="form-group" databind="fileDrag: FileInput">\
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
	}
);

ko.components.register("ko-file-input",
	{
		viewModel: function (params: any) {
			var myfileInput = ko.observable(new KoComponents.FileInputViewModel(params.file));
			this.Label = ko.observable(params.label);

			this.myfileInput = myfileInput;
			//col-xs-offset-1  btn-fab btn-fab-mini

			var viewModel: any = {};
			var fileData = ko.observable({
				dataURL: ko.observable(),
				// base64String: ko.observable(),
			});
			var onClear = function (fileData) {
				if (confirm('Are you sure?')) {
					fileData.clear && fileData.clear();
				}
			};

			var wind: any = window;

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
		template:
		'<div class="container">\
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