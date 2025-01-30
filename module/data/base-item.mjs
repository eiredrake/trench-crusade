import TrenchCrusadeDataModel from "./base-model.mjs";

export default class TrenchCrusadeItemBase extends TrenchCrusadeDataModel {

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = {};

    schema.description = new fields.StringField({ required: true, blank: true });
    schema.rules = new fields.HTMLField({ required: false, blank: true }); 
    
    return schema;
  }

}