// Include buildSchema from graphql package
var { buildSchema } = require('graphql');

// Define the schema. In order to make sense of what is going on please see https://graphql.org/learn/schema/
var schema = buildSchema(`
    type Query {
        users: [User]
        me: User
        weather(lat: Float!, lng: Float!): Weather,
        courses(userId: Int!): [Course]
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
    type Weather {
      temp: Float!,
      name: String,
      description: String,
      city: String,
      lat: Float,
      lng: Float,
      timestamp: Int
    },
    type Course {
      name: String!,
      schedule: CourseSchedule,
      professor: String,
      semester: Int,
      grade: Float,
    },
    type CourseSchedule{
      days: [String!]!,
      time: CourseTimeSchedule!
    },
    type CourseTimeSchedule{
      day: String!,
      start: Int!,
      end: Int!
    },
    type Mutation {
      register(email: String!, password: String!): User,
      login(email: String, username: String, password: String!): JWT
    }
`);

// export schema
module.exports = schema;
