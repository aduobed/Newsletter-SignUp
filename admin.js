const mailchimp = require("@mailchimp/mailchimp_marketing");
const client = require("@mailchimp/mailchimp_marketing");

mailchimp.setConfig({
    apiKey: "bdf4c41ee9fb39e2edfc63f1f377436f-us4",
    server: "us4",
});

async function callPing() {
    const response = await mailchimp.ping.get();
    console.log(response);
}

// const run = async () => {
//     const response = await client.campaigns.list();
//     console.log(response);
// };

// const run = async () => {
//     const response = await client.automations.list();
//     console.log(response);
// };

// const run = async () => {
//     const response = await client.automations.get("workflow_id");
//     console.log(response);
// };

const run = async () => {
    const response = await client.lists.getAllLists();
    console.log(response);
};

// const run = async () => {
//     const response = await client.lists.getListMembersInfo("6d9fcd41ae");
//     console.log(response);
// };

callPing();

run();
