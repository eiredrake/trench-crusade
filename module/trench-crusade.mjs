// Import document classes.
import { TrenchCrusadeActor } from './documents/actor.mjs';
import { TrenchCrusadeItem } from './documents/item.mjs';
import { TrenchCrusadeArmor } from './documents/armor.mjs';
import { TrenchCrusadeWeapon } from './documents/weapon.mjs';
// Import sheet classes.
import { TrenchCrusadeActorSheet } from './sheets/actor-sheet.mjs';
import { TrenchCrusadeItemSheet } from './sheets/item-sheet.mjs';
import { TrenchCrusadeArmorSheet } from './sheets/item-armor-sheet.mjs';
import { TrenchCrusadeWeaponSheet } from './sheets/item-weapon-sheet.mjs';
// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from './helpers/templates.mjs';
import { TRENCHCRUSADE } from './helpers/config.mjs';
// Import DataModel classes
import * as models from './data/_module.mjs';

import {DicePool} from "./apps/dice/DicePool.mjs";
import {Armoury} from "./apps/armoury/Armoury.mjs";

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', function () {
  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.
  game.trenchcrusade = {
    TrenchCrusadeActor,
    TrenchCrusadeItem,
    TrenchCrusadeArmor,
    TrenchCrusadeWeapon,
    rollItemMacro,
  };

  // Add custom constants for configuration.
  CONFIG.TRENCHCRUSADE = TRENCHCRUSADE;

  CONFIG.ui.roller = DicePool;
  CONFIG.armoury = Armoury;

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: '1d20 + @abilities.dex.mod',
    decimals: 2,
  };

  // Define custom Document and DataModel classes
  CONFIG.Actor.documentClass = TrenchCrusadeActor;

  // Note that you don't need to declare a DataModel
  // for the base actor/item classes - they are included
  // with the Unit as part of super.defineSchema()
  CONFIG.Actor.dataModels = {
    unit: models.TrenchCrusadeUnit,
  }
  CONFIG.Item.documentClass = TrenchCrusadeItem;
  CONFIG.Item.dataModels = {
    item: models.TrenchCrusadeItem,
    feature: models.TrenchCrusadeFeature,
    armor: models.TrenchCrusadeArmor,
    weapon: models.TrenchCrusadeWeapon
  }

  // Register sheet application classes
  Actors.unregisterSheet('core', ActorSheet);
  Actors.registerSheet('trench-crusade', TrenchCrusadeActorSheet, {
    makeDefault: true,
    label: 'TRENCHCRUSADE.SheetLabels.Actor',
  });
  Items.unregisterSheet('core', ItemSheet);
  Items.registerSheet('trench-crusade', TrenchCrusadeItemSheet, {
    makeDefault: true,
    label: 'TRENCHCRUSADE.SheetLabels.Item',
  });

  Items.registerSheet('trench-crusade', TrenchCrusadeArmorSheet, {
    makeDefault: true,
    label: 'TRENCHCRUSADE.SheetLabels.Armor',
    types: ['armor']
  });

  Items.registerSheet('trench-crusade', TrenchCrusadeWeaponSheet, {
    makeDefault: true,
    label: 'TRENCHCRUSADE.SheetLabels.Weapon',
    types: ['weapon']
  });

  // Preload Handlebars templates.
  return preloadHandlebarsTemplates();
});

/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */

// If you need to add Handlebars helpers, here is a useful example:
Handlebars.registerHelper('toLowerCase', function (str) {
  return str.toLowerCase();
});

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once('ready', function () {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on('hotbarDrop', (bar, data, slot) => createItemMacro(data, slot));


});

Hooks.on("getSceneControlButtons", (buttons) => {
  //const tokenButtons = buttons.find(b => b.name === 'token')
  //tokenButtons.tools.push() // put the tool data in here
});

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createItemMacro(data, slot) {
  // First, determine if this is a valid owned item.
  if (data.type !== 'Item') return;
  if (!data.uuid.includes('Actor.') && !data.uuid.includes('Token.')) {
    return ui.notifications.warn(
      'You can only create macro buttons for owned Items'
    );
  }
  // If it is, retrieve it based on the uuid.
  const item = await Item.fromDropData(data);

  // Create the macro command using the uuid.
  const command = `game.trenchcrusade.rollItemMacro("${data.uuid}");`;
  let macro = game.macros.find(
    (m) => m.name === item.name && m.command === command
  );
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: 'script',
      img: item.img,
      command: command,
      flags: { 'trench-crusade.itemMacro': true },
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemUuid
 */
function rollItemMacro(itemUuid) {
  // Reconstruct the drop data so that we can load the item.
  const dropData = {
    type: 'Item',
    uuid: itemUuid,
  };
  // Load the item from the uuid.
  Item.fromDropData(dropData).then((item) => {
    // Determine if the item loaded and if it's an owned item.
    if (!item || !item.parent) {
      const itemName = item?.name ?? itemUuid;
      return ui.notifications.warn(
        `Could not find item ${itemName}. You may need to delete and recreate this macro.`
      );
    }

    // Trigger the item roll
    item.roll();
  });
}
