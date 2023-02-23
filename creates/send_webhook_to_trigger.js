const NexusClient = require("grindery-nexus-client").default;

// create a particular send_webhook_to_trigger by name
const perform = async (z, bundle) => {
  //const token = await client.getToken();
  const client = new NexusClient(bundle.authData.access_token);
  try {
    //const nexus_response = await client.listWorkspaces();
    const payload = {
      param1: bundle.inputData.param1 ? bundle.inputData.param1 : "",
      param2: bundle.inputData.param2 ? bundle.inputData.param2 : "",
      param3: bundle.inputData.param3 ? bundle.inputData.param3 : "",
      param4: bundle.inputData.param4 ? bundle.inputData.param4 : "",
      param5: bundle.inputData.param5 ? bundle.inputData.param5 : "",
      param6: bundle.inputData.param6 ? bundle.inputData.param6 : "",
      param7: bundle.inputData.param7 ? bundle.inputData.param7 : "",
      param8: bundle.inputData.param8 ? bundle.inputData.param8 : "",
      param9: bundle.inputData.param9 ? bundle.inputData.param9 : "",
      param10: bundle.inputData.param10 ? bundle.inputData.param10 : "",
    };
    const nexus_response = await client.connector.callWebhook({
      connectorKey: "zapier",
      operationKey: "waitForZap",
      body: { payload: payload, token: bundle.inputData.workflow_id }, //optional string 'staging'
    });

    z.console.log("Nexus Response:", JSON.stringify(nexus_response));

    // this should return a single object
    return { result: "ok" };
  } catch (error) {
    z.console.log("Error retrieving workspaces: ", error.message);
    //possibly test the response
    if (error.message === "Invalid access token") {
      throw new z.errors.RefreshAuthError();
    }
  }
};

module.exports = {
  // see here for a full list of available properties:
  // https://github.com/zapier/zapier-platform/blob/master/packages/schema/docs/build/schema.md#createschema
  key: "send_webhook_to_trigger",
  noun: "Webhook",

  display: {
    label: "Grindery Flow",
    description: "Trigger existing workflows in Grindery Flow",
    hidden: true,
  },

  operation: {
    perform,

    // `inputFields` defines the fields a user could provide
    // Zapier will pass them in as `bundle.inputData` later. They're optional.
    // End-users will map data into these fields. In general, they should have any fields that the API can accept. Be sure to accurately mark which fields are required!
    inputFields: [
      {
        key: "workspace_id",
        label: "Grindery Workspace",
        type: "string",
        required: true,
        altersDynamicFields: true,
        dynamic: "workspace.key",
      },
      async function (z, bundle) {
        const client = new NexusClient(bundle.authData.access_token);
        try {
          let nexus_response = [];
          const getWorkspaces = await client.workspace.list();
          if (bundle.inputData.workspace_id === "default") {
            nexus_response = await client.workflow.list({});
          } else {
            z.console.log("Returned Workspaces", JSON.stringify(getWorkspaces));
            //filter list that matches bundle.inputData.workspace_id - the selected id from dropdown above
            const thisWorkspace = getWorkspaces.filter(
              (workspace) => workspace.key === bundle.inputData.workspace_id
            );

            // z.console.log(`This workspaces token is: ${thisWorkspace.token}`);
            const client2 = new NexusClient(`${thisWorkspace[0].token}`);
            nexus_response = await client2.workflow.list({
              workspaceKey: bundle.inputData.workspace_id,
            });
          }

          if (nexus_response) {
            z.console.log("This Workspace workflows: ", nexus_response);
            let filtered_array = nexus_response.filter(
              (workflow) => workflow.workflow.trigger.connector === "zapier"
            );
            let choices = {};
            if (filtered_array) {
              filtered_array.map((item) => {
                z.console.log(
                  "Workflow Trigger: ",
                  JSON.stringify(item.workflow.trigger)
                );
                choices = {
                  [item.workflow.trigger.input.token]: item.workflow.title,
                  ...choices,
                };
              });
            }
            return [
              {
                key: "workflow_id",
                label: "Grindery Workflow",
                type: "string",
                required: true,
                choices: choices,
              },
              {
                key: "param1",
                label: "param1",
                type: "string",
              },
              {
                key: "param2",
                label: "param2",
                type: "string",
              },
              {
                key: "param3",
                label: "param3",
                type: "string",
              },
              {
                key: "param4",
                label: "param4",
                type: "string",
              },
              {
                key: "param5",
                label: "param5",
                type: "string",
              },
              {
                key: "param6",
                label: "param6",
                type: "string",
              },
              {
                key: "param7",
                label: "param7",
                type: "string",
              },
              {
                key: "param8",
                label: "param8",
                type: "string",
              },
              {
                key: "param9",
                label: "param9",
                type: "string",
              },
              {
                key: "param10",
                label: "param10",
                type: "string",
              },
              /*
              {
                key: "payload",
                dict: true,
                helpText: "Add your data payload",
                required: true,
              },*/
            ];
          }
        } catch (error) {
          if (error.message === "Invalid access token") {
            throw new z.errors.RefreshAuthError();
          }
        }
      },
    ],

    // In cases where Zapier needs to show an example record to the user, but we are unable to get a live example
    // from the API, Zapier will fallback to this hard-coded sample. It should reflect the data structure of
    // returned records, and have obvious placeholder values that we can show to any user.
    sample: {
      id: "facebookConnector",
      name: "Facebook",
    },

    // If fields are custom to each user (like spreadsheet columns), `outputFields` can create human labels
    // For a more complete example of using dynamic fields see
    // https://github.com/zapier/zapier-platform/tree/master/packages/cli#customdynamic-fields
    // Alternatively, a static field definition can be provided, to specify labels for the fields
    outputFields: [
      // these are placeholders to match the example `perform` above
      // {key: 'id', label: 'Person ID'},
      // {key: 'name', label: 'Person Name'}
    ],
  },
};
