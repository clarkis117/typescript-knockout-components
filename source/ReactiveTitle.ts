//reactive Title Control
namespace KoComponents {
	export class ReactiveTitle {
		public externValue: any;

		public ValueSubscription: KnockoutSubscription;

		public Value: KnockoutObservable<any> = ko.observable("");

		public Title: string;

		public IsNew: KnockoutComputed<boolean> = ko.computed<boolean>(() => {
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

		/*
			Examples:
			1. New True False Question
			2. True False Question #...
		*/
		constructor(params: TitleParams) {
			if (ko.isObservable(params.Value)
				|| ko.isComputed(params.Value)) {
				this.Value(params.Value());

				this.ValueSubscription = (params.Value as KnockoutObservable<any>).subscribe((data) => {
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
		public dispose() {
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

	export interface TitleParams {
		Value: any;
		Title: string;
	}
}

ko.components.register("reactive-title",
	{
		viewModel: function (params: any) {
			return new KoComponents.ReactiveTitle(params);
		},
		template:
		'<span class="label label-success" data-bind="if: IsNew">New</span>\
		<span data-bind="text: Title"></span>\
		<span data-bind="ifnot: IsNew"><span data-bind="text: Value"></span></span>'
	}
);