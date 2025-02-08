const { Roll } = foundry.dice;
const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export class DicePool extends HandlebarsApplicationMixin(ApplicationV2) {
	// #region Options
	static DEFAULT_OPTIONS = {
		classes: [
			`ripcrypt--DicePool`,
		],
		window: {
			title: `Dice Pool`,
			frame: true,
			positioned: true,
			resizable: false,
			minimizable: true,
		},
		position: {
			width: `auto`,
			height: `auto`,
		},
		actions: {
			diceCountDelta: this.#diceCountDelta,
			roll: this.#roll,
		},
	};

	static PARTS = {
		numberOfDice: {
			template: filePath(`templates/Apps/DicePool/numberOfDice.hbs`),
		},
		buttons: {
			template: filePath(`templates/Apps/DicePool/buttons.hbs`),
		},
	};
	// #endregion

	// #region Instance Data
	_diceCount;

	constructor({
		diceCount = 1,
		flavor = ``,
		...opts
	} = {}) {
		super(opts);

		this._flavor = flavor;
		this._diceCount = diceCount;
	};

	get title() {
		if (!this._flavor) {
			return super.title;
		}
		return `${super.title}: ${this._flavor}`;
	};
	// #endregion

	// #region Lifecycle
	async _preparePartContext(partId, ctx, _opts) {
		ctx = {};

		switch (partId) {
			case `numberOfDice`: {
				this._prepareNumberOfDice(ctx);
				break;
			};
			case `buttons`: {
				break;
			};
		}
		return ctx;
	};

	async _prepareNumberOfDice(ctx) {
		ctx.numberOfDice = this._diceCount;
		ctx.decrementDisabled = this._diceCount <= 0;
	};
	// #endregion

	// #region Actions
	static async #diceCountDelta(_event, element) {
		const delta = parseInt(element.dataset.delta);
		if (Number.isNaN(delta)) {
			ui.notifications.error(
				localizer(`RipCrypt.notifs.error.invalid-delta`, { name: `@RipCrypt.Apps.numberOfDice` }),
			);
			return;
		};

		let newCount = this._diceCount + delta;

		if (newCount < 0) {
			ui.notifications.warn(`Cannot go below dice count 0`,);
		};

		this._diceCount = Math.max(newCount, 0);
		this.render({ parts: [`numberOfDice`] });
	};

	static async #roll() {
		const formula = `${this._diceCount}d8`;

		let flavor = this._flavor;

		const roll = new Roll(formula);
		await roll.evaluate();
		await roll.toMessage({
			speaker: ChatMessage.getSpeaker({ actor: this.actor }),
			flavor,
		});
		this.close();
	};
	// #endregion
};