import TrenchCrusadeItemBase from "./base-item.mjs";

export default class TrenchCrusadeWeapon extends TrenchCrusadeItemBase {

  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    const schema = super.defineSchema();

    
    schema.weaponType = new fields.StringField({ required: true, blank: true }); 
    schema.range = new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 });
    schema.toHitModifier = new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 });
    schema.toInjureModifier = new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 });
    schema.shieldCombo =  new fields.BooleanField( { required: false } );


    return schema;
  }

  prepareDerivedData() {
    // Build the formula dynamically using string interpolation
    // const roll = this.roll;

    // this.formula = `${roll.diceNum}${roll.diceSize}${roll.diceBonus}`
  }
}