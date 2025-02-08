import { TrenchCrusadeItemSheet } from "./item-sheet.mjs";

/**
 * Extend the basic TrenchCrusadeItemSheet with some very simple modifications
 * @extends {TrenchCrusadeItemSheet}
 */
export class TrenchCrusadeArmorSheet extends TrenchCrusadeItemSheet {
    /** @override */
    static get defaultOptions() {
      return foundry.utils.mergeObject(super.defaultOptions, {
        classes: ['trench-crusade', 'sheet', 'item', 'armor'],
        width: 520,
        height: 580,
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
      const path = 'systems/trench-crusade/templates/item';
      // Return a single sheet for all item types.
      // return `${path}/item-sheet.hbs`;
  
      // Alternatively, you could use the following return statement to do a
      // unique item sheet by type, like `weapon-sheet.hbs`.
      return `${path}/item-${this.item.type}-sheet.hbs`;
    }
  
    /* -------------------------------------------- */
  
    /** @override */
    async getData() {
      // Retrieve base data structure.
      const context = await super.getData();
  
      // Use a safe clone of the item data for further operations.
      const itemData = this.document.toPlainObject();
   
      // Add the item's data to context.data for easier access, as well as flags.
      context.system = itemData.system;
      context.flags = itemData.flags;
      context.short_description = itemData.short_description;
  
      // Adding a pointer to CONFIG.TRENCHCRUSADE
      context.config = CONFIG.TRENCHCRUSADE;
  
      return context;
    }
  
    /* -------------------------------------------- */
  
    /** @override */
    activateListeners(html) {
      super.activateListeners(html);
  
      // Everything below here is only needed if the sheet is editable
      if (!this.isEditable) return;
  
      // Roll handlers, click handlers, etc. would go here.
    }
  }
  