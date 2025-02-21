/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class TrenchCrusadeActorSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['trench-crusade', 'sheet', 'actor'],
      actions: {

      },
      width: 750,
      height: 700,
      tabs: [
        {
          navSelector: '.sheet-tabs',
          contentSelector: '.sheet-body',
          initial: 'description',
        },
      ],
    });
  }

  
  /**
   * Available sheet modes.
   * @enum {number}
   */
  static MODES = {
    PLAY: 1,
    EDIT: 2
  };

    /**
   * The mode the sheet is currently in.
   * @type {TrenchCrusadeActorSheet.MODES}
   */
  #isEdit = TrenchCrusadeActorSheet.MODES.PLAY;

  get isEdit() {

    var result = this.#isEdit == TrenchCrusadeActorSheet.MODES.EDIT

    console.info(`isEdit is: ${result}`)

    return result;
  }

  /**
   * Toggle Edit vs. Play mode
   *
   * @this TrenchCrusadeActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   */
  async _toggleMode(event, target) 
  {
    if(this.#isEdit == TrenchCrusadeActorSheet.MODES.EDIT)
      this.#isEdit = TrenchCrusadeActorSheet.MODES.PLAY;
    else
      this.#isEdit = TrenchCrusadeActorSheet.MODES.EDIT;

    this.render( );

    console.info(`toggleMode() set to ${this.isEdit}`);
  }

  /** @override */
  get template() {
    return `systems/trench-crusade/templates/actor/actor-${this.actor.type}-sheet.hbs`;
  }

  /** @override */
  async getData() {
    // Retrieve the data structure from the base sheet. You can inspect or log
    // the context variable to see the structure, but some key properties for
    // sheets are the actor object, the data object, whether or not it's
    // editable, the items array
    const context = super.getData();

    context.isEdit = this.isEdit;

    context.mySheetLabels = CONFIG.TRENCHCRUSADE.mySheetLabels;
    context.keywordChoices = CONFIG.TRENCHCRUSADE.keywordsChoices;
    context.factions = CONFIG.TRENCHCRUSADE.factionsChoices;
    context.keywords = Object.entries(CONFIG.TRENCHCRUSADE.keywordsChoices).map(([value, label]) => ({value, label}));
    // Use a safe clone of the actor data for further operations.
    const actorData = this.document.toPlainObject();

    // Add the actor's data to context.data for easier access, as well as flags.
    context.system = this.actor.system;
    context.flags = this.actor.flags;

    // Adding a pointer to CONFIG.TRENCHCRUSADE
    context.config = CONFIG.TRENCHCRUSADE;

    // Prepare unit data and items.
    if (actorData.type == 'unit') 
    {
      this._prepareItems(context);
      this._prepareUnitData(context, this.actor);
    }

    this.actor.unitName = actorData.unitName;
    this.actor.faction = actorData.faction;
    this.actor.keywords = actorData.keywords;
    this.actor.flavorText = actorData.flavorText;
    this.actor.limit = actorData.limit;
    this.actor.baseSize = actorData.baseSize;
    this.actor.blood = actorData.blood;
    this.actor.blessings = actorData.blessings;

    // Enrich biography info for display
    // Enrichment turns text like `[[/r 1d20]]` into buttons
    context.enrichedDescription = await TextEditor.enrichHTML(
      this.actor.system.description,
      {
        // Whether to show secret blocks in the finished html
        secrets: this.document.isOwner,
        // Necessary in v11, can be removed in v12
        async: true,
        // Data to fill in for inline rolls
        rollData: this.actor.getRollData(),
        // Relative UUID resolution
        relativeTo: this.actor,
      }
    );

    return context;
  }

  /**
   * Unit-specific context modifications
   *
   * @param {object} context The context object to mutate
   */
  _prepareUnitData(context, actor) {
    // This is where you can enrich Unit-specific editor fields
    // or setup anything else that's specific to this type
    actor.system.computedCostDucats = actor.system.cost.ducats;
    actor.system.computedCostGlory = actor.system.cost.glory; 
    
    let computedKeywords = actor.system.keywords;

    actor.items.forEach(item => 
    {
      actor.system.computedCostDucats += item.system.cost.ducats;
      actor.system.computedCostGlory += item.system.cost.glory;

      switch(item.type)
      {       
        case 'item':
          {
            
          }
          break;
        case 'feature':
          {
            computedKeywords = [...new Set([...computedKeywords, ...item.system.keywords])];
          }
          break;
        case 'weapon':
          break;
        case 'armor':
          break;
      }
    });

    context.computedKeywords = computedKeywords;
  }

  /**
   * Organize and classify Items for Actor sheets.
   *
   * @param {object} context The context object to mutate
   */
  _prepareItems(context) {
    // Initialize containers.
    const gear = [];
    const features = [];
   
    // Iterate through items, allocating to containers
    for (var item of context.items) 
    {
      item.img = item.img || Item.DEFAULT_ICON;
      // Append to gear.
      if (item.type === 'item') {
        gear.push(item);
      }
      // Append to features.
      else if (item.type === 'feature') {
        features.push(item);
      }
      else if (item.type == 'weapon'){
        gear.push(item);
      }
      else if (item.type == 'armor') {
        gear.push(item);
      }
    }

    // Assign and return
    context.gear = gear;
    context.features = features;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Render the item sheet for viewing/editing prior to the editable check.
    html.on('click', '.item-edit', (ev) => {
      const li = $(ev.currentTarget).parents('.item');
      const item = this.actor.items.get(li.data('itemId'));
      item.sheet.render(true);
    });

    html.on('change', 'div.slider-object label.switch input.item-edit-slider', () => {
      this._toggleMode();
    });

    // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Add Inventory Item
    html.on('click', '.item-create', this._onItemCreate.bind(this));

    // Delete Inventory Item
    html.on('click', '.item-delete', (ev) => {
      const li = $(ev.currentTarget).parents('.item');
      const item = this.actor.items.get(li.data('itemId'));
      item.delete();
      li.slideUp(200, () => this.render(false));
    });

    // Rollable abilities.
    html.on('click', '.rollable', this._onRoll.bind(this));

    // Drag events for macros.
    if (this.actor.isOwner) {
      let handler = (ev) => this._onDragStart(ev);
      html.find('li.item').each((i, li) => {
        if (li.classList.contains('inventory-header')) return;
        li.setAttribute('draggable', true);
        li.addEventListener('dragstart', handler, false);
      });
    }
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Grab any data associated with this control.
    const data = duplicate(header.dataset);
    // Initialize a default name.
    const name = `New ${type.capitalize()}`;
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      system: data,
    };
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.system['type'];

    // Finally, create the item!
    return await Item.create(itemData, { parent: this.actor });
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  _onRoll(event) 
  {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    console.info(`onRoll start: ${event.currentTarget}`);

    // let roll = new Roll("2d6", this.actor.getRollData());
    // roll.toMessage({
    //     speaker: ChatMessage.getSpeaker({ actor: this.actor}),
    //     flavor: "doing the thing",
    //     rollMode: game.settings.get('core', 'rollMode'),
    //   }
    // );
    // return roll;
    if(dataset.rollType == 'weapon')
    {
        var flavor = '';
        var itemName = element.firstElementChild.title;
        if(itemName.length > 0)
            flavor = `${this.actor.name} is making an ATTACK action with ${itemName}`;

        new CONFIG.ui.roller({flavor: flavor}).render({force: true});
    }
    
    console.info("onRoll end");

    
 
    // Handle item rolls.
    // if (dataset.rollType) 
    // {
    //   if (dataset.rollType == 'item') {
    //     const itemId = element.closest('.item').dataset.itemId;
    //     const item = this.actor.items.get(itemId);
    //     if (item) return item.roll();
    //   }
    // }

    // // Handle rolls that supply the formula directly.
    // if (dataset.roll) {
    //   let label = dataset.label ? `[ability] ${dataset.label}` : '';
    //   let roll = new Roll(dataset.roll, this.actor.getRollData());
    //   roll.toMessage({
    //     speaker: ChatMessage.getSpeaker({ actor: this.actor }),
    //     flavor: label,
    //     rollMode: game.settings.get('core', 'rollMode'),
    //   });
    //   return roll;
    // }
  }
}
