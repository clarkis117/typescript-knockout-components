/// <reference path="./ApiClient.ts" />

namespace KoComponents {
	export interface ListItem {
		Id: any;
	}

	export interface Item {
		Id: any;
		map(data: any): void;
	}

	export interface SideMenuInterface {
		StatusMessage: KnockoutObservable<string>;

		/**
		 * The editor's main view model
		 */
		Item: Item;

		ApiClient: ApiClient;

		CurrentItemName: KnockoutObservable<string>;

		ItemName: string;

		ClearEditor(): void;

		CreateItem(): void;

		IsCreateMode: boolean;

		/**
		 * All top level poco item forms in the object graph
		 */
		FormIds: string[];

		//validates each form in FormIds then posts data
		SaveItem(): void;

		DeleteItem(): void;

		//should export to a download
		ExportItemToJson(): void;

		//-- Items List feature
		ItemList: KnockoutObservableArray<ListItem>;

		//-- Item List Actions
		ModifyItem(ListItem: ListItem, event: any): void;

		GetItemList(): void;
	}

	/*
	export interface SideMenuWithCollapse extends SideMenuInterface {
		//alternateCollapse(string, string)
	}
	*/

	export abstract class BaseSpaViewModel implements SideMenuInterface {
		//-- Properties
		/*
			default is true because the form starts empty
			Function Create Items should set this to true
			Retrieval of an item with a set Id should set this to false
		*/
		public IsCreateMode = true;

		public Item: Item;

		public ItemName: string;

		public CurrentItemName = ko.observable("");

		public ItemList = ko.observableArray<ListItem>([]);

		public StatusMessage = ko.observable("");

		public ApiClient: KoComponents.ApiClient;

		constructor(itemName: string, formIds: string[]) {
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

			this.ApiClient = new GenericApiClient("api", itemName);

			this.GetItemList();
		}

		//-- Methods

		/**
		 * Clears the editor
		 * Sets create mode to true
		 * removes selection class on side list elements
		 */
		public ClearEditor = () => {
			this.IsCreateMode = true;

			//let currentItemId = "#" + Id + "list-group-item";

			this.RemoveSelectedClass();

			this.Item.map(null);
		}

		public RemoveSelectedClass() {
			$(".menu ul.list-group li.list-group-item").removeClass("active");
		}

		public SelectItem(Id: string) {
			let currentItemId = "#" + Id + "list-group-item";

			// Change Active Menu Item
			if (!$(event.target).is(".active")) {
				$(".menu ul.list-group li.list-group-item").not($(currentItemId)).removeClass("active");

				$(currentItemId).addClass("active");
				//body > div.container-fluid.main > div > nav > ul.list-group > li:nth-child(3)
			}
		}

		/*
		 * First make URL for request
		 * Second retrieve section
		 * Third update section
		 * todo: add prompts
		 */
		public ModifyItem = (ListItem: ListItem) => {
			this.SelectItem(this.idResolver(this.Item.Id));

			//set creation mode to false
			this.IsCreateMode = false;

			this.ApiClient.Get(this.idResolver(ListItem.Id))
				.done((data) => {
					if (data != null || data != "") {
						this.Item.map(data);
					}
					else {
						//data error
						this.StatusMessage("Invalid data returned by server");
					}
				}).fail(this.requestFailure);
		}

		//clears the item form
		public CreateItem(): void {
			this.ClearEditor();
		}

		public FormIds: string[];

		public idResolver(Id: any): string {
			if (ko.isObservable(Id)) {
				return Id();
			}
			else {
				return Id;
			}
		}

		/**
		 * This should be called to update the form data
		 * todo: this should be update when generic api changes to return updated values
		 */
		public updateFormData = (data) => {
			if (data != null || data != "") {
				if (this.IsCreateMode == true) {
					this.Item.map(data);

					this.StatusMessage("Item Successfully created");
				}
				else {
					let getPromise = this.ApiClient.Get(this.idResolver(this.Item.Id));

					getPromise.done((data2) => {
						if (data2 != null || data2 != "") {
							this.Item.map(data2);

							this.StatusMessage("Item Successfully Updated");
						}
						else {
							this.StatusMessage("Data Error on updating");
						}
					}).fail(this.requestFailure);
				}
			}
			else {
				//error invalid data
				this.StatusMessage("Server returned invalid data for current item");
			}

			this.GetItemList();
		}

		public requestFailure = () => {
			this.StatusMessage("Request to server Failed");

			alert("Error Communicating with the Server");
		}

		//todo make form name show up in status bar
		/**
		 * This should post the current item then retrieve it form the server again
		 * Then it should update the form with the data again
		 */
		public SaveItem(): void {
			let AreFormsValid: boolean = false;

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
						.done(this.updateFormData)
						.fail(this.requestFailure);
				}
				else {
					let updatePromise = this.ApiClient.Update(ko.mapping.toJSON(this.Item), this.idResolver(this.Item.Id))
						.done(this.updateFormData)
						.fail(this.requestFailure);
				}

				//this.GetItemList();
			}
		}

		public DeleteItem(): void {
			let deletePromise = this.ApiClient.Delete(this.idResolver(this.Item.Id));

			deletePromise.done((data) => {
				let delitem = this.ItemList().find((item) => { if (item.Id == this.Item.Id()) return true; });

				this.ItemList.remove(delitem);

				//clear form
				//this.Item.map(null);
				this.ClearEditor();

				this.StatusMessage("Item and Children Deleted");
			}).fail(this.requestFailure); //.then(() => this.GetItemList());
		}

		public ExportItemToJson(): void {
			//let contentType = "application/json";
			//let charset = "charset=utf-8";
			let datauri = "data:application/json;charset=utf-8," + ko.mapping.toJSON(this.Item);

			let blob = new Blob([ko.mapping.toJSON(this.Item)], { type: 'application/json' });

			let link = document.createElement("a");

			(link as any).download = this.idResolver(this.Item.Id)+".json";

			(link as any).href = URL.createObjectURL(blob);

			document.body.appendChild(link);

			link.click();

			// Cleanup the DOM
			document.body.removeChild(link);

			//delete link;
		}

		public GetItemList(): void {
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
	}
}