export const Environments = {
  AWS_DEFAULT_REGION: process.env.AWS_DEFAULT_REGION as string,
  TABLE_NAME_TENANT: process.env.TABLE_NAME_TENANT as string,
  TABLE_NAME_USER: process.env.TABLE_NAME_USER as string,
  TABLE_NAME_PRODUCT: process.env.TABLE_NAME_PRODUCT as string,
  TABLE_NAME_ORDER: process.env.TABLE_NAME_ORDER as string,
  SERVICE_ENDPOINT_TENANT: `http://${process.env.SERVICE_ENDPOINT_TENANT}`,
  SERVICE_ENDPOINT_USER: `http://${process.env.SERVICE_ENDPOINT_USER}`,
  SERVICE_ENDPOINT_AUTH: `http://${process.env.SERVICE_ENDPOINT_AUTH}`,
  SERVICE_ENDPOINT_TOKEN: `http://${process.env.SERVICE_ENDPOINT_TOKEN}`,
  AWS_ENDPOINT_URL: process.env.AWS_ENDPOINT_URL,
};
