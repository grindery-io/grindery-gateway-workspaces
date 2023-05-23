"use strict";
const NexusClient = require("grindery-nexus-client").default;

const getAccessToken = (z, bundle) => {
  const promise = z.request("https://orchestrator.grindery.org/oauth/token", {
    method: "POST",
    body: {
      code: bundle.inputData.code,
      grant_type: "authorization_code",
    },
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
  });

  // Needs to return at minimum, `access_token`, and if your app also does refresh, then `refresh_token` too
  return promise.then((response) => {
    if (response.status !== 200) {
      throw new Error("Unable to fetch access token: " + response.content);
    }

    const result = JSON.parse(response.content);
    return {
      access_token: result.access_token,
      refresh_token: result.refresh_token,
      expires_in: result.expires_in,
    };
  });
};

const refreshAccessToken = (z, bundle) => {
  const promise = z.request("https://orchestrator.grindery.org/oauth/token", {
    method: "POST",
    body: {
      refresh_token: bundle.authData.refresh_token,
      grant_type: "refresh_token",
    },
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
  });

  // Needs to return `access_token`. If the refresh token stays constant, can skip it. If it changes, can
  // return it here to update the user's auth on Zapier.
  return promise.then((response) => {
    if (response.status !== 200) {
      throw new Error("Unable to fetch access token: " + response.content);
    }

    const result = JSON.parse(response.content);
    return {
      access_token: result.access_token,
    };
  });
};

const testAuth = async (z, bundle) => {
  const client = new NexusClient(bundle.authData.access_token);
  let workflows;
  try {
    workflows = await client.workflow.list({});
  } catch (error) {
    throw new z.errors.RefreshAuthError();
  }
  const user = client.user.get();
  if (user) {
    if (!user.workspace) {
      // return user's wallet address is short format, e.g. 0x44Ab...f5c0
      return { id: user.address_short };
    } else {
      const workspaces = await client.workspace.list();
      const workspace = (workspaces || []).find(
        (ws) => ws && ws.key === user.workspace
      );
      const workspaceName = (workspace && workspace.title) || "";
      // return user's wallet address is short format + workspace name, e.g. 0x44Ab...f5c0 - Custom Workspace
      return {
        id: `${user.address_short}${
          workspaceName ? " - " + workspaceName : ""
        }`,
      };
    }
  } else {
    throw new Error("The access token you supplied is not valid");
  }
};

module.exports = {
  config: {
    // "basic" auth automatically creates "username" and "password" input fields. It
    // also registers default middleware to create the authentication header.
    type: "oauth2",
    test: testAuth,
    /*test: {
      url: "https://connex-zapier-grindery.herokuapp.com/me",
      method: "GET",
      headers: {
        Authorization: "Bearer {{bundle.authData.access_token}}",
        accept: "application/json",
      },
      body: {},
      removeMissingValuesFrom: {},
    },*/
    oauth2Config: {
      authorizeUrl: {
        method: "GET",
        url: `https://orchestrator.grindery.org/oauth/authorize`,
        params: {
          response_type: "code",
          redirect_uri: "{{bundle.inputData.redirect_uri}}",
          utm_source: "zapier-gateway-workspaces",
        },
      },
      getAccessToken: getAccessToken,
      refreshAccessToken: refreshAccessToken,
      autoRefresh: true,
    },

    // Define any input app's auth requires here. The user will be prompted to enter
    // this info when they connect their account.
    fields: [
      /*{
        key: "wallet_address",
        label: "Wallet Address",
        helpText: "Enter your Wallet Address",
        required: true,
      },*/
    ],

    // This template string can access all the data returned from the auth test. If
    // you return the test object, you'll access the returned data with a label like
    // `{{json.X}}`. If you return `response.data` from your test, then your label can
    // be `{{X}}`. This can also be a function that returns a label. That function has
    // the standard args `(z, bundle)` and data returned from the test can be accessed
    // in `bundle.inputData.X`.
    connectionLabel: "{{id}}",
  },
  befores: [],
  afters: [],
};
