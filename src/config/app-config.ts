import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "Tourism Portal",
  version: packageJson.version,
  copyright: `© ${currentYear}, Tourism Portal.`,
  meta: {
    title: "Tourism Portal - One-stop support for local service providers.",
    description: "A platform to support local service providers in service delivery.",
  },
};
