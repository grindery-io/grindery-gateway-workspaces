const {
  config: authentication,
  befores = [],
  afters = [],
} = require("./authentication");

const listDrivers = require("./triggers/list_drivers");

const createSendWebhookToTrigger = require("./creates/send_webhook_to_trigger");

const getTriggerZapFromGrindery = require("./triggers/trigger_zap_from_grindery");

const createRunGrinderyAction = require("./creates/run_grindery_action");

const getListDriverActions = require("./triggers/list_driver_actions");

const getListDriverTriggers = require("./triggers/list_driver_triggers");

const getTriggerFromAGrinderyWorkflow = require("./triggers/trigger_from_a_grindery_workflow");

const getListDriversWithTriggers = require("./triggers/list_drivers_with_triggers");

module.exports = {
  // This is just shorthand to reference the installed dependencies you have.
  // Zapier will need to know these before we can upload.
  version: require("./package.json").version,
  platformVersion: require("zapier-platform-core").version,

  authentication,

  beforeRequest: [...befores],

  afterResponse: [...afters],

  // If you want your trigger to show up, you better include it here!
  triggers: {
    [getTriggerZapFromGrindery.key]: getTriggerZapFromGrindery,
    [listDrivers.key]: listDrivers,
    [getListDriverActions.key]: getListDriverActions,
    [getListDriverTriggers.key]: getListDriverTriggers,
    [getTriggerFromAGrinderyWorkflow.key]: getTriggerFromAGrinderyWorkflow,
    [getListDriversWithTriggers.key]: getListDriversWithTriggers,
  },

  // If you want your searches to show up, you better include it here!
  searches: {},

  // If you want your creates to show up, you better include it here!
  creates: {
    [createSendWebhookToTrigger.key]: createSendWebhookToTrigger,
    [createRunGrinderyAction.key]: createRunGrinderyAction,
  },

  resources: {},
};
