export type Token = { [key: string]: string };

export type IdInputs = {
  IdentityPoolId: string;
  provider: string;
  token: string;
};

export type IdentityInputs = {
  IdentityId: string;
  provider: string;
  token: string;
};
