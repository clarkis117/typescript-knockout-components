namespace KoComponents {

	export interface ApiClient {
		ApiRoute: string

		ItemTypeName: string;

		Actions: any;

		//CallBacks: ApiClientCallbacks;

		createRequestUrl(action: string): string;

		Create(Item: any): JQueryXHR;

		Update(Item: any, Id: string): JQueryXHR;

		Get(Id: string): JQueryXHR;

		GetAll(): JQueryXHR;

		Delete(Id: string): JQueryXHR;
	}

	export interface GraphClient extends ApiClient {

		DeleteChild(Child: any): JQueryXHR;
	}

	//todo: add null checking to api functions
	export class GenericApiClient implements ApiClient {

		public ItemTypeName: string;

		public ApiRoute = "api";

		private IdQuery = "?Id="

		public Actions = {
			Create: "create",
			Update: "update",
			Get: "get",
			GetAll: "getall",
			Delete: "delete",
		}

		//public CallBacks: ApiClientCallbacks;

		constructor(apiRoute: string, itemTypeName: string) {
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

		public createRequestUrl(action: string): string {
			return `/${this.ApiRoute}/${this.ItemTypeName}/${action}`;
		}

		public Create(Item: any) {

			let settings: JQueryAjaxSettings = {
				type: "POST",
				dataType: "json",
				contentType: "application/json",
				url: this.createRequestUrl(this.Actions.Create),
				data: Item
			}

			return $.ajax(settings);
		}

		public Get(Id: any) {

			let settings: JQueryAjaxSettings = {
				type: "GET",
				dataType: "json",
				contentType: "application/json",
				url: this.createRequestUrl(this.Actions.Get) + "?id=" + Id,
			}

			return $.ajax(settings);
		}

		public Update(Item: any, Id: string) {

			let settings: JQueryAjaxSettings = {
				type: "POST",
				dataType: "json",
				contentType: "application/json",
				url: this.createRequestUrl(this.Actions.Update) + "?id=" + Id,
				data: Item
			}

			return $.ajax(settings);
		}

		public Delete(Id: string) {

			let settings: JQueryAjaxSettings = {
				type: "DELETE",
				dataType: "json",
				contentType: "application/json",
				url: this.createRequestUrl(this.Actions.Delete) + "?id=" + Id,
			}

			return $.ajax(settings);
		}

		public GetAll() {

			let settings: JQueryAjaxSettings = {
				type: "GET",
				//dataType: "json",
				contentType: "application/json",
				url: this.createRequestUrl(this.Actions.GetAll)
			}

			return $.ajax(settings);
		}
	}

	export class GraphApiClient extends GenericApiClient implements GraphClient
	{
		public Actions = {
			Create: "create",
			Update: "update",
			Get: "get",
			GetAll: "getall",
			Delete: "delete",
			DeleteChild: "deletechild"
		}

		constructor(apiRoute: string, itemTypeName: string)
		{
			super(apiRoute, itemTypeName);

		}

		public DeleteChild(Child: any) {

			let settings: JQueryAjaxSettings = {
				type: "DELETE",
				dataType: "json",
				contentType: "application/json",
				url: this.createRequestUrl(this.Actions.DeleteChild),
				data: Child
			}

			return $.ajax(settings);
		}
	}
}