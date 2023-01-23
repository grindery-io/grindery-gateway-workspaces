const NexusClient = require("grindery-nexus-client").default;

// triggers on a new getconnectors with a certain tag
const perform = async (z, bundle) => {
  const client = new NexusClient();
  try {
    client.authenticate(`${bundle.authData.access_token}`);
    const nexus_response = await client.listDrivers();
    z.console.log("Grinder Drivers", nexus_response);

    var key_array = [];
    //only web3 drivers with actions
    let filtered_array = nexus_response.filter(
      (driver) => driver.type === "web3"
    );
    filtered_array.map((driver) => {
      z.console.log("Listing this driver: ", driver);
      if (driver.actions && driver.actions.length > 0) {
        key_array.push({
          id: driver.key,
          key: driver.key,
          title: driver.name,
        });
      }
    });
    // this should return an array of objects
    //return key_array;
    return key_array;
  } catch (error) {
    z.console.log(
      "Auth Error in List Driver Trigger (list_drivers.js)",
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
  key: "list_drivers",
  noun: "Driver",

  display: {
    label: "List Drivers",
    description: "List Grindery Nexus Drivers",
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
      { key: "id", label: "Driver ID" },
      { key: "title", label: "Driver Name" },
    ],
  },
};
