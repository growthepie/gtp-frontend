import { EventExample } from "./types";


const APP_CARDS: {owner_project: string, metric: string}[] = [
      {
        owner_project: "saharaai",
        metric: "txcount"
      },
      {
        owner_project: "storj",
        metric: "daa"
      },
      {
        owner_project: "holochain",
        metric: "gas_fees"
      },

      {
        owner_project: "holochain",
        metric: "num_contracts"
      },
      {
        owner_project: "holochain",
        metric: "num_contracts"
      },

      {
        owner_project: "holochain",
        metric: "num_contracts"
      },
      {
        owner_project: "holochain",
        metric: "gas_fees"
      },
      {
        owner_project: "holochain",
        metric: "gas_fees"
      },
      {
        owner_project: "holochain",
        metric: "gas_fees"
      },
];

const topAppsEvent: EventExample = {
  title: "Top Apps",
  description: "The top apps in the Ethereum ecosystem.",
  question: "What apps are driving activity in the Ethereum ecosystem?",
  image: "gtp-project",
  link: "/applications",
  cards: APP_CARDS,
  bodyType: "card",

};

export default topAppsEvent;
