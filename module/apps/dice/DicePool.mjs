const { Roll } = foundry.dice;
const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export class DicePool extends HandlebarsApplicationMixin(ApplicationV2) {
	// #region Options
	static DEFAULT_OPTIONS = {
		classes: [
			`ripcrypt--DicePool`,
		],
		window: {
			title: `Trench Crusade Roller`,
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
			diceBonusDelta: this.#diceBonusDelta,
			roll: this.#roll,
			reset: this.#reset,
		},
	};

	static PARTS = {
		numberOfDice: {
			template: 'systems/trench-crusade/module/apps/dice/numberOfDice.hbs',
		},
		buttons: {
			template: 'systems/trench-crusade/module/apps/dice/buttons.hbs',
		},
	};
	// #endregion

	// #region Instance Data
	_diceCount;

	constructor({
		diceCount = 0,
		diceBonus = 0,
		formula = '2d6kh2',
		flavor = ``,
		...opts
	} = {}) {
		super(opts);

		this._flavor = flavor;
		this._diceCount = diceCount;
		this._diceBonus = diceBonus;
		this._formula = formula;
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
		ctx.formula = this._formula;
		ctx.diceBonus = this._diceBonus;
		ctx.decrementDisabled = this._diceCount <= 0;
	};
	// #endregion

	static async #diceBonusDelta(_event, element){

		//console.info("diceBonusDelta called");
		//console.info(`element: ${element.dataset.dicebonus}`);

		const delta = parseInt(element.dataset.dicebonus);
		if (Number.isNaN(delta)) {
			ui.notifications.error(
				localizer(`RipCrypt.notifs.error.invalid-delta`, { name: `@RipCrypt.Apps.numberOfDice` }),
			);
			return;
		};

		let newBonus = this._diceBonus + delta;

		this._diceBonus = newBonus;

		//console.info(`diceBonus: ${this._diceBonus}`);

		this._formula = DicePool.compileFormula(this._diceCount, this._diceBonus);

		this.render({ parts: [`numberOfDice`] });
	}

	// #region Actions
	static async #diceCountDelta(_event, element) {

//console.info("diceCountDelta called");
//console.info(`element: ${element.dataset.delta}`);

		const delta = parseInt(element.dataset.delta);
		if (Number.isNaN(delta)) {
			ui.notifications.error(
				localizer(`RipCrypt.notifs.error.invalid-delta`, { name: `@RipCrypt.Apps.numberOfDice` }),
			);
			return;
		};

		let newCount = this._diceCount + delta;

		this._diceCount = newCount;

//console.info(`diceCount: ${this._diceCount}`);

		this._formula = DicePool.compileFormula(this._diceCount, this._diceBonus);

		this.render({ parts: [`numberOfDice`] });
	};

	static compileFormula(diceCount, bonus)
	{
		let bonusOperator = "";
		if(bonus > 0)
			bonusOperator = `+${bonus}`;
		else if(bonus < 0)
			bonusOperator = `${bonus}`;

		let result = `${2+Math.abs(diceCount)}d6k${diceCount < 0 ? 'l' : 'h'}2`;
		result = result + bonusOperator;

		return result;
	}

	static async #reset(_event)
	{
		this._diceBonus = 0;
		this._diceCount = 0;

		this._formula = DicePool.compileFormula(this._diceCount, this._diceBonus);

		this.render({ parts: [`numberOfDice`] });
	}

	static async #roll(_event, element) {
		const rollType = element.getAttribute('data-rollType');
		console.info(`type: ${rollType}`);

		let flavor = this._flavor;
		const roll = new Roll(this._formula);

		let rollTable = await fromUuid(rollType);
		if(rollTable)
		{
			console.info(`rollTable: ${rollTable.name}`);
			await rollTable.draw(
				{
					roll: roll,
				});
		}
		else{	
			await roll.toMessage({
				speaker: ChatMessage.getSpeaker({ actor: this.actor }),
				flavor,
			});
		}
	};

	// #endregion
};