import TrenchCrusadeDataModel from "./base-model.mjs";


export default class PlaceableBase extends TrenchCrusadeDataModel {

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = {};

    schema.description = new fields.StringField({ required: true, blank: true });

    return schema;
  }

}