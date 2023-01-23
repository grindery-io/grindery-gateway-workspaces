const NexusClient = require("grindery-nexus-client").default;

const perform = async (z, bundle) => {
  const client = new NexusClient();
  try {
    let chains = await client.listChains("evm");
    // this should return an array of objects

    if (chains) {
      var result = [];
      chains.map((chain) => {
        result.push({
          id: chain.value,
          key: chain.value,
          title: chain.label,
        });
      });
      return result;
    } else {
      return [];
    }
  } catch (error) {
    z.console.log(
      "Auth Error in List Chains Triggers (Zapier)-Trigger (listChains.js)",
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
  key: "list_chains_trigger",
  noun: "List_chains_trigger",

  display: {
    label: "New List_chains_triggers",
    description: "Triggers when a new list_chains_triggers is created.",
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
      { key: "id", label: "Chain" },
      { key: "title", label: "Chain Name" },
    ],
  },
};
