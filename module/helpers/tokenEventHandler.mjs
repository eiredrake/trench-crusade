import PlaceableActorBase from "../data/actor-placeableActor.mjs";

export default class tokenEventHandler 
{
    static ACTOR_UNIT_TYPE = Object.freeze('unit');
    static ACTOR_PLACEABLE_TYPE = Object.freeze('placeable');

    static async stakePlaceable(actor, placableToken)
    {
        if(actor != undefined && placableToken != undefined)
        {
            const token = actor.token;
            const templateId = token.getFlag('trench-crusade', 'template-id');
            if(templateId != undefined)
            {
                const template = token.parent.templates.get(templateId);
                if(template != undefined)
                {
                    const shape = template.object.shape ?? template.object._computeShape();
                    if(shape != undefined)
                    {
                        const points = shape.points ?? shape.toPolygon().points;
                        if(points != undefined)
                        {
                            let shape = {
                                hole: false,
                                type: 'polygon',
                                points: points.map((pt, ind) => ind % 2 ? pt + template.y : pt + template.x)
                            };

                            let system = {
                                color: "#ff0000",
                                events : [
                                    'tokenMoveIn',
                                    'tokenMoveOut',
                                ],
                                text: 'ASSHOLE',
                                visibility: 2,
                            }

                            let regionBehavior = {
                                disabled: false,
                                name: 'Display Scrolling Text',
                                type: 'displayScrollingText',
                                system: system,
                            };

                            let mineTriggerRegion = await canvas.scene.createEmbeddedDocuments('Region', [{
                                color: "#ff0000",
                                name: `${token.name} Trigger Region`,
                                shapes: [shape],
                                behaviors: [regionBehavior],
                                visibility: 0,
                                flags: {
                                    'trench-crusade' : {'actor-id': `${actor.id}`},
                                }
                            }]);
                      
                            token.update(
                                {
                                    flags: {
                                        'trench-crusade' : { 'region-id' : mineTriggerRegion[0].uuid }
                                    } 
                                });
                        }
                    }

                    template.delete();
                }
            }
        }
    }


    static async onDeleteToken(token, options, userId)
    {
        const actor = token.actor;
        switch(actor.type)
        {
            case tokenEventHandler.ACTOR_UNIT_TYPE:
                break;
            case tokenEventHandler.ACTOR_PLACEABLE_TYPE:
                tokenEventHandler.#onDeletePlaceable(token)
                break;
        }
    }

    static async onMoveToken(token, options)
    {
        const actor = token.actor;
        switch(actor.type)
        {
            case tokenEventHandler.ACTOR_UNIT_TYPE:
                break;
            case tokenEventHandler.ACTOR_PLACEABLE_TYPE:
                tokenEventHandler.#onMovePlaceable(token, options);
                break;
        }
    }

    static async #onMovePlaceable(token, options)
    {
        const templateId = token.getFlag('trench-crusade', 'template-id');
        if(templateId != undefined)
        {
            const tokenCenter = token.object.getCenterPoint();
            const template = token.parent.templates.get(templateId);
            if(template != undefined && options.x != undefined && options.y != undefined)
            {
                const x = options.x;
                const y = options.y;

                const deltaX = Math.floor((token.object.getSize().width / 2));
                const deltaY = Math.floor((token.object.getSize().height / 2));
                template.update(
                    {
                        x: x + deltaX,
                        y: y + deltaY
                    });
            }
        }
    }

    static async #onDeletePlaceable(token)
    {
        const templateId = token.getFlag('trench-crusade', 'template-id');
        const regionId = token.getFlag('trench-crusade', 'region-id');
        if(templateId != undefined)
        {
            const template = token.parent.templates.get(templateId);
            if(template != undefined)
                template.delete();
        }

        if(regionId != undefined)
        {
            const region = await fromUuid(regionId);
            if(region != undefined)
                region.delete();
        }
    }


    static #onDropUnit(actor, token)
    {
        actor.setFlag('trench-crusade', '.purchased-unit', true);
        actor.setFlag('trench-crusade', '.has-activated', false);

        if(token != undefined)
        {
            token.update({flags: {} });
            token.update({'occludable': '{ radius: 3}'});
            token.update({'ring.colors.ring': "#00ff00"});
            token.update({'ring.enabled': 'true'});
        }
    }

    static async #onDropPlacable(actor, token)
    {
        let radius = 2;
        let borderColor = '#000000';
        let fillColor = '#FF0000';

        if(actor.system.areaOfEffect != undefined)
        {
            if(actor.system.areaOfEffect > radius)
                radius = actor.system.areaOfEffect.radius;

            if(actor.system.areaOfEffect.borderColor)
                fillColor = actor.system.areaOfEffect.borderColor;

            if(actor.system.areaOfEffect.fillColor)
                fillColor = actor.system.areaOfEffect.fillColor;
        }


        const tokenCenter = token.object.getCenterPoint();
        const templateData = {
            t: 'circle',
            angle: 0,
            user: game.user.id,
            x: tokenCenter.x, 
            y: tokenCenter.y,
            direction: 16,
            distance: radius,
            borderColor: borderColor,
            fillColor: fillColor,
        };

        const template = await MeasuredTemplateDocument.create(templateData, 
            { 
                parent: canvas.scene
            }
        );

        token.setFlag('trench-crusade', 'template-id', template.id);
    }


    static onCreateToken(token, options, userId)
    {
        const actor = token.actor;
        console.info(`token: ${token.id} for actor actor: ${actor.id} placed on table`);

        switch(actor.type)
        {
            case tokenEventHandler.ACTOR_UNIT_TYPE:
                    this.#onDropUnit(actor, token);
                break;
            case tokenEventHandler.ACTOR_PLACEABLE_TYPE:
                    this.#onDropPlacable(actor, token);
                break;
        }
    }
}