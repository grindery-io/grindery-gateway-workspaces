const NexusClient = require("grindery-nexus-client").default;
let triggerToken = "";

const crypto = require("crypto");
// triggers on a new triggerzapfrom Grindery with a certain tag
const performWebhook = async (z, bundle) => {
  const payload = {
    data: bundle.cleanedRequest.data,
  };
  return [payload];
};

//subscribe this hook to the endpoint
const subscribeHook = async (z, bundle) => {
  const options = {
    url: `https://connex-zapier-grindery.herokuapp.com/webhooks`,
    method: "POST",
    body: {
      url: bundle.targetUrl,
      //workflow_id: bundle.inputData.workflow_id,
      workspace_key: bundle.inputData.workspace_id,
      token: bundle.inputData.workflow_id,
    },
  };

  // make the request and parse the response - this does not currently include any error handling.
  return z.request(options).then(async (response) => {
    z.console.log("Zap URL", bundle.targetUrl);
    const data2 = z.JSON.parse(response.content);
    z.console.log("Data2 from Response: ", JSON.stringify(data2));
    const data = await JSON.parse(response.content);
    z.console.log("Data from Response: ", JSON.stringify(data));
    return z.JSON.parse(response.content);
  });
};

const unsubscribeHook = async (z, bundle) => {
  // bundle.subscribeData contains the parsed response from the subscribeHook function.
  const hookId = bundle.subscribeData.id;
  z.console.log("unsubscribe hook: ", hookId);

  const options = {
    url: `https://connex-zapier-grindery.herokuapp.com/webhooks/${hookId}`,
    method: "DELETE",
  };

  const unsub_response = await z.request(options);
  if (unsub_response.status !== 200) {
    z.console.log(unsub_response);
  } else {
    return { message: "Unscubscribed: ", hookId };
  }

  return z.request(options).then((response) => z.JSON.parse(response.content));
};

const performTransactionList = async (z, bundle) => {
  const options = {
    url: `https://connex-zapier-grindery.herokuapp.com/latest_data`,
    method: "POST",
    params: {
      limit: 1,
    },
    body: {
      token: bundle.inputData.workflow_id,
    },
  };
  const response = await z.request(options);
  const headerData = await JSON.stringify(response.headers);
  const responseHeader = (headerData) => {
    return JSON.parse(headerData);
  };

  if (response.status !== 200) {
    throw new z.errors.Error(`Error with status code: ${response.status}`);
  }
  const data = await JSON.parse(response.content);

  if (Object.keys(data.items).length === 0) {
    return [];
  } else {
    return data.items;
  }
};

function uniqueID() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + "-" + s4() + s4() + "-" + s4();
}

const getTokenID = (url) => {
  var urlUUID = uuidv5("url", url);
  return urlUUID;
};

const uuidv4 = () => {
  return crypto.randomBytes(64).toString("hex");
};

module.exports = {
  key: "trigger_grindery",
  noun: "Trigger",

  display: {
    label: "Grindery Flow",
    description: "Connect Zapier to existing workflows in Grindery Flow",
    hidden: true,
  },

  operation: {
    type: "hook",
    perform: performWebhook,
    performList: performTransactionList,
    performSubscribe: subscribeHook,
    performUnsubscribe: unsubscribeHook,

    // `inputFields` defines the fields a user could provide
    // Zapier will pass them in as `bundle.inputData` later. They're optional.
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
          z.console.log(
            "Selected Workspace ID ",
            bundle.inputData.workspace_id
          );
          if (bundle.inputData.workspace_id === "default") {
            nexus_response = await client.workflow.list({});
          } else {
            const getWorkspaces = await client.workspace.list();
            z.console.log("Returned Workspaces", JSON.stringify(getWorkspaces));
            //filter list that matches bundle.inputData.workspace_id - the selected id from dropdown above
            const thisWorkspace = getWorkspaces.filter(
              (workspace) => workspace.key === bundle.inputData.workspace_id
            );
            if (thisWorkspace) {
              z.console.log(
                "Found this workspace and token: ",
                JSON.stringify(thisWorkspace[0].token)
              );
            } else {
              z.console.log("Workspace not found");
            }
            const client2 = new NexusClient(`${thisWorkspace[0].token}`);

            nexus_response = await client2.workflow.list({
              workspaceKey: bundle.inputData.workspace_id,
            });
          }

          if (nexus_response) {
            z.console.log("This Workspace workflows: ", nexus_response);
            let cleanedArray = [];
            for (let i = 0; i < nexus_response.length; i++) {
              let temp_item = nexus_response[i];
              for (let j = 0; j < temp_item.workflow.actions.length; j++) {
                let temp_action = temp_item.workflow.actions[j];
                if (
                  temp_action.operation === "triggerZap" &&
                  temp_action.connector === "zapier"
                ) {
                  z.console.log("This item: ", JSON.stringify(temp_item));
                  cleanedArray.push(temp_item);
                }
              }
            }
            z.console.log(
              "Zapier Triggering Workflows : ",
              cleanedArray.length
            );
            let choices = {};
            let workflow_actions = [];
            cleanedArray.map((item) => {
              workflow_actions = item.workflow.actions;
              workflow_actions.map((action) => {
                if (typeof action.input.token !== undefined) {
                  choices = {
                    [action.input.token]: item.workflow.title,
                    ...choices,
                  };
                }
              });
            });
            z.console.log("Choices: ", JSON.stringify(choices));
            z.console.log("Total Actions: ", workflow_actions.length);
            //z.console.log("Actions: ", JSON.stringify(workflow_actions[0]));
            z.console.log("Listing Choices");
            return [
              {
                key: "workflow_id",
                label: "Grindery Workflow",
                type: "string",
                required: true,
                choices: choices,
              },
            ];
          }
          return [
            {
              key: "workflow_id",
              label: "Sample Dropdown",
              type: "string",
              required: true,
              choices: {
                one: "1",
                two: "2",
              },
            },
          ];
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
      data: {
        test: "String",
      },
    },

    // If fields are custom to each user (like spreadsheet columns), `outputFields` can create human labels
    // For a more complete example of using dynamic fields see
    // https://github.com/zapier/zapier-platform/tree/master/packages/cli#customdynamic-fields
    // Alternatively, a static field definition can be provided, to specify labels for the fields
    outputFields: [
      // these are placeholders to match the example `perform` above
      //{ key: "data", label: "Data" },
      // {key: 'name', label: 'Person Name'}
    ],
  },
};
