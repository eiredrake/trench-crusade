import {setOptions} from "../helpers/helpers.mjs";
import TrenchCrusadeDataModel from "./base-model.mjs";


export default class TrenchCrusadeActorBase extends TrenchCrusadeDataModel {

  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    const schema = {};

    schema.requiredUnit = new fields.BooleanField( { required: false } );
    schema.faction = new fields.StringField({ required: true, blank: true }); 
    schema.keywords = new fields.SetField(setOptions());

    schema.blood = new fields.SchemaField({
      value: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0, max: 6 }),
      max: new fields.NumberField({ ...requiredInteger, initial: 6, max: 6 }),
    });

    schema.blessings = new fields.SchemaField({
      value: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0}),
    });

    schema.description = new fields.StringField({ required: true, blank: true });

    schema.cost = new fields.SchemaField({
      ducats: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0}),
      glory: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0}),
    });


    return schema;
  }

}