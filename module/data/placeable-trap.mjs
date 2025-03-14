import PlaceableBase from "./placeable-base.mjs";


export default class PlaceableTrap extends PlaceableBase {

  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    const schema = {};

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