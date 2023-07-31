const { gql } = require('apollo-server-express');

module.exports = typeDefs = gql`
  type User {
    id: ID!
    firstName: String!
    lastName: String!
    age: Int!
  }

  type Query {
    getUserList: [User!]!
  }
  type Mutation {
    createUser(name: String, email: String!, age: Int): User
  }
`;