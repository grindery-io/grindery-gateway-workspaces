const {
  performGrinderyAction,
  getInputFields,
  getOutputFields,
} = require("../utils");

const perform = async (z, bundle) => {
  return await performGrinderyAction(z, bundle);
};

module.exports = {
  // see here for a full list of available properties:
  // https://github.com/zapier/zapier-platform/blob/master/packages/schema/docs/build/schema.md#createschema
  key: "run_grindery_action",
  noun: "Grindery Gateway",

  display: {
    label: "Grindery Gateway",
    description: "Configure actions using Grindery Gateway directly in Zapier",
  },

  operation: {
    perform,

    // `inputFields` defines the fields a user could provide
    // Zapier will pass them in as `bundle.inputData` later. They're optional.
    // End-users will map data into these fields. In general, they should have any fields that the API can accept. Be sure to accurately mark which fields are required!
    inputFields: [
      {
        key: "driver_id",
        label: "Destination",
        type: "string",
        required: true,
        altersDynamicFields: true,
        dynamic: "list_drivers.key",
      },
      {
        key: "action_id",
        label: "Driver Action",
        type: "string",
        required: true,
        altersDynamicFields: true,
        dynamic: "list_driver_actions.key",
      },
      async function (z, bundle) {
        return await getInputFields(z, bundle);
      },
    ],

    // In cases where Zapier needs to show an example record to the user, but we are unable to get a live example
    // from the API, Zapier will fallback to this hard-coded sample. It should reflect the data structure of
    // returned records, and have obvious placeholder values that we can show to any user.
    sample: {
      _grinderyChain: "eip155:1",
    },

    // If fields are custom to each user (like spreadsheet columns), `outputFields` can create human labels
    // For a more complete example of using dynamic fields see
    // https://github.com/zapier/zapier-platform/tree/master/packages/cli#customdynamic-fields
    // Alternatively, a static field definition can be provided, to specify labels for the fields
    outputFields: [
      async function (z, bundle) {
        return await getOutputFields(z, bundle, "actions");
      },
    ],
  },
};
