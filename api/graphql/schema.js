// Include buildSchema from graphql package
var { buildSchema } = require('graphql');

// Define the schema. In order to make sense of what is going on please see https://graphql.org/learn/schema/
var schema = buildSchema(`
    type Query {
        users: [User]
        me: User
    },
    type User {
      id: Int!,
      name: String,
      email: String!,
      username: String,
      faculty: String!,
      lat: String,
      lng: String,
    },
    type JWT {
      token: String!
    },
    type Mutation {
      register(email: String!, password: String!): User!,
      login(email: String, username: String, password: String!): JWT!
    }
`);


// export schema
module.exports = schema;