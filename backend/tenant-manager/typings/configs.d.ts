export interface DynamoDBTable {
  Arn: string;
  Name: string;
}

export interface Configs {
  Tables: {
    User: DynamoDBTable;
    Product: DynamoDBTable;
    Tenant: DynamoDBTable;
    Order: DynamoDBTable;
  };
}
