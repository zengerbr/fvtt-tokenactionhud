import { SystemManager } from "./manager.js";
import { CategoryManager } from "../categories/categoryManager.js";
import { ActionHandlerDemonlord as ActionHandler } from "../actions/demonlord/demonlord-actions.js";
import { RollHandlerBaseDemonlord as Core } from "../rollHandlers/demonlord/demonlord-base.js";
import * as settings from "../settings/demonlord-settings.js";

export class DemonlordSystemManager extends SystemManager {
  constructor(appName) {
    super(appName);
  }

  /** @override */
  doGetCategoryManager(user) {
    const categoryManager = new CategoryManager(user);
    return categoryManager;
  }

  /** @override */
  doGetActionHandler(character, categoryManager) {
    const actionHandler = new ActionHandler(character, categoryManager);
    return actionHandler;
  }

  /** @override */
  getAvailableRollHandlers() {
    const choices = { core: "Core Demonlord" };

    return choices;
  }

  /** @override */
  doGetRollHandler(handlerId) {
    return new Core();
  }

  /** @override */
  doRegisterSettings(appName, updateFunc) {
    settings.register(appName, updateFunc);
  }

  /** @override */
  async doRegisterDefaultFlags() {
    const defaults = {
      default: {
        categories: {
          challenge: { 
            id: "challenge",
            title: this.i18n("tokenActionHud.demonLord.challengeRoll"),
            subcategories: {
              challenge_challenge: { 
                id: "challenge" ,
                title: this.i18n("tokenActionHud.demonLord.challengeRoll"),
                type: "system"
              }
            }
          },
          weapons: { 
            id: "weapons",
            title: this.i18n("tokenActionHud.demonLord.weapons"),
            subcategories: {
              weapons_weapons: { 
                id: "weapons" ,
                title: this.i18n("tokenActionHud.demonLord.weapons"),
                type: "system"
              }
            }
          },
          talents: { 
            id: "talents",   
            title: this.i18n("tokenActionHud.demonLord.talents"),
            subcategories: {
              talents_talents: {
                id: "talents",
                title: this.i18n("tokenActionHud.demonLord.talents"),
                type: "system"
              }
            }
          },
          spells: { 
            id: "spells",     
            title: this.i18n("tokenActionHud.demonLord.spells"), 
            subcategories: {
              spells_spells: {
                id: "spells",
                title: this.i18n("tokenActionHud.demonLord.spells"),
                type: "system"
              }
            }  
          },
          utility: { 
            id: "utility", 
            title: this.i18n("tokenActionHud.utility"),
            subcategories: {
              utility_combat: {
                id: "combat",
                title: this.i18n("tokenActionHud.combat"),
                type: "system"
              },
              utility_rest: {
                id: "rest",
                title: this.i18n("tokenActionHud.demonLord.rest"),
                type: "system"
              },
              utility_token: {
                id: "token",
                title: this.i18n("tokenActionHud.token"),
                type: "system"
              }
            }
          }
        },
        subcategories: [
          { id: "challenge", title: this.i18n("tokenActionHud.demonLord.challengeRoll"), type: "system" },
          { id: "weapons", title: this.i18n("tokenActionHud.demonLord.weapons"), type: "system" },
          { id: "talents", title: this.i18n("tokenActionHud.demonLord.talents"), type: "system" },
          { id: "combat", title: this.i18n("tokenActionHud.combat"), type: "system" },
          { id: "rest", title: this.i18n("tokenActionHud.demonLord.rest"), type: "system" },
          { id: "token", title: this.i18n("tokenActionHud.token"), type: "system" }
        ]
      } 
    }
    await game.user.update({flags: {"token-action-hud": defaults}})
  }
}
