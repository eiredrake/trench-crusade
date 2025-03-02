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
			minimizable: false,
		},
		position: {
			width: `auto`,
			height: `auto`,
		},
		actions: {
			diceCountDelta: this.#diceCountDelta,
			diceBonusDelta: this.#diceBonusDelta,
			rollBloodbath: this.#rollBloodbath,
			rolld3: this.#rolld3,
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

	_diceCount;
	_formula;
	_diceBonus;
	_flavor;

	constructor(
		{diceCount, diceBonus, formula, flavor, ...opts} = {}
	) 
	{
		super(opts);

		this._flavor = flavor;

		if(diceCount > 0)
			this._diceCount = diceCount;
		else
			this._diceCount = 0;

		if(diceBonus > 0)
			this._diceBonus = diceBonus;
		else
			this._diceBonus = 0;

		if(formula)
			this._formula = formula;
		else
			this._formula = this.compileFormula(this._diceCount, this._diceBonus);
	};

	get title() {
		return super.title;
	};
	// #endregion

	// #region Lifecycle
	async _preparePartContext(partId, ctx, _opts) {
		ctx = {};

        //console.info(`partId: ${partId}`);

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
		ctx.flavor = this._flavor;
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

		this._formula = this.compileFormula(this._diceCount, this._diceBonus);

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

		this._formula = this.compileFormula(this._diceCount, this._diceBonus);

		this.render({ parts: [`numberOfDice`] });
	};

	compileFormula(diceCount, bonus, diceToKeep = 2)
	{
		let bonusOperator = "";
		if(bonus > 0)
			bonusOperator = `+${bonus}`;
		else if(bonus < 0)
			bonusOperator = `${bonus}`;

		let result = `${2+Math.abs(diceCount)}d6k${diceCount < 0 ? 'l' : 'h'}${diceToKeep}`;
		result = result + bonusOperator;

		return result;
	}

	static async #rollBloodbath(_event, element) 
	{
		const rollType = element.getAttribute('data-rollType');
		console.info(`type: ${rollType}`);

		let flavor = this._flavor;

		flavor += " (BLOODBATH)";

		const roll = new Roll(this.compileFormula(this._diceCount + 1, this._diceBonus, 3));

		let rollTable = await fromUuid(rollType);
		if(rollTable)
		{
			console.info(`rollTable: ${rollTable.name}`);
			await rollTable.draw(
				{
					speaker: ChatMessage.getSpeaker({ actor: this.actor }),
					flavor,					
					roll: roll,
				});
		}
		else{	
			await roll.toMessage({
				speaker: ChatMessage.getSpeaker({ actor: this.actor }),
				flavor,
			});
		}

		this.resetVariables();
	}

	static async #rolld3(_event, element)
	{
		const roll = new Roll('1d3');
		await roll.toMessage({
			speaker: ChatMessage.getSpeaker({actor: this.actions}),
			flavor: this._flavor,
			roll: roll,
		});
	}

	static async #roll(_event, element) 
	{
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
					speaker: ChatMessage.getSpeaker({ actor: this.actor }),
					flavor,					
					roll: roll,
				});
		}
		else{	
			await roll.toMessage({
				speaker: ChatMessage.getSpeaker({ actor: this.actor }),
				flavor,
			});
		}

		this.resetVariables();
	};

	static async #reset(_event)
	{
		// console.info("RESET CALLED");

		this.resetVariables();
	}	

	async resetVariables()
	{
		this._diceCount = 0;
		this._diceBonus = 0;

		this._formula = this.compileFormula(this._diceCount, this._diceBonus);

		this.render({ parts: [`numberOfDice`] });
	}

	// #endregion
};