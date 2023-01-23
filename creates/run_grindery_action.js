const NexusClient = require("grindery-nexus-client").default;

// create a particular run_grindery_action by name
const perform = async (z, bundle) => {
  //get the selected driver, get the selected actions (and input fields), package the data and run action
  const client = new NexusClient();
  let step = {}; //step object
  let input = {}; //input object
  try {
    //Get the driver
    let selected_driver_response = await client.getDriver(
      bundle.inputData.driver_id
    );
    let selected_driver_actions = selected_driver_response.actions; //get the driver's actions
    let filteredActionArray = [];
    //get the selected driver action
    if (selected_driver_actions) {
      filteredActionArray = selected_driver_actions.filter(
        (action) => action.key === bundle.inputData.action_id
      );
      //if found, should be single item array
      if (filteredActionArray.length >= 0) {
        let selected_action = filteredActionArray[0];
        //get actions input fields, https://docs.google.com/document/d/14arNus32sKeovhfmVbGncXA6F93mdWix-cGm8RxoyL0/edit#heading=h.t91p0v8eq5q8
        step = {
          type: "action", //always action
          connector: bundle.inputData.driver_id,
          operation: bundle.inputData.action_id,
        };
        z.console.log("Step Object: ", step); //DEBUG log to confirm correct structure
        if (selected_action.operation.inputFields.length >= 1) {
          selected_action.operation.inputFields.map((field) => {
            if(field.computed === true){
              input = {
                [field.key]: field.default,
                ...input,
              };
            }else{
              input = {
                [field.key]: bundle.inputData[field.key] ? bundle.inputData[field.key] : field.default,
                ...input,
              };
            }
          }); //build the input object based on the fields available
          z.console.log("Input Object: ", input);
        }
      }
      client.authenticate(`${bundle.authData.access_token}`);
      const nexus_response = await client.runAction(step, input); //optional string 'staging'
      z.console.log("Response from runAction: ", nexus_response);
      if (nexus_response) {
        return nexus_response;
      }
    }
  } catch (error) {
    if (error.message === "Invalid access token") {
      z.console.log("Line 56 - Auth Error in run_grindery_action", error.message);
      throw new z.errors.RefreshAuthError();
    }else{
      z.console.log("Error in run_grindery_action: ", error.message);
    }
  }
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
        const client = new NexusClient();
        try {
          let response = await client.getDriver(
            bundle.inputData.driver_id
          );
          //z.console.log("listing driver details: ", response);
          let driver_actions = response.actions; //match the selected driver
          let choices = {};
          let choices2 = [];
          let actionsInputField = [];
          if (driver_actions) {
            //if driver has actions
            //get the selected action
            let this_selected_action = driver_actions.filter(
              (action) => action.key === bundle.inputData.action_id
            );
            if (this_selected_action.length >= 0) {
              //DEBUG MESSAGE
              z.console.log(
                "User selected action is: ",
                this_selected_action[0]
              );
              if (this_selected_action[0].operation.inputFields.length >= 1) {
                let filtered_action_fields = this_selected_action[0].operation.inputFields.filter((action) => !action.computed);
                filtered_action_fields.map(
                  (inputField) => {
                    let type = "";
                    switch(inputField.type){
                      case "boolean":
                        type = "boolean";
                      case "text":
                        type = "text"
                      case "file":
                        type = "file"
                      case "password":
                        type = "password"
                      case "integer":
                        type = "integer"
                      case "number":
                        type = "number"
                      case "datetime":
                        type = "datetime"
                      case "string":
                      default:
                        type = "string";
                    }
                    //TODO, filter on input type, and whether required or not, translate the ui from Grindery to Zapier
                    let temp = {
                      key: inputField.key,
                      label: inputField.label,
                      helpText: inputField.helpText,
                      default: inputField.default,
                      type: type,
                    }
                    if(inputField.choices){
                      inputField.choices.map((choice) => {
                        choices = {
                          [choice.value]: choice.label,
                          ...choices
                        };
                      });
                      temp = {
                        choices: choices,
                        ...temp
                      }
                    }
                    if(inputField.required){
                      temp = {
                        required: true,
                        ...temp
                      }
                    }
                    if(inputField.default){
                      temp = {
                        default: inputField.default,
                        ...temp
                      }
                    }
                    actionsInputField.push(temp);
                  }
                );
                return actionsInputField;
              }
            }
          }
        } catch (error) {
          z.console.log(error.message);
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
      id: 1,
      name: "Test",
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
