const {HandlebarsApplicationMixin, ApplicationV2} = foundry.applications.api;

export class Armoury extends HandlebarsApplicationMixin(ApplicationV2) {
    static PARTS = {
        header: { template: 'systems/trench-crusade/module/apps/armoury/header.hbs'},
        armoury_body: { template: 'systems/trench-crusade/module/apps/armoury/armoury_body.hbs'},
        footer: { template: 'systems/trench-crusade/module/apps/armoury/footer.hbs'},
    };

    static DEFAULT_OPTIONS = {
        tag: "form",
        form: {
            handler: Armoury.myFormHandler,
            submitOnChange: false,
            closeOnSubmit: false,
        },
        classes: [

        ],
        buttons: [],
        dragDrop: [{ dragSelector: "[data-drag]", dropselector: null}],
        window: {
            title: "Faction Armoury",
            frame: true,
            positioned: true,
            resizable: true,
            minimizable: true,
            icon: "fa-solid fa-triangle-exclamation",
            label: "Bar",
            action: "myAction"
        },
        position: {
            width: "auto",
            height: "auto",
        },
        actions: {
        },
    };

    constructor({ ...opts } = {}) {
		super(opts);

        console.info("CONSTRUCTOR()");

        this.factions = CONFIG.TRENCHCRUSADE.factionsChoices;
        this.keywords = Object.entries(CONFIG.TRENCHCRUSADE.keywordsChoices).map(([value, label]) => ({value, label}));
        this.mySheetLabels = CONFIG.TRENCHCRUSADE.mySheetLabels;

        this.totalDucats = 0;
        this.totalGlory = 0;

        this.generalCompendiumIds = {
            abilities: { id: 'world.generalabilities'},
            armor: { id: 'Compendium.world.generalarmor'},
            equipment: { id: 'Compendium.world.generalequipment'},
            melee: { id: 'Compendium.world.generalmelee'},
            ranged: { id: 'Compendium.world.generalranged'},
        };

        this.generalCompendiums = game.packs.get(this.generalCompendiumIds.abilities.id);

        console.info(`general: ${this.generalCompendiums}`);

        this.#dragDrop = this.#createDragDropHandlers();
	};

    async _preparePartContext(partId, context, _opts) {
		context = {};

        console.info(`_preparePartContext() partId ${partId} called`);

        context.factions = this.factions;
        context.mySheetLabels = this.mySheetLabels;
        context.keywords = this.keywords;

        context.generalCompendiums = this.generalCompendiums;

        console.info($`{context.generalCompendiums.abilities}`);

        switch(partId)
        {
            case "header":
                this._prepareHeaderContext(context);
            case "armoury_body":
                this._prepareArmouryBodyContext(context);
            case "footer":
                this._prepareFooterContext(context);
        }

        return context;
	};      

    async _prepareHeaderContext(context)
    {

    }

    async _prepareArmouryBodyContext(context)
    {

    }

    async _prepareFooterContext(context)
    {
        context.totalDucats = this.totalDucats;
        context.totalGlory = this.totalGlory;  
    }


    _onRender(context, options) {
        this.#dragDrop.forEach((d)=> d.bind(this.element));
    };

    _configureRenderOptions(options) {
        super._configureRenderOptions(options);
    };

      /**
   * Define whether a user is able to begin a dragstart workflow for a given drag selector
   * @param {string} selector       The candidate HTML selector for dragging
   * @returns {boolean}             Can the current user drag this selector?
   * @protected
   */
    _canDragStart(selector) {
        return this.isEditable;
    };

/**
   * Define whether a user is able to conclude a drag-and-drop workflow for a given drop selector
   * @param {string} selector       The candidate HTML selector for the drop target
   * @returns {boolean}             Can the current user drop on this selector?
   * @protected
   */
    _canDragDrop(selector) {
        // game.user fetches the current user
        return this.isEditable;
    };

/**
   * Callback actions which occur at the beginning of a drag start workflow.
   * @param {DragEvent} event       The originating DragEvent
   * @protected
   */
    _onDragStart(event) {
        const el = event.currentTarget;
        if ('link' in event.target.dataset) return;

        // Extract the data you need
        let dragData = null;

        if (!dragData) return;

        // Set data transfer
        event.dataTransfer.setData('text/plain', JSON.stringify(dragData));
    };

    /**
     * Callback actions which occur when a dragged element is over a drop target.
     * @param {DragEvent} event       The originating DragEvent
     * @protected
     */
    _onDragOver(event) {};    

    /**
     * Callback actions which occur when a dragged element is dropped on a target.
     * @param {DragEvent} event       The originating DragEvent
     * @protected
     */
    async _onDrop(event) {
        const data = TextEditor.getDragEventData(event);

        // Handle different data types
        switch (data.type) {
            // write your cases
        }
    };    

     #createDragDropHandlers() {
        return this.options.dragDrop.map((d) => {
            d.permissions = {
                dragstart: this._canDragStart.bind(this),
                drop: this._canDragDrop.bind(this),
            };

            d.callbacks = {
                dragstart: this._onDragStart.bind(this),
                dragover: this._onDragOver.bind(this),
                drop: this._onDrop.bind(this),
            };
            return new DragDrop(d);
        });
    };

    #dragDrop;

    get dragDrop() {
        return this.#dragDrop;
    };

    get title() {
      return super.title;  
    };
  
};