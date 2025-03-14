// Import document classes.
import { TrenchCrusadeActor } from './documents/actor.mjs';
import { TrenchCrusadeItem } from './documents/item.mjs';
import { TrenchCrusadeArmor } from './documents/armor.mjs';
import { TrenchCrusadeWeapon } from './documents/weapon.mjs';
import { TrenchCrusadeTrap } from './documents/trap.mjs';

// Import sheet classes.
import { TrenchCrusadeActorSheet } from './sheets/actor-sheet.mjs';
import { TrenchCrusadeItemSheet } from './sheets/item-sheet.mjs';
import { TrenchCrusadeArmorSheet } from './sheets/item-armor-sheet.mjs';
import { TrenchCrusadeWeaponSheet } from './sheets/item-weapon-sheet.mjs';
import { TrenchCrusadeTrapSheet } from './sheets/placeable-trap.mjs';

// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from './helpers/templates.mjs';
import { TRENCHCRUSADE } from './helpers/config.mjs';
// Import DataModel classes
import * as models from './data/_module.mjs';

import {DicePool} from "./apps/dice/DicePool.mjs";
import {Armoury} from "./apps/armoury/Armoury.mjs";
import tokenEventHandler from './helpers/tokenEventHandler.mjs';

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
    TrenchCrusadeTrap,
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
    formula: '1',
    decimals: 2,
  };

  // Define custom Document and DataModel classes
  CONFIG.Actor.documentClass = TrenchCrusadeActor;

  // Note that you don't need to declare a DataModel
  // for the base actor/item classes - they are included
  // with the Unit as part of super.defineSchema()
  CONFIG.Actor.dataModels = {
    unit: models.TrenchCrusadeUnit,
    trap: models.PlaceableTrap,
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
  Actors.registerSheet(game.system.id, TrenchCrusadeActorSheet, {
    makeDefault: true,
    label: 'TRENCHCRUSADE.SheetLabels.Actor',
  });

  Actors.registerSheet(game.system.id, TrenchCrusadeTrapSheet, {
    makeDefault: true,
    label: 'TRENCHCRUSADE.SheetLabels.Trap',
  });

  Items.unregisterSheet('core', ItemSheet);
  Items.registerSheet(game.system.id, TrenchCrusadeItemSheet, {
    makeDefault: true,
    label: 'TRENCHCRUSADE.SheetLabels.Item',
  });

  Items.registerSheet(game.system.id, TrenchCrusadeArmorSheet, {
    makeDefault: true,
    label: 'TRENCHCRUSADE.SheetLabels.Armor',
    types: ['armor']
  });

  Items.registerSheet(game.system.id, TrenchCrusadeWeaponSheet, {
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

  Hooks.on('combatStart', (combat, updateData) => combatStart(combat, updateData));

  Hooks.on('deleteCombat', (combat, updateData) => combatStop(combat, updateData));

  Hooks.on('combatRound', (combat, updateData, updateOptions) => combatRound(combat, updateData, updateOptions));

  Hooks.on('preUpdateToken', (token, change) =>preUpdateToken(token, change));  
});

Hooks.on('createToken', (token, options, userId) => 
{
  tokenEventHandler.onCreateToken(token, options, userId);
});

Hooks.on('deleteToken', (token, options, userId) => 
{
  tokenEventHandler.onDeleteToken(token, options, userId);
});      

Hooks.on('updateToken', (token, options) => {
  tokenEventHandler.onMoveToken(token, options);
});


function preUpdateToken(token, change) {
  console.info(`preUpdateToken called`);
  if(token != null)
  {
    const actor = token.actor;
    if(actor != undefined && change.x != undefined && change.y != undefined)
    {
      switch(actor.type)
      {
        case token.ACTOR_UNIT_TYPE:
          if(actor.inCombat && game.combat != undefined && game.combat.current.turn != undefined)
          {
            const hasActivated = actor.getFlag(game.system.id, 'has-activated');
            console.info(`has-activated: ${hasActivated}`);
            if(hasActivated == undefined || hasActivated == false)
            {             
              foundry.utils.setProperty(change, 'ring.colors.ring', '#FF0000');
              foundry.utils.setProperty(change, 'flags.trench-crusade.has-activated', true);

              actor.setFlag('trench-crusade', 'has-activated', true);

              token.update(
                {
                  'ring.colors.ring': '#00FF00',
                  'flags.trench-crusade.has-activated' : true,
                }
              );
    
              console.info(`actor ${actor.name} ring color set to red`);
              console.info(`actor ${actor.name} has-activated flag set to TRUE`);
            }
          }
          break;
        case tokenEventHandler.ACTOR_TRAP_TYPE:
          
          break;
      }
    }
  }
};

function combatStart(combat, updateData) {
  console.info(`combatStart called`);

  for(const placableToken of canvas.tokens.placeables)
  {
    const actor = placableToken.actor;
    switch(actor.type)
    {
      case tokenEventHandler.ACTOR_TRAP_TYPE:
        tokenEventHandler.stakePlaceable(actor, placableToken);
        break;
      case tokenEventHandler.ACTOR_UNIT_TYPE:
        placableToken.document.toggleCombatant();   
        break;
    }
  }
}

function combatStop(combat, updateData) {
  console.info(`combatStop called`);
  for(const combatant of combat?.combatants ?? []) 
  {
      const token = combatant.token;
      const hasActivated = combatant.actor.getFlag(game.system.id, 'has-activated');
      if(hasActivated)
      {       
        combatant.actor.setFlag('trench-crusade', 'has-activated', false);
        token.update({'ring.colors.ring': '#00FF00'});

        console.info(`updateCombatRound forced render on : ${combatant.actor.id}`);
      }
  }      
};

function combatRound(combat, updateData, updateOptions) {
  console.info(`updateCombatRound called`);

  for(const combatant of combat?.combatants ?? [])
    {
      const token = combatant.token;     
      const hasActivated = combatant.actor.getFlag(game.system.id, 'has-activated');
      console.info(`actor ${combatant.actor.name} has-activated flag IS set to ${hasActivated}}.`);

      if(hasActivated)
      {       
        combatant.actor.setFlag('trench-crusade', 'has-activated', false);
        token.update({'ring.colors.ring': '#00FF00'});

        console.info(`updateCombatRound forced render on : ${combatant.actor.id}`);
      }
    }
};


Hooks.on("renderActorDirectory", (app, [html], context) => {
  console.info(`APP: ${app}`);
  console.info(`HTML: ${html}`);
  console.info(`CONTEXT: ${context}`);

  const entries = html.querySelectorAll('li.directory-item.document.actor.flexrow');
  if(entries.length <= 0)
    console.info("No items matched query");
  else
    console.info(`${entries.length} items matched query`);

    for(const entry of entries)
    {
      const entryId = entry.dataset.entryId;
      const actor = game.actors.get(entryId);

      const modelName = actor.name;
      const unitName = actor.system.unitName;

      if(unitName != undefined && unitName.length > 0)
      {
        const nameElement = entry.querySelector('h4.entry-name.document-name');
        if(nameElement != undefined)
        {
          //console.info(`render actor: ${modelName} - ${unitName}`);
          nameElement.innerHTML = `<a>
              <div class='actor-model-name'>
                ${modelName}
              </div>
              <div class='actor-unit-name'>
                ${unitName}
              </div>
            </a>`;
          
          //nameElement.innerHTML=`<a>${unitName}</a>`;
        }
      };
    };
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
