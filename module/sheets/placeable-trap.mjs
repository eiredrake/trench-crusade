/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class TrenchCrusadeTrapSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['trench-crusade', 'sheet', 'trap'],
      actions: {
        
      },
      width: 500,
      height: 500,
      tabs: [
        {
          navSelector: '.sheet-tabs',
          contentSelector: '.sheet-body',
          initial: 'description',
        },
      ],
    });
  }

  
  /** @override */
  get template() {
    return `systems/trench-crusade/templates/actor/actor-trap-sheet.hbs`;
  }

  /** @override */
  async getData() {
    // Retrieve the data structure from the base sheet. You can inspect or log
    // the context variable to see the structure, but some key properties for
    // sheets are the actor object, the data object, whether or not it's
    // editable, the items array
    const context = super.getData();

    context.mySheetLabels = CONFIG.TRENCHCRUSADE.mySheetLabels;

    // Use a safe clone of the actor data for further operations.
    const actorData = this.document.toPlainObject();

    // Add the actor's data to context.data for easier access, as well as flags.
    context.system = this.actor.system;
    context.flags = this.actor.flags;

    // Adding a pointer to CONFIG.TRENCHCRUSADE
    context.config = CONFIG.TRENCHCRUSADE;

    this.actor.baseSize = actorData.baseSize;

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
   
  }

  /**
   * Organize and classify Items for Actor sheets.
   *
   * @param {object} context The context object to mutate
   */
  _prepareItems(context) {
    // Initialize containers.
  
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

   
  }

}
