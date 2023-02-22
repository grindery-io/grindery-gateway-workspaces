const NexusClient = require("grindery-nexus-client").default;

const getCreatorId = (token) => {
  try {
    const client = new NexusClient();
    client.authenticate(token);
    const user = client.getUser();
    return user.id;
  } catch (error) {
    //force token refresh if invalid
    if (error.message === "Invalid access token") {
      throw new z.errors.RefreshAuthError();
    } else {
      z.console.log("Error in getCreatorId function", error.message);
    }
  }
};

const uniqueID = () => {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + "-" + s4() + "-" + s4() + "-" + s4() + "-" + s4();
};

const getDynamicInputFields = async (z, bundle, driver, operation) => {
  const client = new NexusClient();
  client.authenticate(`${bundle.authData.access_token}`);
  let res;
  try {
    res = await client.callInputProvider(driver, operation, {
      jsonrpc: "2.0",
      method: "grinderyNexusConnectorUpdateFields",
      id: new Date(),
      params: {
        key: operation,
        fieldData: bundle.inputData,
        authentication: "",
      },
    });
  } catch (error) {
    if (error.message === "Invalid access token") {
      throw new z.errors.RefreshAuthError();
    } else {
      z.console.log("callInputProvider err", error);
    }
  }

  function toObject(arr) {
    var rv = {};
    for (var i = 0; i < arr.length; i++) rv[arr[i].value] = arr[i].label;
    return rv;
  }

  const fields =
    (res &&
      res.inputFields &&
      res.inputFields.map((field) => {
        let input = {
          key: field.key,
          label: field.label || field.key || "",
        };
        let type = "";
        switch (field.type) {
          case "boolean":
            type = "boolean";
            break;
          case "text":
            type = "text";
            break;
          case "file":
            type = "file";
            break;
          case "password":
            type = "password";
            break;
          case "integer":
            type = "integer";
            break;
          case "number":
            type = "number";
            break;
          case "datetime":
            type = "datetime";
            break;
          default:
            type = "string";
        }
        input.type = type;
        if (field.required) {
          input.required = true;
        }
        if (field.choices) {
          input.choices = toObject(field.choices);
        }
        if (field.default) {
          if (type === "boolean") {
            if (field.default === "true") {
              input.default = field.default;
            }
          } else {
            input.default = field.default;
          }
        }
        if (field.helpText) {
          input.helpText = field.helpText;
        }
        if (
          field.key === "_grinderyChain" &&
          !field.choices &&
          !field.default
        ) {
          input.dynamic = "list_chains_trigger.key";
        }
        input.altersDynamicFields = true;
        return input;
      })) ||
    [];
  return fields;
};

const performGrinderyAction = async (z, bundle) => {
  //get the selected driver, get the selected actions (and input fields), package the data and run action
  const client = new NexusClient();
  let step = {}; //step object
  let input = { ...bundle.inputData }; //input object
  delete input.driver_id;
  delete input.action_id;
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
            if (field.computed === true) {
              input = {
                [field.key]: field.default,
                ...input,
              };
            } else {
              if (!input[field.key] && field.default) {
                input = {
                  ...input,
                  [field.key]: field.default,
                };
              }
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
      z.console.log(
        "Line 56 - Auth Error in run_grindery_action",
        error.message
      );
      throw new z.errors.RefreshAuthError();
    } else {
      z.console.log("Error in run_grindery_action: ", error.message);
    }
  }
};

const getInputFields = async (z, bundle) => {
  const client = new NexusClient();
  try {
    let response = await client.getDriver(bundle.inputData.driver_id);
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
      let inputFields = [];

      if (this_selected_action.length >= 0) {
        //DEBUG MESSAGE
        z.console.log("User selected action is: ", this_selected_action[0]);
        if (this_selected_action[0].operation.inputFields.length >= 1) {
          let filtered_action_fields =
            this_selected_action[0].operation.inputFields.filter(
              (action) => !action.computed
            );
          filtered_action_fields.map((inputField) => {
            let type = "";
            switch (inputField.type) {
              case "boolean":
                type = "boolean";
              case "text":
                type = "text";
              case "file":
                type = "file";
              case "password":
                type = "password";
              case "integer":
                type = "integer";
              case "number":
                type = "number";
              case "datetime":
                type = "datetime";
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
            };
            if (inputField.choices) {
              inputField.choices.map((choice) => {
                choices = {
                  [choice.value]: choice.label,
                  ...choices,
                };
              });
              temp = {
                choices: choices,
                ...temp,
              };
            }
            if (inputField.required) {
              temp = {
                required: true,
                ...temp,
              };
            }
            if (inputField.default) {
              temp = {
                default: inputField.default,
                ...temp,
              };
            }
            actionsInputField.push(temp);
          });
          inputFields = [...inputFields, ...actionsInputField];
        } else {
          if (this_selected_action[0].operation.inputFieldProviderUrl) {
            const dynamicInputFields = await getDynamicInputFields(
              z,
              bundle,
              bundle.inputData.driver_id,
              bundle.inputData.action_id
            );
            inputFields = [...inputFields, ...dynamicInputFields];
          }
        }
        return inputFields;
      }
    }
  } catch (error) {
    z.console.log(error.message);
    if (error.message === "Invalid access token") {
      throw new z.errors.RefreshAuthError();
    }
  }
};

const getOutputFields = async (z, bundle, type) => {
  if (!bundle.inputData.driver_id || !bundle.inputData.action_id || !type) {
    return [];
  }
  const client = new NexusClient();
  client.authenticate(`${bundle.authData.access_token}`);
  let selectedDriver;
  try {
    selectedDriver = await client.getDriver(bundle.inputData.driver_id);
  } catch (error) {
    if (error.message === "Invalid access token") {
      throw new z.errors.RefreshAuthError();
    } else {
      z.console.log("getDriver err", error);
    }
  }

  const selectedAction = selectedDriver[type].find(
    (action) => action.key === bundle.inputData.action_id
  );
  if (!selectedAction) {
    return [];
  }

  const outputFields =
    (selectedAction.operation && selectedAction.operation.outputFields) || [];

  return (
    (outputFields &&
      outputFields.map((field) => ({
        key: field.key,
        label: field.label || field.key || "",
      }))) ||
    []
  );
};

module.exports = {
  getCreatorId,
  uniqueID,
  getDynamicInputFields,
  performGrinderyAction,
  getInputFields,
  getOutputFields,
};
