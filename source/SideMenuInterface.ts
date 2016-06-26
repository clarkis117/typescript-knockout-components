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
		StatusMessageModalId: string;

		StatusMessage: KnockoutObservable<string>;

		/**
		 * The editor's main view model
		 */
		Item: Item;

		ApiClient: GraphClient;

		CurrentItemName: KnockoutComputed<string>;

		ItemName: string;

		IsCreateMode: boolean;

		IsAnyFormDirty: boolean;

		/**
		 * All top level poco item forms in the object graph
		 */
		FormIds: string[];

		//Editor Actions
		ClearEditor(): void;

		ClearNestedForms(): void;

		CreateItem(): void;

		GenerateGUID(): string;

		AlternateCollapse(CurrentCollapseId: string, CollapseToShowId: string): void;

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
		public StatusMessageModalId = "";

		public DeleteConfirmModalId = "DeletionConfirmation";

		//When modifying an existing item this will be false
		//when creating a new item it will be true
		//todo make sure delete will only clear editor when true... use pending changes modal
		public IsCreateMode: boolean = true;

		public FormIds: string[];

		public IsAnyFormDirty: boolean = false;

		public ConfirmLostChangesMessage = "Are you sure? Any pending changes will be lost!";

		public Item: Item;

		public ItemName: string;

		public ItemList = ko.observableArray<ListItem>([]);

		public StatusMessage = ko.observable("");

		public ApiClient: KoComponents.GraphClient;

		public CurrentItemName = ko.pureComputed<string>(() => {
			if (this.Item != null) {
				return this.ItemName + " - " + this.Item.Id();
			}
			else {
				return this.ItemName;
			}
		});

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

			this.ApiClient = new GraphApiClient("api", itemName);

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

		public AlternateCollapse(CurrentCollapseId: string, CollapseToShowId: string) {
			if (CurrentCollapseId === CollapseToShowId || CurrentCollapseId === "" || CurrentCollapseId == null) {
				let toShowId = "[id=\"" + CollapseToShowId + "\"]";
				($(toShowId) as any).collapse('show');

				return;
			}

			let currentId = "[id=\"" + CurrentCollapseId + "\"]";
			let toShowId = "[id=\"" + CollapseToShowId + "\"]";

			($(currentId) as any).collapse('hide');
			($(toShowId) as any).collapse('show');
		}

		public RemoveSelectedClass() {
			$(".menu ul.list-group li.list-group-item").removeClass("active");
		}

		public SelectItem(Id: string) {
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


//#region Action Handlers
	
		/*
		 * First make URL for request
		 * Second retrieve section
		 * Third update section
		 * todo: add prompts
		 */
		public ModifyItem = (ListItem: ListItem) => {
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
		}

		//clears the item form
		//This should also set IsAnyForm Dirty to false
		public CreateItem(): void {
			//confirm if editor is dirty
			if (this.IsAnyFormDirty) {
				let conf = confirm(this.ConfirmLostChangesMessage);

				if (conf != true) {
					return;
				}
			}

			this.ClearEditor();
		}

		/**
		 * This should be called to update the form data
		 * Success paths for this should set IsFormDirty to false
		 * todo: this should be update when generic api changes to return updated values
		 */
		public updateDataOnSave = (data) => {
			if (data != null || data != "") {
				this.Item.map(data);

				this.IsAnyFormDirty = false;

				this.StatusMessage("Item Successfully created");
			}
			else { //todo reevaluate this code due to api changes
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

		public requestFailure = () => {
			this.StatusMessage("Request to server Failed");

			alert("Error Communicating with the Server");
		}

		//no, we go to form anyways make form name show up in status bar
		/**
		 * This should post the current item then retrieve it form the server again
		 * Then it should update the form with the data again
		 * reseting anyFormDirty is handled in updateDataOnSave
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
						.done(this.updateDataOnSave)
						.fail(this.requestFailure);
				}
				else {
					let updatePromise = this.ApiClient.Update(ko.mapping.toJSON(this.Item), this.idRes(this.Item.Id))
						.done(this.updateDataOnSave)
						.fail(this.requestFailure);
				}

				//this.GetItemList();
			}
		}

		/**
		 * 
		 */
		public DeleteItem(): void {

			//confirm if editor is dirty
			if (this.IsAnyFormDirty) {
				let conf = confirm(this.ConfirmLostChangesMessage);

				if (conf != true) {
					return;
				}
			}

			if (!this.IsCreateMode) {
		
				($("#" + this.DeleteConfirmModalId) as any).modal("show");

			}
			else {
				this.ClearEditor();
			}
		}

		public deleteCurrentItem = () =>
		{
			let deletePromise = this.ApiClient.Delete(this.idRes(this.Item.Id));

			deletePromise.done((data) => {

				//remove item from the item list
				let delitem = this.ItemList().find((item) => { if (item.Id == this.Item.Id()) return true; });

				this.ItemList.remove(delitem);

				//clear form
				//this.Item.map(null);
				this.ClearEditor();

				this.StatusMessage("Item and Children Deleted");
			}).fail(this.requestFailure); //.then(() => this.GetItemList());
		} 

		/**
		 * This Exports the current Item and any changes to a download-able JSON File in Plain text
		 */
		public ExportItemToJson(): void {
			//let contentType = "application/json";
			//let charset = "charset=utf-8";
			let datauri = "data:application/json;charset=utf-8," + ko.mapping.toJSON(this.Item);

			let blob = new Blob([ko.mapping.toJSON(this.Item)], { type: 'application/json' });

			let link = document.createElement("a");

			(link as any).download = this.idRes(this.Item.Id) + ".json";

			(link as any).href = URL.createObjectURL(blob);

			document.body.appendChild(link);

			link.click();

			// Cleanup the DOM
			document.body.removeChild(link);

			//delete link;
		}

//#endregion

		//todo fix
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

//#region Utility

		//Generate GUID function that avoids possible collisions
		//From: http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
		public GenerateGUID = () => {
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
		  * Resolves Ids to their value type
		  * @param Id
		  */
		public idRes(Id: any): string {
			if (ko.isObservable(Id)) {
				return Id();
			}
			else {
				return Id;
			}
		}

		/**
		 * Clears the editor
		 * Sets create mode to true
		 * removes selection class on side list elements
		 * resets IsAnyFormDirty to false
		 */
		public ClearEditor = () => {

			this.IsCreateMode = true;

			//let currentItemId = "#" + Id + "list-group-item";

			this.RemoveSelectedClass();

			this.Item.map(null);

			this.ClearNestedForms();

			this.IsAnyFormDirty = false;
		}

		public abstract ClearNestedForms(): void;

//#endregion
	}
}