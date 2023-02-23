const NexusClient = require("grindery-nexus-client").default;

// triggers on a new list_driver_triggers with a certain tag
const perform = async (z, bundle) => {
  const client = new NexusClient();
  try {
    let response = await client.connector.get({
      driverKey: bundle.inputData.driver_id,
    });
    // this should return an array of objects
    let driver_triggers = response.triggers;
    if (driver_triggers) {
      var key_array = [];
      driver_triggers.map((trigger) => {
        key_array.push({
          id: trigger.key,
          key: trigger.key,
          title: trigger.display.label,
        });
      });
      return key_array;
    } else {
      return [];
    }
  } catch (error) {
    z.console.log(
      "Auth Error in List Driver Triggers (Zapier)-Trigger (list_driver_triggers.js)",
      error.message
    );
    if (error.message === "Invalid access token") {
      throw new z.errors.RefreshAuthError();
    }
  }
};

module.exports = {
  // see here for a full list of available properties:
  // https://github.com/zapier/zapier-platform/blob/master/packages/schema/docs/build/schema.md#triggerschema
  key: "list_driver_triggers",
  noun: "List_driver_triggers",

  display: {
    label: "New List_driver_triggers",
    description: "Triggers when a new list_driver_triggers is created.",
    hidden: true,
  },

  operation: {
    perform,

    // `inputFields` defines the fields a user could provide
    // Zapier will pass them in as `bundle.inputData` later. They're optional.
    inputFields: [],

    // In cases where Zapier needs to show an example record to the user, but we are unable to get a live example
    // from the API, Zapier will fallback to this hard-coded sample. It should reflect the data structure of
    // returned records, and have obvious placeholder values that we can show to any user.
    sample: {
      id: 1,
      name: "Test",
    },

    // If fields are custom to each user (like spreadsheet columns), `outputFields` can create human labels
    // For a more complete example of using dynamic fields see
    // https://github.com/zapier/zapier-platform/tree/master/packages/cli#customdynamic-fields
    // Alternatively, a static field definition can be provided, to specify labels for the fields
    outputFields: [
      // these are placeholders to match the example `perform` above
      { key: "id", label: "Driver" },
      { key: "title", label: "Driver Label" },
    ],
  },
};
