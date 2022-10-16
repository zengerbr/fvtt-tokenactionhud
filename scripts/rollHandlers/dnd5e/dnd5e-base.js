import { RollHandler } from "../rollHandler.js";
import * as settings from "../../settings.js";

export class RollHandlerBase5e extends RollHandler {
  constructor() {
    super();
  }

  /** @override */
  async doHandleActionEvent(event, encodedValue) {
    let payload = encodedValue.split("|");

    if (payload.length != 4) {
      super.throwInvalidValueErr();
    }

    let actionType = payload[0];
    let actorId = payload[1];
    let tokenId = payload[2];
    let actionId = payload[3];

    if (tokenId === "multi" && actionId !== "toggleCombat") {
      for (const token of canvas.tokens.controlled) {
        const tokenActorId = token.actor?.id;
        const tokenTokenId = token.id;
        await this._handleMacros(
          event,
          actionType,
          tokenActorId,
          tokenTokenId,
          actionId
        );
      }
    } else {
      await this._handleMacros(event, actionType, actorId, tokenId, actionId);
    }
  }

  async _handleMacros(event, actionType, actorId, tokenId, actionId) {
    switch (actionType) {
      case "ability":
        this.rollAbilityMacro(event, actorId, tokenId, actionId);
        break;
      case "skill":
        this.rollSkillMacro(event, actorId, tokenId, actionId);
        break;
      case "abilitySave":
        this.rollAbilitySaveMacro(event, actorId, tokenId, actionId);
        break;
      case "abilityCheck":
        this.rollAbilityCheckMacro(event, actorId, tokenId, actionId);
        break;
      case "item":
      case "weapon":
      case "spell":
      case "feat":
        if (this.isRenderItem()) this.doRenderItem(actorId, actionId);
        else this.rollItemMacro(event, actorId, tokenId, actionId);
        break;
      case "utility":
        await this.performUtilityMacro(event, actorId, tokenId, actionId);
        break;
      case "effect":
        await this.toggleEffect(event, actorId, tokenId, actionId);
        break;
      case "condition":
        if (!tokenId) return;
        await this.toggleCondition(event, tokenId, actionId);
      default:
        break;
    }
  }

  rollAbilityMacro(event, actorId, tokenId, checkId) {
    const actor = super.getActor(tokenId, actorId);
    actor.rollAbility(checkId, { event: event });
  }

  rollAbilityCheckMacro(event, actorId, tokenId, checkId) {
    const actor = super.getActor(tokenId, actorId);
    actor.rollAbilityTest(checkId, { event: event });
  }

  rollAbilitySaveMacro(event, actorId, tokenId, checkId) {
    const actor = super.getActor(tokenId, actorId);
    actor.rollAbilitySave(checkId, { event: event });
  }

  rollSkillMacro(event, actorId, tokenId, checkId) {
    const actor = super.getActor(tokenId, actorId);
    actor.rollSkill(checkId, { event: event });
  }

  rollItemMacro(event, actorId, tokenId, actionId) {
    let actor = super.getActor(tokenId, actorId);
    let item = super.getItem(actor, actionId);

    if (this.needsRecharge(item)) {
      item.rollRecharge();
      return;
    }

    return item.use({ event });
  }

  needsRecharge(item) {
    return (
      item.system.recharge &&
      !item.system.recharge.charged &&
      item.system.recharge.value
    );
  }

  async performUtilityMacro(event, actorId, tokenId, actionId) {
    let actor = super.getActor(tokenId, actorId);
    let token = super.getToken(tokenId);

    switch (actionId) {
      case "shortRest":
        actor.shortRest();
        break;
      case "longRest":
        actor.longRest();
        break;
      case "inspiration":
        let update = !actor.system.attributes.inspiration;
        actor.update({ "data.attributes.inspiration": update });
        break;
      case "toggleCombat":
        if (canvas.tokens.controlled.length === 0) break;
        await canvas.tokens.controlled[0].toggleCombat();
        Hooks.callAll("forceUpdateTokenActionHUD");
        break;
      case "toggleVisibility":
        if (!token) break;
        token.toggleVisibility();
        Hooks.callAll("forceUpdateTokenActionHUD");
        break;
      case "deathSave":
        actor.rollDeathSave({ event });
        break;
      case "initiative":
        await this.performInitiativeMacro(actorId);
        break;
      case "endTurn":
        if (!token) break;
        if (game.combat?.current?.tokenId === tokenId)
          await game.combat?.nextTurn();
        break;
    }
  }

  async performInitiativeMacro(actorId) {
    let actor = super.getActor(tokenId, actorId);

    await actor.rollInitiative({ createCombatants: true });

    Hooks.callAll("forceUpdateTokenActionHUD");
  }

  async toggleEffect(event, actorId, tokenId, effectId) {
    const actor = super.getActor(tokenId, actorId);
    const effects =
      "find" in actor.effects.entries ? actor.effects.entries : actor.effects;
    const effect = effects.find((e) => e.id === effectId);

    if (!effect) return;

    const statusId = effect.flags.core?.statusId;
    if (tokenId && statusId) {
      await this.toggleCondition(event, tokenId, statusId, effect);
      return;
    }

    await effect.update({ disabled: !effect.disabled });
    Hooks.callAll("forceUpdateTokenActionHUD");
  }

  async toggleCondition(event, tokenId, effectId, effect = null) {
    const token = super.getToken(tokenId);
    const isRightClick = this.isRightClick(event);
    if (game.dfreds && effect?.flags?.isConvenient) {
      const effectLabel = effect.label;
      game.dfreds.effectInterface.toggleEffect(effectLabel);
    } else {
      const condition = this.findCondition(effectId);
      if (!condition) return;

      isRightClick
        ? await token.toggleEffect(condition, { overlay: true })
        : await token.toggleEffect(condition);
    }

    Hooks.callAll("forceUpdateTokenActionHUD");
  }

  findCondition(id) {
    return CONFIG.statusEffects.find((effect) => effect.id === id);
  }
}
