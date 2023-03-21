import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";

// Get the token
const getToken = (user)=>jwt.sign({id:user.id},process.env.JWT_KEY,{expiresIn:'7 days'});

// Get the user from token
const getUserFromToken = async ({ accessToken,db })=>{
  // Check the token
  if(!accessToken)return null;

  const res = jwt.verify(accessToken,process.env.JWT_KEY);
  if(!res?.id) return null;
  // 
}


const resolvers = {
    Query: {
      getTaskList: async (_,{ id },{ db,User })=>{
        if(!User){throw new Error("Authentication Error: Please Signed In");}
  
        return await db.collection("TaskList").findOne({ _id: new ObjectId(id) })
      },
      myTaskLists: async (_,__,{ db,User })=>{
        if(!User){throw new Error("Authentication Error: Please Signed In");}
  
        const taskLists = await db.collection("TaskList").find({ userIds: User._id }).toArray();
        return taskLists;
      } 
    },

    Mutation:{
      deleteToDo: async(_,{ id },{ db,User })=>{
        if(!User){throw new Error("Authentication Error: Please Signed In");}
  
        if(!(await db.collection("TodoList").findOne({ _id: new ObjectId(id) })))return false;
  
        await db.collection("TodoList").deleteOne({_id: new ObjectId(id)});
        return true;
      },
      updateToDo: async (_,data,{ db,User })=>{
        if(!User){throw new Error("Authentication Error: Please Signed In");}
  
        await db.collection("TodoList").updateOne({_id: new ObjectId(data.id)},{$set:data});
  
        return await db.collection("TodoList").findOne({ _id: new ObjectId(data.id)})
      },
  
      createToDo: async (_,{ content,taskListId },{ db,User })=>{
        if(!User){throw new Error("Authentication Error: Please Signed In");}
  
        // Create a ToDO List
        const newTodo = {
          content,
          taskListId: new ObjectId(taskListId),
          isCompleted: false
        }
  
        const res = await db.collection("TodoList").insertOne(newTodo);
        const data = await db.collection("TodoList").findOne({_id: res.insertedId})
  
        return data
      },
  
      addUserToTaskList: async(_,{ tasklistId,id },{ db,User })=>{
        if(!User){throw new Error("Authentication Error: Please Signed In");}
  
        // Check for the tasklistId exists or not
        const tasklist = await db.collection("TaskList").findOne({_id: new ObjectId(tasklistId)});
        if(!tasklist)return null;
  
        // Check for user already be there in the tasklist
        if(tasklist.userIds.find((userID)=>userID.toString()===id.toString()))return tasklist
  
        await db.collection("TaskList").updateOne(
            {_id: mongoose.Types.ObjectId(tasklistId)},
            {$push:{userIds:new ObjectId(id)}}
        )
  
        const updatedtaskList = await db.collection("TaskList").findOne({_id: new ObjectId(tasklistId)})
  
        return updatedtaskList
        
      },
  
      deleteTaskList: async (_,{ id },{ db,User })=>{
        if(!User){throw new Error("Authentication Error: Please Signed In");}
  
        await db.collection("TaskList").deleteOne({ _id:new ObjectId(id) })
        return true
      },
  
      createTaskList: async(_,{ title },{ db,User })=>{
        if(!User){throw new Error("Authentication Error: Please Signed In");}
  
        // Create a new TaskList
        const newTaskList = {
          title: title,
          createdAt: new Date().toISOString(),
          userIds: [User._id],
        }
  
        const res = await db.collection("TaskList").insertOne(newTaskList);
        const data = await db.collection("TaskList").findOne({_id: res.insertedId});
        console.log(data)
        return data;
  
      },
  
      updateTaskList: async(_,{ id,title },{ db,User })=>{
        if(!User){ throw new Error("Authentication Error: Please Authenticate to use") }
        const updatedTaskList = await db.collection("TaskList").updateOne({ _id: new ObjectId(id) },   
        {
          $set: { title : title }
        })
        return await db.collection("TaskList").findOne({_id: new ObjectId(id)})
      },

      signUp: async (_,{ input },db)=>{
        const hashedPassword = bcrypt.hashSync(input.password);
        const user = {
          ...input,
          password: hashedPassword
        };

        // Save into the Database
        const {insertedId} = await db.collection("User").insertOne(user);
        const {_id,password,...others} = await db.collection("User").findOne({_id:insertedId});
        
        const authUser = {
          user:{...others,_id},
          token:getToken({id:_id})
        }

        return authUser;

      },
      signIn: async (_,{ input },db)=>{
        const user = await db.collection("User").findOne({ email:input.email });
        if(!user){
          throw new Error("Invalid Credentials");
        }

        // Check if password is correct or not
        const {_id,password,...others} = user;
        if(bcrypt.compareSync(input.password,password)){
          return {
            user:{...others,_id},
            token:getToken({id:_id})
          }
        }

        throw new Error("Invalid Credentials");
      }
    },

    User:{
      id:({_id,id})=>_id || id
    },
    TaskList:{
      id:({_id,id})=>_id || id,
      progress: async({ _id },_,{ db })=>{
        const todos = await db.collection("TodoList").find({taskListId: _id}).toArray();
  
        // Base Case
        if(todos.length===0)return 0;
  
        // For Completed Todos
        const Completed = todos.filter((todo)=>todo.isCompleted===true);
  
        const percent = 100 * (Completed.length/todos.length);
        return percent
      },
      users:({ userIds },_,{ db })=>Promise.all(userIds.map((userId)=>db.collection("Users").findOne({_id:userId}))),
      todos: async ({ _id },_,{ db })=>{
        return await db.collection("TodoList").find({ taskListId: _id }).toArray()
      }
    },
    Todo:{
      id:({_id,id})=>_id || id,
      taskList: async({ taskListId },_,{ db })=>{
        const res = await db.collection("TaskList").findOne({ _id: taskListId });
        return res
      }
    }
  };
export default resolvers;