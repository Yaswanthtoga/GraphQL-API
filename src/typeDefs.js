const typeDefs = `#graphql
   
   # Queries
   type Query{
    myTaskLists: [TaskList!]!
   }

   # Mutations
   type Mutation{
    signUp(input: signUpInput!): AuthUser!,
    signIn(input: signInInput!): AuthUser!,

    createTaskList(title: String!): TaskList!
    updateTaskList(id: ID!,title: String!):  TaskList!
    deleteTaskList(id: ID!): Boolean!
    addUserToTaskList(tasklistId: ID!,id: ID!): TaskList

    createToDo(content:String!,taskListId:ID!): Todo!
    updateToDo(id: ID!,content: String,isCompleted:Boolean):  Todo!
    deleteToDo(id:ID!): Boolean!
   }

   input signUpInput{
    username: String!,
    email: String!,
    password:String!,
    avatar: String
   }

   input signInInput{
    email: String!,
    password: String!
   }

   type AuthUser{
    user: User!,
    token: String!
   }

   # User Schema
   type User{
    id: ID!,
    username: String!,
    email: String!,
    avatar: String
   }

   # Task List Schema
   type TaskList{
    id: ID!,
    createdAt: String!,
    title: String!,
    progress: Float!,
    users: [User!]!,
    todos: [Todo!]!
   }

   # To DO Schema
   type Todo{
    id: ID!,
    content: String!,
    isCompleted: Boolean!,
    taskList: TaskList!
   }

`;
export default typeDefs;