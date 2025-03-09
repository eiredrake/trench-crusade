import TrenchCrusadeDataModel from "./base-model.mjs";


export default class PlaceableActorBase extends TrenchCrusadeDataModel {

  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    const schema = {};

    schema.description = new fields.StringField({ required: true, blank: true });

    schema.cost = new fields.SchemaField({
      ducats: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0}),
      glory: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0}),
    });

    schema.areaOfEffect = new fields.SchemaField({
      radius: new fields.NumberField({ ...requiredInteger, initial: 2, min: 1}),
      borderColor: new fields.StringField({ required: true, blank: true, default: '#000000' }),   
      fillColor: new fields.StringField({ required: true, blank: true, default: '#FF0000' }),   
    });


    return schema;
  }

}